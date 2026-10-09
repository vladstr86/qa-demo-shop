import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const digest = data => createHash('sha256').update(data).digest('hex');
const manifestPath = root => path.join(root, 'qa/latest.json');

export async function siteFingerprint(root) {
  const files = [];

  async function visit(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const stat = await fs.lstat(full);
      if (stat.isSymbolicLink()) {
        throw new Error('Symlinks are forbidden in dist: ' + full);
      }
      if (stat.isDirectory()) {
        await visit(full);
      } else if (stat.isFile() && !entry.name.endsWith('.zip') && entry.name !== 'demo.local.json') {
        files.push(full);
      } else if (!stat.isFile()) {
        throw new Error('Unsupported dist entry: ' + full);
      }
    }
  }

  await visit(path.join(root, 'dist'));
  files.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  const hash = createHash('sha256');
  for (const file of files) {
    const relative = path.relative(path.join(root, 'dist'), file).split(path.sep).join('/');
    const bytes = await fs.readFile(file);
    hash.update(JSON.stringify([relative, bytes.length]) + '\n');
    hash.update(bytes);
  }
  return hash.digest('hex');
}

async function writeManifest(root, manifest) {
  await fs.mkdir(path.join(root, 'qa'), { recursive: true });
  const destination = manifestPath(root);
  const temporary = destination + '.tmp';
  await fs.writeFile(temporary, JSON.stringify(manifest, null, 2) + '\n');
  await fs.rename(temporary, destination);
}

export async function prepare(root, { promptPath, id, revision, sourceSha }) {
  if (!/^QA-[A-Z0-9-]+$/.test(id) || !Number.isSafeInteger(revision) || revision < 1) {
    throw new Error('Valid QA ID and positive integer revision required.');
  }
  const relative = path.relative(root, path.resolve(root, promptPath));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Prompt must be inside project.');
  }
  const prompt = await fs.readFile(path.resolve(root, promptPath), 'utf8');
  const manifest = {
    id,
    revision,
    promptPath: relative,
    promptSha256: digest(prompt),
    siteSha256: await siteFingerprint(root),
    status: 'pending',
    preparedAt: new Date().toISOString(),
    ...(sourceSha ? { sourceSha } : {}),
  };
  let prior;
  try {
    prior = JSON.parse(await fs.readFile(manifestPath(root), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  // Revision records prevent reuse after a different handoff becomes latest.
  const history = path.join(root, 'qa', '.handoff-records', `${id}-r${revision}.json`);
  let record;
  try {
    record = JSON.parse(await fs.readFile(history, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const old of [prior, record]) {
    if (old?.id === id && old.revision === revision) {
      if (old.promptSha256 !== manifest.promptSha256 ||
          old.siteSha256 !== manifest.siteSha256 ||
          old.promptPath !== manifest.promptPath) {
        throw new Error('ID/revision already bound to different content. Increment revision.');
      }
      if (old.status !== 'pending') {
        throw new Error('This revision has already been processed. Increment revision.');
      }
    }
  }
  await fs.mkdir(path.dirname(history), { recursive: true });
  await fs.writeFile(history, JSON.stringify(manifest, null, 2) + '\n', {
    flag: record ? 'w' : 'wx',
  });
  await writeManifest(root, manifest);
  return manifest;
}

export async function review(root) {
  const raw = await fs.readFile(manifestPath(root), 'utf8');
  const manifest = JSON.parse(raw);
  if (!/^QA-[A-Z0-9-]+$/.test(manifest.id) ||
      !Number.isSafeInteger(manifest.revision) || manifest.revision < 1) {
    throw new Error('Invalid manifest.');
  }
  const location = path.resolve(root, manifest.promptPath);
  const relative = path.relative(root, location);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid prompt location.');
  }
  const prompt = await fs.readFile(location, 'utf8');
  if (digest(prompt) !== manifest.promptSha256) {
    throw new Error('Prompt drift: prepare a new revision.');
  }
  if (await siteFingerprint(root) !== manifest.siteSha256) {
    throw new Error('Site drift: prepare a new revision.');
  }
  return { manifest, prompt, manifestHash: digest(raw) };
}

export function sendCodex(root, prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('codex', ['exec', '--sandbox', 'workspace-write', '-'], {
      cwd: root,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: false,
    });
    child.on('error', reject);
    child.stdin.on('error', reject);
    child.on('close', code => resolve(code));
    child.stdin.end(prompt);
  });
}

export async function apply(root, {
  isTTY,
  confirm,
  dispatch = sendCodex,
  display = console.log,
} = {}) {
  if (!isTTY) {
    throw new Error('Approval requires an interactive TTY. No dispatch performed.');
  }
  const initial = await review(root);
  if (initial.manifest.status !== 'pending') {
    throw new Error('Revision already processed; no dispatch performed.');
  }
  display(JSON.stringify(initial.manifest, null, 2) + '\n\n' + initial.prompt);
  const token = `APROB ${initial.manifest.id} r${initial.manifest.revision}`;
  const answer = await confirm(token);
  if (answer !== token) return { status: 'declined', invoked: false };

  const fresh = await review(root);
  if (fresh.manifestHash !== initial.manifestHash) {
    throw new Error('Manifest drift during approval. No dispatch performed.');
  }
  const manifest = {
    ...fresh.manifest,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvalToken: token,
  };
  await writeManifest(root, manifest);
  const record = path.join(root, 'qa', '.handoff-records',
    `${manifest.id}-r${manifest.revision}.json`);
  await fs.mkdir(path.dirname(record), { recursive: true });
  await fs.writeFile(record, JSON.stringify(manifest, null, 2) + '\n');
  const payload = `User explicitly approved dispatch ${manifest.id} r${manifest.revision}. ` +
    `Approval token: ${token}. Prompt SHA256: ${manifest.promptSha256}. ` +
    `Site SHA256: ${manifest.siteSha256}. ` +
    `Follow this reviewed prompt within the project scope.\n\n${fresh.prompt}`;

  let code;
  let dispatchError;
  try {
    code = await dispatch(root, payload);
  } catch (error) {
    code = -1;
    dispatchError = error.message;
  }
  manifest.status = code === 0 ? 'dispatched' : 'dispatch_failed';
  manifest.dispatchExitCode = code;
  manifest.dispatchedAt = new Date().toISOString();
  if (dispatchError) manifest.dispatchError = dispatchError;
  await writeManifest(root, manifest);
  await fs.writeFile(record, JSON.stringify(manifest, null, 2) + '\n');
  if (manifest.status === 'dispatched') {
    display('Codex CLI completed. This does not mean all E2E tests passed.');
  } else {
    display(`Codex dispatch failed (exit ${code}). No test-pass claim.`);
    if (dispatchError) {
      display(`Dispatch error: ${dispatchError}`);
      if (/ENOENT/.test(dispatchError)) {
        display('Codex CLI is required. Install it separately; no prompt was sent.');
      }
    }
  }
  return { status: manifest.status, invoked: true, exitCode: code };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const [command, ...args] = process.argv.slice(2);
  if (command === 'fingerprint') {
    console.log(await siteFingerprint(root));
    return;
  }
  if (command === 'prepare') {
    const [promptPath, id, revision, sourceSha] = args;
    console.log(await prepare(root, {
      promptPath, id, revision: Number(revision), sourceSha,
    }));
    return;
  }
  if (command === 'review') {
    const result = await review(root);
    console.log(JSON.stringify(result.manifest, null, 2) + '\n\n' + result.prompt);
    return;
  }
  if (command === 'apply') {
    const readline = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const result = await apply(root, {
        isTTY: !!process.stdin.isTTY && !!process.stdout.isTTY,
        confirm: token => readline.question(
          `Type exactly ${token} to send to Codex (anything else declines): `),
      });
      if (result.status === 'dispatch_failed') process.exitCode = 1;
    } finally {
      readline.close();
    }
    return;
  }
  throw new Error('Usage: qa-handoff.mjs prepare <prompt> <QA-ID> <revision> ' +
    '[sourceSha] | review | apply | fingerprint');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.code === 'ENOENT'
      ? 'Required file or Codex CLI missing; install Codex CLI separately if needed. ' + error.message
      : error.message);
    process.exitCode = 1;
  });
}
