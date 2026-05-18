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
exports.requestAssistantSuggestion = requestAssistantSuggestion;
exports.requestDeepMarketAnalysis = requestDeepMarketAnalysis;
var deepAnalysisFallback_1 = require("@/lib/deepAnalysisFallback");
var aiAnalysisValidation_1 = require("@/lib/aiAnalysisValidation");
var aiStructuredNarrative_1 = require("@/lib/aiStructuredNarrative");
var appBasePath_1 = require("@/lib/appBasePath");
var globalAnnouncements_1 = require("@/lib/globalAnnouncements");
var GROUNDED_QUICK_SYSTEM = "You are Sigflo's grounded market assistant. You ONLY interpret the JSON \"data_package\" in the user message. Rules:\n- Do NOT invent prices, levels, indicators, or events not present in data_package.\n- Do NOT mention MACD, Bollinger, VWAP, Ichimoku, Stochastic, Fibonacci, Elliott, or harmonic patterns unless those exact words appear in data_package.allowedIndicatorTerms.\n- Do NOT cite RSI, EMA, ATR, or volume as concepts unless allowed by allowedIndicatorTerms (case-insensitive match to those themes).\n- If information is missing for a claim, say \"insufficient data in package\" for that point instead of guessing.\n- levels_used must be a subset of data_package.allowedPriceLevels (use exact values from the list only, or an empty array).\n- You explain the Sigflo signal engine and plan levels; you do not replace execution decisions.\n\ndata_package includes marketRegime (trending | range | risk_off | transition) and regimeToneGuide. Use them ONLY to calibrate tone, hedging, and how you phrase confidence in reasoning and notes \u2014 still obey every rule above. Never treat regime as external news; it is an internal label from the packaged scores and scanner status.\n\nReturn a single JSON object with EXACTLY these keys and no others:\nbias (string: \"long\" | \"short\" | \"neutral\"),\nconfidence (number 0-100, aligned with tradeReadinessScore when unsure),\nreasoning (string, 1-2 short sentences, only package facts; no bullet lists),\nlevels_used (array of numbers from allowedPriceLevels only),\ntrade_valid (boolean: whether the packaged setup supports a new trade per scannerStatus and scores),\nnotes (string, one short sentence on gaps or caution only).\n\nNo markdown. No headline or body fields.";
var allowGroundedValidationRetry = import.meta.env.VITE_AI_GROUNDED_RETRY_ON_INVALID !== 'false';
function buildGroundedUserPayload(action, req) {
    return "Action requested: ".concat(action, "\ndata_package:\n").concat(JSON.stringify(req.context));
}
function buildGroundedQuickRetryUserContent(req, hint, previous) {
    var prev = previous != null ? JSON.stringify(previous) : '(unparseable or missing)';
    return "Your previous JSON failed validation: ".concat(hint, ".\n\nReturn a corrected JSON object with ONLY these keys: bias, confidence, reasoning, levels_used, trade_valid, notes.\n\nHard rules:\n- levels_used: each number must match a value in allowedPriceLevels exactly: ").concat(JSON.stringify(req.context.allowedPriceLevels), " \u2014 or use [].\n- Only reference RSI, EMA, ATR, or volume themes if allowedIndicatorTerms permits: ").concat(JSON.stringify(req.context.allowedIndicatorTerms), ".\n- No MACD, Bollinger, VWAP, Ichimoku, Stochastic, Fibonacci, Elliott, harmonics.\n\nAction requested: ").concat(req.action, "\ndata_package:\n").concat(JSON.stringify(req.context), "\n\nPrevious rejected output:\n").concat(prev);
}
function extractStructuredFromRemotePayload(data) {
    var _a, _b;
    if (!data || typeof data !== 'object')
        return null;
    var raw = data;
    if (raw.structured != null) {
        return (0, aiAnalysisValidation_1.parseAiStructuredAnalysis)(raw.structured);
    }
    if (typeof raw.bias === 'string') {
        return (0, aiAnalysisValidation_1.parseAiStructuredAnalysis)(raw);
    }
    var choices = raw.choices;
    var content = (_b = (_a = choices === null || choices === void 0 ? void 0 : choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
    if (typeof content !== 'string' || !content.trim())
        return null;
    try {
        var parsed = JSON.parse(content.trim());
        return (0, aiAnalysisValidation_1.parseAiStructuredAnalysis)(parsed);
    }
    catch (_c) {
        return null;
    }
}
function validateAndBuildRemoteQuickResponse(req, structured) {
    var v = (0, aiAnalysisValidation_1.validateGroundedStructuredAnalysis)(structured, req.context);
    if (!v.ok)
        return null;
    var _a = (0, aiStructuredNarrative_1.expandStructuredToQuickNarrative)(req.action, structured, req.context), headline = _a.headline, body = _a.body;
    return { structured: structured, headline: headline, body: body, source: 'remote' };
}
function announceAssistantResult(req, out) {
    var _a, _b;
    try {
        var bias = (_b = (_a = out.structured) === null || _a === void 0 ? void 0 : _a.bias) !== null && _b !== void 0 ? _b : '—';
        (0, globalAnnouncements_1.emitGlobalAnnouncement)({
            id: "ai-asst-".concat(Date.now()),
            kind: 'ai_action',
            title: 'AI insight',
            subtitle: "".concat(req.signal.pair.trim(), " \u00B7 ").concat(req.action, " \u00B7 ").concat(bias, " (").concat(out.source, ")"),
        });
    }
    catch (_c) {
        /* ignore */
    }
}
function requestAssistantSuggestion(req) {
    return __awaiter(this, void 0, void 0, function () {
        var local, proxyEndpoint, allowBrowserOpenAi, browserOpenAiEndpoint, browserOpenAiKey, model, buildQuickPayload, runQuickFetch, run, out;
        var _this = this;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    local = (0, aiStructuredNarrative_1.buildLocalStructuredAnalysis)(req.action, req.signal, req.status, req.tradeScore, req.context);
                    proxyEndpoint = (0, appBasePath_1.resolveAppApiPath)(import.meta.env.VITE_AI_PROXY_ENDPOINT, '/api/ai/suggest');
                    allowBrowserOpenAi = import.meta.env.VITE_AI_ALLOW_BROWSER_OPENAI === 'true';
                    browserOpenAiEndpoint = (_a = import.meta.env.VITE_AI_ENDPOINT) === null || _a === void 0 ? void 0 : _a.trim();
                    browserOpenAiKey = (_b = import.meta.env.VITE_AI_API_KEY) === null || _b === void 0 ? void 0 : _b.trim();
                    model = ((_c = import.meta.env.VITE_AI_MODEL) === null || _c === void 0 ? void 0 : _c.trim()) || 'gpt-4o-mini';
                    buildQuickPayload = function (retry, hint, previousStructured) {
                        if (allowBrowserOpenAi && browserOpenAiEndpoint) {
                            var user = retry
                                ? buildGroundedQuickRetryUserContent(req, hint, previousStructured)
                                : buildGroundedUserPayload(req.action, req);
                            return {
                                model: model,
                                temperature: 0.15,
                                response_format: { type: 'json_object' },
                                messages: [
                                    { role: 'system', content: GROUNDED_QUICK_SYSTEM },
                                    { role: 'user', content: user },
                                ],
                            };
                        }
                        if (retry) {
                            return __assign({ action: req.action, signal: req.signal, status: req.status, tradeScore: req.tradeScore, context: req.context, grounded: true, groundedRetry: true, groundedRetryHint: hint }, (previousStructured != null ? { previousStructured: previousStructured } : {}));
                        }
                        return {
                            action: req.action,
                            signal: req.signal,
                            status: req.status,
                            tradeScore: req.tradeScore,
                            context: req.context,
                            grounded: true,
                        };
                    };
                    runQuickFetch = function (body) { return __awaiter(_this, void 0, void 0, function () {
                        var target, controller, timeout, res, data, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    target = allowBrowserOpenAi && browserOpenAiEndpoint ? browserOpenAiEndpoint : proxyEndpoint;
                                    controller = new AbortController();
                                    timeout = window.setTimeout(function () { return controller.abort(); }, 9000);
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, , 6, 7]);
                                    return [4 /*yield*/, fetch(target, {
                                            method: 'POST',
                                            headers: __assign({ 'Content-Type': 'application/json' }, (allowBrowserOpenAi && browserOpenAiKey ? { Authorization: "Bearer ".concat(browserOpenAiKey) } : {})),
                                            body: JSON.stringify(body),
                                            signal: controller.signal,
                                        })];
                                case 2:
                                    res = _b.sent();
                                    if (!res.ok) return [3 /*break*/, 4];
                                    return [4 /*yield*/, res.json()];
                                case 3:
                                    _a = (_b.sent());
                                    return [3 /*break*/, 5];
                                case 4:
                                    _a = null;
                                    _b.label = 5;
                                case 5:
                                    data = _a;
                                    return [2 /*return*/, { res: res, data: data }];
                                case 6:
                                    window.clearTimeout(timeout);
                                    return [7 /*endfinally*/];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); };
                    run = function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a, res, data, structured, remote, failReason, vQuick, previousForRetry, _b, res2, data2, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, runQuickFetch(buildQuickPayload(false, '', null))];
                                case 1:
                                    _a = _d.sent(), res = _a.res, data = _a.data;
                                    if (!res.ok || !data)
                                        return [2 /*return*/, local];
                                    structured = extractStructuredFromRemotePayload(data);
                                    remote = structured ? validateAndBuildRemoteQuickResponse(req, structured) : null;
                                    if (remote)
                                        return [2 /*return*/, remote];
                                    if (!allowGroundedValidationRetry)
                                        return [2 /*return*/, local];
                                    failReason = 'missing_or_invalid_json';
                                    if (structured != null) {
                                        vQuick = (0, aiAnalysisValidation_1.validateGroundedStructuredAnalysis)(structured, req.context);
                                        if (!vQuick.ok)
                                            failReason = vQuick.reason;
                                    }
                                    previousForRetry = structured !== null && structured !== void 0 ? structured : null;
                                    return [4 /*yield*/, runQuickFetch(buildQuickPayload(true, failReason, previousForRetry))];
                                case 2:
                                    _b = _d.sent(), res2 = _b.res, data2 = _b.data;
                                    if (!res2.ok || !data2)
                                        return [2 /*return*/, local];
                                    structured = extractStructuredFromRemotePayload(data2);
                                    remote = structured ? validateAndBuildRemoteQuickResponse(req, structured) : null;
                                    return [2 /*return*/, remote !== null && remote !== void 0 ? remote : local];
                                case 3:
                                    _c = _d.sent();
                                    return [2 /*return*/, local];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, run()];
                case 1:
                    out = _d.sent();
                    announceAssistantResult(req, out);
                    return [2 /*return*/, out];
            }
        });
    });
}
function buildDeepRetryUserContent(req, hint, previous) {
    var _a, _b;
    var prevH = (_a = previous === null || previous === void 0 ? void 0 : previous.headline) !== null && _a !== void 0 ? _a : '';
    var prevB = String((_b = previous === null || previous === void 0 ? void 0 : previous.body) !== null && _b !== void 0 ? _b : '').slice(0, 1400);
    return "Your previous headline/body failed validation: ".concat(hint, ".\n\nReturn corrected JSON with keys headline (string) and body (string) only.\nbody = GitHub Markdown with ## sections in order: Overview, Market structure, Bullish case, Bearish case, Key levels, Momentum and trend, Invalidation, Risk factors, Trade approach.\n\nRules:\n- Any price with 2+ decimal places in body must match allowedPriceLevels: ").concat(JSON.stringify(req.context.allowedPriceLevels), "\n- Indicators only if allowed in allowedIndicatorTerms: ").concat(JSON.stringify(req.context.allowedIndicatorTerms), "\n- No MACD, Bollinger, VWAP, Ichimoku, Stochastic, Fibonacci, Elliott, harmonics.\n\ndata_package:\n").concat(JSON.stringify(req.context), "\n\nSignal narrative (from app):\naiExplanation: ").concat(req.signal.aiExplanation, "\nwhyThisMatters: ").concat(req.signal.whyThisMatters, "\n\nRejected headline: ").concat(prevH, "\nRejected body excerpt:\n").concat(prevB);
}
var GROUNDED_DEEP_SYSTEM = "You are Sigflo's grounded desk analyst. You ONLY use the JSON data_package in the user message.\n\nRules:\n- Do NOT invent prices or levels. Any specific price number in your markdown body MUST appear in data_package.allowedPriceLevels (match approximately the same numeric values).\n- Do NOT reference indicators or studies not supported by data_package.allowedIndicatorTerms (RSI/EMA/ATR/volume themes only when listed).\n- Do NOT use MACD, Bollinger, VWAP, Ichimoku, Stochastic, Fibonacci, Elliott, harmonics.\n- If data_package.dataGaps is non-empty, mention \"insufficient data in package\" where those gaps block a conclusion.\n- Explain the existing Sigflo signal and levels; do not present novel technical analysis.\n\ndata_package includes marketRegime and regimeToneGuide. Apply them to voice and emphasis across sections without adding facts or levels not in the package.\n\nReturn strict JSON with keys: headline (string), body (string only).\nbody must be GitHub-flavored Markdown with these level-2 headings in order:\n## Overview\n## Market structure\n## Bullish case\n## Bearish case\n## Key levels\n## Momentum and trend\n## Invalidation\n## Risk factors\n## Trade approach\n\nUse only facts from the package. Short paragraphs. No emojis.";
function buildDeepGroundedUser(req) {
    return "data_package:\n".concat(JSON.stringify(req.context), "\n\nSignal narrative (authoritative copy from app, may paraphrase carefully):\naiExplanation: ").concat(req.signal.aiExplanation, "\nwhyThisMatters: ").concat(req.signal.whyThisMatters, "\n");
}
function coerceDeepRemotePayload(data) {
    var _a, _b;
    if (!data || typeof data !== 'object')
        return null;
    var raw = data;
    if (typeof raw.error === 'string')
        return null;
    if (typeof raw.headline === 'string' && typeof raw.body === 'string') {
        return { headline: raw.headline, body: raw.body };
    }
    var choices = raw.choices;
    var content = (_b = (_a = choices === null || choices === void 0 ? void 0 : choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
    if (typeof content !== 'string' || content.trim().length === 0)
        return null;
    try {
        var parsed = JSON.parse(content.trim());
        if (typeof parsed.headline === 'string' && typeof parsed.body === 'string') {
            return { headline: parsed.headline, body: parsed.body };
        }
    }
    catch (_c) {
        return null;
    }
    return null;
}
function requestDeepMarketAnalysis(req) {
    return __awaiter(this, void 0, void 0, function () {
        var localWrap, proxyEndpoint, allowBrowserOpenAi, browserOpenAiEndpoint, browserOpenAiKey, model, buildDeepPayload, runDeepFetch, run, out;
        var _this = this;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    localWrap = function () {
                        var f = (0, deepAnalysisFallback_1.buildDeepAnalysisFallback)(req.signal, req.status, req.tradeScore, req.context);
                        return __assign(__assign({}, f), { source: 'local' });
                    };
                    proxyEndpoint = (0, appBasePath_1.resolveAppApiPath)(import.meta.env.VITE_AI_PROXY_ENDPOINT, '/api/ai/suggest');
                    allowBrowserOpenAi = import.meta.env.VITE_AI_ALLOW_BROWSER_OPENAI === 'true';
                    browserOpenAiEndpoint = (_a = import.meta.env.VITE_AI_ENDPOINT) === null || _a === void 0 ? void 0 : _a.trim();
                    browserOpenAiKey = (_b = import.meta.env.VITE_AI_API_KEY) === null || _b === void 0 ? void 0 : _b.trim();
                    model = ((_c = import.meta.env.VITE_AI_MODEL) === null || _c === void 0 ? void 0 : _c.trim()) || 'gpt-4o-mini';
                    buildDeepPayload = function (retry, hint, previous) {
                        if (allowBrowserOpenAi && browserOpenAiEndpoint) {
                            var user = retry
                                ? buildDeepRetryUserContent(req, hint, previous)
                                : buildDeepGroundedUser(req);
                            return {
                                model: model,
                                temperature: 0.32,
                                response_format: { type: 'json_object' },
                                messages: [
                                    { role: 'system', content: GROUNDED_DEEP_SYSTEM },
                                    { role: 'user', content: user },
                                ],
                            };
                        }
                        if (retry) {
                            return __assign({ action: 'deep', signal: req.signal, status: req.status, tradeScore: req.tradeScore, context: req.context, grounded: true, deepRetry: true, deepRetryHint: hint }, (previous ? { previousDeep: previous } : {}));
                        }
                        return {
                            action: 'deep',
                            signal: req.signal,
                            status: req.status,
                            tradeScore: req.tradeScore,
                            context: req.context,
                            grounded: true,
                        };
                    };
                    runDeepFetch = function (body) { return __awaiter(_this, void 0, void 0, function () {
                        var target, controller, timeout, res, data, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    target = allowBrowserOpenAi && browserOpenAiEndpoint ? browserOpenAiEndpoint : proxyEndpoint;
                                    controller = new AbortController();
                                    timeout = window.setTimeout(function () { return controller.abort(); }, 50000);
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, , 6, 7]);
                                    return [4 /*yield*/, fetch(target, {
                                            method: 'POST',
                                            headers: __assign({ 'Content-Type': 'application/json' }, (allowBrowserOpenAi && browserOpenAiKey ? { Authorization: "Bearer ".concat(browserOpenAiKey) } : {})),
                                            body: JSON.stringify(body),
                                            signal: controller.signal,
                                        })];
                                case 2:
                                    res = _b.sent();
                                    if (!res.ok) return [3 /*break*/, 4];
                                    return [4 /*yield*/, res.json()];
                                case 3:
                                    _a = (_b.sent());
                                    return [3 /*break*/, 5];
                                case 4:
                                    _a = null;
                                    _b.label = 5;
                                case 5:
                                    data = _a;
                                    return [2 /*return*/, { res: res, data: data }];
                                case 6:
                                    window.clearTimeout(timeout);
                                    return [7 /*endfinally*/];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); };
                    run = function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a, res, data, parsed, failReason, v, _b, res2, data2, v2, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, runDeepFetch(buildDeepPayload(false, '', null))];
                                case 1:
                                    _a = _d.sent(), res = _a.res, data = _a.data;
                                    if (!res.ok || !data)
                                        return [2 /*return*/, localWrap()];
                                    parsed = coerceDeepRemotePayload(data);
                                    failReason = 'missing_or_invalid_json';
                                    if (parsed) {
                                        v = (0, aiAnalysisValidation_1.validateDeepMarkdownGrounded)(parsed.body, req.context);
                                        if (v.ok)
                                            return [2 /*return*/, { headline: parsed.headline, body: parsed.body, source: 'remote' }];
                                        failReason = v.reason;
                                    }
                                    if (!allowGroundedValidationRetry)
                                        return [2 /*return*/, localWrap()];
                                    return [4 /*yield*/, runDeepFetch(buildDeepPayload(true, failReason, parsed))];
                                case 2:
                                    _b = _d.sent(), res2 = _b.res, data2 = _b.data;
                                    if (!res2.ok || !data2)
                                        return [2 /*return*/, localWrap()];
                                    parsed = coerceDeepRemotePayload(data2);
                                    if (!parsed)
                                        return [2 /*return*/, localWrap()];
                                    v2 = (0, aiAnalysisValidation_1.validateDeepMarkdownGrounded)(parsed.body, req.context);
                                    if (!v2.ok)
                                        return [2 /*return*/, localWrap()];
                                    return [2 /*return*/, { headline: parsed.headline, body: parsed.body, source: 'remote' }];
                                case 3:
                                    _c = _d.sent();
                                    return [2 /*return*/, localWrap()];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, run()];
                case 1:
                    out = _d.sent();
                    try {
                        (0, globalAnnouncements_1.emitGlobalAnnouncement)({
                            id: "ai-deep-".concat(Date.now()),
                            kind: 'ai_action',
                            title: 'Deep analysis',
                            subtitle: "".concat(req.signal.pair.trim(), " \u00B7 ").concat(out.headline.slice(0, 140)),
                        });
                    }
                    catch (_e) {
                        /* ignore */
                    }
                    return [2 /*return*/, out];
            }
        });
    });
}
