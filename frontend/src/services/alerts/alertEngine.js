"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOpportunitiesForAlerts = processOpportunitiesForAlerts;
function isReadyOrTriggered(state) {
    return state === 'Ready' || state === 'Triggered';
}
function prefsIncludesState(state, prefs) {
    return prefs.states.includes(state);
}
/** True when this row counts as alert-worthy under prefs (Ready/Triggered, score, enabled). */
function qualifiesForSetupAlert(opp, prefs) {
    if (!prefs.enabled)
        return false;
    if (!isReadyOrTriggered(opp.state))
        return false;
    if (!prefsIncludesState(opp.state, prefs))
        return false;
    if (opp.score < prefs.minScore)
        return false;
    return true;
}
/**
 * Diff two opportunity snapshots and emit discrete alert events for UX (highlight + optional sound).
 * Does not dedupe across time — caller should avoid calling on initial hydration with empty `prev`.
 */
function processOpportunitiesForAlerts(prev, next, preferences) {
    if (!preferences.enabled)
        return [];
    var prevById = new Map(prev.map(function (o) { return [o.id, o]; }));
    var out = [];
    var seen = new Set();
    for (var _i = 0, next_1 = next; _i < next_1.length; _i++) {
        var n = next_1[_i];
        if (!isReadyOrTriggered(n.state))
            continue;
        if (!prefsIncludesState(n.state, preferences))
            continue;
        if (n.score < preferences.minScore)
            continue;
        var p = prevById.get(n.id);
        var fire = false;
        if (!p) {
            fire = true;
        }
        else {
            var prevQualifies = qualifiesForSetupAlert(p, preferences);
            if (!prevQualifies) {
                fire = true;
            }
            else if (p.state === 'Building' && n.state === 'Ready') {
                fire = true;
            }
            else if (p.state === 'Watching' && n.state === 'Ready') {
                fire = true;
            }
            else if (p.state === 'Ready' && n.state === 'Triggered') {
                fire = true;
            }
            else if (isReadyOrTriggered(p.state) &&
                p.score < preferences.minScore &&
                n.score >= preferences.minScore) {
                fire = true;
            }
        }
        if (fire && !seen.has(n.id)) {
            seen.add(n.id);
            out.push({ id: n.id, pair: n.pair, state: n.state, score: n.score });
        }
    }
    return out;
}
