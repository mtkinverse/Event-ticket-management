import { readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = join(dirname(fileURLToPath(import.meta.url)));
const files = readdirSync(dir).filter(f => f.endsWith('.test.js'));

let exitCode = 0;

for (const file of files) {
  console.log(`\n── ${file} ──`);
  try {
    execSync(`node ${join(dir, file)}`, { stdio: 'inherit' });
  } catch {
    exitCode = 1;
  }
}

process.exit(exitCode);
