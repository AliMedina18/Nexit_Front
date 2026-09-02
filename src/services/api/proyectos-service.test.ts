import { describe, it, expect, vi } from "vitest";

/**
 * proyectosApi.exportar/importar (docs/31) -- ver clientes-service.test.ts para el
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

const { proyectosApi } = await import("./proyectos-service");

describe("proyectosApi.exportar/importar", () => {
  it("exportar pide el archivo con el nombre de respaldo correcto", async () => {
    const archivo = { blob: new Blob(["x"]), fileName: "proyectos.xlsx" };
    getFileMock.mockResolvedValueOnce(archivo);

    const resultado = await proyectosApi.exportar();

    expect(getFileMock).toHaveBeenCalledWith("/api/proyectos/exportar", "proyectos.xlsx");
    expect(resultado).toBe(archivo);
  });

  it("importar arma un FormData con el archivo bajo la clave 'archivo' y pega al endpoint /importar", async () => {
    postFormMock.mockResolvedValueOnce({ creados: 0, errores: [{ fila: 2, mensaje: "El estado es obligatorio." }] });
    const archivo = new File(["contenido"], "proyectos.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const resultado = await proyectosApi.importar(archivo);

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/api/proyectos/importar");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("archivo")).toBe(archivo);
    expect(resultado.creados).toBe(0);
    expect(resultado.errores).toHaveLength(1);
  });
});
