"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENGINE_FOCUS_BY_ID = void 0;
exports.engineFocusLine = engineFocusLine;
/** Plain-English focus lines for engine detail (mock / product copy). */
exports.ENGINE_FOCUS_BY_ID = {
    'eng-nova': 'Looks for breakout compression, volume expansion, and trend continuation.',
    'eng-rio': 'Looks for exhaustion, failed moves, and reversal confirmation.',
    'eng-pulse': 'Looks for momentum continuation and active trend strength.',
    'eng-guard': 'Monitors risk, exposure, and execution safety.',
};
function engineFocusLine(engineId) {
    var _a;
    return ((_a = exports.ENGINE_FOCUS_BY_ID[engineId]) !== null && _a !== void 0 ? _a : 'Scans live market structure and surfaces setups when conditions align with this engine’s rules.');
}
