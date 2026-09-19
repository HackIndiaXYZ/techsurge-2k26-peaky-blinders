/**
 * Scratch page for eyeballing the Phase 1 brand assets in isolation.
 * Removed before the redesign ships — not linked from anywhere.
 */

import { PausePayMark } from "@/components/brand/PausePayMark";
import { PausePayShield } from "@/components/brand/PausePayShield";
import { PausePayWordmark } from "@/components/brand/PausePayWordmark";
import { AppIcon } from "@/components/phone/AppIcon";
import { Wallpaper } from "@/components/phone/Wallpaper";

export default function BrandLab() {
  return (
    <main className="min-h-dvh bg-white p-10 font-sans text-zinc-900">
      <h1 className="mb-8 text-2xl font-bold">Brand lab</h1>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">Mark</h2>
        <div className="flex items-end gap-8">
          {[24, 32, 48, 96, 160].map((s) => (
            <PausePayMark key={s} size={s} />
          ))}
          <div className="rounded-xl bg-[#0F0F12] p-4 text-white">
            <PausePayMark size={64} tone="mono" />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">Wordmark</h2>
        <div className="flex items-center gap-10">
          <PausePayWordmark size={22} />
          <PausePayWordmark size={32} />
          <div className="rounded-xl bg-[#0F0F12] p-4">
            <PausePayWordmark size={28} inverted />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">Shield</h2>
        <div className="flex items-center gap-10">
          <PausePayShield size={160} />
          <PausePayShield size={160} check />
          <PausePayShield size={96} rays={false} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500">App icons</h2>
        <div className="relative w-[390px] overflow-hidden rounded-3xl border border-zinc-200 p-8">
          <Wallpaper />
          <div className="relative flex gap-5">
            <AppIcon app="inbox" />
            <AppIcon app="flow" />
            <AppIcon app="pausepay" />
          </div>
        </div>
      </section>
    </main>
  );
}
