"use client";

import { ThemeProvider } from "next-themes";
import { LenisScroll } from "@/components/ui/LenisScroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LenisScroll>{children}</LenisScroll>
    </ThemeProvider>
  );
}
