"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatedFromSigfloActive = exports.sigfloActiveToStripPosition = exports.sigfloActivePositionFromExchange = exports.DemoPositionRepository = exports.normalizePositionPairKey = void 0;
exports.getPositionRepository = getPositionRepository;
var demoPositionRepository_1 = require("@/services/positions/demoPositionRepository");
var singleton = null;
function getPositionRepository() {
    if (!singleton)
        singleton = new demoPositionRepository_1.DemoPositionRepository();
    return singleton;
}
var positionRepository_1 = require("@/services/positions/positionRepository");
Object.defineProperty(exports, "normalizePositionPairKey", { enumerable: true, get: function () { return positionRepository_1.normalizePositionPairKey; } });
var demoPositionRepository_2 = require("@/services/positions/demoPositionRepository");
Object.defineProperty(exports, "DemoPositionRepository", { enumerable: true, get: function () { return demoPositionRepository_2.DemoPositionRepository; } });
var mappers_1 = require("@/services/positions/mappers");
Object.defineProperty(exports, "sigfloActivePositionFromExchange", { enumerable: true, get: function () { return mappers_1.sigfloActivePositionFromExchange; } });
Object.defineProperty(exports, "sigfloActiveToStripPosition", { enumerable: true, get: function () { return mappers_1.sigfloActiveToStripPosition; } });
Object.defineProperty(exports, "simulatedFromSigfloActive", { enumerable: true, get: function () { return mappers_1.simulatedFromSigfloActive; } });
