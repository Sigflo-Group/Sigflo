// Self-signed dev TLS cert (opt-in via SIGFLO_DEV_HTTPS=true), for the same reason Umbra's
// tls_cert.py exists: serving the Vite dev server over HTTPS on your LAN IP (not just
// localhost) so you can open Sigflo from your phone on the same WiFi. Browsers only allow
// some APIs (camera/mic, etc.) on a "secure context" — HTTPS, or localhost over plain HTTP —
// so a phone hitting the dev machine's LAN IP needs HTTPS even in dev.
//
// The first visit from any device shows a "connection not private" warning — expected for a
// self-signed cert with no public Certificate Authority behind it. Tap Advanced -> Proceed
// (or "visit this website" on iOS Safari). Safe here: it's your own dev server, on your own
// network.
//
// Cached under .cert/ (gitignored) and regenerated automatically if missing, expired, or
// covering a different LAN IP (e.g. you switched WiFi networks since it was last generated).

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import selfsigned from 'selfsigned';

const CERT_DIR = path.join(process.cwd(), '.cert');
const CERT_PATH = path.join(CERT_DIR, 'dev-cert.pem');
const KEY_PATH = path.join(CERT_DIR, 'dev-key.pem');

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function certCoversIp(certPem, ip) {
  let cert;
  try {
    cert = new crypto.X509Certificate(certPem);
  } catch {
    return false;
  }
  if (new Date(cert.validTo).getTime() <= Date.now()) return false;
  const altNames = cert.subjectAltName ?? '';
  return altNames.includes(`IP Address:${ip}`);
}

/** Returns `{ cert, key }` PEM strings suitable for Vite's `server.https`, generating (and
 * caching) a self-signed cert covering localhost, 127.0.0.1, and the current LAN IP. */
export function ensureDevHttpsOptions() {
  const ip = getLanIp();

  if (fs.existsSync(CERT_PATH) && fs.existsSync(KEY_PATH)) {
    const existingCert = fs.readFileSync(CERT_PATH, 'utf8');
    if (certCoversIp(existingCert, ip)) {
      return { cert: existingCert, key: fs.readFileSync(KEY_PATH, 'utf8') };
    }
  }

  const pems = selfsigned.generate([{ name: 'commonName', value: 'sigflo.local' }], {
    days: 825, // browsers cap trusted validity around here
    keySize: 2048,
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' }, // DNS
          { type: 7, ip: '127.0.0.1' }, // IP
          { type: 7, ip },
        ],
      },
    ],
  });

  fs.mkdirSync(CERT_DIR, { recursive: true });
  fs.writeFileSync(CERT_PATH, pems.cert);
  fs.writeFileSync(KEY_PATH, pems.private);

  return { cert: pems.cert, key: pems.private };
}
