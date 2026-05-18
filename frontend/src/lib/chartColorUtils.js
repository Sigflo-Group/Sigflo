"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexToRgba = hexToRgba;
/** Apply alpha to a 6-digit hex color for lightweight-charts price lines. */
function hexToRgba(hex, alpha) {
    var x = hex.replace('#', '').trim();
    if (x.length !== 6)
        return hex;
    var r = Number.parseInt(x.slice(0, 2), 16);
    var g = Number.parseInt(x.slice(2, 4), 16);
    var b = Number.parseInt(x.slice(4, 6), 16);
    var a = Math.max(0, Math.min(1, alpha));
    return "rgba(".concat(r, ",").concat(g, ",").concat(b, ",").concat(a, ")");
}
