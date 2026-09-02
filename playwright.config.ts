import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo ("sanitarias"/smoke) contra la app real
 * corriendo (build de producción, `next start`) -- no simulan nada, pegan
 * contra el servidor real. Esto es lo mismo que se verificó a mano con curl
 * y Playwright al escribir src/proxy.ts (docs/31): quedó formalizado acá
 * para que se pueda volver a correr con `npm run test:e2e` cada vez que algo
 * toque el proxy, el login o las páginas protegidas, en vez de tener que
 * repetir la verificación manual cada vez.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4300",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: "/opt/pw-browsers/chromium" } },
    },
  ],
  webServer: {
    command: "npm run start -- -p 4300",
    url: "http://localhost:4300/login",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
