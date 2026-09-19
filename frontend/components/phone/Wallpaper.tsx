/**
 * Home-screen wallpaper.
 *
 * Rebuilt as layered radial gradients rather than a bitmap: the reference is a
 * near-white canvas with a faint aurora wash, which compresses badly as a PNG
 * (banding in the flat areas) and would ship ~1MB for something CSS renders
 * exactly. It also stays crisp at any device scale.
 *
 * Kept deliberately pale — app icons and labels sit on top and need contrast.
 */

export function Wallpaper({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        background: [
          // Cool wash, upper right.
          "radial-gradient(60% 45% at 78% 22%, rgba(120,175,255,0.20), transparent 70%)",
          // Cyan pool, mid right — the brightest note in the reference.
          "radial-gradient(45% 30% at 88% 52%, rgba(96,205,245,0.18), transparent 72%)",
          // Warm counterpoint, low centre.
          "radial-gradient(42% 26% at 46% 84%, rgba(255,190,150,0.16), transparent 70%)",
          // Violet, lower left.
          "radial-gradient(50% 34% at 14% 72%, rgba(168,150,255,0.14), transparent 72%)",
          // Base — very slightly warm white so it does not read as pure #fff.
          "linear-gradient(180deg, #FDFDFE 0%, #F7F9FC 100%)",
        ].join(","),
      }}
    />
  );
}
