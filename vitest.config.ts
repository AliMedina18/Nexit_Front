import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Config de Vitest para las pruebas unitarias/de componentes del frontend
 * (src/**\/*.test.ts(x)). Deliberadamente separado de Playwright
 * (playwright.config.ts, pruebas de extremo a extremo contra un servidor
 * real) -- acá se prueba lógica y componentes en aislamiento (jsdom, sin red
 * real), ahí se prueba el comportamiento real de la app corriendo.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    css: false,
    // "threads" en vez del default "forks" -- en Windows, lanzar procesos nuevos del
    // sistema operativo (forks) suele colgarse por el antivirus corporativo o por
    // OneDrive sincronizando node_modules, con el error "Timeout waiting for worker
    // to respond" en TODOS los archivos de prueba a la vez. "threads" corre las
    // pruebas en hilos dentro del mismo proceso de Node, sin ese problema, y funciona
    // igual de bien en Linux/macOS/CI.
    pool: "threads",
  },
});
