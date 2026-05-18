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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
/** Merge keys missing from `into` (e.g. OPENAI_API_KEY only in `backend/.env`). */
function mergeDotenvFile(filePath, into) {
    if (!(0, node_fs_1.existsSync)(filePath))
        return;
    try {
        var text = (0, node_fs_1.readFileSync)(filePath, 'utf8');
        for (var _i = 0, _a = text.split('\n'); _i < _a.length; _i++) {
            var line = _a[_i];
            var trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            var eq = trimmed.indexOf('=');
            if (eq <= 0)
                continue;
            var key = trimmed.slice(0, eq).trim();
            var val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (key && into[key] === undefined)
                into[key] = val;
        }
    }
    catch (_b) {
        /* ignore */
    }
}
/**
 * Vite `loadEnv(..., '')` ends by copying `process.env` over parsed files, so an empty
 * `OPENAI_API_KEY` in the OS environment wins over `.env.local` → OpenAI sees `Bearer ` (invalid).
 * Re-read these keys from disk in normal precedence (later files override).
 */
var AI_ENV_KEYS = new Set([
    'OPENAI_API_KEY',
    'AI_API_KEY',
    'OPENAI_API_ENDPOINT',
    'AI_ENDPOINT',
    'OPENAI_MODEL',
    'AI_MODEL',
    'NEWS_RSS_FEEDS',
]);
function mergeDotenvWhitelistOverwrite(filePath, into, allowed) {
    if (!(0, node_fs_1.existsSync)(filePath))
        return;
    try {
        var text = (0, node_fs_1.readFileSync)(filePath, 'utf8');
        for (var _i = 0, _a = text.split('\n'); _i < _a.length; _i++) {
            var line = _a[_i];
            var trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            var eq = trimmed.indexOf('=');
            if (eq <= 0)
                continue;
            var key = trimmed.slice(0, eq).trim();
            if (!key || !allowed.has(key))
                continue;
            var val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            into[key] = val;
        }
    }
    catch (_b) {
        /* ignore */
    }
}
function loadAiSecretsFromDisk(mode, rootDir) {
    var out = {};
    var chain = [
        node_path_1.default.join(rootDir, 'backend', '.env'),
        node_path_1.default.join(rootDir, '.env'),
        node_path_1.default.join(rootDir, '.env.local'),
        node_path_1.default.join(rootDir, ".env.".concat(mode)),
        node_path_1.default.join(rootDir, ".env.".concat(mode, ".local")),
    ];
    for (var _i = 0, chain_1 = chain; _i < chain_1.length; _i++) {
        var p = chain_1[_i];
        mergeDotenvWhitelistOverwrite(p, out, AI_ENV_KEYS);
    }
    return out;
}
function readBody(req) {
    return new Promise(function (resolve, reject) {
        var chunks = [];
        req.on('data', function (c) { return chunks.push(c); });
        req.on('end', function () { return resolve(Buffer.concat(chunks).toString('utf8')); });
        req.on('error', reject);
    });
}
exports.default = (0, vite_1.defineConfig)(function (_a) {
    var _b;
    var mode = _a.mode;
    var envFromFiles = __assign({}, (0, vite_1.loadEnv)(mode, __dirname, ''));
    mergeDotenvFile(node_path_1.default.join(__dirname, 'backend', '.env'), envFromFiles);
    var aiSecretsFromDisk = loadAiSecretsFromDisk(mode, __dirname);
    var devAiEnv = function () { return (__assign(__assign(__assign({}, process.env), envFromFiles), aiSecretsFromDisk)); };
    var baseFromEnv = (_b = envFromFiles.VITE_BASE) === null || _b === void 0 ? void 0 : _b.trim();
    var resolvedBase = baseFromEnv && baseFromEnv !== '/'
        ? baseFromEnv.endsWith('/')
            ? baseFromEnv
            : "".concat(baseFromEnv, "/")
        : '/';
    return {
        /** Set `VITE_BASE=/your/subpath/` when hosting under a subfolder (avoids blank screen from 404 JS/CSS). */
        base: resolvedBase,
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                        'vendor-charts': ['lightweight-charts'],
                        'vendor-motion': ['framer-motion'],
                        'vendor-supabase': ['@supabase/supabase-js'],
                    },
                },
            },
        },
        plugins: [
            {
                name: 'ai-suggest-dev',
                enforce: 'pre',
                configureServer: function (server) {
                    var _this = this;
                    server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                        var pathname, isAdminBeta, out, body, runAdminBeta, authHeader, result_1, runMarketNewsScan, result_2, runAiSuggest, result, _a;
                        var _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    pathname = (_c = (_b = req.url) === null || _b === void 0 ? void 0 : _b.split('?')[0]) !== null && _c !== void 0 ? _c : '';
                                    isAdminBeta = pathname === '/api/admin/beta' || pathname.endsWith('/api/admin/beta');
                                    if (pathname !== '/api/ai/suggest' && pathname !== '/api/ai/news-scan' && !isAdminBeta) {
                                        next();
                                        return [2 /*return*/];
                                    }
                                    out = res;
                                    if (req.method === 'OPTIONS') {
                                        out.statusCode = 204;
                                        out.end();
                                        return [2 /*return*/];
                                    }
                                    if (req.method !== 'POST') {
                                        out.statusCode = 405;
                                        out.setHeader('Content-Type', 'application/json');
                                        out.end(JSON.stringify({ error: 'Method not allowed' }));
                                        return [2 /*return*/];
                                    }
                                    _d.label = 1;
                                case 1:
                                    _d.trys.push([1, 11, , 12]);
                                    return [4 /*yield*/, readBody(req)];
                                case 2:
                                    body = _d.sent();
                                    if (!isAdminBeta) return [3 /*break*/, 5];
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require(
                                        // @ts-expect-error TS7016 — untyped .mjs Netlify module
                                        './netlify/functions/lib/admin-beta-core.mjs'); })];
                                case 3:
                                    runAdminBeta = (_d.sent()).runAdminBeta;
                                    authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
                                    return [4 /*yield*/, runAdminBeta(body, authHeader, devAiEnv())];
                                case 4:
                                    result_1 = _d.sent();
                                    out.setHeader('Content-Type', 'application/json');
                                    out.statusCode = result_1.statusCode;
                                    out.end(JSON.stringify(result_1.body));
                                    return [2 /*return*/];
                                case 5:
                                    if (!(pathname === '/api/ai/news-scan')) return [3 /*break*/, 8];
                                    return [4 /*yield*/, Promise.resolve().then(function () { return require(
                                        // @ts-expect-error TS7016 — untyped .mjs Netlify module
                                        './netlify/functions/lib/market-news-scan-core.mjs'); })];
                                case 6:
                                    runMarketNewsScan = (_d.sent()).runMarketNewsScan;
                                    return [4 /*yield*/, runMarketNewsScan(body, devAiEnv())];
                                case 7:
                                    result_2 = _d.sent();
                                    out.setHeader('Content-Type', 'application/json');
                                    out.statusCode = 200;
                                    out.end(JSON.stringify(result_2));
                                    return [2 /*return*/];
                                case 8: return [4 /*yield*/, Promise.resolve().then(function () { return require('./netlify/functions/lib/ai-suggest-core.mjs'); })];
                                case 9:
                                    runAiSuggest = (_d.sent()).runAiSuggest;
                                    return [4 /*yield*/, runAiSuggest(body, devAiEnv())];
                                case 10:
                                    result = _d.sent();
                                    out.setHeader('Content-Type', 'application/json');
                                    if ('error' in result) {
                                        out.statusCode = 400;
                                        out.end(JSON.stringify({ error: result.error }));
                                    }
                                    else {
                                        out.statusCode = 200;
                                        out.end(JSON.stringify(result));
                                    }
                                    return [3 /*break*/, 12];
                                case 11:
                                    _a = _d.sent();
                                    out.statusCode = 500;
                                    out.setHeader('Content-Type', 'application/json');
                                    out.end(JSON.stringify({ error: 'AI handler failed' }));
                                    return [3 /*break*/, 12];
                                case 12: return [2 /*return*/];
                            }
                        });
                    }); });
                },
            },
            (0, plugin_react_1.default)(),
        ],
        resolve: {
            alias: {
                '@': node_path_1.default.resolve(__dirname, './src'),
            },
        },
        server: {
            allowedHosts: true,
            /**
             * Netlify Dev (`netlify.toml` `[dev]` targetPort) must match this port. If Vite silently picked
             * the next port (e.g. 5174), the proxy (e.g. :4000) would still forward to :5173 → blank/black UI.
             */
            strictPort: true,
            // Only proxy backend routes. `/api/ai/suggest` is handled above (and by Netlify in production).
            proxy: {
                '/api/integrations': { target: 'http://127.0.0.1:8787', changeOrigin: true },
                '/api/portfolio': { target: 'http://127.0.0.1:8787', changeOrigin: true },
                '/api/trade': { target: 'http://127.0.0.1:8787', changeOrigin: true },
            },
        },
    };
});
