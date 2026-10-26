import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = [];
const fail = name => { failures.push(name); console.error(`FAIL ${name}`); };
const pass = name => console.log(`PASS ${name}`);
const run = (command, args, env = process.env) => spawnSync(command, args, {
  cwd: root, env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
});

// Child output is never echoed: errors can contain paths or environment values.
if (Number(process.versions.node.split('.')[0]) !== 24) fail('NODE_JS_24');
else pass('NODE_JS_24');

const listing = run('git', ['ls-files', '-z', '--', 'dist/']);
if (listing.status !== 0) fail('TRACKED_PUBLIC_SITE');
else {
  const files = listing.stdout.split('\0').filter(Boolean);
  const privateFiles = files.filter(path => /(?:^|\/)[^/]*\.local\.|(?:^|\/)\.env(?:\.|$)/u.test(path));
  const required = ['dist/index.html', 'dist/app.js', 'dist/style.css',
    'dist/account-config.example.json', 'dist/vendor/supabase.js'];
  if (privateFiles.length || required.some(path => !files.includes(path))) fail('TRACKED_PUBLIC_SITE');
  else {
    let valid = true;
    for (const path of files) {
      try {
        if (!lstatSync(new URL(path, new URL('../', import.meta.url))).isFile()) valid = false;
        if (/\.(?:js|mjs)$/u.test(path) && run(process.execPath, ['--check', path]).status !== 0) valid = false;
      } catch { valid = false; }
    }
    if (valid) pass('TRACKED_PUBLIC_SITE_AND_SYNTAX');
    else fail('TRACKED_PUBLIC_SITE_AND_SYNTAX');
  }
}

const privatePaths = ['test-data/shop.js', 'test-data/shop.local.json',
  'dist/demo.local.json', 'dist/account-config.local.json', 'qa/prompts/QA-001-EUR.md'];
// Do not open any private file.
const ignoredPaths = run('git', ['check-ignore', '--', ...privatePaths]);
if (ignoredPaths.status === 0 && privatePaths.every(path => ignoredPaths.stdout.split('\n').includes(path))) {
  pass('PRIVATE_FIXTURE_IGNORE_RULES');
} else fail('PRIVATE_FIXTURE_IGNORE_RULES');

try {
  const configuration = JSON.parse(readFileSync(new URL('../dist/account-config.example.json', import.meta.url), 'utf8'));
  if (configuration.url !== '' || configuration.publishableKey !== '') fail('EMPTY_TRACKED_ACCOUNT_CONFIGURATION');
  else pass('EMPTY_TRACKED_ACCOUNT_CONFIGURATION');
} catch { fail('EMPTY_TRACKED_ACCOUNT_CONFIGURATION'); }

try {
  const cli = fileURLToPath(import.meta.resolve('@playwright/test/cli'));
  const discoveryEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('QA_')),
  );
  const discovery = run(process.execPath, [cli, 'test', '--list', '--reporter=json'], {
    ...discoveryEnvironment, CI: 'true', QA_USE_LOCAL_TEST_DATA: '0',
    BASE_URL: 'http://127.0.0.1:4173/', PLAYWRIGHT_HTML_OPEN: 'never',
  });
  if (discovery.status !== 0) fail('PLAYWRIGHT_DISCOVERY');
  else {
    const report = JSON.parse(discovery.stdout);
    const counts = new Map();
    const inspect = suite => {
      for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
        counts.set(test.projectName, (counts.get(test.projectName) ?? 0) + 1);
      }
      for (const child of suite.suites ?? []) inspect(child);
    };
    for (const suite of report.suites ?? []) inspect(suite);
    const desktop = counts.get('chromium-desktop') ?? 0;
    const mobile = counts.get('chromium-mobile') ?? 0;
    if (counts.size !== 2 || desktop < 1 || desktop > 10 || mobile < 1 || mobile > 8 || desktop + mobile > 18) {
      fail('PLAYWRIGHT_DISCOVERY_LIMITS');
    } else pass(`PLAYWRIGHT_DISCOVERY ${desktop} desktop / ${mobile} mobile`);
  }
} catch { fail('PLAYWRIGHT_DISCOVERY'); }

console.log('Remote configuration, environment protection, and live database: NOT VERIFIED.');
console.log('Browser E2E: NOT RUN by read-only preflight.');
console.log(`Local read-only preflight: ${failures.length ? 'FAILED' : 'PASSED'}.`);
process.exitCode = failures.length ? 1 : 0;
