import { describe, it, expect, vi, beforeEach } from "vitest";

/** Ver projects-store.test.ts para el porqué de estas pruebas. */
vi.mock("@/services/api/proveedores-service", () => ({
  proveedoresApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    getById: vi.fn(),
    marcarColaborador: vi.fn(),
    quitarColaborador: vi.fn(),
  },
}));

const { proveedoresApi } = await import("@/services/api/proveedores-service");
const { useProvidersStore } = await import("./providers-store");

beforeEach(() => {
  useProvidersStore.setState({ items: [], loading: false, loaded: false, error: null });
  vi.mocked(proveedoresApi.list).mockReset();
});

describe("useProvidersStore.fetchAll", () => {
  it("en fallo: resetea loading, guarda error, no marca loaded", async () => {
    vi.mocked(proveedoresApi.list).mockRejectedValue(new Error("caído"));
    await useProvidersStore.getState().fetchAll();
    const state = useProvidersStore.getState();
    expect(state.loading).toBe(false);
    expect(state.loaded).toBe(false);
    expect(state.error).toBe("caído");
  });

  it("reintentar después de un fallo vuelve a llamar a la API y limpia el error", async () => {
    vi.mocked(proveedoresApi.list).mockRejectedValueOnce(new Error("caído"));
    await useProvidersStore.getState().fetchAll();

    vi.mocked(proveedoresApi.list).mockResolvedValueOnce([{ id: "1" } as never]);
    await useProvidersStore.getState().fetchAll();

    const state = useProvidersStore.getState();
    expect(state.error).toBeNull();
    expect(state.items).toHaveLength(1);
    expect(proveedoresApi.list).toHaveBeenCalledTimes(2);
  });
});
