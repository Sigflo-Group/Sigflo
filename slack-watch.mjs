import { readFileSync, statSync, writeFileSync } from 'fs';

const FILE = '/tmp/slack-messages.jsonl';
let lastSize = 0;

try { lastSize = statSync(FILE).size; } catch {}

setInterval(() => {
  try {
    const st = statSync(FILE);
    if (st.size > lastSize) {
      const data = readFileSync(FILE, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      const newLines = [];
      let accumulated = 0;
      for (const line of lines) {
        const lineLen = line.length + 1;
        if (accumulated + lineLen > lastSize) {
          newLines.push(line);
        }
        accumulated += lineLen;
      }
      for (const line of newLines) {
        try {
          const m = JSON.parse(line);
          if (m.type === 'dm') {
            writeFileSync('/tmp/slack-alert', m.text, 'utf-8');
          }
        } catch {}
      }
      lastSize = st.size;
    }
  } catch {}
}, 1500);
