#!/usr/bin/env node
// Confirms every pack (and the template) compiles with the shared pack
// compiler, @markii/pack-build. That compiler resolves only the pack's own
// relative files and the host's React globals, so a component that imports
// any other package fails here instead of bundling a second copy the host
// cannot load. Prints "ok <pack>" per pack that builds, and any CSS lint
// warnings the compiler reports. Exits 1 on a failed or skipped pack.

import { discover, compile } from './pack-tools.mjs';

const { packs, skipped, collisions } = await discover();
let hadError = false;

for (const s of skipped) {
  hadError = true;
  console.error(`FAIL ${s.folder}: ${s.reason}`);
}
for (const name of collisions) {
  hadError = true;
  console.error(`FAIL namespace "${name}" is declared by more than one folder`);
}

if (packs.length === 0 && skipped.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
}

for (const pack of packs) {
  const name = pack.manifest.name;
  const { outcome } = await compile(pack);
  if (outcome.kind === 'failed') {
    hadError = true;
    console.error(`FAIL ${name}: failed to build`);
    console.error(outcome.reason);
    continue;
  }
  if (outcome.kind === 'skipped') {
    hadError = true;
    console.error(`FAIL ${name}: nothing was built (the pack declares no react component)`);
    continue;
  }
  for (const w of outcome.warnings) console.warn(`warn ${name}: ${w}`);
  console.log(`ok ${name}`);
}

if (hadError) process.exit(1);
