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
exports.default = ResetPasswordScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var SigfloLogo_1 = require("@/components/branding/SigfloLogo");
var appRoutes_1 = require("@/config/appRoutes");
var supabaseAuthErrors_1 = require("@/lib/supabaseAuthErrors");
var supabase_1 = require("@/lib/supabase");
/** True when the URL likely came from a Supabase reset email (hash, query, or PKCE code on this route). */
function looksLikeRecoveryRedirect() {
    if (typeof window === 'undefined')
        return false;
    var hash = window.location.hash.replace(/^#/, '');
    if (hash) {
        var fromHash = new URLSearchParams(hash);
        if (fromHash.get('type') === 'recovery')
            return true;
        // Implicit / some templates put tokens in the hash without `type` before redirect cleanup.
        if (fromHash.get('access_token'))
            return true;
    }
    var q = new URLSearchParams(window.location.search);
    if (q.get('type') === 'recovery')
        return true;
    // PKCE recovery emails use ?code= on the redirect URL; OAuth uses /auth/callback, not this screen.
    if (q.get('code'))
        return true;
    if (q.get('token_hash'))
        return true;
    if (q.get('token'))
        return true;
    return false;
}
/**
 * Supabase recovery emails vary by template:
 * - `token_hash` or `token` + `type=recovery` → verifyOtp (no PKCE verifier; works from any device).
 * - Hash `access_token` + `refresh_token` + `type=recovery` → setSession.
 * - `code` → exchangeCodeForSession (needs verifier from the same browser that requested the reset).
 */
function consumeRecoveryFromUrl(client) {
    return __awaiter(this, void 0, void 0, function () {
        var url, typeParam, otpToken, error, qs, hash, hp, access_token, refresh_token, error, code, _a, data, error, qs;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = new URL(window.location.href);
                    typeParam = url.searchParams.get('type');
                    otpToken = (_b = url.searchParams.get('token_hash')) !== null && _b !== void 0 ? _b : url.searchParams.get('token');
                    if (!(typeParam === 'recovery' && otpToken)) return [3 /*break*/, 2];
                    return [4 /*yield*/, client.auth.verifyOtp({
                            type: 'recovery',
                            token_hash: otpToken,
                        })];
                case 1:
                    error = (_c.sent()).error;
                    if (!error) {
                        url.searchParams.delete('token_hash');
                        url.searchParams.delete('token');
                        url.searchParams.delete('type');
                        qs = url.searchParams.toString();
                        window.history.replaceState(null, '', "".concat(url.pathname).concat(qs ? "?".concat(qs) : '').concat(url.hash));
                        return [2 /*return*/, true];
                    }
                    _c.label = 2;
                case 2:
                    hash = url.hash.replace(/^#/, '');
                    if (!hash) return [3 /*break*/, 4];
                    hp = new URLSearchParams(hash);
                    access_token = hp.get('access_token');
                    refresh_token = hp.get('refresh_token');
                    if (!(access_token && refresh_token && hp.get('type') === 'recovery')) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.auth.setSession({ access_token: access_token, refresh_token: refresh_token })];
                case 3:
                    error = (_c.sent()).error;
                    if (!error) {
                        window.history.replaceState(null, '', "".concat(url.pathname).concat(url.search));
                        return [2 /*return*/, true];
                    }
                    _c.label = 4;
                case 4:
                    code = url.searchParams.get('code');
                    if (!code) return [3 /*break*/, 6];
                    return [4 /*yield*/, client.auth.exchangeCodeForSession(code)];
                case 5:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (!error && data.session) {
                        url.searchParams.delete('code');
                        qs = url.searchParams.toString();
                        window.history.replaceState(null, '', "".concat(url.pathname).concat(qs ? "?".concat(qs) : '').concat(url.hash));
                        return [2 /*return*/, true];
                    }
                    _c.label = 6;
                case 6: return [2 /*return*/, false];
            }
        });
    });
}
function ResetPasswordScreen() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)(''), password = _a[0], setPassword = _a[1];
    var _b = (0, react_1.useState)(''), confirm = _b[0], setConfirm = _b[1];
    var _c = (0, react_1.useState)(false), showPw = _c[0], setShowPw = _c[1];
    /**
     * True when we have a session from the reset link. We use PASSWORD_RECOVERY when it fires, plus getSession
     * (immediate + short poll) because PASSWORD_RECOVERY can emit before React subscribes to onAuthStateChange.
     */
    var _d = (0, react_1.useState)(false), recoverySessionReady = _d[0], setRecoverySessionReady = _d[1];
    var _e = (0, react_1.useState)(false), verifyTimedOut = _e[0], setVerifyTimedOut = _e[1];
    var _f = (0, react_1.useState)(false), busy = _f[0], setBusy = _f[1];
    var _g = (0, react_1.useState)(null), error = _g[0], setError = _g[1];
    var _h = (0, react_1.useState)(false), done = _h[0], setDone = _h[1];
    /** Captured once — Supabase may strip hash/query after parsing tokens. */
    var arrivedFromRecoveryEmail = (0, react_1.useState)(function () { return looksLikeRecoveryRedirect(); })[0];
    var recoveryAppliedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        var client = supabase_1.supabase;
        if (!client)
            return;
        var cancelled = false;
        var markReadyIfSession = function () {
            if (cancelled || !arrivedFromRecoveryEmail || recoveryAppliedRef.current)
                return;
            void client.auth.getSession().then(function (_a) {
                var data = _a.data;
                if (cancelled || recoveryAppliedRef.current)
                    return;
                if (data.session) {
                    recoveryAppliedRef.current = true;
                    setRecoverySessionReady(true);
                    setVerifyTimedOut(false);
                }
            });
        };
        var subscription = client.auth.onAuthStateChange(function (event, session) {
            if (cancelled)
                return;
            if (event === 'PASSWORD_RECOVERY' && session) {
                recoveryAppliedRef.current = true;
                setRecoverySessionReady(true);
                setVerifyTimedOut(false);
            }
        }).data.subscription;
        void (function () { return __awaiter(_this, void 0, void 0, function () {
            var consumed, i, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, consumeRecoveryFromUrl(client)];
                    case 1:
                        consumed = _a.sent();
                        if (cancelled)
                            return [2 /*return*/];
                        if (consumed) {
                            recoveryAppliedRef.current = true;
                            setRecoverySessionReady(true);
                            setVerifyTimedOut(false);
                            return [2 /*return*/];
                        }
                        // Race: PASSWORD_RECOVERY often fires during client init, before this listener runs.
                        markReadyIfSession();
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < 80 && !cancelled && arrivedFromRecoveryEmail && !recoveryAppliedRef.current)) return [3 /*break*/, 6];
                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 200); })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, client.auth.getSession()];
                    case 4:
                        data = (_a.sent()).data;
                        if (cancelled || recoveryAppliedRef.current)
                            return [2 /*return*/];
                        if (data.session) {
                            recoveryAppliedRef.current = true;
                            setRecoverySessionReady(true);
                            setVerifyTimedOut(false);
                            return [2 /*return*/];
                        }
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        }); })();
        var timeoutId;
        if (arrivedFromRecoveryEmail) {
            timeoutId = window.setTimeout(function () {
                if (!cancelled && !recoveryAppliedRef.current) {
                    setVerifyTimedOut(true);
                }
            }, 25000);
        }
        return function () {
            cancelled = true;
            if (timeoutId !== undefined)
                window.clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [arrivedFromRecoveryEmail]);
    var onSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var session, upErr, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError(null);
                    if (password.length < 6) {
                        setError('Use at least 6 characters.');
                        return [2 /*return*/];
                    }
                    if (password !== confirm) {
                        setError('Passwords do not match.');
                        return [2 /*return*/];
                    }
                    if (!supabase_1.supabase)
                        return [2 /*return*/];
                    setBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, supabase_1.supabase.auth.getSession()];
                case 2:
                    session = (_a.sent()).data.session;
                    if (!session) {
                        setError('Your reset session expired or this page was opened without the email link. Request a new reset from the login screen.');
                        setRecoverySessionReady(false);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase_1.supabase.auth.updateUser({ password: password })];
                case 3:
                    upErr = (_a.sent()).error;
                    if (upErr)
                        throw upErr;
                    setDone(true);
                    window.setTimeout(function () { return navigate((0, appRoutes_1.getFeedRoute)(), { replace: true }); }, 1200);
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError((0, supabaseAuthErrors_1.describeAuthError)(err_1, 'Could not update password.'));
                    return [3 /*break*/, 6];
                case 5:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [confirm, navigate, password]);
    if (!supabase_1.supabase) {
        return (<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0F1115] px-6 text-center text-sm text-[rgba(245,247,250,0.65)]">
        Supabase is not configured.
      </div>);
    }
    return (<div className="flex min-h-[100dvh] flex-col bg-[#0F1115] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,200,120,0.12),transparent)]" aria-hidden/>
      <div className="relative mx-auto w-full max-w-sm flex-1">
        <div className="mb-8 flex flex-col items-center text-center">
          <SigfloLogo_1.SigfloLogo size={48} glowing className="mb-4"/>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F7FA]">Set new password</h1>
          <p className="mt-2 text-sm text-[rgba(245,247,250,0.65)]">Choose a strong password for your account.</p>
        </div>

        {!recoverySessionReady ? (verifyTimedOut ? (<div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>
                We could not confirm your reset link (it may have expired). Request a new password reset from the login
                screen, then open the link in the <span className="font-medium text-white">same browser</span> you use
                for Sigflo (same site URL and port as when you tapped &quot;Forgot password&quot;). If your email uses a
                long <span className="font-mono text-[11px] text-white/80">code=</span> link, that flow only works when
                the verifier stored in that browser is still present.
              </p>
              <react_router_dom_1.Link to="/login" className="mt-4 inline-block text-sm font-semibold text-[#7ee8d3]">
                Back to sign in
              </react_router_dom_1.Link>
            </div>) : arrivedFromRecoveryEmail ? (<div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-center text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>Verifying your reset link…</p>
            </div>) : (<div className="rounded-2xl border border-white/[0.08] bg-[#171A20] p-5 text-sm leading-relaxed text-[rgba(245,247,250,0.75)]">
              <p>
                Open the reset link from your email in this browser. Do not bookmark this page — it only works after you
                tap the link in the message.
              </p>
              <react_router_dom_1.Link to="/login" className="mt-4 inline-block text-sm font-semibold text-[#7ee8d3]">
                Back to sign in
              </react_router_dom_1.Link>
            </div>)) : done ? (<div className="rounded-2xl border border-[rgba(0,200,120,0.22)] bg-[#171A20] p-5 text-center">
            <p className="text-sm font-semibold text-[#00E08A]">Password updated</p>
            <p className="mt-2 text-sm text-[rgba(245,247,250,0.75)]">Taking you to Sigflo…</p>
          </div>) : (<form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-pw" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                New password
              </label>
              <div className="relative">
                <input id="reset-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={function (ev) { return setPassword(ev.target.value); }} disabled={busy} className="w-full rounded-xl border border-white/[0.1] bg-[#171A20] py-3.5 pl-4 pr-12 text-base text-[#F5F7FA] outline-none focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50"/>
                <button type="button" tabIndex={-1} onClick={function () { return setShowPw(function (v) { return !v; }); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-[rgba(245,247,250,0.5)] hover:text-[#F5F7FA]">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reset-pw2" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[rgba(245,247,250,0.45)]">
                Confirm password
              </label>
              <input id="reset-pw2" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={function (ev) { return setConfirm(ev.target.value); }} disabled={busy} className="w-full rounded-xl border border-white/[0.1] bg-[#171A20] px-4 py-3.5 text-base text-[#F5F7FA] outline-none focus:border-[rgba(0,200,120,0.45)] focus:shadow-[0_0_0_3px_rgba(0,200,120,0.12)] disabled:opacity-50"/>
            </div>
            {error ? <p className="text-sm text-rose-300/95">{error}</p> : null}
            <button type="submit" disabled={busy || !password || !confirm} className="w-full rounded-xl bg-[#00C878] py-3.5 text-sm font-bold text-[#0F1115] shadow-[0_8px_28px_-8px_rgba(0,200,120,0.45)] transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[rgba(245,247,250,0.4)] disabled:shadow-none">
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>)}
      </div>
    </div>);
}
