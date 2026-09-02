import { describe, it, expect, vi } from "vitest";

/**
 * proveedorAdjuntosApi es la única puerta del frontend hacia
 * ProveedorAdjuntosController (docs/28, HU-13). Estas pruebas cubren que
 * arma bien las tres formas de pedir algo -- JSON normal (link), multipart
 * (subir archivo real) y la ruta con proveedorId+adjuntoId -- sin depender
 * de un backend real: se mockea apiClient completo, ya que api-client.ts
 * mismo ya tiene sus propias pruebas (api-client.test.ts).
 */
const getMock = vi.fn();
const postMock = vi.fn();
const postFormMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
    postForm: (...args: unknown[]) => postFormMock(...args),
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const { proveedorAdjuntosApi } = await import("./proveedor-adjuntos-service");

describe("proveedorAdjuntosApi", () => {
  it("list pide el listado del proveedor correcto", async () => {
    getMock.mockResolvedValueOnce([]);
    await proveedorAdjuntosApi.list("prov-1");
    expect(getMock).toHaveBeenCalledWith("/api/proveedores/prov-1/adjuntos");
  });

  it("crearLink manda el body tal cual como JSON, sin tocar FormData", async () => {
    postMock.mockResolvedValueOnce({ id: "adj-1" });
    const input = { tipo: "link" as const, nombre: "Cotización", url: "https://example.com/doc.pdf" };
    await proveedorAdjuntosApi.crearLink("prov-1", input);
    expect(postMock).toHaveBeenCalledWith("/api/proveedores/prov-1/adjuntos", input);
  });

  it("subirArchivo arma un FormData con el archivo bajo la clave 'archivo' y pega al endpoint /subir", async () => {
    postFormMock.mockResolvedValueOnce({ id: "adj-2", tipo: "file" });
    const archivo = new File(["contenido"], "contrato.pdf", { type: "application/pdf" });

    await proveedorAdjuntosApi.subirArchivo("prov-1", archivo);

    expect(postFormMock).toHaveBeenCalledTimes(1);
    const [path, form] = postFormMock.mock.calls[0];
    expect(path).toBe("/api/proveedores/prov-1/adjuntos/subir");
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("archivo")).toBe(archivo);
  });

  it("obtenerUrlDescarga pide la URL de descarga del adjunto correcto", async () => {
    getMock.mockResolvedValueOnce({ url: "https://firmada.example.com/x.pdf" });
    const { url } = await proveedorAdjuntosApi.obtenerUrlDescarga("prov-1", "adj-2");
    expect(getMock).toHaveBeenCalledWith("/api/proveedores/prov-1/adjuntos/adj-2/descargar");
    expect(url).toBe("https://firmada.example.com/x.pdf");
  });

  it("remove borra el adjunto correcto del proveedor correcto", async () => {
    deleteMock.mockResolvedValueOnce(undefined);
    await proveedorAdjuntosApi.remove("prov-1", "adj-2");
    expect(deleteMock).toHaveBeenCalledWith("/api/proveedores/prov-1/adjuntos/adj-2");
  });
});
