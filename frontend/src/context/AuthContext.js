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
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
var react_1 = require("react");
var oauthRedirectOrigin_1 = require("@/lib/oauthRedirectOrigin");
var supabase_1 = require("@/lib/supabase");
var AuthContext = (0, react_1.createContext)(null);
function AuthProvider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = (0, react_1.useState)(null), session = _b[0], setSession = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    (0, react_1.useEffect)(function () {
        if (!supabase_1.supabase) {
            setLoading(false);
            return;
        }
        void supabase_1.supabase.auth.getSession()
            .then(function (_a) {
            var next = _a.data.session;
            setSession(next);
            setLoading(false);
        })
            .catch(function () {
            setLoading(false);
        });
        var subscription = supabase_1.supabase.auth.onAuthStateChange(function (_event, next) {
            setSession(next);
        }).data.subscription;
        return function () { return subscription.unsubscribe(); };
    }, []);
    var value = (0, react_1.useMemo)(function () {
        var _a;
        return ({
            session: session,
            user: (_a = session === null || session === void 0 ? void 0 : session.user) !== null && _a !== void 0 ? _a : null,
            loading: loading,
            authMode: (0, supabase_1.isSupabaseConfigured)() ? 'supabase' : 'dev',
            signInWithGoogle: function () { return __awaiter(_this, void 0, void 0, function () {
                var redirectTo, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            redirectTo = (0, oauthRedirectOrigin_1.getOAuthRedirectToProfile)();
                            return [4 /*yield*/, supabase_1.supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: redirectTo,
                                        /** Return the provider URL so we always navigate explicitly (embedded browsers often skip auto-redirect). */
                                        skipBrowserRedirect: true,
                                    },
                                })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            if (data === null || data === void 0 ? void 0 : data.url) {
                                window.location.assign(data.url);
                                return [2 /*return*/];
                            }
                            throw new Error('Google sign-in did not return a redirect URL. Add this site to Supabase Auth → URL Configuration redirect allow list.');
                    }
                });
            }); },
            signInWithMagicLink: function (email) { return __awaiter(_this, void 0, void 0, function () {
                var emailRedirectTo, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            emailRedirectTo = (0, oauthRedirectOrigin_1.getMagicLinkRedirectTo)();
                            return [4 /*yield*/, supabase_1.supabase.auth.signInWithOtp({
                                    email: email.trim(),
                                    options: {
                                        emailRedirectTo: emailRedirectTo,
                                        shouldCreateUser: true,
                                    },
                                })];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/];
                    }
                });
            }); },
            signInWithPassword: function (email, password) { return __awaiter(_this, void 0, void 0, function () {
                var error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            return [4 /*yield*/, supabase_1.supabase.auth.signInWithPassword({
                                    email: email.trim(),
                                    password: password,
                                })];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/];
                    }
                });
            }); },
            signUpWithPassword: function (email, password) { return __awaiter(_this, void 0, void 0, function () {
                var emailRedirectTo, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            emailRedirectTo = (0, oauthRedirectOrigin_1.getMagicLinkRedirectTo)();
                            return [4 /*yield*/, supabase_1.supabase.auth.signUp({
                                    email: email.trim(),
                                    password: password,
                                    options: {
                                        emailRedirectTo: emailRedirectTo,
                                    },
                                })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            return [2 /*return*/, { session: data.session }];
                    }
                });
            }); },
            resendSignupConfirmation: function (email) { return __awaiter(_this, void 0, void 0, function () {
                var emailRedirectTo, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            emailRedirectTo = (0, oauthRedirectOrigin_1.getMagicLinkRedirectTo)();
                            return [4 /*yield*/, supabase_1.supabase.auth.resend({
                                    type: 'signup',
                                    email: email.trim(),
                                    options: { emailRedirectTo: emailRedirectTo },
                                })];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/];
                    }
                });
            }); },
            resetPasswordForEmail: function (email) { return __awaiter(_this, void 0, void 0, function () {
                var redirectTo, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!supabase_1.supabase) {
                                throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).');
                            }
                            redirectTo = (0, oauthRedirectOrigin_1.getPasswordRecoveryRedirectTo)();
                            return [4 /*yield*/, supabase_1.supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo })];
                        case 1:
                            error = (_a.sent()).error;
                            if (error)
                                throw error;
                            return [2 /*return*/];
                    }
                });
            }); },
            signOut: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!supabase_1.supabase)
                                return [2 /*return*/];
                            return [4 /*yield*/, supabase_1.supabase.auth.signOut()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
        });
    }, [session, loading]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
    var ctx = (0, react_1.useContext)(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
