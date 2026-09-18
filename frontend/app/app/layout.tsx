import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "PausePay | Pause before you pay",
  description: "Simulated messenger and UPI payment flow protected by the PausePay verification layer.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
