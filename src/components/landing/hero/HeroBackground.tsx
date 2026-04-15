/** Hero-only backdrop: reads as one scene with the marketing PNG, then eases toward `landing-bg`. */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Depth: black core → charcoal lower third (meets page bg without a hard line). */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 125% 50% at 70% 84%, rgba(0, 200, 120, 0.11) 0%, transparent 50%),
            radial-gradient(ellipse 65% 50% at 86% 40%, rgba(33, 240, 195, 0.055) 0%, transparent 46%),
            radial-gradient(ellipse 50% 65% at 16% 36%, rgba(0, 200, 120, 0.035) 0%, transparent 40%),
            linear-gradient(180deg,
              #000000 0%,
              #020302 28%,
              #040504 52%,
              #070807 72%,
              #0a0b0e 88%,
              #0c0e12 100%
            )
          `,
        }}
      />

      {/* Soft vignette — pulls viewport edges toward the PNG’s black frame. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 88% 72% at 50% 46%, transparent 0%, rgba(0, 0, 0, 0.38) 100%)
          `,
        }}
      />

      {/* Teal grid — low contrast, biased left; fades out where the mock sits. */}
      <div
        className="absolute inset-0 opacity-[0.055] motion-reduce:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 200, 120, 0.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 120, 0.09) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse 92% 95% at 40% 46%, black 12%, rgba(0,0,0,0.35) 52%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 92% 95% at 40% 46%, black 12%, rgba(0,0,0,0.35) 52%, transparent 88%)',
        }}
      />
    </div>
  );
}
