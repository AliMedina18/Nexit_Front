import { describe, it, expect, vi } from "vitest";

/**
 * clientesApi.exportar/importar (docs/31) -- las únicas dos operaciones nuevas de este
 * archivo; el resto (list/create/update/remove/prioridad) son wrappers triviales de un
 * solo `apiClient.get/post/put/delete` cada uno y no se duplican acá. Se mockea
 * apiClient completo (ya tiene sus propias pruebas en api-client.test.ts).
 */
const getFileMock = vi.fn();
const postFormMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getFile: (...args: unknown[]) => getFileMock(...args),
    postForm: (...args: unknown[]) => postFormMock(...args),
  },
}));

const { clientesApi } = await import("./clientes-service");

describe("clientesApi.exportar/importar", () => {
  it("exportar pide el archivo con el nombre de respaldo correcto", async () => {
    const archivo = { blob: new Blob(["x"]), fileName: "clientes.xlsx" };
    getFileMock.mockResolvedValueOnce(archivo);

    const resultado = await clientesApi.exportar();

    expect(getFileMock).toHaveBeenCalledWith("/api/clientes/exportar", "clientes.xlsx");
    expect(resultado).toBe(archivo);
  });

  it("importar arma un FormData con el archivo bajo la clave 'archivo' y pega al endpoint /importar", async () => {
    postFormMock.mockResolvedValueOnce({ creados: 3, errores: [] });
    const archivo = new File(["contenido"], "clientes.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const resultado = await clientesApi.importar(archivo);

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/api/clientes/importar");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("archivo")).toBe(archivo);
    expect(resultado).toEqual({ creados: 3, errores: [] });
  });
});
