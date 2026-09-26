import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";

import "./globals.css";

// Variable font with the width axis: titles use wdth 125, body text 100.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Siete8",
};

// Lets the page reach the screen edges so fixed elements can use the
// safe-area insets (floating WhatsApp button).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-EC" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
