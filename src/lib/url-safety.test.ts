import { describe, it, expect } from "vitest";
import { toSafeHref } from "./url-safety";

describe("toSafeHref", () => {
  it("acepta URLs http/https tal cual", () => {
    expect(toSafeHref("https://miempresa.com/portafolio")).toBe("https://miempresa.com/portafolio");
    expect(toSafeHref("http://miempresa.com")).toBe("http://miempresa.com/");
  });

  it("agrega https:// si no trae esquema (mismo comportamiento que tenía cliente.web)", () => {
    expect(toSafeHref("miempresa.com")).toBe("https://miempresa.com/");
    expect(toSafeHref("www.miempresa.com")).toBe("https://www.miempresa.com/");
  });

  it("recorta espacios", () => {
    expect(toSafeHref("  miempresa.com  ")).toBe("https://miempresa.com/");
  });

  it("rechaza vacío", () => {
    expect(toSafeHref("")).toBeNull();
    expect(toSafeHref("   ")).toBeNull();
  });

  it.each([
    "javascript:alert(document.cookie)",
    "javascript://alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
  ])("rechaza esquemas peligrosos: %s", (malicioso) => {
    expect(toSafeHref(malicioso)).toBeNull();
  });
});
