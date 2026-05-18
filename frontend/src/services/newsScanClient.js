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
exports.requestMarketNewsScan = requestMarketNewsScan;
var appBasePath_1 = require("@/lib/appBasePath");
function isRecord(x) {
    return x !== null && typeof x === 'object' && !Array.isArray(x);
}
function parseArticles(raw) {
    if (!Array.isArray(raw))
        return [];
    var out = [];
    for (var _i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
        var x = raw_1[_i];
        if (!isRecord(x))
            continue;
        var id = x.id;
        var title = x.title;
        var link = x.link;
        var source = x.source;
        if (typeof id !== 'number' || typeof title !== 'string' || typeof link !== 'string' || typeof source !== 'string') {
            continue;
        }
        out.push({
            id: id,
            title: title,
            link: link,
            source: source,
            published: typeof x.published === 'string' ? x.published : '',
            excerpt: typeof x.excerpt === 'string' ? x.excerpt : '',
        });
    }
    return out;
}
function parseAssetFocus(raw) {
    if (!isRecord(raw))
        return null;
    var symbol = raw.symbol;
    var newsRelevance = raw.newsRelevance;
    var narrative = raw.narrative;
    var technicalVsNews = raw.technicalVsNews;
    if (typeof symbol !== 'string' || typeof narrative !== 'string' || typeof technicalVsNews !== 'string') {
        return null;
    }
    if (newsRelevance !== 'high' && newsRelevance !== 'medium' && newsRelevance !== 'low' && newsRelevance !== 'none') {
        return null;
    }
    return { symbol: symbol, newsRelevance: newsRelevance, narrative: narrative, technicalVsNews: technicalVsNews };
}
function parseSummary(raw, mode) {
    if (!isRecord(raw))
        return null;
    var marketMood = raw.marketMood;
    if (typeof marketMood !== 'string')
        return null;
    var keyDrivers = Array.isArray(raw.keyDrivers) ? raw.keyDrivers.filter(function (x) { return typeof x === 'string'; }) : [];
    if (keyDrivers.length < 1)
        return null;
    var assetsAffected = Array.isArray(raw.assetsAffected)
        ? raw.assetsAffected
            .filter(isRecord)
            .map(function (o) { return ({
            symbol: typeof o.symbol === 'string' ? o.symbol : '',
            note: typeof o.note === 'string' ? o.note : '',
        }); })
            .filter(function (a) { return a.symbol && a.note; })
        : [];
    var whyItMatters = typeof raw.whyItMatters === 'string' ? raw.whyItMatters : '';
    if (whyItMatters.length < 4)
        return null;
    var whatToWatchNext = Array.isArray(raw.whatToWatchNext)
        ? raw.whatToWatchNext.filter(function (x) { return typeof x === 'string'; })
        : [];
    var sourcesReferenced = Array.isArray(raw.sourcesReferenced)
        ? raw.sourcesReferenced.filter(function (x) { return typeof x === 'number' && Number.isInteger(x); })
        : [];
    var lowSignalSummary = Boolean(raw.lowSignalSummary);
    var assetFocus = parseAssetFocus(raw.assetFocus);
    var fullBrief = mode === 'deep' && typeof raw.fullBrief === 'string' && raw.fullBrief.trim().length > 0 ? raw.fullBrief.trim() : undefined;
    return __assign({ marketMood: marketMood, keyDrivers: keyDrivers, assetsAffected: assetsAffected, whyItMatters: whyItMatters, whatToWatchNext: whatToWatchNext, sourcesReferenced: sourcesReferenced, lowSignalSummary: lowSignalSummary, assetFocus: assetFocus }, (fullBrief ? { fullBrief: fullBrief } : {}));
}
function normalizePayload(data) {
    if (!isRecord(data)) {
        return {
            ok: false,
            error: 'News scan response was missing required fields',
            mode: 'short',
            focusAsset: null,
            summary: null,
            articles: [],
        };
    }
    var mode = data.mode === 'deep' ? 'deep' : 'short';
    var focusAsset = typeof data.focusAsset === 'string' && data.focusAsset ? data.focusAsset : null;
    var articles = parseArticles(data.articles);
    var summaryRaw = data.summary;
    var summary = summaryRaw === null || summaryRaw === undefined ? null : parseSummary(summaryRaw, mode);
    return {
        ok: Boolean(data.ok),
        error: typeof data.error === 'string' ? data.error : undefined,
        noAi: Boolean(data.noAi),
        lowSignal: Boolean(data.lowSignal),
        message: typeof data.message === 'string' ? data.message : undefined,
        mode: mode,
        focusAsset: focusAsset,
        summary: summary,
        articles: articles,
    };
}
function requestMarketNewsScan(req) {
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, controller, timeout, res, data, _a;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    endpoint = (0, appBasePath_1.resolveAppApiPath)(import.meta.env.VITE_NEWS_SCAN_ENDPOINT, '/api/ai/news-scan');
                    controller = new AbortController();
                    timeout = window.setTimeout(function () { return controller.abort(); }, 60000);
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(__assign({ mode: req.mode, focusAsset: (_b = req.focusAsset) !== null && _b !== void 0 ? _b : null }, (req.marketRegime != null ? { marketRegime: req.marketRegime } : {}))),
                            signal: controller.signal,
                        })];
                case 2:
                    res = _e.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 3:
                    data = _e.sent();
                    if (!res.ok) {
                        return [2 /*return*/, normalizePayload({
                                ok: false,
                                error: typeof data === 'object' && data && 'error' in data ? String(data.error) : "HTTP ".concat(res.status),
                                mode: req.mode,
                                focusAsset: (_c = req.focusAsset) !== null && _c !== void 0 ? _c : null,
                                summary: null,
                                articles: [],
                            })];
                    }
                    return [2 /*return*/, normalizePayload(data)];
                case 4:
                    _a = _e.sent();
                    return [2 /*return*/, {
                            ok: false,
                            error: 'Network error',
                            mode: req.mode,
                            focusAsset: (_d = req.focusAsset) !== null && _d !== void 0 ? _d : null,
                            summary: null,
                            articles: [],
                        }];
                case 5:
                    window.clearTimeout(timeout);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
