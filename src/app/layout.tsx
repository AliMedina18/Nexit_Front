import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

// Nunito is the closest free match to Circular — the rounded geometric sans
// the "next!" wordmark uses — so the NEXIT logotype and the rest of the UI
// read as the same type family as the company logo, not a mismatched font.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NEXIT · Next Marketing Experiencial",
  description: "Gestión de proveedores y proyectos para Next Marketing Experiencial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={nunito.variable}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
