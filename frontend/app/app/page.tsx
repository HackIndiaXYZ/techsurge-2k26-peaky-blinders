/**
 * Phone home screen — the entry point to the demo.
 *
 * The three apps are deliberately separate: Inbox is where the
 * social-engineering context arrives, FLOW is where the payment is made, and
 * PausePay is the layer that connects the two. Showing them as peers on a home
 * screen is what makes the architecture legible to someone watching the demo.
 */

import type { Metadata } from "next";
import { AppIcon } from "@/components/phone/AppIcon";
import { Wallpaper } from "@/components/phone/Wallpaper";

export const metadata: Metadata = {
  title: "PausePay | Simulated phone",
};

export default function PhoneHome() {
  return (
    <main className="relative flex h-full flex-col overflow-hidden">
      <Wallpaper />

      <div className="relative flex flex-1 flex-col px-7 pt-10">
        <div className="grid grid-cols-4 justify-items-center gap-y-7">
          <AppIcon app="inbox" />
          <AppIcon app="flow" />
          <AppIcon app="pausepay" />
        </div>

        <p className="mt-auto pb-6 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Simulated phone · Demo only
        </p>
      </div>
    </main>
  );
}
