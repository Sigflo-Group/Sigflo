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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiJson = apiJson;
var supabase_1 = require("@/lib/supabase");
var httpErrorMessage_1 = require("@/lib/httpErrorMessage");
/**
 * Backend mounts integrations and portfolio under `/api/...` (see backend `server.ts`).
 * Must end with `/api` (no trailing slash). Common mistake: `http://localhost:8787` → 404 on `/integrations/...`.
 */
function resolveApiBase() {
    var _a;
    var raw = (_a = import.meta.env.VITE_BACKEND_API_BASE) === null || _a === void 0 ? void 0 : _a.trim();
    if (raw) {
        var base = raw.replace(/\/+$/, '');
        if (/^https?:\/\/[^/]+$/i.test(base)) {
            return "".concat(base, "/api");
        }
        return base;
    }
    /** Same-origin `/api` — Vite dev proxy, Netlify/Vercel rewrites, or reverse proxy to the Express backend. */
    return '/api';
}
var API_BASE = resolveApiBase();
var DEV_USER_ID = (_a = import.meta.env.VITE_DEV_USER_ID) === null || _a === void 0 ? void 0 : _a.trim();
function looksLikeHtmlPayload(s) {
    var t = s.trim();
    if (t.length === 0)
        return false;
    if (/^<\s*!doctype/i.test(t) || /^<\s*html/i.test(t))
        return true;
    if (t.includes('<!DOCTYPE') || t.includes('<!doctype'))
        return true;
    if (t.includes('CloudFront') && t.includes('could not be satisfied'))
        return true;
    if (t.includes('<HTML') || t.includes('<html'))
        return true;
    return false;
}
function cdnBlockedMessage(status) {
    return "HTTP ".concat(status, " \u2014 CDN blocked this request (e.g. CloudFront/WAF) before your API. Fix: set Netlify (or build) env VITE_BACKEND_API_BASE to your API origin (e.g. https://YOUR-SERVICE.up.railway.app with no /api suffix), redeploy, and ensure that host does not return HTML for /api/* \u2014 or proxy /api on the same domain as the SPA.");
}
function apiJson(path, init) {
    return __awaiter(this, void 0, void 0, function () {
        var headers, data, token, res, ct, message, body, errText, text, trimmed, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    headers = __assign({ 'Content-Type': 'application/json' }, init === null || init === void 0 ? void 0 : init.headers);
                    if (!supabase_1.supabase) return [3 /*break*/, 2];
                    return [4 /*yield*/, supabase_1.supabase.auth.getSession()];
                case 1:
                    data = (_d.sent()).data;
                    token = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token;
                    if (token) {
                        headers.Authorization = "Bearer ".concat(token);
                    }
                    _d.label = 2;
                case 2:
                    if (!headers.Authorization && DEV_USER_ID) {
                        headers['x-user-id'] = DEV_USER_ID;
                    }
                    return [4 /*yield*/, fetch("".concat(API_BASE).concat(path), __assign(__assign({}, init), { headers: headers }))];
                case 3:
                    res = _d.sent();
                    if (!!res.ok) return [3 /*break*/, 11];
                    ct = (_c = res.headers.get('content-type')) !== null && _c !== void 0 ? _c : '';
                    message = "Request failed: HTTP ".concat(res.status);
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 9, , 10]);
                    if (!ct.includes('application/json')) return [3 /*break*/, 6];
                    return [4 /*yield*/, res.json()];
                case 5:
                    body = (_d.sent());
                    errText = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : '';
                    if (errText) {
                        message = looksLikeHtmlPayload(errText) ? cdnBlockedMessage(res.status) : errText;
                    }
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, res.text()];
                case 7:
                    text = _d.sent();
                    trimmed = text.trim();
                    if (looksLikeHtmlPayload(trimmed)) {
                        message = cdnBlockedMessage(res.status);
                    }
                    else if (trimmed.length > 0 && trimmed.length < 400) {
                        message = "Request failed: HTTP ".concat(res.status, " \u2014 ").concat(trimmed);
                    }
                    _d.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    _a = _d.sent();
                    return [3 /*break*/, 10];
                case 10: throw new Error((0, httpErrorMessage_1.sanitizeUserFacingHttpErrorMessage)(message));
                case 11:
                    if (res.status === 204)
                        return [2 /*return*/, undefined];
                    return [4 /*yield*/, res.json()];
                case 12: return [2 /*return*/, (_d.sent())];
            }
        });
    });
}
