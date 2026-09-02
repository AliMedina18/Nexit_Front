import { test, expect } from "@playwright/test";

/**
 * Prueba sanitaria del login: que la página cargue, que no haya errores de
 * consola ni violaciones del Content-Security-Policy (next.config.ts), y
 * que se pueda escribir en el campo de correo -- sin llegar a enviar nada
 * (no se dispara ningún efecto real contra Supabase).
 */
test("login carga sin errores de consola ni violaciones de CSP", async ({ page }) => {
  const consoleErrors: string[] = [];
  const cspViolations: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    if (/content security policy|csp/i.test(msg.text())) cspViolations.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto("/login");
  await expect(page.locator("body")).not.toBeEmpty();

  const emailInput = page.locator('input[type="email"], input[name="email"], input#email').first();
  if (await emailInput.count()) {
    await emailInput.fill("prueba-sanitaria@example.com");
  }

  await page.waitForTimeout(500);

  expect(consoleErrors, consoleErrors.join("\n")).toHaveLength(0);
  expect(cspViolations, cspViolations.join("\n")).toHaveLength(0);
});

test("las cabeceras de seguridad (next.config.ts) están presentes", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toBeTruthy();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["strict-transport-security"]).toBeTruthy();
  expect(headers["x-powered-by"]).toBeUndefined();
});
