"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playSideEntryClickSound = playSideEntryClickSound;
exports.playTapSound = playTapSound;
exports.playSetupReadySound = playSetupReadySound;
exports.playAlertSound = playAlertSound;
exports.playSetupReadyAlertSound = playSetupReadyAlertSound;
exports.playUiTapSound = playUiTapSound;
var alertPreferences_1 = require("@/services/alerts/alertPreferences");
var audioCtx = null;
/** Primary `ui-tap`; fallback keeps existing deploys if only `ui-button-tap` is present. */
var UI_TAP_PATHS = ['/sounds/ui-tap.wav', '/sounds/ui-button-tap.wav'];
var BUTTON_TAP_VOLUME = 0.2;
/** Short / Long (or Sell / Buy) instant entry buttons — subtle click MP3. */
var SIDE_ENTRY_MP3 = '/sounds/ui-side-entry.mp3';
var SIDE_ENTRY_VOLUME = 0.26;
var SETUP_READY_WAV = '/sounds/setup-ready.wav';
var ALERT_WAV = '/sounds/alert.wav';
var TAP_MIN_INTERVAL_MS = 160;
var SIDE_ENTRY_MIN_INTERVAL_MS = 140;
var SIGNIFICANT_MIN_INTERVAL_MS = 2000;
var lastTapAt = 0;
var lastSideEntryClickAt = 0;
var lastSignificantAt = 0;
var activeSignificantAudio = null;
var stopGeneratedSignificant = null;
var setupReadyWavOk = { v: null };
var alertWavOk = { v: null };
function shouldSkipForMotion() {
    if (typeof window === 'undefined')
        return true;
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    catch (_a) {
        return false;
    }
}
function canPlayTap() {
    if (typeof window === 'undefined')
        return false;
    if (shouldSkipForMotion())
        return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
        return false;
    var t = Date.now();
    if (t - lastTapAt < TAP_MIN_INTERVAL_MS)
        return false;
    lastTapAt = t;
    return true;
}
function canPlaySideEntryClick() {
    if (typeof window === 'undefined')
        return false;
    if (shouldSkipForMotion())
        return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
        return false;
    var t = Date.now();
    if (t - lastSideEntryClickAt < SIDE_ENTRY_MIN_INTERVAL_MS)
        return false;
    lastSideEntryClickAt = t;
    return true;
}
function canPlaySignificantNow() {
    if (typeof window === 'undefined')
        return false;
    if (shouldSkipForMotion())
        return false;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
        return false;
    var t = Date.now();
    if (t - lastSignificantAt < SIGNIFICANT_MIN_INTERVAL_MS)
        return false;
    return true;
}
function beginSignificantPlayback() {
    lastSignificantAt = Date.now();
    silenceSignificantOutputs();
}
function silenceSignificantOutputs() {
    if (activeSignificantAudio) {
        try {
            activeSignificantAudio.pause();
            activeSignificantAudio.currentTime = 0;
        }
        catch (_a) {
            /* ignore */
        }
        activeSignificantAudio = null;
    }
    if (stopGeneratedSignificant) {
        try {
            stopGeneratedSignificant();
        }
        catch (_b) {
            /* ignore */
        }
        stopGeneratedSignificant = null;
    }
}
function getCtx() {
    if (typeof window === 'undefined')
        return null;
    if (!audioCtx) {
        try {
            var Ctor = window.AudioContext || window.webkitAudioContext;
            if (!Ctor)
                return null;
            audioCtx = new Ctor();
        }
        catch (_a) {
            return null;
        }
    }
    return audioCtx;
}
function playSetupReadyGenerated() {
    var ctx = getCtx();
    if (!ctx)
        return;
    void ctx.resume().catch(function () { });
    var now = ctx.currentTime;
    try {
        var gOut_1 = ctx.createGain();
        gOut_1.gain.setValueAtTime(0.0001, now);
        gOut_1.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
        gOut_1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        gOut_1.connect(ctx.destination);
        var playTone = function (freq, t0, dur) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.018);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(g);
            g.connect(gOut_1);
            osc.start(t0);
            osc.stop(t0 + dur + 0.02);
        };
        playTone(587.33, now, 0.1);
        playTone(783.99, now + 0.11, 0.12);
        var stopAt = now + 0.38;
        stopGeneratedSignificant = function () {
            try {
                gOut_1.disconnect();
            }
            catch (_a) {
                /* ignore */
            }
        };
        window.setTimeout(function () {
            if (stopGeneratedSignificant) {
                stopGeneratedSignificant();
                stopGeneratedSignificant = null;
            }
        }, Math.ceil((stopAt - now) * 1000) + 40);
    }
    catch (_a) {
        /* ignore */
    }
}
function playAlertGenerated() {
    var ctx = getCtx();
    if (!ctx)
        return;
    void ctx.resume().catch(function () { });
    var now = ctx.currentTime;
    try {
        var gOut_2 = ctx.createGain();
        gOut_2.gain.setValueAtTime(0.0001, now);
        gOut_2.gain.exponentialRampToValueAtTime(0.085, now + 0.05);
        gOut_2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
        gOut_2.connect(ctx.destination);
        var mk = function (freq, detune, peak, t0, dur) {
            var osc = ctx.createOscillator();
            var g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            osc.detune.setValueAtTime(detune, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(peak, t0 + 0.035);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(g);
            g.connect(gOut_2);
            osc.start(t0);
            osc.stop(t0 + dur + 0.03);
        };
        mk(392, 0, 0.11, now, 0.16);
        mk(523.25, 3, 0.08, now + 0.08, 0.18);
        var stopAt = now + 0.4;
        stopGeneratedSignificant = function () {
            try {
                gOut_2.disconnect();
            }
            catch (_a) {
                /* ignore */
            }
        };
        window.setTimeout(function () {
            if (stopGeneratedSignificant) {
                stopGeneratedSignificant();
                stopGeneratedSignificant = null;
            }
        }, Math.ceil((stopAt - now) * 1000) + 50);
    }
    catch (_a) {
        /* ignore */
    }
}
function tryPlaySignificantWav(path, volume, cache, onGenerated) {
    if (cache.v === false) {
        onGenerated();
        return;
    }
    var a = new Audio(path);
    a.volume = volume;
    var clearRef = function () {
        if (activeSignificantAudio === a)
            activeSignificantAudio = null;
    };
    a.addEventListener('ended', clearRef, { once: true });
    activeSignificantAudio = a;
    void a
        .play()
        .then(function () {
        cache.v = true;
    })
        .catch(function () {
        cache.v = false;
        clearRef();
        onGenerated();
    });
}
/**
 * UI tap — custom WAV (`/sounds/ui-tap.wav`, then `/sounds/ui-button-tap.wav`).
 * Throttled separately from setup/alert; no alert-channel gate (use `playUiTapSound` for that).
 */
/**
 * Short/Long (or Sell/Buy) entry buttons. Uses `/sounds/ui-side-entry.mp3`.
 * Same `sound` channel preference as `playUiTapSound`; separate throttle from generic taps.
 */
function playSideEntryClickSound() {
    if (!(0, alertPreferences_1.getAlertPreferences)().channels.includes('sound'))
        return;
    if (!canPlaySideEntryClick())
        return;
    try {
        var audio = new Audio(SIDE_ENTRY_MP3);
        audio.volume = Math.min(1, Math.max(0, SIDE_ENTRY_VOLUME));
        void audio.play().catch(function () { });
    }
    catch (_a) {
        /* ignore */
    }
}
function playTapSound() {
    if (!canPlayTap())
        return;
    var tryPath = function (i) {
        if (i >= UI_TAP_PATHS.length)
            return;
        try {
            var audio = new Audio(UI_TAP_PATHS[i]);
            audio.volume = Math.min(1, Math.max(0, BUTTON_TAP_VOLUME));
            void audio.play().catch(function () { return tryPath(i + 1); });
        }
        catch (_a) {
            tryPath(i + 1);
        }
    };
    tryPath(0);
}
/**
 * Setup became Ready. Uses `/sounds/setup-ready.wav` when available, else a soft generated chime.
 * Only when `alertPreferences.channels` includes `sound`. Shares a 2s throttle with `playAlertSound`.
 */
function playSetupReadySound() {
    if (!(0, alertPreferences_1.getAlertPreferences)().channels.includes('sound'))
        return;
    if (!canPlaySignificantNow())
        return;
    beginSignificantPlayback();
    tryPlaySignificantWav(SETUP_READY_WAV, 0.3, setupReadyWavOk, function () {
        silenceSignificantOutputs();
        playSetupReadyGenerated();
    });
}
/**
 * Triggered setup, Ready with score ≥ 80, risk warning, position management warning.
 * Uses `/sounds/alert.wav` when available, else a stronger (still rounded) generated chime.
 */
function playAlertSound() {
    if (!(0, alertPreferences_1.getAlertPreferences)().channels.includes('sound'))
        return;
    if (!canPlaySignificantNow())
        return;
    beginSignificantPlayback();
    tryPlaySignificantWav(ALERT_WAV, 0.34, alertWavOk, function () {
        silenceSignificantOutputs();
        playAlertGenerated();
    });
}
/** @deprecated Prefer `playSetupReadySound()`. */
function playSetupReadyAlertSound() {
    playSetupReadySound();
}
/** UI tap when the alert Sound channel is enabled (existing behavior). */
function playUiTapSound() {
    if (!(0, alertPreferences_1.getAlertPreferences)().channels.includes('sound'))
        return;
    playTapSound();
}
