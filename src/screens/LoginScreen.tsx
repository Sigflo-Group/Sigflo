import { useCallback, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SigfloLogo } from '@/components/branding/SigfloLogo';
import { getFeedRoute } from '@/config/appRoutes';
import { useAuth } from '@/context/AuthContext';
import { describeAuthError } from '@/lib/supabaseAuthErrors';
import { isSupabaseConfigured } from '@/lib/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full rounded-xl border border-white/[0.1] bg-[#171A20] px-4 py-3.5 text-base text-[#F5F7FA] outline-none transition placeholder:text-[rgba(245,247,250,0.35)] focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50';

const primaryBtnClass =
  'w-full rounded-xl bg-[#00C878] py-3.5 text-sm font-bold text-[#0F1115] shadow-[0_8px_28px_-8px_rgba(0,200,120,0.45)] transition enabled:active:scale-[0.99] enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[rgba(245,247,250,0.4)] disabled:shadow-none';

const ghostBtnClass =
  'w-full rounded-xl border border-white/[0.12] bg-transparent py-3 text-sm font-semibold text-[#F5F7FA] transition hover:border-white/[0.2] hover:bg-white/[0.04] disabled:opacity-45';

const googleBtnClass =
  'flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-[#171A20] py-3.5 text-sm font-semibold text-[#F5F7FA] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition hover:border-white/[0.18] hover:bg-[#1c2028] disabled:cursor-not-allowed disabled:opacity-45';

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthTab = 'password' | 'magic';

export default function LoginScreen() {
  const {
    user,
    authMode,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    resendSignupConfirmation,
    resetPasswordForEmail,
    signInWithGoogle,
  } = useAuth();

  const [authTab, setAuthTab] = useState<AuthTab>('password');

  // —— Password / sign-up (isolated from magic link) ——
  const [pwEmail, setPwEmail] = useState('');
  const [pwPassword, setPwPassword] = useState('');
  const [pwMode, setPwMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  /** Set after sign-up when email confirmation is required (no session yet). */
  const [pwConfirmEmailMessage, setPwConfirmEmailMessage] = useState(false);
  const [pwResendBusy, setPwResendBusy] = useState(false);
  const [pwResendSent, setPwResendSent] = useState(false);
  const [pwResendError, setPwResendError] = useState<string | null>(null);

  // Forgot password (password tab only)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // —— Magic link (isolated state) ——
  const [magicEmail, setMagicEmail] = useState('');
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const switchTab = useCallback((tab: AuthTab) => {
    setAuthTab(tab);
    setPwError(null);
    setMagicError(null);
    setGoogleError(null);
  }, []);

  const openForgot = useCallback(() => {
    setForgotOpen(true);
    setForgotEmail(pwEmail.trim());
    setForgotError(null);
    setForgotSent(false);
  }, [pwEmail]);

  const onPasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPwError(null);
      setPwConfirmEmailMessage(false);
      const email = pwEmail.trim();
      if (!EMAIL_RE.test(email)) {
        setPwError('Enter a valid email address.');
        return;
      }
      if (pwPassword.length < 6) {
        setPwError('Password must be at least 6 characters.');
        return;
      }
      setPwBusy(true);
      try {
        if (pwMode === 'signin') {
          await signInWithPassword(email, pwPassword);
        } else {
          const { session } = await signUpWithPassword(email, pwPassword);
          if (!session) {
            setPwResendSent(false);
            setPwResendError(null);
            setPwConfirmEmailMessage(true);
            setPwPassword('');
          }
        }
      } catch (err) {
        setPwError(describeAuthError(err, pwMode === 'signin' ? 'Sign-in failed.' : 'Could not create account.'));
      } finally {
        setPwBusy(false);
      }
    },
    [pwEmail, pwMode, pwPassword, signInWithPassword, signUpWithPassword],
  );

  const onForgotSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotError(null);
      const trimmed = forgotEmail.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setForgotError('Enter a valid email address.');
        return;
      }
      setForgotBusy(true);
      try {
        await resetPasswordForEmail(trimmed);
        setForgotSent(true);
      } catch (err) {
        setForgotError(describeAuthError(err, 'Could not send reset email.'));
      } finally {
        setForgotBusy(false);
      }
    },
    [forgotEmail, resetPasswordForEmail],
  );

  const onMagicSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMagicError(null);
      const trimmed = magicEmail.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setMagicError('Enter a valid email address.');
        return;
      }
      setMagicBusy(true);
      try {
        await signInWithMagicLink(trimmed);
        setMagicSent(true);
      } catch (err) {
        setMagicError(describeAuthError(err, 'Could not send link. Try again.'));
      } finally {
        setMagicBusy(false);
      }
    },
    [magicEmail, signInWithMagicLink],
  );

  if (authMode === 'dev' || !isSupabaseConfigured() || user) {
    return <Navigate to={getFeedRoute()} replace />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0F1115] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,200,120,0.12),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00C878]/[0.12] blur-2xl sigflo-splash-glow-pulse"
              aria-hidden
            />
            <SigfloLogo size={56} glowing className="relative" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Enter Sigflo</h1>
          <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.72)]">Your trading workspace</p>
          <p className="mt-3 inline-flex items-center rounded-full border border-[rgba(0,200,120,0.34)] bg-[rgba(0,200,120,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8FFFD4]">
            Beta phase
          </p>
        </div>

        <button
          type="button"
          disabled={googleBusy}
          onClick={() => {
            setGoogleError(null);
            setGoogleBusy(true);
            void signInWithGoogle()
              .catch((err: unknown) => {
                setGoogleError(describeAuthError(err, 'Google sign-in failed.'));
              })
              .finally(() => {
                setGoogleBusy(false);
              });
          }}
          className={googleBtnClass}
        >
          <GoogleGlyph className="h-5 w-5 shrink-0" />
          {googleBusy ? 'Redirecting…' : 'Continue with Google'}
        </button>
        {googleError ? <p className="mt-2 text-center text-sm text-rose-300/95">{googleError}</p> : null}

        <div className={`mb-6 flex items-center gap-3 ${googleError ? 'mt-3' : 'mt-5'}`}>
          <div className="h-px flex-1 bg-white/[0.1]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.38)]">or</span>
          <div className="h-px flex-1 bg-white/[0.1]" />
        </div>

        {/* Segmented: Password | Magic link */}
        <div
          className="mb-6 flex rounded-xl border border-white/[0.1] bg-[#171A20] p-1"
          role="tablist"
          aria-label="Sign-in method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'password'}
            onClick={() => switchTab('password')}
            className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition ${
              authTab === 'password'
                ? 'bg-[rgba(0,200,120,0.16)] text-[#00E08A] shadow-[inset_0_0_0_1px_rgba(0,200,120,0.25)]'
                : 'text-[rgba(245,247,250,0.45)] hover:text-[rgba(245,247,250,0.75)]'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'magic'}
            onClick={() => switchTab('magic')}
            className={`flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition ${
              authTab === 'magic'
                ? 'bg-[rgba(0,200,120,0.16)] text-[#00E08A] shadow-[inset_0_0_0_1px_rgba(0,200,120,0.25)]'
                : 'text-[rgba(245,247,250,0.45)] hover:text-[rgba(245,247,250,0.75)]'
            }`}
          >
            Magic link
          </button>
        </div>

        {authTab === 'password' ? (
          <>
            {pwConfirmEmailMessage ? (
              <div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 shadow-[0_0_40px_-20px_rgba(0,200,120,0.35)]">
                <p className="text-sm font-semibold text-[#00E08A]">Confirm your email</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
                  We sent a verification link to <span className="font-medium text-white">{pwEmail.trim()}</span>. Open
                  it to activate your account, then sign in with your password.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[rgba(245,247,250,0.5)]">
                  Check spam or promotions — mail can take a few minutes. If nothing arrives, resend below.
                </p>
                {pwResendError ? (
                  <p className="mt-3 text-xs text-red-300/90" role="alert">
                    {pwResendError}
                  </p>
                ) : null}
                {pwResendSent ? (
                  <p className="mt-3 text-xs font-medium text-[#7ee8d3]">Another link was sent — check your inbox.</p>
                ) : null}
                <button
                  type="button"
                  disabled={pwResendBusy}
                  onClick={async () => {
                    setPwResendError(null);
                    setPwResendSent(false);
                    setPwResendBusy(true);
                    try {
                      await resendSignupConfirmation(pwEmail.trim());
                      setPwResendSent(true);
                    } catch (err) {
                      setPwResendError(describeAuthError(err, 'Could not resend the email.'));
                    } finally {
                      setPwResendBusy(false);
                    }
                  }}
                  className="mt-4 w-full rounded-xl border border-white/[0.12] bg-transparent py-2.5 text-xs font-semibold text-[#F5F7FA] transition hover:border-white/[0.2] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {pwResendBusy ? 'Sending…' : 'Resend verification email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwConfirmEmailMessage(false);
                    setPwResendSent(false);
                    setPwResendError(null);
                    setPwMode('signin');
                  }}
                  className="mt-3 w-full text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]"
                >
                  Back to sign in
                </button>
              </div>
            ) : forgotSent ? (
              <div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5">
                <p className="text-sm font-semibold text-[#00E08A]">Check your email</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
                  If an account exists for <span className="font-medium text-white">{forgotEmail.trim()}</span>, you will
                  receive a link to set a new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotSent(false);
                    setForgotError(null);
                  }}
                  className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]"
                >
                  Back to sign in
                </button>
              </div>
            ) : forgotOpen ? (
              <form onSubmit={onForgotSubmit} className="space-y-4">
                <p className="text-sm text-[rgba(245,247,250,0.72)]">Reset your password via email.</p>
                <div>
                  <label htmlFor="sigflo-forgot-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                    Email
                  </label>
                  <input
                    id="sigflo-forgot-email"
                    type="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(ev) => setForgotEmail(ev.target.value)}
                    disabled={forgotBusy}
                    className={inputClass}
                  />
                </div>
                {forgotError ? <p className="text-sm text-rose-300/95">{forgotError}</p> : null}
                <button type="submit" disabled={forgotBusy || !forgotEmail.trim()} className={primaryBtnClass}>
                  {forgotBusy ? 'Sending…' : 'Send reset link'}
                </button>
                <button
                  type="button"
                  disabled={forgotBusy}
                  onClick={() => {
                    setForgotOpen(false);
                    setForgotError(null);
                  }}
                  className={ghostBtnClass}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={onPasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="sigflo-pw-email"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]"
                  >
                    Email
                  </label>
                  <input
                    id="sigflo-pw-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@email.com"
                    value={pwEmail}
                    onChange={(ev) => setPwEmail(ev.target.value)}
                    disabled={pwBusy}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="sigflo-pw-password"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="sigflo-pw-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={pwMode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      value={pwPassword}
                      onChange={(ev) => setPwPassword(ev.target.value)}
                      disabled={pwBusy}
                      className={`${inputClass} pr-14`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-[rgba(245,247,250,0.5)] hover:text-[#F5F7FA]"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {pwMode === 'signin' ? (
                  <button type="button" onClick={openForgot} className="text-left text-xs font-semibold text-[#7ee8d3] hover:text-[#b8fff0]">
                    Forgot password?
                  </button>
                ) : null}
                {pwError ? <p className="text-sm text-rose-300/95">{pwError}</p> : null}
                <button
                  type="submit"
                  disabled={pwBusy || !pwEmail.trim() || !pwPassword}
                  className={primaryBtnClass}
                >
                  {pwBusy ? 'Please wait…' : pwMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                <button
                  type="button"
                  disabled={pwBusy}
                  onClick={() => {
                    setPwMode((m) => (m === 'signin' ? 'signup' : 'signin'));
                    setPwError(null);
                    setPwConfirmEmailMessage(false);
                  }}
                  aria-label={pwMode === 'signin' ? 'Switch to create account' : 'Switch to sign in'}
                  className="group w-full py-3 text-center transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                >
                  {pwMode === 'signin' ? (
                    <span className="inline-flex items-center justify-center gap-x-1.5 whitespace-nowrap text-xs font-semibold">
                      <span className="text-[rgba(245,247,250,0.55)]">New to Sigflo?</span>
                      <span className="text-[#b8fff0]">Create an account</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0 text-[#00E08A] transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      >
                        <path
                          d="M9 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-x-1.5 whitespace-nowrap text-xs font-semibold">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="shrink-0 text-sigflo-muted transition-transform duration-200 group-hover:-translate-x-0.5"
                        aria-hidden
                      >
                        <path
                          d="M15 18l-6-6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sigflo-muted">Already registered?</span>
                      <span className="text-[rgba(245,247,250,0.92)]">Sign in with password</span>
                    </span>
                  )}
                </button>
              </form>
            )}
          </>
        ) : magicSent ? (
          <div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 shadow-[0_0_40px_-20px_rgba(0,200,120,0.35)]">
            <p className="text-sm font-semibold text-[#00E08A]">Check your email</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              We sent a sign-in link to <span className="font-medium text-white">{magicEmail.trim()}</span>. Open it on
              this device to continue — no password needed.
            </p>
            <button
              type="button"
              onClick={() => {
                setMagicSent(false);
                setMagicError(null);
              }}
              className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onMagicSubmit} className="space-y-4">
            <div>
              <label htmlFor="sigflo-magic-email" className="sr-only">
                Email
              </label>
              <input
                id="sigflo-magic-email"
                type="email"
                name="email-magic"
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                value={magicEmail}
                onChange={(ev) => setMagicEmail(ev.target.value)}
                disabled={magicBusy}
                className={inputClass}
              />
            </div>
            {magicError ? <p className="text-sm text-rose-300/95">{magicError}</p> : null}
            <p className="text-[11px] leading-relaxed text-[rgba(245,247,250,0.55)]">
              Prefer not to use a password? We'll email you a secure one-time sign-in link.
            </p>
            <button type="submit" disabled={magicBusy || !magicEmail.trim()} className={primaryBtnClass}>
              {magicBusy ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[rgba(245,247,250,0.45)]">
          <Link
            to="/privacy"
            className="font-semibold text-[#7ee8d3] underline-offset-2 transition hover:text-[#b8fff0] hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
