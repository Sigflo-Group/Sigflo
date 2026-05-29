const KEY_BYTES = 32;
const IV_BYTES = 12;
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
  if (cacheKey) return cacheKey;
  try {
    const stored = sessionStorage.getItem(KEY_STORAGE);
    if (stored) {
      cacheKey = base64ToBytes(stored);
      return cacheKey;
    }
  } catch {}
  cacheKey = crypto.getRandomValues(new Uint8Array(KEY_BYTES));
  try {
    sessionStorage.setItem(KEY_STORAGE, bytesToBase64(cacheKey));
  } catch {}
  return cacheKey;
}

function xorEncrypt(value: string): string {
  const key = getKey();
  const data = new TextEncoder().encode(value);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const out = new Uint8Array(IV_BYTES + data.length);
  out.set(iv, 0);
  for (let i = 0; i < data.length; i++) {
    out[IV_BYTES + i] = data[i] ^ key[i % KEY_BYTES] ^ iv[i % IV_BYTES];
  }
  return bytesToBase64(out);
}

function xorDecrypt(encoded: string): string | null {
  try {
    const raw = base64ToBytes(encoded);
    if (raw.length < IV_BYTES + 1) return null;
    const key = getKey();
    const iv = raw.slice(0, IV_BYTES);
    const data = raw.slice(IV_BYTES);
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ key[i % KEY_BYTES] ^ iv[i % IV_BYTES];
    }
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

const PREFIX = 'c1:';

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
      if (raw.startsWith(PREFIX)) return xorDecrypt(raw.slice(PREFIX.length));
      return raw;
    } catch { return null; }
  },

  setItem(key: string, value: string): void {
    const store = getStorage();
    if (!store) return;
    try {
      const encrypted = xorEncrypt(value);
      store.setItem(key, PREFIX + encrypted);
    } catch {}
  },

  removeItem(key: string): void {
    const store = getStorage();
    if (!store) return;
    try { store.removeItem(key); } catch {}
  },
};
