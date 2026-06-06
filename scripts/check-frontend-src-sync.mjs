import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'src');
const mirrorDir = path.join(repoRoot, 'frontend', 'src');

function walkFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files.sort();
}

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

if (!exists(sourceDir) || !exists(mirrorDir)) {
  console.error('Missing src/ or frontend/src/ — run npm run sync:frontend-src');
  process.exit(1);
}

const sourceFiles = walkFiles(sourceDir);
const mirrorFiles = walkFiles(mirrorDir);
const allPaths = [...new Set([...sourceFiles, ...mirrorFiles])].sort();
const mismatches = [];

for (const rel of allPaths) {
  const a = path.join(sourceDir, rel);
  const b = path.join(mirrorDir, rel);
  const aExists = exists(a);
  const bExists = exists(b);
  if (!aExists || !bExists) {
    mismatches.push(`${rel}: ${aExists ? 'only in src' : 'only in frontend/src'}`);
    continue;
  }
  if (hashFile(a) !== hashFile(b)) {
    mismatches.push(`${rel}: content differs`);
  }
}

if (mismatches.length > 0) {
  console.error('frontend/src is out of sync with src/:');
  for (const line of mismatches.slice(0, 50)) console.error(`  - ${line}`);
  if (mismatches.length > 50) console.error(`  ... and ${mismatches.length - 50} more`);
  console.error('Run: npm run sync:frontend-src');
  process.exit(1);
}

console.log('frontend/src matches src/');
