#!/usr/bin/env node
// Builds every pack's prebuilt form (scripts/build-pack.mjs) and zips it as
// a `.mkp` archive: `<name>-<version>.mkp` when pack.json declares a
// semver `version`, `<name>.mkp` otherwise. Files sit at the ZIP ROOT
// (pack.json, webview.js, webview.css when produced, scripts/ when
// present) — never nested inside a folder — because that is the shape
// both hosts' `.mkp` reader expects (docs/packs.md, main repo).
//
// Used by .github/workflows/release.yml on a version tag. Can also be run
// locally: `node scripts/make-mkp.mjs [outDir]` (default outDir: `dist/`).
//
// Depends on the `zip` command-line tool being on PATH (present by default
// on GitHub's ubuntu-latest runners); this repo adds no new npm dependency
// to build the archive.

import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  cpSync,
  readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { buildPrebuiltPack } from './build-pack.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packsDir = join(rootDir, 'packs');
const outDir = join(rootDir, process.argv[2] ?? 'dist');

function discoverPacks() {
  if (!existsSync(packsDir)) return [];
  return readdirSync(packsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/**
 * `manifest.version` comes straight off `@markii/pack`'s `parsePackManifest`
 * (0.12.0+ validates it as plain semver and rejects a malformed one as an
 * error), so by the time this runs, after `npm run check` in the release
 * workflow and after `buildPrebuiltPack`'s own parse here, it is already
 * known-good. No re-parsing or re-validating needed.
 */
function archiveNameFor(name, version) {
  if (typeof version === 'string') {
    return `${name}-${version}.mkp`;
  }
  return `${name}.mkp`;
}

async function packOne(name) {
  const dir = join(packsDir, name);
  const { js, css, manifest } = await buildPrebuiltPack(dir);

  const stagingDir = mkdtempSync(join(tmpdir(), `markii-mkp-${name}-`));
  try {
    cpSync(join(dir, 'pack.json'), join(stagingDir, 'pack.json'));
    writeFileSync(join(stagingDir, 'webview.js'), js);
    if (css !== undefined) {
      writeFileSync(join(stagingDir, 'webview.css'), css);
    }
    const scriptsDir = join(dir, 'scripts');
    if (existsSync(scriptsDir)) {
      cpSync(scriptsDir, join(stagingDir, 'scripts'), { recursive: true });
    }

    mkdirSync(outDir, { recursive: true });
    const archiveName = archiveNameFor(manifest.name, manifest.version);
    const archivePath = join(outDir, archiveName);
    rmSync(archivePath, { force: true });

    // `-X` drops extra file attributes (owner/group, timestamps beyond the
    // DOS-resolution ones the zip format always carries) so the archive is
    // reproducible across runners. Run FROM the staging directory with `.`
    // as the only argument so every entry path is root-relative
    // (`pack.json`, not `<tmpdir-name>/pack.json`).
    execFileSync('zip', ['-X', '-r', archivePath, '.'], {
      cwd: stagingDir,
      stdio: 'inherit',
    });

    console.log(`built ${archiveName}`);
    return archivePath;
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
}

const packNames = discoverPacks();
if (packNames.length === 0) {
  console.log('no packs yet (packs/ is empty or missing)');
  process.exit(0);
}

const built = [];
for (const name of packNames) {
  built.push(await packOne(name));
}

console.log(`\nbuilt ${built.length} archive(s) in ${outDir}`);
