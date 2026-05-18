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
exports.useBetaAccess = useBetaAccess;
var react_1 = require("react");
var AuthContext_1 = require("@/context/AuthContext");
var adminBetaApi_1 = require("@/lib/adminBetaApi");
var betaProfile_1 = require("@/lib/betaProfile");
var supabase_1 = require("@/lib/supabase");
function formatProfileLoadError(e) {
    if (e instanceof Error)
        return e.message;
    if (typeof e === 'object' && e !== null) {
        var o = e;
        var msg = typeof o.message === 'string' ? o.message : '';
        var details = typeof o.details === 'string' ? o.details : '';
        var hint = typeof o.hint === 'string' ? o.hint : '';
        var code = typeof o.code === 'string' ? o.code : '';
        var parts = [msg, details, hint, code].filter(Boolean);
        if (parts.length)
            return parts.join(' — ');
    }
    return 'Could not load your access profile.';
}
/**
 * Resolves beta access from `public.profiles` for Supabase sessions.
 * Dev mode (no Supabase) or missing client → treated as approved so local/dev flows keep working.
 */
function useBetaAccess() {
    var _this = this;
    var _a = (0, AuthContext_1.useAuth)(), user = _a.user, authLoading = _a.loading, authMode = _a.authMode, session = _a.session;
    var _b = (0, react_1.useState)('idle'), status = _b[0], setStatus = _b[1];
    var _c = (0, react_1.useState)(false), approved = _c[0], setApproved = _c[1];
    var _d = (0, react_1.useState)(null), profile = _d[0], setProfile = _d[1];
    var _e = (0, react_1.useState)(null), error = _e[0], setError = _e[1];
    var run = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var row, token, _a, e_1, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (authLoading)
                        return [2 /*return*/];
                    if (authMode !== 'supabase' || !user || !(0, supabase_1.isSupabaseConfigured)() || !supabase_1.supabase) {
                        setProfile(null);
                        setError(null);
                        setApproved(true);
                        setStatus('ready');
                        return [2 /*return*/];
                    }
                    setStatus('loading');
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, (0, betaProfile_1.fetchOrCreateBetaProfile)(user)];
                case 2:
                    row = _b.sent();
                    setProfile(row);
                    if (row.approved === true) {
                        setApproved(true);
                        setStatus('ready');
                        return [2 /*return*/];
                    }
                    token = session === null || session === void 0 ? void 0 : session.access_token;
                    _a = token;
                    if (!_a) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, adminBetaApi_1.checkIsBetaAdmin)(token)];
                case 3:
                    _a = (_b.sent());
                    _b.label = 4;
                case 4:
                    if (_a) {
                        setApproved(true);
                        setStatus('ready');
                        return [2 /*return*/];
                    }
                    setApproved(false);
                    setStatus('ready');
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _b.sent();
                    msg = formatProfileLoadError(e_1);
                    setProfile(null);
                    setApproved(false);
                    setError(msg);
                    setStatus('ready');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [authLoading, authMode, user, session]);
    (0, react_1.useEffect)(function () {
        void run();
    }, [run]);
    return { status: status, approved: approved, profile: profile, error: error, refresh: run };
}
