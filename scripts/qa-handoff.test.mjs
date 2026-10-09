import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepare, review, apply, siteFingerprint } from './qa-handoff.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'qa-handoff-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'dist'));
  await fs.mkdir(path.join(root, 'qa'));
  await fs.writeFile(path.join(root, 'dist/index.html'), 'demo');
  await fs.writeFile(path.join(root, 'qa/prompt.md'), 'Reviewed exact prompt\n');
  await prepare(root, { promptPath: 'qa/prompt.md', id: 'QA-001', revision: 1 });
  return root;
}

const options = { isTTY: true, display: () => {} };

test('decline and non-TTY never invoke Codex', async t => {
  const root = await fixture(t);
  let calls = 0;
  const dispatch = async () => {
    calls++;
    return 0;
  };
  const result = await apply(root, {
    ...options, dispatch, confirm: async () => 'yes',
  });
  assert.equal(result.status, 'declined');
  await assert.rejects(apply(root, {
    ...options, isTTY: false, dispatch, confirm: async () => 'APROB QA-001 r1',
  }), /TTY/);
  assert.equal(calls, 0);
  assert.equal((await review(root)).manifest.status, 'pending');
});

test('exact approval sends reviewed prompt once and records dispatch without test-pass claim', async t => {
  const root = await fixture(t);
  let calls = 0;
  const result = await apply(root, {
    ...options,
    confirm: async () => 'APROB QA-001 r1',
    dispatch: async (cwd, prompt) => {
      calls++;
      assert.equal(cwd, root);
      assert.ok(prompt.endsWith('Reviewed exact prompt\n'));
      assert.match(prompt, /Prompt SHA256: [a-f0-9]{64}/);
      return 0;
    },
  });
  assert.equal(result.status, 'dispatched');
  await assert.rejects(apply(root, {
    ...options,
    confirm: async () => 'APROB QA-001 r1',
    dispatch: async () => {
      calls++;
      return 0;
    },
  }), /already processed/);
  assert.equal(calls, 1);
});

for (const drift of ['site', 'prompt', 'manifest']) {
  test(`${drift} drift during approval blocks invocation`, async t => {
    const root = await fixture(t);
    let calls = 0;
    await assert.rejects(apply(root, {
      ...options,
      dispatch: async () => {
        calls++;
        return 0;
      },
      confirm: async () => {
        if (drift === 'site') {
          await fs.writeFile(path.join(root, 'dist/index.html'), 'changed');
        }
        if (drift === 'prompt') {
          await fs.writeFile(path.join(root, 'qa/prompt.md'), 'changed');
        }
        if (drift === 'manifest') {
          const file = path.join(root, 'qa/latest.json');
          const manifest = JSON.parse(await fs.readFile(file));
          manifest.extra = 'changed';
          await fs.writeFile(file, JSON.stringify(manifest));
        }
        return 'APROB QA-001 r1';
      },
    }), /drift/i);
    assert.equal(calls, 0);
  });
}

test('zip changes ignored; symlinks rejected', async t => {
  const root = await fixture(t);
  const hash = await siteFingerprint(root);
  await fs.writeFile(path.join(root, 'dist/archive.zip'), 'first');
  assert.equal(await siteFingerprint(root), hash);
  await fs.writeFile(path.join(root, 'dist/archive.zip'), 'second');
  assert.equal(await siteFingerprint(root), hash);
  await fs.symlink('index.html', path.join(root, 'dist/link.zip'));
  await assert.rejects(siteFingerprint(root), /Symlinks/);
});

test('private demo configuration does not change the public fingerprint', async t => {
  const root = await fixture(t);
  const hash = await siteFingerprint(root);
  const local = path.join(root, 'dist/demo.local.json');
  await fs.writeFile(local, JSON.stringify({ email: 'local@example.test', password: 'LocalExampleOnly' }));
  assert.equal(await siteFingerprint(root), hash);
  await fs.writeFile(local, JSON.stringify({ email: 'other@example.test', password: 'OtherExampleOnly' }));
  assert.equal(await siteFingerprint(root), hash);
  await fs.rm(local);
  assert.equal(await siteFingerprint(root), hash);
  await fs.writeFile(path.join(root, 'dist/demo.example.json'), JSON.stringify({ email: 'demo@example.test', password: 'ExampleOnly' }));
  assert.notEqual(await siteFingerprint(root), hash);
});

test('same ID revision cannot rebind prompt or site, even after another latest', async t => {
  const root = await fixture(t);
  await prepare(root, { promptPath: 'qa/prompt.md', id: 'QA-002', revision: 1 });
  await fs.writeFile(path.join(root, 'qa/prompt.md'), 'new prompt');
  await assert.rejects(prepare(root, {
    promptPath: 'qa/prompt.md', id: 'QA-001', revision: 1,
  }), /Increment revision/);
  await prepare(root, { promptPath: 'qa/prompt.md', id: 'QA-001', revision: 2 });
  await fs.writeFile(path.join(root, 'dist/index.html'), 'new site');
  await assert.rejects(prepare(root, {
    promptPath: 'qa/prompt.md', id: 'QA-001', revision: 2,
  }), /Increment revision/);
});

test('CLI error exit is dispatch_failed rather than E2E pass', async t => {
  const root = await fixture(t);
  let output = '';
  const result = await apply(root, {
    ...options,
    display: text => output += text,
    confirm: async () => 'APROB QA-001 r1',
    dispatch: async () => 7,
  });
  assert.equal(result.status, 'dispatch_failed');
  assert.equal(result.exitCode, 7);
  assert.match(output, /No test-pass claim/);
  assert.equal((await review(root)).manifest.status, 'dispatch_failed');
});
