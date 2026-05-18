"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.default = BetaAdminScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var appRoutes_1 = require("@/config/appRoutes");
var AuthContext_1 = require("@/context/AuthContext");
var adminBetaApi_1 = require("@/lib/adminBetaApi");
var ACCENT = '#00ffc8';
function BetaAdminScreen() {
    var _this = this;
    var _a;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _b = (0, AuthContext_1.useAuth)(), user = _b.user, session = _b.session, authMode = _b.authMode, authLoading = _b.loading;
    var token = (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : null;
    var _c = (0, react_1.useState)([]), list = _c[0], setList = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var _f = (0, react_1.useState)(''), email = _f[0], setEmail = _f[1];
    var _g = (0, react_1.useState)(''), userId = _g[0], setUserId = _g[1];
    var _h = (0, react_1.useState)(false), busy = _h[0], setBusy = _h[1];
    var _j = (0, react_1.useState)(null), notice = _j[0], setNotice = _j[1];
    var load = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var res, j, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!token) {
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    setError(null);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, adminBetaApi_1.postAdminBeta)(token, { action: 'list', limit: 120 })];
                case 2:
                    res = _d.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    j = (_d.sent());
                    if (!res.ok) {
                        setError(typeof j.error === 'string' ? j.error : "HTTP ".concat((_b = res.status) !== null && _b !== void 0 ? _b : 'unknown'));
                        setList([]);
                        return [2 /*return*/];
                    }
                    setList((_c = j.profiles) !== null && _c !== void 0 ? _c : []);
                    return [3 /*break*/, 6];
                case 4:
                    _a = _d.sent();
                    setError('Could not reach beta admin API.');
                    setList([]);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [token]);
    (0, react_1.useEffect)(function () {
        void load();
    }, [load]);
    var approveBy = (0, react_1.useCallback)(function (override) { return __awaiter(_this, void 0, void 0, function () {
        var e, id, res, j, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    e = ((_b = override === null || override === void 0 ? void 0 : override.email) !== null && _b !== void 0 ? _b : email).trim().toLowerCase();
                    id = ((_c = override === null || override === void 0 ? void 0 : override.userId) !== null && _c !== void 0 ? _c : userId).trim();
                    if (!e && !id) {
                        setNotice('Enter an email or user id.');
                        return [2 /*return*/];
                    }
                    setBusy(true);
                    setNotice(null);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, (0, adminBetaApi_1.postAdminBeta)(token, __assign({ action: 'approve' }, (id ? { userId: id } : { email: e })))];
                case 2:
                    res = _e.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    j = (_e.sent());
                    if (!res.ok) {
                        setNotice((_d = j.error) !== null && _d !== void 0 ? _d : "Approve failed (".concat(res.status, ")"));
                        return [2 /*return*/];
                    }
                    setNotice(j.profile ? "Approved ".concat(j.profile.email) : 'Approved.');
                    setEmail('');
                    setUserId('');
                    return [4 /*yield*/, load()];
                case 4:
                    _e.sent();
                    return [3 /*break*/, 7];
                case 5:
                    _a = _e.sent();
                    setNotice('Network error while approving.');
                    return [3 /*break*/, 7];
                case 6:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [token, email, userId, load]);
    var onRevoke = (0, react_1.useCallback)(function (id) { return __awaiter(_this, void 0, void 0, function () {
        var res, j, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!token)
                        return [2 /*return*/];
                    setBusy(true);
                    setNotice(null);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, (0, adminBetaApi_1.postAdminBeta)(token, { action: 'revoke', userId: id })];
                case 2:
                    res = _c.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    j = (_c.sent());
                    if (!res.ok) {
                        setNotice((_b = j.error) !== null && _b !== void 0 ? _b : 'Revoke failed');
                        return [2 /*return*/];
                    }
                    setNotice('Access revoked.');
                    return [4 /*yield*/, load()];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 5:
                    _a = _c.sent();
                    setNotice('Network error while revoking.');
                    return [3 /*break*/, 7];
                case 6:
                    setBusy(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [token, load]);
    if (authLoading) {
        return (<div className="flex min-h-[100dvh] items-center justify-center bg-[#050505] text-sm text-white/50">
        Loading…
      </div>);
    }
    if (authMode !== 'supabase' || !user) {
        return <react_router_dom_1.Navigate to="/login" replace/>;
    }
    return (<div className="min-h-[100dvh] bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Team
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">Beta access</h1>
            <p className="mt-1 text-sm text-white/55">Approve or revoke `public.profiles` (same source as the waitlist gate).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={function () { return navigate((0, appRoutes_1.getFeedRoute)()); }} className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Back to app
            </button>
            <react_router_dom_1.Link to="/profile" className="rounded-xl border border-white/[0.12] bg-transparent px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.05]">
              Profile
            </react_router_dom_1.Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/[0.08] p-5 shadow-[0_0_60px_-24px_rgba(0,255,200,0.2)] backdrop-blur-xl" style={{
            background: 'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.35) 100%)',
        }}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Grant access</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs text-white/55">
              Email (they must open the app once so a profile row exists)
              <input type="email" value={email} onChange={function (ev) { return setEmail(ev.target.value); }} placeholder="trader@example.com" className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/35 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[rgba(0,255,200,0.35)]" disabled={busy}/>
            </label>
            <label className="flex-1 text-xs text-white/55">
              Or user id (UUID from Supabase Auth → Users)
              <input type="text" value={userId} onChange={function (ev) { return setUserId(ev.target.value); }} placeholder="00000000-0000-…" className="mt-1 w-full rounded-xl border border-white/[0.1] bg-black/35 px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/30 focus:border-[rgba(0,255,200,0.35)]" disabled={busy}/>
            </label>
            <button type="button" onClick={function () { return void approveBy(); }} disabled={busy} className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0a0a0a] transition enabled:hover:brightness-110 disabled:opacity-45" style={{ backgroundColor: ACCENT }}>
              Approve
            </button>
          </div>
          {notice ? <p className="mt-3 text-sm text-amber-100/90">{notice}</p> : null}
          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Server env on Netlify: <span className="font-mono text-white/55">SUPABASE_SERVICE_ROLE_KEY</span>,{' '}
            <span className="font-mono text-white/55">SIGFLO_BETA_ADMIN_EMAILS</span> (your email). See{' '}
            <span className="font-mono">docs/NETLIFY.md</span>.
          </p>
        </div>

        {error ? (<div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-100/95">
            {error}
            {error.includes('Not a beta admin') ? (<p className="mt-2 text-xs text-rose-100/75">
                Add your account email to <span className="font-mono">SIGFLO_BETA_ADMIN_EMAILS</span> in Netlify, redeploy,
                then try again.
              </p>) : null}
            {error.includes('SERVICE_ROLE') ? (<p className="mt-2 text-xs text-rose-100/75">
                Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> in Netlify (server only).
              </p>) : null}
          </div>) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Recent profiles</p>
          <button type="button" onClick={function () { return void load(); }} disabled={loading || !token} className="text-xs font-semibold text-[#00ffc8] hover:underline disabled:opacity-40">
            Refresh
          </button>
        </div>

        <div className="mt-2 overflow-x-auto rounded-xl border border-white/[0.06]">
          {loading ? (<p className="p-6 text-sm text-white/45">Loading list…</p>) : (<table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Approved</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (<tr>
                    <td colSpan={4} className="px-3 py-6 text-white/45">
                      No rows (or list failed). New users appear after their first sign-in.
                    </td>
                  </tr>) : (list.map(function (row) { return (<tr key={row.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-xs text-white/85">{row.email}</td>
                      <td className="px-3 py-2.5">
                        {row.approved ? (<span className="text-emerald-300/95">Yes</span>) : (<span className="text-amber-200/90">Pending</span>)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-white/50">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.approved ? (<button type="button" disabled={busy} onClick={function () { return void onRevoke(row.id); }} className="text-xs font-semibold text-rose-300/90 hover:underline disabled:opacity-40">
                            Revoke
                          </button>) : (<button type="button" disabled={busy} onClick={function () { return void approveBy({ userId: row.id }); }} className="text-xs font-semibold hover:underline disabled:opacity-40" style={{ color: ACCENT }}>
                            Approve
                          </button>)}
                      </td>
                    </tr>); }))}
              </tbody>
            </table>)}
        </div>
      </div>
    </div>);
}
