import { describe, it, expect, vi, beforeEach } from "vitest";

/** Ver projects-store.test.ts para el porqué de estas pruebas. */
vi.mock("@/services/api/clientes-service", () => ({
  clientesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const { clientesApi } = await import("@/services/api/clientes-service");
const { useClientesStore } = await import("./clientes-store");

beforeEach(() => {
  useClientesStore.setState({ items: [], loading: false, loaded: false, error: null });
  vi.mocked(clientesApi.list).mockReset();
});

describe("useClientesStore.fetchAll", () => {
  it("en fallo: resetea loading, guarda error, no marca loaded", async () => {
    vi.mocked(clientesApi.list).mockRejectedValue(new Error("caído"));
    await useClientesStore.getState().fetchAll();
    const state = useClientesStore.getState();
    expect(state.loading).toBe(false);
    expect(state.loaded).toBe(false);
    expect(state.error).toBe("caído");
  });

  it("reintentar después de un fallo vuelve a llamar a la API y limpia el error", async () => {
    vi.mocked(clientesApi.list).mockRejectedValueOnce(new Error("caído"));
    await useClientesStore.getState().fetchAll();

    vi.mocked(clientesApi.list).mockResolvedValueOnce([{ id: "1" } as never]);
    await useClientesStore.getState().fetchAll();

    const state = useClientesStore.getState();
    expect(state.error).toBeNull();
    expect(state.items).toHaveLength(1);
    expect(clientesApi.list).toHaveBeenCalledTimes(2);
  });
});
