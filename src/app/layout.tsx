import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carburanti Flegrei",
  description:
    "Prezzi dei distributori di Pozzuoli e dei Campi Flegrei, con segnalazioni degli utenti su carburante disponibile e fila.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
