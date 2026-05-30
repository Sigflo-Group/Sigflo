import { WebClient } from '@slack/web-api';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';

const FILE = '/tmp/slack-messages.jsonl';
const TS_FILE = '/tmp/slack-last-ts.txt';
const channel = 'D0B74AVRYUU';
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

writeFileSync(FILE, '');
let lastTs = '';
try { lastTs = readFileSync(TS_FILE, 'utf-8').trim(); } catch {}

const poll = async () => {
  try {
    const res = await web.conversations.history({ channel, oldest: lastTs || undefined, limit: 5 });
    if (res.messages?.length) {
      const msgs = [...res.messages].reverse();
      for (const m of msgs) {
        if (m.subtype === 'bot_message' || m.bot_id) continue;
        if (m.ts <= lastTs) continue;
        appendFileSync(FILE, JSON.stringify({ type: 'dm', user: m.user, text: m.text, channel, ts: m.ts }) + '\n');
        lastTs = m.ts;
        writeFileSync(TS_FILE, lastTs);
        web.chat.postMessage({ channel, text: 'Got it!' }).catch(() => {});
      }
    }
  } catch (e) {}
};

setInterval(poll, 2000);
console.error('bridge ready');
