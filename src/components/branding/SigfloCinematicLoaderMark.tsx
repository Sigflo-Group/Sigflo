/**
 * Vector “vortex” mark for the boot loader: green/teal and blue arc groups rotate at different rates
 * (subtle shear / liquidity), with SMIL-driven highlights that travel along each ring (data-flow feel).
 * When `decorative`, omit semantics so a parent `img` can own the accessible name.
 */
export function SigfloCinematicLoaderMark({
  className = '',
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  /** Circumference 2πr for dash math + flow loop length */
  const c36 = 226.2;
  const c40 = 251.3;
  const c30 = 188.5;

  return (
    <svg
      className={`overflow-visible ${className}`}
      viewBox="0 0 100 100"
      width={160}
      height={160}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'Sigflo'}
    >
      <defs>
        <linearGradient id="sigflo-loader-arc-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bef264" />
          <stop offset="55%" stopColor="#00ffc8" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="sigflo-loader-arc-blue" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="sigflo-loader-arc-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(50 50)">
        {/* Green / teal stack: faster CW drift (SMIL = stable pivot at ring center) */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="22s"
            repeatCount="indefinite"
          />
          <circle
            r="36"
            cx="0"
            cy="0"
            fill="none"
            stroke="url(#sigflo-loader-arc-green)"
            strokeWidth="8"
            strokeDasharray={`88 ${c36 - 88}`}
            strokeLinecap="round"
            opacity={0.94}
            transform="rotate(-22)"
            filter="url(#sigflo-loader-arc-soft)"
          />
          <circle
            r="30"
            cx="0"
            cy="0"
            fill="none"
            stroke="#86efac"
            strokeWidth="4"
            strokeDasharray={`56 ${c30 - 56}`}
            strokeLinecap="round"
            opacity={0.55}
            transform="rotate(102)"
          />
          {/* Traveling highlight — follows green ring */}
          <circle
            r="36"
            cx="0"
            cy="0"
            fill="none"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="2.25"
            strokeDasharray={`14 ${c36 - 14}`}
            strokeLinecap="round"
            transform="rotate(-22)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`0;${-c36}`}
              dur="2.35s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Blue stack: slower CCW drift → subtle shear / flow vs green */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="-360 0 0"
            dur="27.5s"
            repeatCount="indefinite"
          />
          <circle
            r="40"
            cx="0"
            cy="0"
            fill="none"
            stroke="url(#sigflo-loader-arc-blue)"
            strokeWidth="7"
            strokeDasharray={`96 ${c40 - 96}`}
            strokeLinecap="round"
            opacity={0.9}
            transform="rotate(152)"
            filter="url(#sigflo-loader-arc-soft)"
          />
          <circle
            r="40"
            cx="0"
            cy="0"
            fill="none"
            stroke="rgba(147,197,253,0.45)"
            strokeWidth="3.5"
            strokeDasharray={`48 ${c40 - 48}`}
            strokeLinecap="round"
            opacity={0.65}
            transform="rotate(198)"
          />
          {/* Traveling highlight — blue ring, slightly slower pulse */}
          <circle
            r="40"
            cx="0"
            cy="0"
            fill="none"
            stroke="rgba(224,242,254,0.85)"
            strokeWidth="2"
            strokeDasharray={`12 ${c40 - 12}`}
            strokeLinecap="round"
            transform="rotate(152)"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`0;${-c40}`}
              dur="2.85s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </g>
    </svg>
  );
}
