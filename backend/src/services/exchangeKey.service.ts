import { decryptText, encryptText } from '../security/crypto.js';

export function encryptBrokerCredential(plain: string): string {
  return encryptText(plain);
}

export function decryptBrokerCredential(cipherText: string): string {
  return decryptText(cipherText);
}

export function maskBrokerSecret(value: string): string {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 3)}****${value.slice(-3)}`;
}
