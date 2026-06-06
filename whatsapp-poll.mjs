import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import P from 'pino';
import { readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = resolve(__dirname, 'whatsapp-auth');
const MSGS_FILE = '/tmp/whatsapp-messages.jsonl';
const SEND_FILE = '/tmp/whatsapp-send.jsonl';
const PHONE = process.env.WHATSAPP_PHONE || '';

if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

let globalPairingRequested = false;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    logger: P({ level: 'error' }),
    browser: ['Chrome', '120', ''],
    connectTimeoutMs: 30000,
    keepAliveIntervalMs: 25000,
    markOnlineOnConnect: false,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr && PHONE && !globalPairingRequested) {
      try {
        const code = await sock.requestPairingCode(PHONE);
        const formatted = String(code).match(/.{1,4}/g)?.join('-') || code;
        writeFileSync('/tmp/whatsapp-pairing-code', String(code), 'utf-8');
        console.error('\n=== PAIRING CODE:', formatted, '===\n');
      } catch (e) {
        console.error('[PAIRING ERROR]', e?.message || e);
      }
    } else if (qr && !PHONE) {
      const { default: qrcode } = await import('qrcode-terminal');
      const { default: qrImage } = await import('qrcode');
      console.error('\n=== SCAN QR CODE ===');
      qrcode.generate(qr, { small: true });
      qrImage.toFile('/tmp/whatsapp-qr.png', qr, { width: 400 });
      console.error('====================\n');
    }
    if (connection === 'open') {
      console.error('[WHATSAPP] Connected!');
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const msg = lastDisconnect?.error?.message || lastDisconnect?.error?.output?.payload?.error || '';
      console.error('[WHATSAPP] Closed, status:', statusCode, 'msg:', msg);
      if (state.creds?.registered) {
        console.error('[WHATSAPP] Registered - restarting');
        setTimeout(startBot, 1000);
      } else {
        console.error('[WHATSAPP] Not registered - waiting 15s before retry');
        setTimeout(startBot, 15000);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message) continue;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const jid = msg.key.remoteJid;
      if (!jid?.endsWith('@s.whatsapp.net')) continue;
      try { writeFileSync(MSGS_FILE, JSON.stringify({ type:'dm', from:jid, text, ts:msg.messageTimestamp }) + '\n', { flag:'a' }); } catch {}
    }
  });

  let lastSize = 0;
  setInterval(() => {
    try {
      if (!existsSync(SEND_FILE)) return;
      const st = statSync(SEND_FILE);
      if (st.size > lastSize) {
        for (const line of readFileSync(SEND_FILE,'utf-8').split('\n').filter(Boolean)) {
          try { const { to, text } = JSON.parse(line); sock.sendMessage(to, { text }); } catch {}
        }
        lastSize = st.size;
      }
    } catch {}
  }, 1500);
}

startBot();
process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
