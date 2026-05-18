"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_ROUTE_META = exports.FEED_ACTIONABLE_QUERY = exports.APP_PRODUCT_ORIGIN = void 0;
exports.isSubpathBase = isSubpathBase;
exports.isAppSigfloProductHost = isAppSigfloProductHost;
exports.getFeedRoute = getFeedRoute;
exports.getLandingRoute = getLandingRoute;
exports.feedBrowserPath = feedBrowserPath;
exports.openAppHref = openAppHref;
exports.feedActionablePath = feedActionablePath;
var appBasePath_1 = require("@/lib/appBasePath");
/**
 * Subpath deploy (e.g. `VITE_BASE=/feed/`). Treat missing/empty BASE_URL like root `/`.
 */
function isSubpathBase() {
    var b = import.meta.env.BASE_URL;
    if (b == null || b === '' || b === '/')
        return false;
    return true;
}
/**
 * Product shell on `app.sigflo.group`: feed at `/`, in-SPA marketing at `/landing`.
 * Evaluated at call time so `window.location` is always correct (avoids stale module init).
 */
function isAppSigfloProductHost() {
    if (import.meta.env.VITE_APP_HOST === 'app')
        return true;
    if (typeof window === 'undefined')
        return false;
    return window.location.hostname.toLowerCase() === 'app.sigflo.group';
}
exports.APP_PRODUCT_ORIGIN = 'https://app.sigflo.group';
/** Router path for the main feed hub (call during render / handlers, not at module top level). */
function getFeedRoute() {
    if (isSubpathBase())
        return '/';
    if (isAppSigfloProductHost())
        return '/';
    return '/feed';
}
/** Landing / marketing route when feed is not at `/`. */
function getLandingRoute() {
    if (isSubpathBase())
        return '/landing';
    if (isAppSigfloProductHost())
        return '/landing';
    return '/';
}
function feedBrowserPath() {
    return (0, appBasePath_1.withAppBase)(getFeedRoute());
}
function openAppHref() {
    if (import.meta.env.PROD)
        return "".concat(exports.APP_PRODUCT_ORIGIN, "/");
    if (typeof window === 'undefined')
        return '/feed';
    return "".concat(window.location.origin).concat(feedBrowserPath());
}
exports.FEED_ACTIONABLE_QUERY = '?filter=actionable';
function feedActionablePath() {
    var feed = getFeedRoute();
    return feed === '/' ? "/".concat(exports.FEED_ACTIONABLE_QUERY) : "".concat(feed).concat(exports.FEED_ACTIONABLE_QUERY);
}
exports.APP_ROUTE_META = {
    '/login': { requiresAuth: false, requiresStepUp: false, auditLabel: 'auth_login' },
    '/feed': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_feed' },
    '/markets': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_markets' },
    '/trade/:symbol': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_trade' },
    '/portfolio': { requiresAuth: true, requiresStepUp: false, auditLabel: 'view_portfolio' },
    '/settings/profile': { requiresAuth: true, requiresStepUp: false, auditLabel: 'settings_profile' },
    '/settings/exchange': { requiresAuth: true, requiresStepUp: true, auditLabel: 'settings_exchange' },
    '/settings/security': { requiresAuth: true, requiresStepUp: false, auditLabel: 'settings_security' },
    '/settings/execution': { requiresAuth: true, requiresStepUp: true, auditLabel: 'settings_execution' },
    '/security/step-up': { requiresAuth: true, requiresStepUp: false, auditLabel: 'security_step_up' },
};
