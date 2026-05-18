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
exports.default = ProfileScreen;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var AuthContext_1 = require("@/context/AuthContext");
var useAccountSnapshot_1 = require("@/hooks/useAccountSnapshot");
var useBotStatuses_1 = require("@/hooks/useBotStatuses");
var useExchangeIntegrations_1 = require("@/hooks/useExchangeIntegrations");
var useSignalEngine_1 = require("@/hooks/useSignalEngine");
var supabase_1 = require("@/lib/supabase");
var formatFundingBalance_1 = require("@/lib/formatFundingBalance");
var oauthRedirectOrigin_1 = require("@/lib/oauthRedirectOrigin");
var exchangeTransferUrls_1 = require("@/lib/exchangeTransferUrls");
var httpErrorMessage_1 = require("@/lib/httpErrorMessage");
var MFA_TOTP_FRIENDLY_NAME = 'Sigflo Account';
var EXCHANGE_API_DOCS_HREF = {
    bybit: 'https://bybit-exchange.github.io/docs/v5/intro',
    mexc: 'https://mexcdevelop.github.io/apidocs/spot_v3_en/',
};
function ProfileScreen() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var _k = (0, AuthContext_1.useAuth)(), user = _k.user, authLoading = _k.loading, authMode = _k.authMode, signInWithGoogle = _k.signInWithGoogle, signOut = _k.signOut;
    var _l = (0, react_1.useState)(true), pushAlerts = _l[0], setPushAlerts = _l[1];
    var _m = (0, react_1.useState)(false), highRiskAlerts = _m[0], setHighRiskAlerts = _m[1];
    var _o = (0, react_1.useState)(true), dailyBriefing = _o[0], setDailyBriefing = _o[1];
    var _p = (0, react_1.useState)('Balanced'), riskMode = _p[0], setRiskMode = _p[1];
    var _q = (0, react_1.useState)(null), exchangeForm = _q[0], setExchangeForm = _q[1];
    var _r = (0, react_1.useState)(null), connectError = _r[0], setConnectError = _r[1];
    var _s = (0, react_1.useState)(false), connectBusy = _s[0], setConnectBusy = _s[1];
    var _t = (0, react_1.useState)(null), disconnectTarget = _t[0], setDisconnectTarget = _t[1];
    var _u = (0, react_1.useState)(false), disconnectBusy = _u[0], setDisconnectBusy = _u[1];
    var _v = (0, react_1.useState)(false), syncBusy = _v[0], setSyncBusy = _v[1];
    var _w = (0, react_1.useState)(null), securityBusy = _w[0], setSecurityBusy = _w[1];
    var _x = (0, react_1.useState)(null), securityMessage = _x[0], setSecurityMessage = _x[1];
    var _y = (0, react_1.useState)(false), mfaEnabled = _y[0], setMfaEnabled = _y[1];
    var _z = (0, react_1.useState)(false), mfaStatusLoading = _z[0], setMfaStatusLoading = _z[1];
    var _0 = (0, react_1.useState)(null), googleSignInError = _0[0], setGoogleSignInError = _0[1];
    var _1 = (0, react_1.useState)(false), totpCopyFlash = _1[0], setTotpCopyFlash = _1[1];
    var totpCopyFlashTimerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        return function () {
            if (totpCopyFlashTimerRef.current != null)
                window.clearTimeout(totpCopyFlashTimerRef.current);
        };
    }, []);
    var _2 = (0, react_1.useState)(null), totpSetup = _2[0], setTotpSetup = _2[1];
    var _3 = (0, useExchangeIntegrations_1.useExchangeIntegrations)(), integrations = _3.items, integrationsLoading = _3.loading, integrationsError = _3.error, refreshIntegrations = _3.refresh, connect = _3.connect, disconnect = _3.disconnect;
    var _4 = (0, useAccountSnapshot_1.useAccountSnapshot)({ pollMs: 12000 }), snapshots = _4.items, closedTrades = _4.closedTrades, snapshotLoading = _4.loading, snapshotError = _4.error, refreshSnapshots = _4.refresh;
    var _5 = (0, useSignalEngine_1.useSignalEngine)(), signals = _5.signals, signalConnection = _5.connection;
    var statusMap = (0, useBotStatuses_1.useBotStatuses)().statusMap;
    var displayName = user
        ? (_f = (_d = (_b = (_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) !== null && _b !== void 0 ? _b : (_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : (_e = user.email) === null || _e === void 0 ? void 0 : _e.split('@')[0]) !== null && _f !== void 0 ? _f : 'Trader'
        : authMode === 'dev'
            ? 'Local dev'
            : 'Guest';
    var displayEmail = (_g = user === null || user === void 0 ? void 0 : user.email) !== null && _g !== void 0 ? _g : (authMode === 'dev' ? 'Using dev header (VITE_DEV_USER_ID)' : 'Sign in to sync account');
    var initials = (0, react_1.useMemo)(function () {
        var _a;
        var src = (_a = user === null || user === void 0 ? void 0 : user.email) !== null && _a !== void 0 ? _a : displayName;
        var clean = src.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2);
        return clean.length >= 2 ? clean.toUpperCase() : 'SF';
    }, [user === null || user === void 0 ? void 0 : user.email, displayName]);
    var canUseExchangeApi = authMode === 'dev' || Boolean(user);
    var mexcIntegration = integrations.find(function (item) { return item.exchange === 'mexc'; });
    var bybitIntegration = integrations.find(function (item) { return item.exchange === 'bybit'; });
    var primaryIntegration = (_j = (_h = mexcIntegration !== null && mexcIntegration !== void 0 ? mexcIntegration : bybitIntegration) !== null && _h !== void 0 ? _h : integrations[0]) !== null && _j !== void 0 ? _j : null;
    var connectedExchangeLabel = primaryIntegration ? primaryIntegration.exchange.toUpperCase() : null;
    var lastSynced = (primaryIntegration === null || primaryIntegration === void 0 ? void 0 : primaryIntegration.lastValidatedAt)
        ? new Date(primaryIntegration.lastValidatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : null;
    var signalCount = signals.length;
    var winRate = (0, react_1.useMemo)(function () {
        if (closedTrades.length === 0)
            return '—';
        var wins = closedTrades.filter(function (trade) { return trade.closedPnl > 0; }).length;
        return "".concat(Math.round((wins / closedTrades.length) * 100), "%");
    }, [closedTrades]);
    var avgRr = (0, react_1.useMemo)(function () {
        if (closedTrades.length === 0)
            return '1.9';
        var wins = closedTrades.filter(function (trade) { return trade.closedPnl > 0; }).map(function (trade) { return trade.closedPnl; });
        var losses = closedTrades.filter(function (trade) { return trade.closedPnl < 0; }).map(function (trade) { return Math.abs(trade.closedPnl); });
        if (wins.length === 0 || losses.length === 0)
            return '—';
        var avgWin = wins.reduce(function (sum, value) { return sum + value; }, 0) / wins.length;
        var avgLoss = losses.reduce(function (sum, value) { return sum + value; }, 0) / losses.length;
        return (avgWin / Math.max(avgLoss, 0.0001)).toFixed(1);
    }, [closedTrades]);
    var activeBotCount = (0, react_1.useMemo)(function () { return Object.values(statusMap).filter(function (status) { return status === 'active'; }).length; }, [statusMap]);
    var apiConnected = !integrationsError && !snapshotError;
    var dataStatus = signalConnection === 'connected' ? 'Live' : signalConnection === 'reconnecting' ? 'Syncing' : 'Offline';
    var syncIssue = integrationsError || snapshotError;
    var returnTo = (0, react_1.useMemo)(function () {
        var _a;
        var raw = ((_a = searchParams.get('returnTo')) !== null && _a !== void 0 ? _a : '').trim();
        if (!raw.startsWith('/'))
            return null;
        if (raw.startsWith('//'))
            return null;
        return raw;
    }, [searchParams]);
    var riskColor = (0, react_1.useMemo)(function () {
        if (riskMode === 'Conservative')
            return 'text-emerald-300';
        if (riskMode === 'Aggressive')
            return 'text-rose-300';
        return 'text-sigflo-accent';
    }, [riskMode]);
    (0, react_1.useEffect)(function () {
        if (!disconnectTarget)
            return;
        var onKeyDown = function (event) {
            if (event.key === 'Escape' && !disconnectBusy) {
                setDisconnectTarget(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return function () { return window.removeEventListener('keydown', onKeyDown); };
    }, [disconnectTarget, disconnectBusy]);
    (0, react_1.useEffect)(function () {
        function loadMfaStatus() {
            return __awaiter(this, void 0, void 0, function () {
                var mfa, listFactors, _a, data, error, allFactors, hasVerified, _b;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!supabase_1.supabase || authMode !== 'supabase' || !user) {
                                setMfaEnabled(false);
                                return [2 /*return*/];
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, 4, 5]);
                            setMfaStatusLoading(true);
                            mfa = supabase_1.supabase.auth.mfa;
                            listFactors = mfa === null || mfa === void 0 ? void 0 : mfa.listFactors;
                            if (!listFactors) {
                                setMfaEnabled(false);
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, listFactors()];
                        case 2:
                            _a = _d.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            allFactors = (_c = data === null || data === void 0 ? void 0 : data.all) !== null && _c !== void 0 ? _c : [];
                            hasVerified = allFactors.some(function (factor) { return factor.status === 'verified'; });
                            setMfaEnabled(hasVerified);
                            return [3 /*break*/, 5];
                        case 3:
                            _b = _d.sent();
                            setMfaEnabled(false);
                            return [3 /*break*/, 5];
                        case 4:
                            setMfaStatusLoading(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        void loadMfaStatus();
    }, [authMode, user === null || user === void 0 ? void 0 : user.id, totpSetup]);
    function handleChangePassword() {
        return __awaiter(this, void 0, void 0, function () {
            var redirectTo, error, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!supabase_1.supabase || !(user === null || user === void 0 ? void 0 : user.email)) {
                            setSecurityMessage('Sign in with Google to manage password resets.');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        setSecurityBusy('password');
                        setSecurityMessage(null);
                        redirectTo = (0, oauthRedirectOrigin_1.getOAuthRedirectToProfile)();
                        return [4 /*yield*/, supabase_1.supabase.auth.resetPasswordForEmail(user.email, { redirectTo: redirectTo })];
                    case 2:
                        error = (_a.sent()).error;
                        if (error)
                            throw error;
                        setSecurityMessage("Password reset link sent to ".concat(user.email, "."));
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        setSecurityMessage(error_1 instanceof Error ? error_1.message : 'Failed to start password reset.');
                        return [3 /*break*/, 5];
                    case 4:
                        setSecurityBusy(null);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleManageSessions() {
        return __awaiter(this, void 0, void 0, function () {
            var error, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!supabase_1.supabase || !user) {
                            setSecurityMessage('Sign in to manage active sessions.');
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        setSecurityBusy('sessions');
                        setSecurityMessage(null);
                        return [4 /*yield*/, supabase_1.supabase.auth.signOut({ scope: 'others' })];
                    case 2:
                        error = (_a.sent()).error;
                        if (error)
                            throw error;
                        setSecurityMessage('Signed out other sessions. Current session is still active.');
                        return [3 /*break*/, 5];
                    case 3:
                        error_2 = _a.sent();
                        setSecurityMessage(error_2 instanceof Error ? error_2.message : 'Failed to manage sessions.');
                        return [3 /*break*/, 5];
                    case 4:
                        setSecurityBusy(null);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleEnable2fa() {
        return __awaiter(this, void 0, void 0, function () {
            var mfa, _a, listed, listError, allFactors, totpFactors, verifiedTotp, _i, _b, factor, unenrollError, _c, data, error, factorId, qrCode, secret, otpauthUri, error_3;
            var _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                switch (_l.label) {
                    case 0:
                        if (authMode !== 'supabase' || !supabase_1.supabase || !user) {
                            setSecurityMessage('2FA setup requires Supabase sign-in.');
                            return [2 /*return*/];
                        }
                        _l.label = 1;
                    case 1:
                        _l.trys.push([1, 8, 9, 10]);
                        setSecurityBusy('2fa');
                        setSecurityMessage(null);
                        mfa = supabase_1.supabase.auth.mfa;
                        if (!mfa) {
                            setSecurityMessage('MFA is not available in this auth session. Try signing out and in again.');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, mfa.listFactors()];
                    case 2:
                        _a = _l.sent(), listed = _a.data, listError = _a.error;
                        if (listError)
                            throw listError;
                        allFactors = (_d = listed === null || listed === void 0 ? void 0 : listed.all) !== null && _d !== void 0 ? _d : [];
                        totpFactors = allFactors.filter(function (f) { return f.factor_type === 'totp'; });
                        verifiedTotp = totpFactors.find(function (f) { return f.status === 'verified'; });
                        if (verifiedTotp) {
                            setMfaEnabled(true);
                            setSecurityMessage('2FA is already enabled on this account.');
                            return [2 /*return*/];
                        }
                        _i = 0, _b = totpFactors.filter(function (f) { return f.status === 'unverified'; });
                        _l.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3 /*break*/, 6];
                        factor = _b[_i];
                        return [4 /*yield*/, mfa.unenroll({ factorId: factor.id })];
                    case 4:
                        unenrollError = (_l.sent()).error;
                        if (unenrollError)
                            throw unenrollError;
                        _l.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, mfa.enroll({ factorType: 'totp', friendlyName: MFA_TOTP_FRIENDLY_NAME })];
                    case 7:
                        _c = _l.sent(), data = _c.data, error = _c.error;
                        if (error)
                            throw error;
                        factorId = data === null || data === void 0 ? void 0 : data.id;
                        qrCode = ((_f = (_e = data === null || data === void 0 ? void 0 : data.totp) === null || _e === void 0 ? void 0 : _e.qr_code) === null || _f === void 0 ? void 0 : _f.trim()) || null;
                        secret = ((_h = (_g = data === null || data === void 0 ? void 0 : data.totp) === null || _g === void 0 ? void 0 : _g.secret) === null || _h === void 0 ? void 0 : _h.trim()) || '';
                        otpauthUri = ((_k = (_j = data === null || data === void 0 ? void 0 : data.totp) === null || _j === void 0 ? void 0 : _j.uri) === null || _k === void 0 ? void 0 : _k.trim()) || null;
                        if (!factorId || !secret) {
                            setSecurityMessage('Could not initialize TOTP setup. Try again.');
                            return [2 /*return*/];
                        }
                        setTotpSetup({
                            factorId: factorId,
                            challengeId: null,
                            qrCode: qrCode,
                            secret: secret,
                            otpauthUri: otpauthUri,
                            code: '',
                        });
                        setSecurityMessage('Scan the QR if you can, or enter the setup key / open the setup link, then enter the 6-digit code.');
                        return [3 /*break*/, 10];
                    case 8:
                        error_3 = _l.sent();
                        setSecurityMessage(error_3 instanceof Error ? "2FA setup failed: ".concat(error_3.message) : '2FA setup failed. Please try again.');
                        return [3 /*break*/, 10];
                    case 9:
                        setSecurityBusy(null);
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    }
    function handleVerifyTotp() {
        return __awaiter(this, void 0, void 0, function () {
            var mfa, challenge, verify, challengeId, challengeRes, verifyRes, error_4;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!supabase_1.supabase || !totpSetup)
                            return [2 /*return*/];
                        if (!/^\d{6}$/.test(totpSetup.code.trim())) {
                            setSecurityMessage('Enter a valid 6-digit authenticator code.');
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, 6, 7]);
                        setSecurityBusy('2fa');
                        setSecurityMessage(null);
                        mfa = supabase_1.supabase.auth.mfa;
                        challenge = mfa === null || mfa === void 0 ? void 0 : mfa.challenge;
                        verify = mfa === null || mfa === void 0 ? void 0 : mfa.verify;
                        if (!challenge || !verify) {
                            setSecurityMessage('This Supabase SDK version does not support MFA verification APIs.');
                            return [2 /*return*/];
                        }
                        challengeId = totpSetup.challengeId;
                        if (!!challengeId) return [3 /*break*/, 3];
                        return [4 /*yield*/, challenge({ factorId: totpSetup.factorId })];
                    case 2:
                        challengeRes = _c.sent();
                        if (challengeRes.error)
                            throw challengeRes.error;
                        challengeId = (_b = (_a = challengeRes.data) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
                        if (!challengeId) {
                            setSecurityMessage('Unable to create verification challenge. Please try again.');
                            return [2 /*return*/];
                        }
                        _c.label = 3;
                    case 3: return [4 /*yield*/, verify({
                            factorId: totpSetup.factorId,
                            challengeId: challengeId,
                            code: totpSetup.code.trim(),
                        })];
                    case 4:
                        verifyRes = _c.sent();
                        if (verifyRes.error)
                            throw verifyRes.error;
                        setMfaEnabled(true);
                        setTotpCopyFlash(false);
                        setSecurityMessage('2FA enabled successfully.');
                        setTotpSetup(null);
                        return [3 /*break*/, 7];
                    case 5:
                        error_4 = _c.sent();
                        setSecurityMessage(error_4 instanceof Error ? error_4.message : 'Failed to verify 2FA code.');
                        return [3 /*break*/, 7];
                    case 6:
                        setSecurityBusy(null);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function handleCancelTotpSetup() {
        return __awaiter(this, void 0, void 0, function () {
            var mfa, unenroll, error, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setTotpCopyFlash(false);
                        if (!supabase_1.supabase || !totpSetup) {
                            setTotpSetup(null);
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        mfa = supabase_1.supabase.auth.mfa;
                        unenroll = mfa === null || mfa === void 0 ? void 0 : mfa.unenroll;
                        if (!unenroll) return [3 /*break*/, 3];
                        return [4 /*yield*/, unenroll({ factorId: totpSetup.factorId })];
                    case 2:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        _b.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        setTotpSetup(null);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleManualSync() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSyncBusy(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, Promise.all([refreshIntegrations(), refreshSnapshots()])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        setSyncBusy(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="space-y-3.5 pb-6 pt-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold tracking-tight text-white">Account</h2>
        {returnTo ? (<button type="button" onClick={function () { return navigate(returnTo); }} className="mt-2 rounded-lg border border-[#00ffc8]/28 bg-[#00ffc8]/10 px-2.5 py-1 text-[11px] font-semibold text-[#bafef1] transition hover:bg-[#00ffc8]/14">
            Back to previous screen
          </button>) : null}
      </div>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-4 shadow-[0_0_28px_-20px_rgba(0,255,200,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/[0.14] text-sm font-bold text-cyan-200">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">{displayName}</p>
              <p className="text-xs text-sigflo-muted">{displayEmail}</p>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              Pro
            </span>
            <p className="text-[11px] font-semibold text-sigflo-accent">
              {connectedExchangeLabel ? "Connected to ".concat(connectedExchangeLabel) : 'No exchange connected'}
            </p>
            {lastSynced ? <p className="text-[10px] text-sigflo-muted">Last synced: {lastSynced}</p> : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {authMode === 'supabase' && !authLoading && !user ? (<div className="flex flex-col items-end gap-1">
              <button type="button" onClick={function () {
                setGoogleSignInError(null);
                void signInWithGoogle().catch(function (e) {
                    setGoogleSignInError(e instanceof Error ? e.message : 'Google sign-in failed');
                });
            }} className="rounded-lg border border-white/[0.1] bg-sigflo-elevated px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1c1d26]">
                Continue with Google
              </button>
              {googleSignInError ? (<p className="max-w-[14rem] text-right text-[10px] leading-snug text-rose-300/95">{googleSignInError}</p>) : null}
            </div>) : null}
          {authMode === 'supabase' && user ? (<>
              <react_router_dom_1.Link to="/admin/beta" className="rounded-lg border border-[rgba(0,255,200,0.22)] bg-[rgba(0,255,200,0.08)] px-3 py-1.5 text-xs font-semibold text-[#8FFFD4] transition hover:bg-[rgba(0,255,200,0.12)]">
                Beta approvals
              </react_router_dom_1.Link>
              <button type="button" onClick={function () {
                void (function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, signOut()];
                            case 1:
                                _a.sent();
                                navigate('/login', { replace: true });
                                return [2 /*return*/];
                        }
                    });
                }); })();
            }} className="rounded-lg border border-white/[0.08] bg-sigflo-elevated px-3 py-1.5 text-xs font-semibold text-sigflo-muted transition hover:text-white">
                Sign out
              </button>
            </>) : null}
          {authMode === 'dev' ? (<p className="text-[11px] text-sigflo-muted">Auth: dev header (set VITE_SUPABASE_* for Google sign-in).</p>) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Exchange Connections</p>
        {authMode === 'supabase' && !user && !authLoading ? (<p className="mt-2 text-[11px] text-amber-200/90">Sign in with Google to connect Bybit or MEXC.</p>) : null}
        <div className="mt-2 space-y-2">
          {['bybit', 'mexc'].map(function (exchange) {
            var integration = integrations.find(function (i) { return i.exchange === exchange; });
            var snapshot = snapshots.find(function (s) { return s.exchange === exchange; });
            var connected = Boolean(integration);
            return (<div key={exchange} className={"rounded-xl border p-2.5 transition ".concat(connected
                    ? 'border-sigflo-accent/30 bg-[#101916] shadow-[0_0_26px_-16px_rgba(0,255,200,0.45)]'
                    : 'border-white/[0.06] bg-sigflo-elevated')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase text-white">{exchange}</p>
                    <p className={"text-[11px] font-medium ".concat(connected ? 'text-emerald-300' : 'text-sigflo-muted')}>
                      {connected ? 'Connected' : 'Not connected'}
                    </p>
                    <p className="text-[11px] text-sigflo-muted">
                      {connected
                    ? "Last synced: ".concat((integration === null || integration === void 0 ? void 0 : integration.lastValidatedAt)
                        ? new Date(integration.lastValidatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                        : 'just now')
                    : 'Link API keys — withdrawals must be off'}
                    </p>
                  </div>
                  {connected ? (<div className="flex shrink-0 items-center gap-1.5">
                      <a href={exchange === 'bybit' ? exchangeTransferUrls_1.BYBIT_API_KEYS_HREF : exchangeTransferUrls_1.MEXC_API_KEYS_HREF} target="_blank" rel="noopener noreferrer" title={"Open ".concat(exchange.toUpperCase(), " API key settings in a new tab")} className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]">
                        API Keys
                      </a>
                      <a href={EXCHANGE_API_DOCS_HREF[exchange]} target="_blank" rel="noopener noreferrer" title={"Open ".concat(exchange.toUpperCase(), " API documentation in a new tab")} className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]">
                        API Docs
                      </a>
                      <a href={exchange === 'bybit' ? exchangeTransferUrls_1.BYBIT_DEPOSIT_HREF : exchangeTransferUrls_1.MEXC_DEPOSIT_HREF} target="_blank" rel="noopener noreferrer" title={"Open ".concat(exchange.toUpperCase(), " deposit in a new tab")} className="rounded-lg border border-sigflo-accent/35 bg-sigflo-accent/10 px-2 py-1 text-[11px] font-semibold text-sigflo-accent transition hover:bg-sigflo-accent/15">
                        Deposit
                      </a>
                      <button type="button" onClick={function () { return setDisconnectTarget(exchange); }} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-500/15">
                        Disconnect
                      </button>
                    </div>) : (<div className="flex shrink-0 items-center gap-1.5">
                      <a href={exchange === 'bybit' ? exchangeTransferUrls_1.BYBIT_API_KEYS_HREF : exchangeTransferUrls_1.MEXC_API_KEYS_HREF} target="_blank" rel="noopener noreferrer" title={"Open ".concat(exchange.toUpperCase(), " API key settings in a new tab")} className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]">
                        API Keys
                      </a>
                      <a href={EXCHANGE_API_DOCS_HREF[exchange]} target="_blank" rel="noopener noreferrer" title={"Open ".concat(exchange.toUpperCase(), " API documentation in a new tab")} className="rounded-lg border border-white/[0.14] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-sigflo-text transition hover:bg-white/[0.08]">
                        API Docs
                      </a>
                      <button type="button" disabled={!canUseExchangeApi} onClick={function () {
                        setConnectError(null);
                        setExchangeForm({ exchange: exchange, apiKey: '', apiSecret: '', passphrase: '' });
                    }} className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40">
                        Connect
                      </button>
                    </div>)}
                </div>
                {snapshot ? <ExchangeBalanceBreakdown snapshot={snapshot}/> : null}
              </div>);
        })}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {integrationsLoading || snapshotLoading ? (<p className="text-[11px] text-sigflo-muted">Syncing integrations...</p>) : (<p className="text-[11px] text-sigflo-muted">Need a refresh? Sync manually.</p>)}
          <button type="button" disabled={syncBusy} onClick={function () { return void handleManualSync(); }} className="shrink-0 rounded-lg border border-white/[0.12] bg-sigflo-elevated px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-text transition hover:bg-[#1c1d26] disabled:opacity-50">
            {syncBusy ? 'Syncing...' : 'Sync now'}
          </button>
        </div>
        {syncIssue ? (<div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-2.5 py-2">
            <p className="text-[11px] text-amber-100">
              Last sync failed: {(0, httpErrorMessage_1.sanitizeUserFacingHttpErrorMessage)(syncIssue)}
            </p>
            <button type="button" disabled={syncBusy} onClick={function () { return void handleManualSync(); }} className="shrink-0 rounded-lg border border-amber-200/35 bg-amber-200/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-200/15 disabled:opacity-50">
              {syncBusy ? 'Retrying...' : 'Retry'}
            </button>
          </div>) : null}
        {connectError ? <p className="mt-2 text-[11px] text-rose-300">{connectError}</p> : null}
      </section>

      {exchangeForm ? (<section className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] p-3.5">
          <p className="text-sm font-semibold text-cyan-100">Connect {exchangeForm.exchange.toUpperCase()}</p>
          <div className="mt-2 space-y-2">
            <input value={exchangeForm.apiKey} onChange={function (e) { return setExchangeForm(__assign(__assign({}, exchangeForm), { apiKey: e.target.value })); }} placeholder="API key" className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"/>
            <input value={exchangeForm.apiSecret} onChange={function (e) { return setExchangeForm(__assign(__assign({}, exchangeForm), { apiSecret: e.target.value })); }} placeholder="API secret" className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"/>
            <input value={exchangeForm.passphrase} onChange={function (e) { return setExchangeForm(__assign(__assign({}, exchangeForm), { passphrase: e.target.value })); }} placeholder="Passphrase (optional)" className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-2 text-sm text-white outline-none"/>
          </div>
          <p className="mt-2 text-[11px] text-sigflo-muted">
            Need permissions help?{' '}
            <a href={EXCHANGE_API_DOCS_HREF[exchangeForm.exchange]} target="_blank" rel="noopener noreferrer" className="font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent">
              Open API docs
            </a>{' '}
            or{' '}
            <a href={exchangeForm.exchange === 'bybit' ? exchangeTransferUrls_1.BYBIT_API_KEYS_HREF : exchangeTransferUrls_1.MEXC_API_KEYS_HREF} target="_blank" rel="noopener noreferrer" className="font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent">
              API key settings
            </a>
            .
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" disabled={connectBusy} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!exchangeForm.apiKey || !exchangeForm.apiSecret) {
                                setConnectError('API key and secret are required.');
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            setConnectBusy(true);
                            setConnectError(null);
                            return [4 /*yield*/, connect(exchangeForm.exchange, {
                                    apiKey: exchangeForm.apiKey,
                                    apiSecret: exchangeForm.apiSecret,
                                    passphrase: exchangeForm.passphrase || undefined,
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, refreshSnapshots()];
                        case 3:
                            _a.sent();
                            setExchangeForm(null);
                            return [3 /*break*/, 6];
                        case 4:
                            e_1 = _a.sent();
                            setConnectError(e_1 instanceof Error ? (0, httpErrorMessage_1.sanitizeUserFacingHttpErrorMessage)(e_1.message) : 'Connection failed.');
                            return [3 /*break*/, 6];
                        case 5:
                            setConnectBusy(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            }); }} className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200">
              {connectBusy ? 'Validating...' : 'Save and validate'}
            </button>
            <button type="button" onClick={function () { return setExchangeForm(null); }} className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text">
              Cancel
            </button>
          </div>
          <p className="mt-2 text-[11px] text-sigflo-muted">Keys are encrypted at rest and never returned to the client after submission.</p>
        </section>) : null}

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Trading Profile</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {['Conservative', 'Balanced', 'Aggressive'].map(function (mode) {
            var active = riskMode === mode;
            return (<button key={mode} type="button" onClick={function () { return setRiskMode(mode); }} className={"rounded-lg border px-2 py-2 text-[11px] font-semibold transition ".concat(active
                    ? 'border-cyan-400/35 bg-[#152028] text-cyan-100'
                    : 'border-white/[0.08] bg-sigflo-elevated text-sigflo-muted hover:border-white/[0.14] hover:bg-[#1c1d26] hover:text-sigflo-text')}>
                {mode}
              </button>);
        })}
        </div>
        <p className={"mt-2 text-xs ".concat(riskColor)}>Risk profile: {riskMode}</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Alerts</p>
        <div className="mt-2 space-y-2">
          <ToggleRow label="Push alerts" subtext="Signals & execution updates" value={pushAlerts} onChange={setPushAlerts}/>
          <ToggleRow label="High-risk setup alerts" subtext="Aggressive setups only" value={highRiskAlerts} onChange={setHighRiskAlerts}/>
          <ToggleRow label="Daily AI briefing" subtext="Daily market summary" value={dailyBriefing} onChange={setDailyBriefing}/>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Your Stats</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Signals</p>
            <p className="mt-1 text-base font-bold text-white">{signalCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Win rate</p>
            <p className="mt-1 text-base font-bold text-emerald-300">{winRate}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Avg R:R</p>
            <p className="mt-1 text-base font-bold text-white">{avgRr}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-sigflo-muted">Based on your trading activity</p>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">System</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SystemIndicator label="API" value={apiConnected ? 'Connected' : 'Degraded'} active={apiConnected}/>
          <SystemIndicator label="Data" value={dataStatus} active={signalConnection === 'connected'}/>
          <SystemIndicator label="Bots" value={"".concat(activeBotCount, " active")} active={activeBotCount > 0}/>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Security</p>
          <span className={"rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ".concat(mfaEnabled
            ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
            : 'border-white/10 bg-sigflo-elevated text-sigflo-muted')}>
            {mfaStatusLoading ? 'Checking 2FA...' : mfaEnabled ? '2FA enabled' : '2FA not enabled'}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          <ActionButton label="Change password" subtext="Send secure reset link to your email" busy={securityBusy === 'password'} busyLabel="Sending..." onClick={function () { return void handleChangePassword(); }}/>
          <ActionButton label="Enable 2FA" subtext="Set up authenticator app (TOTP)" busy={securityBusy === '2fa'} busyLabel="Preparing..." onClick={function () { return void handleEnable2fa(); }}/>
          <ActionButton label="Manage sessions" subtext="Sign out other active devices" busy={securityBusy === 'sessions'} busyLabel="Applying..." onClick={function () { return void handleManageSessions(); }}/>
        </div>
        {totpSetup ? (<div className="mt-2 rounded-xl border border-sigflo-accent/25 bg-sigflo-accent/[0.06] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sigflo-accent">Authenticator setup</p>
            {totpSetup.qrCode ? (<div className="mt-2 flex justify-center rounded-lg border border-white/[0.08] bg-[#08090d] p-2">
                <div className="rounded bg-white p-2" dangerouslySetInnerHTML={{ __html: totpSetup.qrCode }}/>
              </div>) : (<p className="mt-2 text-[11px] text-sigflo-muted">QR not available — use manual setup key or the link below.</p>)}
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">Manual setup key</p>
              <p className="text-[11px] text-sigflo-muted">
                In your authenticator app, choose &quot;Enter setup key&quot; (or equivalent) and paste this secret.
              </p>
              <div className="flex gap-2">
                <input readOnly value={totpSetup.secret} className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2 py-2 font-mono text-[11px] text-white outline-none" aria-label="TOTP setup secret"/>
                <button type="button" disabled={securityBusy === '2fa'} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, navigator.clipboard.writeText(totpSetup.secret)];
                        case 1:
                            _b.sent();
                            setTotpCopyFlash(true);
                            if (totpCopyFlashTimerRef.current != null)
                                window.clearTimeout(totpCopyFlashTimerRef.current);
                            totpCopyFlashTimerRef.current = window.setTimeout(function () {
                                setTotpCopyFlash(false);
                                totpCopyFlashTimerRef.current = null;
                            }, 2000);
                            return [3 /*break*/, 3];
                        case 2:
                            _a = _b.sent();
                            setSecurityMessage('Could not copy — select the key and copy manually.');
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); }} className="shrink-0 rounded-lg border border-sigflo-accent/35 bg-sigflo-accent/10 px-2.5 py-2 text-[11px] font-semibold text-sigflo-accent transition hover:bg-sigflo-accent/15 disabled:opacity-60">
                  {totpCopyFlash ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            {totpSetup.otpauthUri ? (<a href={totpSetup.otpauthUri} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-[11px] font-semibold text-sigflo-accent underline decoration-sigflo-accent/40 underline-offset-2 transition hover:decoration-sigflo-accent">
                Open setup link (adds account in some apps)
              </a>) : null}
            <input value={totpSetup.code} onChange={function (event) { return setTotpSetup(function (prev) { return (prev ? __assign(__assign({}, prev), { code: event.target.value.replace(/\D/g, '').slice(0, 6) }) : prev); }); }} placeholder="Enter 6-digit code" inputMode="numeric" className="mt-2 w-full rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2.5 py-2 text-sm text-white outline-none"/>
            <div className="mt-2 flex items-center justify-end gap-2">
              <button type="button" disabled={securityBusy === '2fa'} onClick={function () { return void handleCancelTotpSetup(); }} className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text">
                Cancel
              </button>
              <button type="button" disabled={securityBusy === '2fa'} onClick={function () { return void handleVerifyTotp(); }} className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-60">
                {securityBusy === '2fa' ? 'Verifying...' : 'Verify and enable'}
              </button>
            </div>
          </div>) : null}
        {securityMessage ? (<p className="mt-2 rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2.5 py-2 text-[11px] text-sigflo-text">{securityMessage}</p>) : null}
      </section>

      {disconnectTarget ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={function () {
                if (!disconnectBusy)
                    setDisconnectTarget(null);
            }}>
          <div className="w-full max-w-sm rounded-2xl border border-rose-400/25 bg-[#0B0B0B] p-4 shadow-[0_0_40px_-18px_rgba(255,91,123,0.45)]" onClick={function (event) { return event.stopPropagation(); }}>
            <p className="text-sm font-semibold text-rose-100">Disconnect {disconnectTarget.toUpperCase()}?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-100/85">
              This will stop syncing balances and positions until you connect this exchange again.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button type="button" disabled={disconnectBusy} onClick={function () { return setDisconnectTarget(null); }} className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text transition hover:bg-white/[0.07] disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={disconnectBusy} onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!disconnectTarget)
                                return [2 /*return*/];
                            setDisconnectBusy(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 4, 5]);
                            return [4 /*yield*/, disconnect(disconnectTarget)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, refreshSnapshots()];
                        case 3:
                            _a.sent();
                            setDisconnectTarget(null);
                            return [3 /*break*/, 5];
                        case 4:
                            setDisconnectBusy(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); }} className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:opacity-50">
                {disconnectBusy ? 'Disconnecting...' : 'Confirm disconnect'}
              </button>
            </div>
          </div>
        </div>) : null}
    </div>);
}
function ToggleRow(_a) {
    var label = _a.label, subtext = _a.subtext, value = _a.value, onChange = _a.onChange;
    return (<button type="button" onClick={function () { return onChange(!value); }} className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-sigflo-elevated px-3 py-2 text-left transition hover:border-white/[0.12] hover:bg-[#1c1d26]">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-sigflo-muted">{subtext}</p>
      </div>
      <span className={"rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ".concat(value ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-sigflo-muted')}>
        {value ? 'On' : 'Off'}
      </span>
    </button>);
}
function fmtUsdMaybe(n) {
    if (n == null || !Number.isFinite(n))
        return '—';
    return "$".concat(n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
function BalanceMetricCell(_a) {
    var label = _a.label, value = _a.value;
    return (<div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
      <p className="text-[9px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className="mt-1 text-xs font-semibold tabular-nums text-white">{fmtUsdMaybe(value)}</p>
    </div>);
}
function ExchangeBalanceBreakdown(_a) {
    var _b, _c, _d;
    var snapshot = _a.snapshot;
    var breakdown = (_b = snapshot.accountBreakdown) !== null && _b !== void 0 ? _b : null;
    if (!breakdown) {
        if (snapshot.status === 'error') {
            var detailRaw = (_c = snapshot.syncError) === null || _c === void 0 ? void 0 : _c.trim();
            var detail = detailRaw ? (0, httpErrorMessage_1.sanitizeUserFacingHttpErrorMessage)(detailRaw) : '';
            return (<div className="mt-2 space-y-1.5 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-2 text-[11px] leading-snug text-rose-100/95">
          <p>
            Portfolio sync failed for this exchange. Try Sync now, or disconnect and reconnect after checking API key
            permissions.
          </p>
          {detail ? (<p className="font-mono text-[10px] text-rose-50/95 [overflow-wrap:anywhere]">{detail}</p>) : null}
          {detail && /\b403\b|HTTP 403/i.test(detail) ? (<p className="text-[10px] text-sigflo-muted">
              If your Bybit key uses an IP allowlist, add your backend&apos;s outbound IP (e.g. Railway) or use &quot;No
              IP restriction&quot; while debugging.
            </p>) : null}
        </div>);
        }
        var noRows = snapshot.balances.length === 0 && snapshot.positions.length === 0;
        if (noRows) {
            return (<div className="mt-2 space-y-2">
          <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-2.5 py-2 text-[11px] leading-snug text-amber-100/95">
            Connected, but <span className="font-semibold">no wallet summary</span> came back from Bybit. This is not
            “$0” — the app could not read UTA / Funding / spot wallets. Check: API key has{' '}
            <span className="font-semibold">Wallet</span> (and Contracts) read access; withdrawals stay off; if the key
            uses an IP allowlist, add your <span className="font-semibold">backend host</span> (e.g. Railway). Unified
            Trading accounts work best with our sync.
          </p>
        </div>);
        }
        return (<div className="mt-2 space-y-1.5">
        <p className="text-[10px] text-sigflo-muted">
          USD totals unavailable — showing raw row counts from the last sync.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Balance rows</p>
            <p className="mt-1 text-sm font-semibold text-white">{snapshot.balances.length}</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">Positions</p>
            <p className="mt-1 text-sm font-semibold text-white">{snapshot.positions.length}</p>
          </div>
        </div>
      </div>);
    }
    return (<div className="mt-2 space-y-2.5">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <BalanceMetricCell label="Total Equity" value={breakdown.overview.totalEquity}/>
        <BalanceMetricCell label="Wallet Balance" value={breakdown.overview.totalWalletBalance}/>
        <BalanceMetricCell label="Available to Trade" value={breakdown.overview.availableToTrade}/>
        <div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2">
          <p className="text-[9px] uppercase tracking-[0.12em] text-sigflo-muted">Funding Balance</p>
          <p className="mt-1 text-xs font-semibold tabular-nums text-white">
            {(0, formatFundingBalance_1.formatFundingBalance)((_d = breakdown.overview.fundingWalletBalance) !== null && _d !== void 0 ? _d : NaN, breakdown.overview.fundingPrimaryAsset)}
          </p>
          <p className="mt-0.5 text-[8px] leading-tight text-sigflo-muted/85" title="Funding = deposit / transfer wallet">
            Funding = deposit / transfer wallet
          </p>
        </div>
      </div>

      {breakdown.buckets.map(function (bucket) {
            var usdt = bucket.assets.find(function (a) { return a.asset === 'USDT'; });
            return (<div key={bucket.kind} className="rounded-lg border border-white/[0.06] bg-sigflo-elevated p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/95">{bucket.label}</p>
                <p className="mt-0.5 text-[10px] text-sigflo-muted">{bucket.helperText}</p>
              </div>
              {usdt ? (<span className="rounded border border-cyan-400/25 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100/95">
                  USDT {fmtUsdMaybe(usdt.total)}
                </span>) : null}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <BalanceMetricCell label="Available Balance" value={bucket.metrics.availableBalance}/>
              <BalanceMetricCell label="Wallet Balance" value={bucket.metrics.walletBalance}/>
              <BalanceMetricCell label="Equity" value={bucket.metrics.equity}/>
              <BalanceMetricCell label="Margin Balance" value={bucket.metrics.marginBalance}/>
              <BalanceMetricCell label="Margin Used" value={bucket.metrics.marginUsed}/>
              <BalanceMetricCell label="Unrealized PnL" value={bucket.metrics.unrealizedPnl}/>
            </div>
            {bucket.kind === 'funding' && bucket.assets.length > 0 ? (<div className="mt-2 flex flex-wrap gap-1.5">
                {bucket.assets.slice(0, 8).map(function (a) { return (<span key={a.asset} className="rounded border border-white/[0.08] bg-[#08090d] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-sigflo-text/95" title={"".concat(a.asset, " \u2014 wallet total")}>
                    {a.asset}{' '}
                    <span className="text-white/90">{fmtUsdMaybe(a.total)}</span>
                  </span>); })}
              </div>) : null}
          </div>);
        })}
    </div>);
}
function SystemIndicator(_a) {
    var label = _a.label, value = _a.value, active = _a.active;
    return (<div className="rounded-lg border border-white/[0.06] bg-sigflo-elevated px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-sigflo-muted">{label}</p>
      <p className={"mt-1 text-xs font-semibold ".concat(active ? 'text-emerald-300' : 'text-sigflo-text')}>{value}</p>
    </div>);
}
function ActionButton(_a) {
    var label = _a.label, subtext = _a.subtext, onClick = _a.onClick, busy = _a.busy, busyLabel = _a.busyLabel;
    return (<button type="button" onClick={onClick} disabled={busy} className="w-full rounded-lg border border-white/[0.08] bg-sigflo-elevated px-3 py-2 text-left text-sm text-sigflo-text transition hover:border-white/[0.14] hover:bg-[#1c1d26] disabled:opacity-60">
      <p>{busy ? busyLabel !== null && busyLabel !== void 0 ? busyLabel : label : label}</p>
      <p className="mt-0.5 text-[11px] text-sigflo-muted">{subtext}</p>
    </button>);
}
