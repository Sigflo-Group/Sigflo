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
exports.createSupabaseOpportunityRepository = createSupabaseOpportunityRepository;
var opportunityConfidenceDecay_1 = require("@/lib/opportunityConfidenceDecay");
var opportunityNormalizer_1 = require("@/services/engine/opportunityNormalizer");
var botSystem_1 = require("@/types/botSystem");
var DB_STATUS_TO_STATE = {
    watching: 'Watching',
    building: 'Building',
    ready: 'Ready',
    triggered: 'Triggered',
    managing: 'Managing',
    completed: 'Completed',
    invalidated: 'Invalidated',
    cooling_off: 'CoolingOff',
};
function mapRowToCard(row) {
    var _a, _b;
    var state = DB_STATUS_TO_STATE[row.status];
    if (!state)
        return null;
    var direction = row.direction === 'short' ? 'SHORT' : 'LONG';
    return {
        id: row.id,
        pair: row.pair,
        direction: direction,
        setupType: row.setup_type,
        score: row.score,
        state: state,
        thesis: row.thesis,
        rationale: row.rationale,
        entryStatus: (0, opportunityNormalizer_1.entryStatusFromOpportunityState)(state),
        entryZone: (_a = row.entry_zone) !== null && _a !== void 0 ? _a : undefined,
        invalidation: (_b = row.invalidation) !== null && _b !== void 0 ? _b : undefined,
        targets: Array.isArray(row.targets) ? row.targets : [],
        timeframeAlignment: Array.isArray(row.timeframe_alignment) ? row.timeframe_alignment : [],
        freshnessSec: Number.isFinite(row.freshness_sec) ? row.freshness_sec : 0,
    };
}
function createSupabaseOpportunityRepository(client) {
    return {
        source: 'supabase',
        listOpportunities: function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, message, rows, cards, _i, rows_1, raw, card, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, client.from('opportunities').select('*')];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error) {
                                message = error.message || 'Unknown Supabase error';
                                console.warn('[opportunities] list failed:', message);
                                throw new Error("Supabase opportunities query failed: ".concat(message));
                            }
                            rows = (data !== null && data !== void 0 ? data : []);
                            cards = [];
                            for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                                raw = rows_1[_i];
                                card = mapRowToCard(raw);
                                if (card)
                                    cards.push((0, opportunityConfidenceDecay_1.applyOpportunityConfidenceDecay)(card));
                            }
                            return [2 /*return*/, (0, botSystem_1.sortOpportunities)(cards)];
                        case 2:
                            e_1 = _b.sent();
                            console.warn('[opportunities] list error:', e_1);
                            if (e_1 instanceof Error)
                                throw e_1;
                            throw new Error('Supabase opportunities query failed.');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        },
        getOpportunityById: function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var key, _a, data, error, card, e_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            key = id.trim();
                            if (!key)
                                return [2 /*return*/, undefined];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, client.from('opportunities').select('*').eq('id', key).maybeSingle()];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error) {
                                console.warn('[opportunities] get failed:', error.message);
                                return [2 /*return*/, undefined];
                            }
                            if (!data)
                                return [2 /*return*/, undefined];
                            card = mapRowToCard(data);
                            return [2 /*return*/, card ? (0, opportunityConfidenceDecay_1.applyOpportunityConfidenceDecay)(card) : undefined];
                        case 3:
                            e_2 = _b.sent();
                            console.warn('[opportunities] get error:', e_2);
                            return [2 /*return*/, undefined];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        },
    };
}
