import { useEffect, useState } from 'react';
import { SigfloLogo } from '@/components/branding/SigfloLogo';

const MESSAGES = ['Initializing…', 'Syncing markets…'] as const;

export function SplashScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 950);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0F1115] px-6">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(0,200,120,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-36 w-36 rounded-full bg-[#00C878]/[0.14] blur-3xl sigflo-splash-glow-pulse"
            aria-hidden
          />
          <div className="absolute h-28 w-28 rounded-full bg-[#00C878]/[0.08] blur-2xl sigflo-splash-glow-pulse-delayed" aria-hidden />
          <SigfloLogo size={88} glowing className="relative sigflo-splash-logo-drift" />
        </div>
        <p
          key={MESSAGES[msgIndex]}
          className="text-[13px] font-medium tracking-wide text-[rgba(245,247,250,0.55)] sigflo-splash-tagline-fade"
        >
          {MESSAGES[msgIndex]}
        </p>
      </div>
    </div>
  );
}
