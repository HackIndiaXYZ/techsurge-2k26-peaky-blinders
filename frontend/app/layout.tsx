import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { Providers } from "./providers";
import "../styles/globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif", display: "swap" });

export const metadata: Metadata = {
  title: "PausePay | Think once. Pay safely.",
  description:
    "An explainable pre-payment safety layer that examines the context around authorised payments before money leaves.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4eb" },
    { media: "(prefers-color-scheme: dark)", color: "#11151d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${dmSerif.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
