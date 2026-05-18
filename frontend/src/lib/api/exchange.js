"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExchangeStatus = getExchangeStatus;
exports.linkExchangeAccount = linkExchangeAccount;
exports.revalidateExchangeAccount = revalidateExchangeAccount;
var client_1 = require("@/lib/api/client");
function getExchangeStatus() {
    return (0, client_1.apiFetch)('/exchange/status');
}
function linkExchangeAccount(body) {
    return (0, client_1.apiFetch)('/exchange/link', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}
function revalidateExchangeAccount(accountId) {
    return (0, client_1.apiFetch)('/exchange/revalidate', {
        method: 'POST',
        body: JSON.stringify({ accountId: accountId }),
    });
}
