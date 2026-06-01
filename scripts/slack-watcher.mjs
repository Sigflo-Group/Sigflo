import { readFileSync, statSync } from 'fs';

const FILE = '/tmp/slack-messages.jsonl';
let lastSize = 0;

try { lastSize = statSync(FILE).size; } catch {}

setInterval(() => {
  try {
    const st = statSync(FILE);
    if (st.size > lastSize) {
      const content = readFileSync(FILE, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          console.log(`\n[SLACK ${msg.type}] from <${msg.user}> in ${msg.channel}: ${msg.text}`);
        } catch {}
      }
      lastSize = st.size;
    }
  } catch {}
}, 2000);
