import nacl from 'tweetnacl';

const KEY_BYTES = 32;
const LEGACY_IV_BYTES = 12;
const KEY_STORAGE = '__sigflo_cipher_key__';

let cacheKey: Uint8Array | null = null;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getKey(): Uint8Array {
  // The encryption key is stored in sessionStorage so it doesn't persist across
  // browser restarts. This limits the XSS exposure window: an attacker who can
  // read sessionStorage (same-origin XSS) still gets key + ciphertext, but
  // credentials are cleared when the tab/window is closed.
  //
  // Trade-off accepted: users must re-enter API keys after closing the browser.
  // Legacy: older installs stored the key in localStorage; we still read it for
  // backward compat so existing credentials aren't wiped on upgrade.
  if (cacheKey) return cacheKey;
  try {
    // Prefer sessionStorage (current scheme).
    const session = globalThis.sessionStorage?.getItem(KEY_STORAGE);
    if (session) {
      cacheKey = base64ToBytes(session);
      return cacheKey;
    }
    // Fall back to localStorage for legacy keys generated before this change.
    const legacy = globalThis.localStorage?.getItem(KEY_STORAGE);
    if (legacy) {
      cacheKey = base64ToBytes(legacy);
      // Migrate: write to sessionStorage and remove from localStorage so the
      // next restart generates a fresh session-scoped key.
      try { globalThis.sessionStorage?.setItem(KEY_STORAGE, legacy); } catch { /* quota */ }
      try { globalThis.localStorage?.removeItem(KEY_STORAGE); } catch { /* ignore */ }
      return cacheKey;
    }
  } catch {
    // Ignore storage access failures (e.g. private-browsing restrictions).
  }
  cacheKey = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  try {
    globalThis.sessionStorage?.setItem(KEY_STORAGE, bytesToBase64(cacheKey));
  } catch {
    // Best-effort persistence only.
  }
  return cacheKey;
}


function xorDecrypt(encoded: string): string | null {
  try {
    const raw = base64ToBytes(encoded);
    if (raw.length < LEGACY_IV_BYTES + 1) return null;
    const key = getKey();
    const iv = raw.slice(0, LEGACY_IV_BYTES);
    const data = raw.slice(LEGACY_IV_BYTES);
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ key[i % KEY_BYTES] ^ iv[i % LEGACY_IV_BYTES];
    }
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

function secretboxEncrypt(value: string): string {
  const nonce = crypto.getRandomValues(new Uint8Array(nacl.secretbox.nonceLength));
  const msg = new TextEncoder().encode(value);
  const key = getKey();
  const box = nacl.secretbox(msg, nonce, key);
  const payload = new Uint8Array(nonce.length + box.length);
  payload.set(nonce, 0);
  payload.set(box, nonce.length);
  return bytesToBase64(payload);
}

function secretboxDecrypt(encoded: string): string | null {
  try {
    const raw = base64ToBytes(encoded);
    const nonceLen = nacl.secretbox.nonceLength;
    if (raw.length < nonceLen + nacl.secretbox.overheadLength) return null;
    const nonce = raw.slice(0, nonceLen);
    const box = raw.slice(nonceLen);
    const msg = nacl.secretbox.open(box, nonce, getKey());
    if (!msg) return null;
    return new TextDecoder().decode(msg);
  } catch {
    return null;
  }
}

const PREFIX_V1 = 'c1:'; // legacy XOR-obfuscated entries
const PREFIX_V2 = 'c2:'; // authenticated encryption entries

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage; } catch { return null; }
}

export const secureStorage = {
  getItem(key: string): string | null {
    const store = getStorage();
    if (!store) return null;
    try {
      const raw = store.getItem(key);
      if (!raw) return null;
      if (raw.startsWith(PREFIX_V2)) return secretboxDecrypt(raw.slice(PREFIX_V2.length));
      if (raw.startsWith(PREFIX_V1)) return xorDecrypt(raw.slice(PREFIX_V1.length));
      return raw;
    } catch { return null; }
  },

  setItem(key: string, value: string): void {
    const store = getStorage();
    if (!store) return;
    try {
      const encrypted = secretboxEncrypt(value);
      store.setItem(key, PREFIX_V2 + encrypted);
    } catch {
      // Ignore quota/storage errors.
    }
  },

  removeItem(key: string): void {
    const store = getStorage();
    if (!store) return;
    try {
      store.removeItem(key);
    } catch {
      // Ignore storage errors on removal.
    }
  },
};
