import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const sourceDir = path.join(repoRoot, 'src');
const targetDir = path.join(repoRoot, 'frontend', 'src');

if (!existsSync(sourceDir)) {
  console.error(`Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

if (path.resolve(sourceDir) === path.resolve(targetDir)) {
  console.error('Refusing to sync: source and target directories are the same.');
  process.exit(1);
}

mkdirSync(path.dirname(targetDir), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced ${path.relative(repoRoot, sourceDir)} -> ${path.relative(repoRoot, targetDir)}`);
