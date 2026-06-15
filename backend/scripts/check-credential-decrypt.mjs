import 'dotenv/config';
import { Pool } from 'pg';
import { createDecipheriv } from 'node:crypto';

function decryptText(encoded) {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY missing or invalid');
  }
  const key = Buffer.from(raw, 'hex');
  const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY ?? '';
  console.log('key fingerprint:', `${key.slice(0, 8)}…${key.slice(-8)} (${key.length} chars)`);
  const { rows } = await pool.query(
    'select id, broker, user_id, api_key_encrypted from broker_accounts order by updated_at desc',
  );
  for (const r of rows) {
    try {
      const plain = decryptText(r.api_key_encrypted);
      console.log('OK', r.broker, r.id.slice(0, 8), `plaintext_len=${plain.length}`);
    } catch (e) {
      console.log('FAIL', r.broker, r.id.slice(0, 8), e instanceof Error ? e.message : String(e));
    }
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
