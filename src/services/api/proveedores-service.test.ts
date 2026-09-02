import { describe, it, expect, vi } from "vitest";

/**
 * proveedoresApi.exportar/importar (docs/31) -- ver clientes-service.test.ts para el
 * porqué de no duplicar pruebas de los wrappers triviales (list/create/update/remove/etc).
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

const { proveedoresApi } = await import("./proveedores-service");

describe("proveedoresApi.exportar/importar", () => {
  it("exportar pide el archivo con el nombre de respaldo correcto", async () => {
    const archivo = { blob: new Blob(["x"]), fileName: "proveedores.xlsx" };
    getFileMock.mockResolvedValueOnce(archivo);

    const resultado = await proveedoresApi.exportar();

    expect(getFileMock).toHaveBeenCalledWith("/api/proveedores/exportar", "proveedores.xlsx");
    expect(resultado).toBe(archivo);
  });

  it("importar arma un FormData con el archivo bajo la clave 'archivo' y pega al endpoint /importar", async () => {
    postFormMock.mockResolvedValueOnce({
      creados: 1,
      errores: [{ fila: 3, mensaje: "El país 'Marte' no existe en el catálogo." }],
    });
    const archivo = new File(["contenido"], "proveedores.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const resultado = await proveedoresApi.importar(archivo);

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/api/proveedores/importar");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("archivo")).toBe(archivo);
    expect(resultado.creados).toBe(1);
    expect(resultado.errores).toHaveLength(1);
  });
});
