"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTradeIntent = createTradeIntent;
exports.executeTrade = executeTrade;
exports.getTradeById = getTradeById;
exports.listTrades = listTrades;
var client_1 = require("@/lib/api/client");
function createTradeIntent(body) {
    return (0, client_1.apiFetch)('/trade/intent', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
function executeTrade(body) {
    return (0, client_1.apiFetch)('/trade/execute', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
function getTradeById(id) {
    return (0, client_1.apiFetch)("/trade/".concat(encodeURIComponent(id)));
}
function listTrades(cursor) {
    var q = cursor ? "?cursor=".concat(encodeURIComponent(cursor)) : '';
    return (0, client_1.apiFetch)("/trades".concat(q));
}
