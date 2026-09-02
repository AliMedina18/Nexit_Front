import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Prueba puntual del arreglo de resiliencia hecho sobre este store: antes,
 * si fetchAll() fallaba, `loading` se quedaba en true para siempre y la
 * guarda `if (loaded || loading) return` bloqueaba cualquier reintento --
 * la pantalla quedaba pegada en "cargando" sin aviso. Ahora debe: (1) volver
 * loading a false, (2) guardar el mensaje en `error`, (3) dejar `loaded` en
 * false para que un fetchAll() posterior (el botón "Reintentar") sí vuelva
 * a intentarlo.
 */
vi.mock("@/services/api/proyectos-service", () => ({
  proyectosApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const { proyectosApi } = await import("@/services/api/proyectos-service");
const { useProjectsStore } = await import("./projects-store");

beforeEach(() => {
  useProjectsStore.setState({ items: [], loading: false, loaded: false, error: null });
  vi.mocked(proyectosApi.list).mockReset();
});

describe("useProjectsStore.fetchAll", () => {
  it("en éxito: carga los items y marca loaded", async () => {
    vi.mocked(proyectosApi.list).mockResolvedValue([{ id: "1" } as never]);
    await useProjectsStore.getState().fetchAll();
    const state = useProjectsStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.loading).toBe(false);
    expect(state.loaded).toBe(true);
    expect(state.error).toBeNull();
  });

  it("en fallo: no deja loading pegado en true, guarda el error, y no marca loaded", async () => {
    vi.mocked(proyectosApi.list).mockRejectedValue(new Error("No se pudo conectar con el servidor."));
    await useProjectsStore.getState().fetchAll();
    const state = useProjectsStore.getState();
    expect(state.loading).toBe(false);
    expect(state.loaded).toBe(false);
    expect(state.error).toBe("No se pudo conectar con el servidor.");
  });

  it("después de un fallo, un fetchAll() posterior (\"Reintentar\") sí vuelve a llamar a la API", async () => {
    vi.mocked(proyectosApi.list).mockRejectedValueOnce(new Error("caído"));
    await useProjectsStore.getState().fetchAll();
    expect(useProjectsStore.getState().error).toBe("caído");

    vi.mocked(proyectosApi.list).mockResolvedValueOnce([{ id: "1" } as never]);
    await useProjectsStore.getState().fetchAll();
    const state = useProjectsStore.getState();
    expect(state.error).toBeNull();
    expect(state.loaded).toBe(true);
    expect(proyectosApi.list).toHaveBeenCalledTimes(2);
  });

  it("no dispara una segunda petición si ya hay una en vuelo", async () => {
    let resolveList!: (v: unknown[]) => void;
    vi.mocked(proyectosApi.list).mockReturnValue(new Promise((resolve) => (resolveList = resolve)) as never);

    const first = useProjectsStore.getState().fetchAll();
    const second = useProjectsStore.getState().fetchAll();
    resolveList([]);
    await Promise.all([first, second]);

    expect(proyectosApi.list).toHaveBeenCalledTimes(1);
  });
});
