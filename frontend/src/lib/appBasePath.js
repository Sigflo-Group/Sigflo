"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppBase = withAppBase;
exports.resolveAppApiPath = resolveAppApiPath;
/**
 * Join a path with Vite `base` so fetches work when the app is hosted under a subpath.
 * Netlify must define matching redirects (e.g. `/app/api/ai/suggest` → function).
 */
function withAppBase(path) {
    var _a;
    var base = ((_a = import.meta.env.BASE_URL) !== null && _a !== void 0 ? _a : '/').replace(/\/+$/, '');
    var p = path.startsWith('/') ? path : "/".concat(path);
    return base ? "".concat(base).concat(p) : p;
}
/** Env override: absolute URL unchanged; relative paths get `base` prefix. */
function resolveAppApiPath(override, defaultPath) {
    var raw = override === null || override === void 0 ? void 0 : override.trim();
    if (!raw)
        return withAppBase(defaultPath);
    if (/^https?:\/\//i.test(raw))
        return raw;
    return withAppBase(raw.startsWith('/') ? raw : "/".concat(raw));
}
