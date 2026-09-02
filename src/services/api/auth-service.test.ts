import { describe, it, expect, vi } from "vitest";

/**
 * authApi.estadoCuenta / confirmarContrasena conectan contra AuthController
 * (docs/30) -- la detección automática "primera vez vs. recurrente" del
 * login. Lo único con lógica propia de este lado es la URL de estadoCuenta
 * (el correo va como query param, sin sesión), así que la prueba clave es
 * que un correo con caracteres especiales (+, espacios, @) se codifique
 * bien -- un correo real con "+" (alias de Gmail) es el caso que de verdad
 * puede pasar en producción.
 */
const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

const { authApi } = await import("./auth-service");

describe("authApi", () => {
  it("estadoCuenta manda el correo como query param, codificado", async () => {
    getMock.mockResolvedValueOnce({ tieneContrasena: true });
    await authApi.estadoCuenta("alicia+test@k11technologies.com");
    expect(getMock).toHaveBeenCalledWith("/api/auth/estado-cuenta?email=alicia%2Btest%40k11technologies.com");
  });

  it("estadoCuenta devuelve tal cual el body del backend", async () => {
    getMock.mockResolvedValueOnce({ tieneContrasena: false });
    await expect(authApi.estadoCuenta("nueva@k11technologies.com")).resolves.toEqual({ tieneContrasena: false });
  });

  it("confirmarContrasena pega al endpoint correcto sin body", async () => {
    postMock.mockResolvedValueOnce(undefined);
    await authApi.confirmarContrasena();
    expect(postMock).toHaveBeenCalledWith("/api/auth/confirmar-contrasena");
  });
});
