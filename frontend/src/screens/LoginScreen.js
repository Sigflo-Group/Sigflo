"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var SigfloLogo_1 = require("@/components/branding/SigfloLogo");
var appRoutes_1 = require("@/config/appRoutes");
var AuthContext_1 = require("@/context/AuthContext");
var supabaseAuthErrors_1 = require("@/lib/supabaseAuthErrors");
var supabase_1 = require("@/lib/supabase");
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var BETA_NOTICE_DISMISSED_KEY = 'sigflo:betaNoticeDismissed:v1';
var inputClass = 'w-full rounded-xl border border-white/[0.1] bg-[#171A20] px-4 py-3.5 text-base text-[#F5F7FA] outline-none transition placeholder:text-[rgba(245,247,250,0.35)] focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50';
var primaryBtnClass = 'w-full rounded-xl bg-[#00C878] py-3.5 text-sm font-bold text-[#0F1115] shadow-[0_8px_28px_-8px_rgba(0,200,120,0.45)] transition enabled:active:scale-[0.99] enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[rgba(245,247,250,0.4)] disabled:shadow-none';
var ghostBtnClass = 'w-full rounded-xl border border-white/[0.12] bg-transparent py-3 text-sm font-semibold text-[#F5F7FA] transition hover:border-white/[0.2] hover:bg-white/[0.04] disabled:opacity-45';
var googleBtnClass = 'flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-[#171A20] py-3.5 text-sm font-semibold text-[#F5F7FA] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition hover:border-white/[0.18] hover:bg-[#1c2028] disabled:cursor-not-allowed disabled:opacity-45';
function GoogleGlyph(_a) {
    var className = _a.className;
    return (<svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>);
}
function LoginScreen() {
    var _this = this;
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, authMode = _a.authMode, signInWithMagicLink = _a.signInWithMagicLink, signInWithPassword = _a.signInWithPassword, signUpWithPassword = _a.signUpWithPassword, resendSignupConfirmation = _a.resendSignupConfirmation, resetPasswordForEmail = _a.resetPasswordForEmail, signInWithGoogle = _a.signInWithGoogle;
    var _b = (0, react_1.useState)('password'), authTab = _b[0], setAuthTab = _b[1];
    // —— Password / sign-up (isolated from magic link) ——
    var _c = (0, react_1.useState)(''), pwEmail = _c[0], setPwEmail = _c[1];
    var _d = (0, react_1.useState)(''), pwPassword = _d[0], setPwPassword = _d[1];
    var _e = (0, react_1.useState)('signin'), pwMode = _e[0], setPwMode = _e[1];
    var _f = (0, react_1.useState)(false), showPassword = _f[0], setShowPassword = _f[1];
    var _g = (0, react_1.useState)(false), pwBusy = _g[0], setPwBusy = _g[1];
    var _h = (0, react_1.useState)(null), pwError = _h[0], setPwError = _h[1];
    /** Set after sign-up when email confirmation is required (no session yet). */
    var _j = (0, react_1.useState)(false), pwConfirmEmailMessage = _j[0], setPwConfirmEmailMessage = _j[1];
    var _k = (0, react_1.useState)(false), pwResendBusy = _k[0], setPwResendBusy = _k[1];
    var _l = (0, react_1.useState)(false), pwResendSent = _l[0], setPwResendSent = _l[1];
    var _m = (0, react_1.useState)(null), pwResendError = _m[0], setPwResendError = _m[1];
    // Forgot password (password tab only)
    var _o = (0, react_1.useState)(false), forgotOpen = _o[0], setForgotOpen = _o[1];
    var _p = (0, react_1.useState)(''), forgotEmail = _p[0], setForgotEmail = _p[1];
    var _q = (0, react_1.useState)(false), forgotBusy = _q[0], setForgotBusy = _q[1];
    var _r = (0, react_1.useState)(null), forgotError = _r[0], setForgotError = _r[1];
    var _s = (0, react_1.useState)(false), forgotSent = _s[0], setForgotSent = _s[1];
    // —— Magic link (isolated state) ——
    var _t = (0, react_1.useState)(''), magicEmail = _t[0], setMagicEmail = _t[1];
    var _u = (0, react_1.useState)(false), magicBusy = _u[0], setMagicBusy = _u[1];
    var _v = (0, react_1.useState)(null), magicError = _v[0], setMagicError = _v[1];
    var _w = (0, react_1.useState)(false), magicSent = _w[0], setMagicSent = _w[1];
    var _x = (0, react_1.useState)(false), googleBusy = _x[0], setGoogleBusy = _x[1];
    var _y = (0, react_1.useState)(null), googleError = _y[0], setGoogleError = _y[1];
    var _z = (0, react_1.useState)(function () {
        try {
            return window.localStorage.getItem(BETA_NOTICE_DISMISSED_KEY) !== '1';
        }
        catch (_a) {
            return true;
        }
    }), betaNoticeOpen = _z[0], setBetaNoticeOpen = _z[1];
    var switchTab = (0, react_1.useCallback)(function (tab) {
        setAuthTab(tab);
        setPwError(null);
        setMagicError(null);
        setGoogleError(null);
    }, []);
    var openForgot = (0, react_1.useCallback)(function () {
        setForgotOpen(true);
        setForgotEmail(pwEmail.trim());
        setForgotError(null);
        setForgotSent(false);
    }, [pwEmail]);
    var onPasswordSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var email, session, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setPwError(null);
                    setPwConfirmEmailMessage(false);
                    email = pwEmail.trim();
                    if (!EMAIL_RE.test(email)) {
                        setPwError('Enter a valid email address.');
                        return [2 /*return*/];
                    }
                    if (pwPassword.length < 6) {
                        setPwError('Password must be at least 6 characters.');
                        return [2 /*return*/];
                    }
                    setPwBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    if (!(pwMode === 'signin')) return [3 /*break*/, 3];
                    return [4 /*yield*/, signInWithPassword(email, pwPassword)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, signUpWithPassword(email, pwPassword)];
                case 4:
                    session = (_a.sent()).session;
                    if (!session) {
                        setPwResendSent(false);
                        setPwResendError(null);
                        setPwConfirmEmailMessage(true);
                        setPwPassword('');
                    }
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    err_1 = _a.sent();
                    setPwError((0, supabaseAuthErrors_1.describeAuthError)(err_1, pwMode === 'signin' ? 'Sign-in failed.' : 'Could not create account.'));
                    return [3 /*break*/, 8];
                case 7:
                    setPwBusy(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); }, [pwEmail, pwMode, pwPassword, signInWithPassword, signUpWithPassword]);
    var onForgotSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var trimmed, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setForgotError(null);
                    trimmed = forgotEmail.trim();
                    if (!EMAIL_RE.test(trimmed)) {
                        setForgotError('Enter a valid email address.');
                        return [2 /*return*/];
                    }
                    setForgotBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, resetPasswordForEmail(trimmed)];
                case 2:
                    _a.sent();
                    setForgotSent(true);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    setForgotError((0, supabaseAuthErrors_1.describeAuthError)(err_2, 'Could not send reset email.'));
                    return [3 /*break*/, 5];
                case 4:
                    setForgotBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [forgotEmail, resetPasswordForEmail]);
    var onMagicSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var trimmed, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setMagicError(null);
                    trimmed = magicEmail.trim();
                    if (!EMAIL_RE.test(trimmed)) {
                        setMagicError('Enter a valid email address.');
                        return [2 /*return*/];
                    }
                    setMagicBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, signInWithMagicLink(trimmed)];
                case 2:
                    _a.sent();
                    setMagicSent(true);
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    setMagicError((0, supabaseAuthErrors_1.describeAuthError)(err_3, 'Could not send link. Try again.'));
                    return [3 /*break*/, 5];
                case 4:
                    setMagicBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [magicEmail, signInWithMagicLink]);
    if (authMode === 'dev' || !(0, supabase_1.isSupabaseConfigured)() || user) {
        return <react_router_dom_1.Navigate to={(0, appRoutes_1.getFeedRoute)()} replace/>;
    }
    return (<div className="flex min-h-[100dvh] flex-col bg-[#0F1115] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,200,120,0.12),transparent)]" aria-hidden/>

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00C878]/[0.12] blur-2xl sigflo-splash-glow-pulse" aria-hidden/>
            <SigfloLogo_1.SigfloLogo size={56} glowing className="relative"/>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Enter Sigflo</h1>
          <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.72)]">Your trading workspace</p>
          <p className="mt-3 inline-flex items-center rounded-full border border-[rgba(0,200,120,0.34)] bg-[rgba(0,200,120,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8FFFD4]">
            Beta phase
          </p>
        </div>

        <button type="button" disabled={googleBusy} onClick={function () {
            setGoogleError(null);
            setGoogleBusy(true);
            void signInWithGoogle()
                .catch(function (err) {
                setGoogleError((0, supabaseAuthErrors_1.describeAuthError)(err, 'Google sign-in failed.'));
            })
                .finally(function () {
                setGoogleBusy(false);
            });
        }} className={googleBtnClass}>
          <GoogleGlyph className="h-5 w-5 shrink-0"/>
          {googleBusy ? 'Redirecting…' : 'Continue with Google'}
        </button>
        {googleError ? <p className="mt-2 text-center text-sm text-rose-300/95">{googleError}</p> : null}

        <div className={"mb-6 flex items-center gap-3 ".concat(googleError ? 'mt-3' : 'mt-5')}>
          <div className="h-px flex-1 bg-white/[0.1]"/>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.38)]">or</span>
          <div className="h-px flex-1 bg-white/[0.1]"/>
        </div>

        {/* Segmented: Password | Magic link */}
        <div className="mb-6 flex rounded-xl border border-white/[0.1] bg-[#171A20] p-1" role="tablist" aria-label="Sign-in method">
          <button type="button" role="tab" aria-selected={authTab === 'password'} onClick={function () { return switchTab('password'); }} className={"flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition ".concat(authTab === 'password'
            ? 'bg-[rgba(0,200,120,0.16)] text-[#00E08A] shadow-[inset_0_0_0_1px_rgba(0,200,120,0.25)]'
            : 'text-[rgba(245,247,250,0.45)] hover:text-[rgba(245,247,250,0.75)]')}>
            Password
          </button>
          <button type="button" role="tab" aria-selected={authTab === 'magic'} onClick={function () { return switchTab('magic'); }} className={"flex-1 rounded-lg py-2.5 text-center text-xs font-bold uppercase tracking-wider transition ".concat(authTab === 'magic'
            ? 'bg-[rgba(0,200,120,0.16)] text-[#00E08A] shadow-[inset_0_0_0_1px_rgba(0,200,120,0.25)]'
            : 'text-[rgba(245,247,250,0.45)] hover:text-[rgba(245,247,250,0.75)]')}>
            Magic link
          </button>
        </div>

        {authTab === 'password' ? (<>
            {pwConfirmEmailMessage ? (<div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 shadow-[0_0_40px_-20px_rgba(0,200,120,0.35)]">
                <p className="text-sm font-semibold text-[#00E08A]">Confirm your email</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
                  We sent a verification link to <span className="font-medium text-white">{pwEmail.trim()}</span>. Open
                  it to activate your account, then sign in with your password.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[rgba(245,247,250,0.5)]">
                  Check spam or promotions — mail can take a few minutes. If nothing arrives, resend below.
                </p>
                {pwResendError ? (<p className="mt-3 text-xs text-red-300/90" role="alert">
                    {pwResendError}
                  </p>) : null}
                {pwResendSent ? (<p className="mt-3 text-xs font-medium text-[#7ee8d3]">Another link was sent — check your inbox.</p>) : null}
                <button type="button" disabled={pwResendBusy} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                    var err_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                setPwResendError(null);
                                setPwResendSent(false);
                                setPwResendBusy(true);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, 4, 5]);
                                return [4 /*yield*/, resendSignupConfirmation(pwEmail.trim())];
                            case 2:
                                _a.sent();
                                setPwResendSent(true);
                                return [3 /*break*/, 5];
                            case 3:
                                err_4 = _a.sent();
                                setPwResendError((0, supabaseAuthErrors_1.describeAuthError)(err_4, 'Could not resend the email.'));
                                return [3 /*break*/, 5];
                            case 4:
                                setPwResendBusy(false);
                                return [7 /*endfinally*/];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); }} className="mt-4 w-full rounded-xl border border-white/[0.12] bg-transparent py-2.5 text-xs font-semibold text-[#F5F7FA] transition hover:border-white/[0.2] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45">
                  {pwResendBusy ? 'Sending…' : 'Resend verification email'}
                </button>
                <button type="button" onClick={function () {
                    setPwConfirmEmailMessage(false);
                    setPwResendSent(false);
                    setPwResendError(null);
                    setPwMode('signin');
                }} className="mt-3 w-full text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]">
                  Back to sign in
                </button>
              </div>) : forgotSent ? (<div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5">
                <p className="text-sm font-semibold text-[#00E08A]">Check your email</p>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
                  If an account exists for <span className="font-medium text-white">{forgotEmail.trim()}</span>, you will
                  receive a link to set a new password.
                </p>
                <button type="button" onClick={function () {
                    setForgotOpen(false);
                    setForgotSent(false);
                    setForgotError(null);
                }} className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]">
                  Back to sign in
                </button>
              </div>) : forgotOpen ? (<form onSubmit={onForgotSubmit} className="space-y-4">
                <p className="text-sm text-[rgba(245,247,250,0.72)]">Reset your password via email.</p>
                <div>
                  <label htmlFor="sigflo-forgot-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                    Email
                  </label>
                  <input id="sigflo-forgot-email" type="email" autoComplete="email" value={forgotEmail} onChange={function (ev) { return setForgotEmail(ev.target.value); }} disabled={forgotBusy} className={inputClass}/>
                </div>
                {forgotError ? <p className="text-sm text-rose-300/95">{forgotError}</p> : null}
                <button type="submit" disabled={forgotBusy || !forgotEmail.trim()} className={primaryBtnClass}>
                  {forgotBusy ? 'Sending…' : 'Send reset link'}
                </button>
                <button type="button" disabled={forgotBusy} onClick={function () {
                    setForgotOpen(false);
                    setForgotError(null);
                }} className={ghostBtnClass}>
                  Cancel
                </button>
              </form>) : (<form onSubmit={onPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="sigflo-pw-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                    Email
                  </label>
                  <input id="sigflo-pw-email" type="email" name="email" autoComplete="email" inputMode="email" placeholder="you@email.com" value={pwEmail} onChange={function (ev) { return setPwEmail(ev.target.value); }} disabled={pwBusy} className={inputClass}/>
                </div>
                <div>
                  <label htmlFor="sigflo-pw-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                    Password
                  </label>
                  <div className="relative">
                    <input id="sigflo-pw-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete={pwMode === 'signin' ? 'current-password' : 'new-password'} placeholder="••••••••" value={pwPassword} onChange={function (ev) { return setPwPassword(ev.target.value); }} disabled={pwBusy} className={"".concat(inputClass, " pr-14")}/>
                    <button type="button" tabIndex={-1} onClick={function () { return setShowPassword(function (v) { return !v; }); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-[rgba(245,247,250,0.5)] hover:text-[#F5F7FA]">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {pwMode === 'signin' ? (<button type="button" onClick={openForgot} className="text-left text-xs font-semibold text-[#7ee8d3] hover:text-[#b8fff0]">
                    Forgot password?
                  </button>) : null}
                {pwError ? <p className="text-sm text-rose-300/95">{pwError}</p> : null}
                <button type="submit" disabled={pwBusy || !pwEmail.trim() || !pwPassword} className={primaryBtnClass}>
                  {pwBusy ? 'Please wait…' : pwMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
                <button type="button" disabled={pwBusy} onClick={function () {
                    setPwMode(function (m) { return (m === 'signin' ? 'signup' : 'signin'); });
                    setPwError(null);
                    setPwConfirmEmailMessage(false);
                }} aria-label={pwMode === 'signin' ? 'Switch to create account' : 'Switch to sign in'} className="group w-full py-3 text-center transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100">
                  {pwMode === 'signin' ? (<span className="inline-flex items-center justify-center gap-x-1.5 whitespace-nowrap text-xs font-semibold">
                      <span className="text-[rgba(245,247,250,0.55)]">New to Sigflo?</span>
                      <span className="text-[#b8fff0]">Create an account</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#00E08A] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>) : (<span className="inline-flex items-center justify-center gap-x-1.5 whitespace-nowrap text-xs font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-sigflo-muted transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden>
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sigflo-muted">Already registered?</span>
                      <span className="text-[rgba(245,247,250,0.92)]">Sign in with password</span>
                    </span>)}
                </button>
              </form>)}
          </>) : magicSent ? (<div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 shadow-[0_0_40px_-20px_rgba(0,200,120,0.35)]">
            <p className="text-sm font-semibold text-[#00E08A]">Check your email</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              We sent a sign-in link to <span className="font-medium text-white">{magicEmail.trim()}</span>. Open it on
              this device to continue — no password needed.
            </p>
            <button type="button" onClick={function () {
                setMagicSent(false);
                setMagicError(null);
            }} className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]">
              Use a different email
            </button>
          </div>) : (<form onSubmit={onMagicSubmit} className="space-y-4">
            <div>
              <label htmlFor="sigflo-magic-email" className="sr-only">
                Email
              </label>
              <input id="sigflo-magic-email" type="email" name="email-magic" autoComplete="email" inputMode="email" placeholder="you@email.com" value={magicEmail} onChange={function (ev) { return setMagicEmail(ev.target.value); }} disabled={magicBusy} className={inputClass}/>
            </div>
            {magicError ? <p className="text-sm text-rose-300/95">{magicError}</p> : null}
            <p className="text-[11px] leading-relaxed text-[rgba(245,247,250,0.55)]">
              Prefer not to use a password? We'll email you a secure one-time sign-in link.
            </p>
            <button type="submit" disabled={magicBusy || !magicEmail.trim()} className={primaryBtnClass}>
              {magicBusy ? 'Sending…' : 'Send magic link'}
            </button>
          </form>)}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[rgba(245,247,250,0.45)]">
          <react_router_dom_1.Link to="/privacy" className="font-semibold text-[#7ee8d3] underline-offset-2 transition hover:text-[#b8fff0] hover:underline">
            Privacy Policy
          </react_router_dom_1.Link>
        </p>
      </div>
      {betaNoticeOpen ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#00C878]/28 bg-[#12161c] p-5 shadow-[0_24px_80px_-28px_rgba(0,200,120,0.55)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8FFFD4]">Sigflo Beta Access</p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(245,247,250,0.88)]">Sigflo is currently in beta.</p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(245,247,250,0.78)]">
              We provide AI-assisted signals and market insights - not financial advice.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(245,247,250,0.78)]">
              Markets carry risk, and outcomes are never guaranteed.
              <br />
              During beta, data and features may be incomplete or inaccurate.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(245,247,250,0.86)]">
              Trade thoughtfully. You are fully responsible for your decisions.
            </p>
            <button type="button" onClick={function () {
                setBetaNoticeOpen(false);
                try {
                    window.localStorage.setItem(BETA_NOTICE_DISMISSED_KEY, '1');
                }
                catch (_a) {
                    // Ignore storage failures (private mode / blocked storage).
                }
            }} className="mt-5 w-full rounded-xl bg-[#00C878] py-3 text-sm font-bold text-[#0F1115] shadow-[0_8px_28px_-8px_rgba(0,200,120,0.45)] transition hover:brightness-105 active:scale-[0.99]">
              Enter Sigflo
            </button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-[rgba(245,247,250,0.6)]">
              By continuing, you acknowledge the risks and accept our terms.
            </p>
          </div>
        </div>) : null}
    </div>);
}
