import { useEffect, useMemo, useState } from 'react';
import { SigfloCinematicLoaderMark } from '@/components/branding/SigfloCinematicLoaderMark';

function splashLogoSrc(): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') return '/logo.png';
  return `${base.replace(/\/?$/, '')}/logo.png`;
}

const STATUSES = [
  'Syncing market context',
  'Reading structure and flow',
  'Calibrating signal engine',
  'Preparing trade workspace',
  'Validating live conditions',
] as const;

/**
 * Full-viewport boot / auth wait — vector halo (dual rings + flow highlights) behind static `logo.png` center;
 * whole stack soft-floats. Shown from `App` until splash min time and auth loading finish.
 */
export function SplashScreen() {
  const logoSrc = useMemo(() => splashLogoSrc(), []);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const t = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % STATUSES.length);
        setVisible(true);
      }, 200);
    }, 2400);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      setProgress((p) => Math.min(96, p + Math.random() * 10));
    }, 900);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#050505] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(0,255,200,0.12),transparent_25%),radial-gradient(circle_at_65%_60%,rgba(0,140,255,0.10),transparent_30%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-[35%] top-[25%] h-72 w-72 animate-sigflo-loader-orb-10 rounded-full bg-[#00ffc8]/10 blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[25%] right-[30%] h-64 w-64 animate-sigflo-loader-orb-14 rounded-full bg-blue-400/10 blur-[140px]"
        aria-hidden
      />

      <div className="relative flex min-h-[100dvh] items-center justify-center px-6">
        <div className="text-center">
          <div className="relative mb-12 flex justify-center">
            <div className="absolute inset-0 scale-[1.6] rounded-full bg-[#00ffc8]/15 blur-3xl" aria-hidden />
            <div
              className="absolute inset-0 scale-[1.6] rounded-full bg-blue-500/10 blur-3xl mix-blend-screen"
              aria-hidden
            />

            <div
              className="relative flex h-[200px] w-[200px] animate-sigflo-loader-float-soft items-center justify-center"
              style={{
                filter:
                  'drop-shadow(0 0 25px rgba(0,255,200,0.35)) drop-shadow(0 0 35px rgba(0,140,255,0.25))',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden
              >
                <SigfloCinematicLoaderMark
                  decorative
                  className="h-[195px] w-[195px] max-w-none scale-105"
                />
              </div>
              <img
                src={logoSrc}
                alt="Sigflo"
                width={96}
                height={96}
                className="relative z-10 h-[96px] w-[96px] shrink-0 object-contain"
                decoding="async"
                draggable={false}
              />
            </div>
          </div>

          <div className="mb-6 h-[24px]" aria-live="polite" aria-atomic="true">
            <p
              className={`text-sm uppercase tracking-[0.18em] text-white/70 transition-all duration-300 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
              }`}
            >
              {STATUSES[index]}
            </p>
          </div>

          <div className="mx-auto w-[260px]">
            <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span>System Boot</span>
              <span>{Math.floor(progress)}%</span>
            </div>

            <div className="relative h-[6px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00ffc8] via-[#00d9ff] to-blue-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-8 text-[11px] uppercase tracking-[0.2em] text-white/25">
            Quietly reading the market
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drop-in alias if you import a “loading screen” by this name elsewhere. */
export const SigfloLoadingScreen = SplashScreen;
