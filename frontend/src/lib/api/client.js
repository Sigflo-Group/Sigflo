"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ApiError = void 0;
exports.apiFetch = apiFetch;
var client_1 = require("@/lib/supabase/client");
function resolveApiBase() {
    var _a;
    var raw = (_a = import.meta.env.VITE_BACKEND_API_BASE) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw)
        return '/api';
    var trimmed = raw.replace(/\/+$/, '');
    if (/^https?:\/\/[^/]+$/i.test(trimmed))
        return "".concat(trimmed, "/api");
    return trimmed;
}
var API_BASE = resolveApiBase();
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(message, status, requestId) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        _this.requestId = requestId;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function () {
        var sb, data;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    sb = (0, client_1.requireSupabaseClient)();
                    return [4 /*yield*/, sb.auth.getSession()];
                case 1:
                    data = (_c.sent()).data;
                    return [2 /*return*/, (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : null];
            }
        });
    });
}
function safeMessage(status) {
    if (status === 401)
        return 'Session expired. Please sign in again.';
    if (status === 403)
        return 'You are not allowed to perform this action.';
    if (status >= 500)
        return 'Service unavailable. Please retry shortly.';
    return 'Request failed.';
}
function apiFetch(path, init) {
    return __awaiter(this, void 0, void 0, function () {
        var token, headers, res, requestId, message, ct, body, _a, _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, getAccessToken()];
                case 1:
                    token = _e.sent();
                    headers = __assign({ 'Content-Type': 'application/json' }, init === null || init === void 0 ? void 0 : init.headers);
                    if (token)
                        headers.Authorization = "Bearer ".concat(token);
                    return [4 /*yield*/, fetch("".concat(API_BASE).concat(path), __assign(__assign({}, init), { headers: headers }))];
                case 2:
                    res = _e.sent();
                    requestId = (_c = res.headers.get('x-request-id')) !== null && _c !== void 0 ? _c : undefined;
                    if (!!res.ok) return [3 /*break*/, 8];
                    message = safeMessage(res.status);
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 6, , 7]);
                    ct = (_d = res.headers.get('content-type')) !== null && _d !== void 0 ? _d : '';
                    if (!ct.includes('application/json')) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.json()];
                case 4:
                    body = (_e.sent());
                    if (typeof body.error === 'string' && body.error.trim())
                        message = body.error.trim();
                    if (typeof body.message === 'string' && body.message.trim())
                        message = body.message.trim();
                    _e.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    _a = _e.sent();
                    return [3 /*break*/, 7];
                case 7: throw new ApiError(message, res.status, requestId);
                case 8:
                    if (res.status === 204)
                        return [2 /*return*/, undefined];
                    _e.label = 9;
                case 9:
                    _e.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, res.json()];
                case 10: return [2 /*return*/, (_e.sent())];
                case 11:
                    _b = _e.sent();
                    throw new ApiError('Unexpected response format.', 500, requestId);
                case 12: return [2 /*return*/];
            }
        });
    });
}
