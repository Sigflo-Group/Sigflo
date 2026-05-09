import { getAlertPreferences } from '@/services/alerts/alertPreferences';

let audioCtx: AudioContext | null = null;

/** Primary `ui-tap`; fallback keeps existing deploys if only `ui-button-tap` is present. */
const UI_TAP_PATHS = ['/sounds/ui-tap.wav', '/sounds/ui-button-tap.wav'] as const;
const UI_TAP_FALLBACK_WAV = '/sounds/ui-button-tap.wav';
const BUTTON_TAP_VOLUME = 0.2;

/** Short / Long (or Sell / Buy) instant entry buttons — subtle click MP3. */
const SIDE_ENTRY_MP3 = '/sounds/ui-side-entry.mp3';
const SIDE_ENTRY_VOLUME = 0.26;

const SETUP_READY_WAV = '/sounds/setup-ready.wav';

const TAP_MIN_INTERVAL_MS = 160;
const SIDE_ENTRY_MIN_INTERVAL_MS = 140;
const SIGNIFICANT_MIN_INTERVAL_MS = 2000;

let lastTapAt = 0;
let lastSideEntryClickAt = 0;
let lastSignificantAt = 0;

let activeSignificantAudio: HTMLAudioElement | null = null;
let stopGeneratedSignificant: (() => void) | null = null;

const setupReadyWavOk: { v: boolean | null } = { v: null };

function shouldSkipForMotion(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function canPlayTap(): boolean {
  if (typeof window === 'undefined') return false;
  if (shouldSkipForMotion()) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  const t = Date.now();
  if (t - lastTapAt < TAP_MIN_INTERVAL_MS) return false;
  lastTapAt = t;
  return true;
}

function canPlaySideEntryClick(): boolean {
  if (typeof window === 'undefined') return false;
  if (shouldSkipForMotion()) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  const t = Date.now();
  if (t - lastSideEntryClickAt < SIDE_ENTRY_MIN_INTERVAL_MS) return false;
  lastSideEntryClickAt = t;
  return true;
}

function canPlaySignificantNow(): boolean {
  if (typeof window === 'undefined') return false;
  if (shouldSkipForMotion()) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
  const t = Date.now();
  if (t - lastSignificantAt < SIGNIFICANT_MIN_INTERVAL_MS) return false;
  return true;
}

function beginSignificantPlayback(): void {
  lastSignificantAt = Date.now();
  silenceSignificantOutputs();
}

function silenceSignificantOutputs(): void {
  if (activeSignificantAudio) {
    try {
      activeSignificantAudio.pause();
      activeSignificantAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    activeSignificantAudio = null;
  }
  if (stopGeneratedSignificant) {
    try {
      stopGeneratedSignificant();
    } catch {
      /* ignore */
    }
    stopGeneratedSignificant = null;
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playSetupReadyGenerated(): void {
  const ctx = getCtx();
  if (!ctx) return;
  void ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  try {
    const gOut = ctx.createGain();
    gOut.gain.setValueAtTime(0.0001, now);
    gOut.gain.exponentialRampToValueAtTime(0.07, now + 0.04);
    gOut.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    gOut.connect(ctx.destination);

    const playTone = (freq: number, t0: number, dur: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(gOut);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };

    playTone(587.33, now, 0.1);
    playTone(783.99, now + 0.11, 0.12);

    const stopAt = now + 0.38;
    stopGeneratedSignificant = () => {
      try {
        gOut.disconnect();
      } catch {
        /* ignore */
      }
    };
    window.setTimeout(() => {
      if (stopGeneratedSignificant) {
        stopGeneratedSignificant();
        stopGeneratedSignificant = null;
      }
    }, Math.ceil((stopAt - now) * 1000) + 40);
  } catch {
    /* ignore */
  }
}

function tryPlaySignificantWav(
  path: string,
  volume: number,
  cache: { v: boolean | null },
  onGenerated: () => void,
): void {
  if (cache.v === false) {
    onGenerated();
    return;
  }
  const a = new Audio(path);
  a.volume = volume;
  const clearRef = () => {
    if (activeSignificantAudio === a) activeSignificantAudio = null;
  };
  a.addEventListener('ended', clearRef, { once: true });
  activeSignificantAudio = a;
  void a
    .play()
    .then(() => {
      cache.v = true;
    })
    .catch(() => {
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
export function playSideEntryClickSound(): void {
  if (!getAlertPreferences().channels.includes('sound')) return;
  if (!canPlaySideEntryClick()) return;
  try {
    const audio = new Audio(SIDE_ENTRY_MP3);
    audio.volume = Math.min(1, Math.max(0, SIDE_ENTRY_VOLUME));
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function playTapSound(): void {
  if (!canPlayTap()) return;
  const tryPath = (i: number) => {
    if (i >= UI_TAP_PATHS.length) return;
    try {
      const audio = new Audio(UI_TAP_PATHS[i]!);
      audio.volume = Math.min(1, Math.max(0, BUTTON_TAP_VOLUME));
      void audio.play().catch(() => tryPath(i + 1));
    } catch {
      tryPath(i + 1);
    }
  };
  tryPath(0);
}

/**
 * Setup became Ready. Uses `/sounds/setup-ready.wav` when available, else a soft generated chime.
 * Only when `alertPreferences.channels` includes `sound`. Shares a 2s throttle with `playAlertSound`.
 */
export function playSetupReadySound(): void {
  if (!getAlertPreferences().channels.includes('sound')) return;
  if (!canPlaySignificantNow()) return;
  beginSignificantPlayback();
  tryPlaySignificantWav(SETUP_READY_WAV, 0.3, setupReadyWavOk, () => {
    silenceSignificantOutputs();
    playSetupReadyGenerated();
  });
}

/**
 * Triggered setup, Ready with score ≥ 80, risk warning, position management warning.
 * Uses `/sounds/alert.wav` when available, else a stronger (still rounded) generated chime.
 */
export function playAlertSound(): void {
  if (!getAlertPreferences().channels.includes('sound')) return;
  if (!canPlaySignificantNow()) return;
  lastSignificantAt = Date.now();
  try {
    const audio = new Audio(UI_TAP_FALLBACK_WAV);
    audio.volume = 0.34;
    activeSignificantAudio = audio;
    void audio.play().finally(() => {
      if (activeSignificantAudio === audio) activeSignificantAudio = null;
    });
  } catch {
    playUiTapSound();
  }
}

/** @deprecated Prefer `playSetupReadySound()`. */
export function playSetupReadyAlertSound(): void {
  playSetupReadySound();
}

/** UI tap when the alert Sound channel is enabled (existing behavior). */
export function playUiTapSound(): void {
  if (!getAlertPreferences().channels.includes('sound')) return;
  playTapSound();
}
