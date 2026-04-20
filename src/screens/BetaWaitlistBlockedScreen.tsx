import { useAuth } from '@/context/AuthContext';

const BG = '#050505';
const ACCENT = '#00ffc8';

type BetaWaitlistBlockedScreenProps = {
  /** Set when profile fetch fails (e.g. missing table or RLS). */
  errorMessage?: string | null;
  /** Re-load profile from Supabase (e.g. after an admin flips `approved`). */
  onRetry: () => void;
};

export default function BetaWaitlistBlockedScreen({ errorMessage, onRetry }: BetaWaitlistBlockedScreenProps) {
  const { signOut } = useAuth();

  return (
    <div
      className="fixed inset-0 z-[400] flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto px-5 py-10"
      style={{ backgroundColor: BG }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.08] px-7 py-10 text-center shadow-[0_0_80px_-20px_rgba(0,255,200,0.18)] backdrop-blur-xl"
        style={{
          background: 'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.35) 100%)',
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: ACCENT }}
        >
          Early access
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">You’re on the list.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/65">
          You’ve been added to the Sigflo waitlist. Access is being rolled out in batches as we refine the system.
        </p>
        <p className="mt-6 text-sm font-semibold text-white/90">Your access hasn’t opened yet.</p>
        <p className="mt-2 text-xs leading-relaxed text-white/45">We’ll notify you as soon as your batch is ready.</p>

        {errorMessage ? (
          <p className="mt-6 rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-left text-[11px] leading-snug text-amber-100/90">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onRetry()}
            className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
          >
            Check again
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-110"
            style={{
              backgroundColor: `${ACCENT}18`,
              color: ACCENT,
              boxShadow: `inset 0 0 0 1px ${ACCENT}44`,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
