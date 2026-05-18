"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWatchCue = resolveWatchCue;
exports.resolveWatchNextCue = resolveWatchNextCue;
/** Short decision cue for cards and Trade — custom copy wins, else derived from structure. */
function resolveWatchCue(signal) {
    var _a;
    var custom = (_a = signal.watchCue) === null || _a === void 0 ? void 0 : _a.trim();
    if (custom)
        return custom;
    var long = signal.side === 'long';
    if (signal.setupType === 'overextended') {
        return long ? 'rejection at highs vs continuation higher' : 'failed bounce vs continuation lower';
    }
    if (signal.setupType === 'pullback') {
        return long ? 'buyers holding the pullback zone' : 'sellers capping relief bounces';
    }
    if (signal.setupTags.includes('Breakout')) {
        return long ? 'breakout above range high' : 'breakdown below range low';
    }
    return long ? 'structure confirming higher' : 'structure confirming lower';
}
/** Forward-looking “what happens next” (quiet, analytical). Custom `watchNext` wins. */
function resolveWatchNextCue(signal) {
    var _a;
    var custom = (_a = signal.watchNext) === null || _a === void 0 ? void 0 : _a.trim();
    if (custom)
        return custom;
    var long = signal.side === 'long';
    if (signal.setupType === 'overextended') {
        return long ? 'extension → resistance reaction' : 'extension → support reaction';
    }
    if (signal.setupType === 'pullback') {
        return long ? 'hold at support → continuation' : 'hold at resistance → continuation';
    }
    if (signal.setupType === 'breakout') {
        return 'range break → continuation';
    }
    return 'next structural cue';
}
