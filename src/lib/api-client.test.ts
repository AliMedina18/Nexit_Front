import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * api-client.ts es el único punto por el que el frontend habla con
 * Nexit_Back -- estas pruebas cubren que traduce bien los dos formatos de
 * error reales del backend (GlobalExceptionHandlerMiddleware.cs y los 400 de
 * validación automáticos de ASP.NET Core) y que una falla de red no revienta
 * la app sino que se convierte en un ApiError legible.
 */
vi.mock("./supabase-client", () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

const { apiClient, ApiError } = await import("./api-client");

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("apiClient -- casos felices", () => {
  it("GET devuelve el body parseado", async () => {
    mockFetchOnce(200, { hola: "mundo" });
    await expect(apiClient.get("/api/algo")).resolves.toEqual({ hola: "mundo" });
  });

  it("204 No Content devuelve undefined en vez de intentar parsear JSON vacío", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 204, ok: true, json: async () => null }) as unknown as typeof fetch;
    await expect(apiClient.delete("/api/algo/1")).resolves.toBeUndefined();
  });
});

describe("apiClient -- error de negocio (GlobalExceptionHandlerMiddleware)", () => {
  it("usa el message y el traceId del body, no un genérico", async () => {
    mockFetchOnce(409, {
      statusCode: 409,
      message: "Ya existe un proveedor con ese correo.",
      traceId: "trace-abc-123",
      timestamp: "2026-09-01T00:00:00Z",
    });
    await expect(apiClient.get("/api/proveedores")).rejects.toMatchObject({
      statusCode: 409,
      message: "Ya existe un proveedor con ese correo.",
      traceId: "trace-abc-123",
    });
  });

  it("el error resultante es una instancia real de ApiError", async () => {
    mockFetchOnce(500, { statusCode: 500, message: "Error interno", traceId: "t1" });
    try {
      await apiClient.get("/api/x");
      expect.unreachable("debía lanzar");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });
});

describe("apiClient -- error de validación (400 automático de ASP.NET Core)", () => {
  it("usa el primer mensaje de campo y expone fieldErrors completo", async () => {
    mockFetchOnce(400, {
      title: "One or more validation errors occurred.",
      status: 400,
      errors: {
        Email: ["El correo no es válido."],
        Nombre: ["El nombre es requerido."],
      },
      traceId: "trace-val-1",
    });
    await expect(apiClient.post("/api/clientes", {})).rejects.toMatchObject({
      statusCode: 400,
      message: "El correo no es válido.",
      fieldErrors: { Email: ["El correo no es válido."], Nombre: ["El nombre es requerido."] },
    });
  });

  it("si no hay mensaje de campo, cae al title", async () => {
    mockFetchOnce(400, { title: "Solicitud inválida.", status: 400, errors: {} });
    await expect(apiClient.post("/api/clientes", {})).rejects.toMatchObject({
      message: "Solicitud inválida.",
    });
  });
});

describe("apiClient -- backend inalcanzable", () => {
  it("una excepción de fetch (red caída, backend apagado, CORS) se convierte en ApiError con statusCode 0", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;
    await expect(apiClient.get("/api/proveedores")).rejects.toMatchObject({
      statusCode: 0,
      message: expect.stringContaining("No se pudo conectar"),
    });
  });
});

describe("apiClient -- adjunta el token de sesión cuando existe", () => {
  it("incluye Authorization: Bearer <token> si hay sesión", async () => {
    vi.resetModules();
    vi.doMock("./supabase-client", () => ({
      supabase: {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "token-de-prueba" } } }),
        },
      },
    }));
    const { apiClient: apiClientConSesion } = await import("./api-client");

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      capturedHeaders = init.headers as Headers;
      return Promise.resolve({ status: 200, ok: true, json: async () => ({}) });
    }) as unknown as typeof fetch;

    await apiClientConSesion.get("/api/x");
    expect(capturedHeaders?.get("Authorization")).toBe("Bearer token-de-prueba");
  });
});
