"use strict";
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
exports.GuidedExecutionPanelExample = GuidedExecutionPanelExample;
var react_1 = require("react");
var GuidedExecutionPanel_1 = require("@/components/trade/GuidedExecutionPanel");
var mockSetup = {
    symbol: 'BTC/USDT',
    direction: 'long',
    statusLabel: 'In Play',
    setupScore: 72,
    setupLabel: 'Structured',
    rationale: 'Conditions aligned across trend, momentum, and structure.',
    entry: 67250.25,
    stop: 67115.75,
    target: 67680.4,
    positionSizeUsd: 1200,
    leverage: 6,
    estimatedMarginUsd: 200,
    liquidationBufferPct: 14.2,
    riskRewardRatio: 2.35,
};
function GuidedExecutionPanelExample() {
    var _this = this;
    var _a = (0, react_1.useState)(false), open = _a[0], setOpen = _a[1];
    return (<div className="min-h-screen bg-[#050505] p-6">
      <button type="button" onClick={function () { return setOpen(true); }} className="rounded-xl border border-[#00ffc8]/30 bg-[#00ffc8]/12 px-4 py-2 text-sm font-semibold text-[#bafef1]">
        Open Guided Execution
      </button>
      <GuidedExecutionPanel_1.default open={open} setup={mockSetup} onClose={function () { return setOpen(false); }} onExecute={function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return window.setTimeout(resolve, 900); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }} onViewPosition={function () {
            setOpen(false);
        }}/>
    </div>);
}
exports.default = GuidedExecutionPanelExample;
