import { readFileSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const FILE = '/tmp/whatsapp-qr.png';
let lastUrl = '';

setInterval(() => {
  try {
    if (!existsSync(FILE)) return;
    const result = execSync(
      `curl -s -F "file=@${FILE}" https://tmpfiles.org/api/v1/upload`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const data = JSON.parse(result);
    if (data.status === 'success' && data.data.url !== lastUrl) {
      lastUrl = data.data.url;
      console.error('[QR URL]', data.data.url);
    }
  } catch {}
}, 8000);
