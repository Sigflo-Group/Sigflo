import crypto from 'node:crypto';
import { env } from '../config/env.js';

function getEncryptionKey() {
  return Buffer.from(env.CREDENTIAL_ENCRYPTION_KEY, 'hex');
}

type Encrypted = {
  iv: string;
  tag: string;
  ciphertext: string;
};

export function encryptText(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: Encrypted = {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export function decryptText(encoded: string): string {
  const key = getEncryptionKey();
  try {
    const raw = Buffer.from(encoded, 'base64').toString('utf8');
    const payload = JSON.parse(raw) as Encrypted;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'hex')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch (e) {
    throw new Error(`Credential decryption failed: ${e instanceof Error ? e.message : 'invalid format'}`);
  }
}
