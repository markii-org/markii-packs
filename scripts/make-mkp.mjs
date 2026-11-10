#!/usr/bin/env node
// Builds every pack and writes its `<name>-<version>.mkp` archive into
// dist/ (or the directory given as the first argument). Compilation and
// archive layout come from @markii/pack-build; the file name rule comes
// from @markii/pack. Used by .github/workflows/release.yml on a version
// tag, and runnable locally.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { rootDir, discover, archive } from './pack-tools.mjs';

const outDir = join(rootDir, process.argv[2] ?? 'dist');

const { packs, skipped, collisions } = await discover({ includeTemplate: false });
for (const s of skipped) console.error(`skipped ${s.folder}: ${s.reason}`);
if (collisions.length > 0) {
  console.error(`namespace collision: ${collisions.join(', ')}`);
  process.exit(1);
}
if (packs.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
let failed = skipped.length > 0;
let built = 0;
for (const pack of packs) {
  const result = await archive(pack);
  if (result.kind === 'failed') {
    console.error(`FAIL ${result.packName}: ${result.reason}`);
    failed = true;
    continue;
  }
  for (const w of result.warnings) console.warn(`warn ${result.packName}: ${w}`);
  writeFileSync(join(outDir, result.fileName), result.bytes);
  console.log(`built ${result.fileName}`);
  built += 1;
}
console.log(`\nbuilt ${built} archive(s) in ${outDir}`);
if (failed) process.exit(1);
