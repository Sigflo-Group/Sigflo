import { readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY;
const API_BASE = 'https://opencode.ai/zen/v1';
const MODEL = 'big-pickle';
const MSGS_FILE = '/tmp/slack-messages.jsonl';
const PROCESSED_FILE = '/tmp/slack-processed.json';
const DM_CHANNEL = 'REDACTED';
const MODEL = 'gpt-4o-mini';

if (!SLACK_BOT_TOKEN || !OPENAI_API_KEY) {
  console.error('Missing SLACK_BOT_TOKEN or OPENAI_API_KEY');
  process.exit(1);
}

const SYSTEM_PROMPT = `You are a helpful AI assistant in a Slack DM conversation. Be concise and helpful. You're replying to a user who DMs you directly.`;

function getProcessed() {
  try {
    return JSON.parse(readFileSync(PROCESSED_FILE, 'utf-8'));
  } catch {
    return { lastTs: 0 };
  }
}

function saveProcessed(data) {
  writeFileSync(PROCESSED_FILE, JSON.stringify(data), 'utf-8');
}

async function getNewMessages(lastTs) {
  if (!existsSync(MSGS_FILE)) return [];
  const data = readFileSync(MSGS_FILE, 'utf-8');
  return data
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(m => m && m.type === 'dm' && parseFloat(m.ts) > lastTs);
}

async function replyInSlack(text) {
  try {
    const payload = JSON.stringify({
      channel: DM_CHANNEL,
      text: text,
    });
    execSync(
      `curl -s -X POST https://slack.com/api/chat.postMessage -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`,
      { encoding: 'utf-8', timeout: 10000 }
    );
  } catch (e) {
    console.error('[SLACK REPLY ERROR]', e.message);
  }
}

async function chatWithOpenAI(userMessage) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    console.error('[OPENAI ERROR]', JSON.stringify(data));
    return "Sorry, I couldn't process that right now.";
  } catch (e) {
    console.error('[OPENAI ERROR]', e.message);
    return "Sorry, something went wrong.";
  }
}

async function processMessages() {
  const processed = getProcessed();
  const messages = await getNewMessages(processed.lastTs);

  for (const msg of messages) {
    console.error('[NEW DM]', msg.from, ':', msg.text);
    const reply = await chatWithOpenAI(msg.text);
    console.error('[REPLY]', reply.slice(0, 80));
    await replyInSlack(reply);
    processed.lastTs = parseFloat(msg.ts);
    saveProcessed(processed);
  }
}

// Poll every 2 seconds
setInterval(processMessages, 2000);
console.error('[SLACK BOT] Auto-reply bot started');
