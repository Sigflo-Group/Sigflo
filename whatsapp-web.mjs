import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { writeFileSync, existsSync, readFileSync, statSync } from 'fs';
import qrcode from 'qrcode-terminal';

const MSGS_FILE = '/tmp/whatsapp-messages.jsonl';
const SEND_FILE = '/tmp/whatsapp-send.jsonl';

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'sigflo-bridge' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.error('\n=== SCAN THIS QR CODE ===');
  qrcode.generate(qr, { small: true });
  console.error('==========================\n');
  import('qrcode').then(qrImg => { qrImg.toFile('/tmp/whatsapp-qr.png', qr, { width: 400 }); });
});

client.on('ready', () => {
  console.error('[WHATSAPP] Client is ready!');
});

client.on('authenticated', () => {
  console.error('[WHATSAPP] Authenticated!');
});

client.on('auth_failure', (msg) => {
  console.error('[WHATSAPP] Auth failure:', msg);
});

client.on('disconnected', (reason) => {
  console.error('[WHATSAPP] Disconnected:', reason);
});

client.on('message', async (msg) => {
  if (msg.fromMe) return;
  const text = msg.body;
  const from = msg.from;
  console.error('[WHATSAPP DM]', from, ':', text);
  try {
    writeFileSync(MSGS_FILE, JSON.stringify({ type:'dm', from, text, ts: Date.now()/1000 }) + '\n', { flag:'a' });
  } catch {}
});

// Poll outgoing send file
let lastSize = 0;
setInterval(() => {
  try {
    if (!existsSync(SEND_FILE)) return;
    const st = statSync(SEND_FILE);
    if (st.size > lastSize) {
      for (const line of readFileSync(SEND_FILE,'utf-8').split('\n').filter(Boolean)) {
        try {
          const { to, text } = JSON.parse(line);
          client.sendMessage(to, text);
          console.error('[WHATSAPP SEND]', to, ':', text);
        } catch {}
      }
      lastSize = st.size;
    }
  } catch {}
}, 1500);

client.initialize();

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
