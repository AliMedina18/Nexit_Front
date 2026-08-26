import { supabase } from "@/lib/supabase-client";

/**
 * Cliente HTTP hacia la API real de Nexit_Back (.NET). Adjunta el token de
 * la sesión de Supabase Auth en cada petición y traduce las dos formas de
 * error que devuelve el backend a un solo tipo (`ApiError`):
 *
 *  - Errores de negocio (`GlobalExceptionHandlerMiddleware.cs`): { statusCode, message, traceId, timestamp }
 *  - Errores de validación (400 automáticos de ASP.NET Core): { title, status, errors: { campo: [mensajes] }, traceId }
 *
 * NEXT_PUBLIC_API_BASE_URL debe apuntar al backend corriendo en tu máquina
 * (ver .env.example) -- localmente, con `ASPNETCORE_ENVIRONMENT=Production`,
 * el backend ya habla contra la base de datos real de Supabase en la nube.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5031";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly traceId?: string;
  /** Solo presente en errores 400 de validación: campo -> lista de mensajes. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(statusCode: number, message: string, traceId?: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.traceId = traceId;
    this.fieldErrors = fieldErrors;
  }
}

interface BusinessErrorBody {
  statusCode: number;
  message: string;
  traceId: string;
  timestamp: string;
}

interface ValidationErrorBody {
  title: string;
  status: number;
  errors: Record<string, string[]>;
  traceId?: string;
}

type ErrorBody = Partial<BusinessErrorBody & ValidationErrorBody>;

function toApiError(status: number, body: ErrorBody | null): ApiError {
  if (body?.errors) {
    const firstField = Object.keys(body.errors)[0];
    const firstMessage = firstField ? body.errors[firstField]?.[0] : undefined;
    return new ApiError(status, firstMessage ?? body.title ?? "Los datos enviados no son válidos.", body.traceId, body.errors);
  }
  return new ApiError(status, body?.message ?? "Ocurrió un error inesperado. Intenta de nuevo.", body?.traceId);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    // El backend no respondió (no está corriendo, CORS bloqueó la petición, sin red, etc.)
    throw new ApiError(0, "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, body as ErrorBody | null);
  }

  return body as T;
}

async function requestForm<T>(path: string, method: "POST" | "PUT", form: FormData): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers();
  // OJO: no seteamos Content-Type acá a propósito -- el navegador arma el
  // boundary multipart correcto solo si lo dejamos poner el header.
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: form });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(response.status, body as ErrorBody | null);
  }
  return body as T;
}

interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

function fileNameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/** Para endpoints que devuelven un archivo binario (ej. exportar a Excel), no JSON. */
async function requestFile(path: string, fallbackFileName: string): Promise<DownloadedFile> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers();
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw toApiError(response.status, body as ErrorBody | null);
  }

  const blob = await response.blob();
  const fileName = fileNameFromContentDisposition(response.headers.get("Content-Disposition"), fallbackFileName);
  return { blob, fileName };
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /** Para endpoints que reciben `multipart/form-data` (subida de archivos), no JSON. */
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, "POST", form),
  /** Para endpoints que devuelven un archivo binario (ej. exportar a Excel), no JSON. */
  getFile: (path: string, fallbackFileName: string) => requestFile(path, fallbackFileName),
};
