import { WebClient } from '@slack/web-api';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';

const FILE = '/tmp/slack-messages.jsonl';
const TS_FILE = '/tmp/slack-last-ts.txt';
const channel = process.env.SLACK_DM_CHANNEL?.trim();
const token = process.env.SLACK_BOT_TOKEN?.trim();

if (!token || !channel) {
  console.error('Set SLACK_BOT_TOKEN and SLACK_DM_CHANNEL before starting slack-bridge.mjs');
  process.exit(1);
}

const web = new WebClient(token);

let lastTs = '';
try { lastTs = readFileSync(TS_FILE, 'utf-8').trim(); } catch {}

const poll = async () => {
  try {
    const res = await web.conversations.history({ channel, oldest: lastTs || undefined, limit: 10 });
    if (res.messages?.length) {
      for (const m of res.messages.toReversed()) {
        if (m.subtype === 'bot_message' || m.bot_id) continue;
        if (m.ts <= lastTs) continue;
        appendFileSync(FILE, JSON.stringify({ type: 'dm', user: m.user, text: m.text, channel, ts: m.ts }) + '\n');
        lastTs = m.ts;
        writeFileSync(TS_FILE, lastTs);
      }
    }
  } catch {}
};

setInterval(poll, 2000);
console.error('Polling bridge started');
