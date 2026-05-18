"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGFLO_MOBILE_LOADER_TRADE_STATUSES = exports.SIGFLO_MOBILE_LOADER_AUTH_STATUSES = exports.SIGFLO_MOBILE_LOADER_FEED_STATUSES = void 0;
/** Preset copy for {@link SigfloMobileLoader} — feed / app boot. */
exports.SIGFLO_MOBILE_LOADER_FEED_STATUSES = [
    'Loading workspace',
    'Refreshing market data',
    'Preparing signals',
];
/** Preset copy for auth flows (callback, session restore). */
exports.SIGFLO_MOBILE_LOADER_AUTH_STATUSES = [
    'Securing session',
    'Loading account',
    'Verifying access',
];
/** Preset copy for trade workspace — pass into `SigfloMobileLoader` where you gate the trade UI. */
exports.SIGFLO_MOBILE_LOADER_TRADE_STATUSES = [
    'Loading position',
    'Refreshing chart',
    'Preparing execution tools',
];
