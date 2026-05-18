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
exports.AccountSnapshotProvider = AccountSnapshotProvider;
exports.useAccountSnapshot = useAccountSnapshot;
var react_1 = require("react");
var AuthContext_1 = require("@/context/AuthContext");
var biasFlipNotifyGate_1 = require("@/lib/biasFlipNotifyGate");
var portfolioClient_1 = require("@/services/api/portfolioClient");
var AccountSnapshotContext = (0, react_1.createContext)(null);
/**
 * One `/api/portfolio/*` subscription for the whole authenticated app shell (Feed, Trade,
 * Portfolio, etc.). Mount once above `Outlet` — do not duplicate with extra hooks.
 */
function AccountSnapshotProvider(_a) {
    var _this = this;
    var _b, _c;
    var children = _a.children, _d = _a.pollMs, pollMs = _d === void 0 ? 12000 : _d;
    var _e = (0, AuthContext_1.useAuth)(), authLoading = _e.loading, session = _e.session;
    var _f = (0, react_1.useState)([]), items = _f[0], setItems = _f[1];
    var _g = (0, react_1.useState)([]), closedTrades = _g[0], setClosedTrades = _g[1];
    var _h = (0, react_1.useState)(false), loading = _h[0], setLoading = _h[1];
    var _j = (0, react_1.useState)(null), error = _j[0], setError = _j[1];
    var mountedRef = (0, react_1.useRef)(true);
    var hasFetchedRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
        };
    }, []);
    var refresh = (0, react_1.useCallback)(function (opts) { return __awaiter(_this, void 0, void 0, function () {
        var silent, biasNotifyGen, snapshots, _a, snapRes, closedRes, errs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    silent = (opts === null || opts === void 0 ? void 0 : opts.silent) === true;
                    if (!silent) {
                        setLoading(true);
                        setError(null);
                    }
                    biasNotifyGen = (0, biasFlipNotifyGate_1.nextBiasFlipNotifySyncGeneration)();
                    snapshots = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, Promise.allSettled([(0, portfolioClient_1.getAccountSnapshots)(), (0, portfolioClient_1.getClosedTrades)()])];
                case 2:
                    _a = _b.sent(), snapRes = _a[0], closedRes = _a[1];
                    if (!mountedRef.current)
                        return [2 /*return*/, snapshots];
                    errs = [];
                    if (snapRes.status === 'fulfilled') {
                        setItems(snapRes.value);
                        snapshots = snapRes.value;
                        (0, biasFlipNotifyGate_1.syncBiasFlipNotifyOpenSymbolsFromSnapshots)(snapRes.value, biasNotifyGen);
                    }
                    else {
                        setItems([]);
                        (0, biasFlipNotifyGate_1.syncBiasFlipNotifyOpenSymbolsFromSnapshots)([], biasNotifyGen);
                        errs.push(snapRes.reason instanceof Error ? snapRes.reason.message : 'Failed to load account snapshot.');
                    }
                    if (closedRes.status === 'fulfilled')
                        setClosedTrades(closedRes.value);
                    else {
                        setClosedTrades([]);
                        errs.push(closedRes.reason instanceof Error ? closedRes.reason.message : 'Failed to load closed trades.');
                    }
                    setError(errs.length > 0 ? errs.join(' · ') : null);
                    return [3 /*break*/, 4];
                case 3:
                    if (!silent && mountedRef.current)
                        setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/, snapshots];
            }
        });
    }); }, []);
    var sessionUid = (_c = (_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null;
    (0, react_1.useEffect)(function () {
        if (authLoading)
            return;
        if (sessionUid == null)
            (0, biasFlipNotifyGate_1.setBiasFlipNotifyTradeFocusLinearSymbol)(null);
        hasFetchedRef.current = true;
        void refresh();
    }, [authLoading, sessionUid, refresh]);
    (0, react_1.useEffect)(function () {
        if (pollMs <= 0 || !hasFetchedRef.current)
            return;
        var id = window.setInterval(function () {
            if (document.visibilityState !== 'visible')
                return;
            void refresh({ silent: true });
        }, pollMs);
        return function () { return window.clearInterval(id); };
    }, [pollMs, refresh]);
    (0, react_1.useEffect)(function () {
        var onVis = function () {
            if (document.visibilityState === 'visible' && hasFetchedRef.current)
                void refresh({ silent: true });
        };
        document.addEventListener('visibilitychange', onVis);
        return function () { return document.removeEventListener('visibilitychange', onVis); };
    }, [refresh]);
    var value = (0, react_1.useMemo)(function () { return ({ items: items, closedTrades: closedTrades, loading: loading, error: error, refresh: refresh }); }, [items, closedTrades, loading, error, refresh]);
    return <AccountSnapshotContext.Provider value={value}>{children}</AccountSnapshotContext.Provider>;
}
/**
 * Shared portfolio snapshots from {@link AccountSnapshotProvider}. The optional `pollMs`
 * argument is ignored — polling is configured on the provider (default 12s).
 */
function useAccountSnapshot(_options) {
    var ctx = (0, react_1.useContext)(AccountSnapshotContext);
    if (ctx == null) {
        throw new Error('useAccountSnapshot must be used within AccountSnapshotProvider.');
    }
    return ctx;
}
