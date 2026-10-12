import { build } from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const output = new URL('../dist/vendor/', import.meta.url);
await mkdir(output, { recursive: true });
const result = await build({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: process.cwd(), sourcefile: 'supabase-entry.mjs' },
  outfile: new URL('supabase.js', output).pathname,
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'],
  minify: true, legalComments: 'inline', metafile: true,
});
await writeFile(new URL('SUPABASE-LICENSE.txt', output), await readFile(new URL('../node_modules/@supabase/supabase-js/LICENSE', import.meta.url)));
const packages = new Map();
for (const input of Object.keys(result.metafile.inputs).filter(path => path.startsWith('node_modules/'))) {
  let directory = dirname(resolve(input));
  while (directory !== dirname(directory)) {
    try {
      const metadata = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
      packages.set(directory, metadata); break;
    } catch { directory = dirname(directory); }
  }
}
const licenses = [];
for (const [directory, metadata] of [...packages].sort((left, right) => left[1].name.localeCompare(right[1].name))) {
  licenses.push(`${metadata.name} ${metadata.version} (${metadata.license || 'see license below'})`);
  const files = (await readdir(directory)).filter(name => /^(?:licen[sc]e|copyrightnotice|notice)(?:\.|$)/i.test(name)).sort();
  for (const file of files) licenses.push(await readFile(resolve(directory, file), 'utf8'));
}
await writeFile(new URL('THIRD-PARTY-LICENSES.txt', output), `${licenses.join('\n\n')}\n`);
console.log('Built the pinned official Supabase browser SDK locally.');
