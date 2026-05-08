import { useEffect, useMemo, useState } from 'react';
import { SIGFLO_MOBILE_LOADER_FEED_STATUSES } from '@/config/sigfloMobileLoaderStatuses';

/** Stable default when `statuses` omitted — same as {@link SIGFLO_MOBILE_LOADER_FEED_STATUSES}. */
const DEFAULT_MOBILE_STATUSES: string[] = [...SIGFLO_MOBILE_LOADER_FEED_STATUSES];

export {
  SIGFLO_MOBILE_LOADER_AUTH_STATUSES,
  SIGFLO_MOBILE_LOADER_FEED_STATUSES,
  SIGFLO_MOBILE_LOADER_TRADE_STATUSES,
} from '@/config/sigfloMobileLoaderStatuses';

function mobileLoaderLogoSrc(): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return '/logo.png';
  return `${base.replace(/\/?$/, '')}/logo.png`;
}

/**
 * Compact full-viewport loader for mobile / pull-to-refresh style waits.
 * Uses `public/logo.png` (same asset as splash). Optional faux progress bar.
 */
export function SigfloMobileLoader({
  statuses,
  intervalMs = 1800,
  showProgress = false,
}: {
  statuses?: string[];
  intervalMs?: number;
  showProgress?: boolean;
}) {
  const logoSrc = useMemo(() => mobileLoaderLogoSrc(), []);
  const lineList = useMemo(
    () => (statuses != null && statuses.length > 0 ? statuses : DEFAULT_MOBILE_STATUSES),
    [statuses],
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    if (!lineList.length) return;

    const timer = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % lineList.length);
        setVisible(true);
      }, 140);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [lineList, intervalMs]);

  useEffect(() => {
    if (!showProgress) return;

    const timer = window.setInterval(() => {
      setProgress((prev) => Math.min(94, prev + Math.random() * 10));
    }, 700);

    return () => window.clearInterval(timer);
  }, [showProgress]);

  const line = lineList.length ? lineList[index % lineList.length] : '';

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#050505] px-6 text-white">
      <div className="w-full max-w-[280px] text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00ffc8]/10 blur-2xl" aria-hidden />
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl" aria-hidden />

          <img
            src={logoSrc}
            alt="Sigflo"
            width={64}
            height={64}
            className="relative h-16 w-16 animate-sigflo-mobile-logo-pulse object-contain"
            style={{
              filter:
                'drop-shadow(0 0 14px rgba(0,255,200,0.28)) drop-shadow(0 0 18px rgba(0,140,255,0.18))',
            }}
            decoding="async"
            draggable={false}
          />
        </div>

        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/32">Sigflo</div>

        <div className="h-6" aria-live="polite" aria-atomic="true">
          <p
            className={`text-sm text-white/72 transition-all duration-200 ${
              visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            {line}
          </p>
        </div>

        {showProgress ? (
          <div className="mx-auto mt-4 w-full max-w-[180px]">
            <div className="h-[4px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ffc8] via-[#00d9ff] to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SigfloMobileLoader;
