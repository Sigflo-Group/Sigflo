"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoPositionRepository = exports.DEMO_POSITIONS_CHANGED_EVENT = void 0;
var positionRepository_1 = require("@/services/positions/positionRepository");
exports.DEMO_POSITIONS_CHANGED_EVENT = 'sigflo:demo-positions-changed';
var DemoPositionRepository = /** @class */ (function () {
    function DemoPositionRepository(rows) {
        if (rows === void 0) { rows = []; }
        this.byKey = new Map(rows.map(function (r) { return [(0, positionRepository_1.normalizePositionPairKey)(r.pair), r]; }));
    }
    DemoPositionRepository.prototype.getActivePositionByPair = function (pair) {
        var _a;
        var key = (0, positionRepository_1.normalizePositionPairKey)(pair);
        return (_a = this.byKey.get(key)) !== null && _a !== void 0 ? _a : null;
    };
    DemoPositionRepository.prototype.listActivePositions = function () {
        return __spreadArray([], this.byKey.values(), true);
    };
    DemoPositionRepository.prototype.addPosition = function (position) {
        var key = (0, positionRepository_1.normalizePositionPairKey)(position.pair);
        this.byKey.set(key, position);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(exports.DEMO_POSITIONS_CHANGED_EVENT));
        }
    };
    return DemoPositionRepository;
}());
exports.DemoPositionRepository = DemoPositionRepository;
