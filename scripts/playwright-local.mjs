import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/';
let selectedURL;
try {
  selectedURL = new URL(baseURL);
} catch {
  console.error('test:local requires a valid HTTP or HTTPS BASE_URL.');
  process.exit(1);
}
if (!['http:', 'https:'].includes(selectedURL.protocol) ||
    !['localhost', '127.0.0.1'].includes(selectedURL.hostname)) {
  console.error('test:local requires localhost or 127.0.0.1. Use npm test for deployed URLs.');
  process.exit(1);
}

console.log(`Local Playwright target: ${selectedURL.origin}${selectedURL.pathname}`);
const cli = fileURLToPath(import.meta.resolve('@playwright/test/cli'));
const child = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, BASE_URL: selectedURL.href },
});
child.on('error', error => {
  console.error(`Unable to start Playwright: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code ?? 1; });
