// The one place this repository talks to the published Markii pack toolchain.
// Manifests are validated with @markii/pack. Compilation and archive export
// come from @markii/pack-build. The check scripts and build:mkp all go
// through here.

import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectNamespaceCollisions,
  packComponents,
  packComponentsForEngine,
  parsePackManifest,
} from '@markii/pack';
import {
  buildPackArchive,
  buildPackRegistrationScript,
} from '@markii/pack-build';

export const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
export const packsDir = join(rootDir, 'packs');
export const templateDir = join(rootDir, 'template');

// Compiled scripts are cached here, never inside a pack's own folder.
const cacheDir = join(rootDir, 'node_modules', '.cache', 'markii-packs');

/** Folder paths of every pack under packs/, plus the template when present. */
export function packFolders({ includeTemplate = true } = {}) {
  const folders = existsSync(packsDir)
    ? readdirSync(packsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => join(packsDir, e.name))
    : [];
  if (includeTemplate && existsSync(templateDir) && statSync(templateDir).isDirectory()) {
    folders.push(templateDir);
  }
  return folders;
}

/** Reads one pack folder into the shape the compiler takes, or a reason it is not a pack. */
function readPack(folder) {
  const manifestPath = join(folder, 'pack.json');
  if (!existsSync(manifestPath)) return { reason: 'no readable pack.json' };
  const manifestText = readFileSync(manifestPath, 'utf8');
  const parsed = parsePackManifest(manifestText);
  if (!parsed.ok) return { reason: `invalid pack.json (${parsed.errors.join('; ')})` };

  const componentPaths = {};
  for (const listing of packComponentsForEngine(parsed.manifest, 'react')) {
    componentPaths[listing.localName] = join(folder, listing.source);
  }
  const componentPathsByEngine = {};
  for (const listing of packComponents(parsed.manifest)) {
    for (const [engine, source] of Object.entries(listing.sources)) {
      (componentPathsByEngine[engine] ??= {})[listing.localName] = join(folder, source);
    }
  }
  return {
    pack: {
      folder,
      manifest: parsed.manifest,
      manifestText,
      componentPaths,
      componentPathsByEngine,
      scriptsDir: join(folder, 'scripts'),
    },
  };
}

/**
 * Validates every pack folder. Returns `{ packs, skipped, collisions }`:
 * the packs that validated and did not collide, the folders that did not
 * (with a reason), and the namespaces claimed more than once.
 */
export async function discover(options) {
  const found = [];
  const skipped = [];
  for (const folder of packFolders(options)) {
    const read = readPack(folder);
    if (read.pack) found.push(read.pack);
    else skipped.push({ folder, reason: read.reason });
  }
  const collisions = detectNamespaceCollisions(found.map((p) => p.manifest.name)).map(
    (collision) => collision.namespace,
  );
  const packs = found.filter((p) => !collisions.includes(p.manifest.name));
  for (const pack of found) {
    if (collisions.includes(pack.manifest.name)) {
      skipped.push({
        folder: pack.folder,
        reason: `pack namespace "${pack.manifest.name}" collides with another pack`,
      });
    }
  }
  return { packs, skipped, collisions };
}

/** Compiles one pack. Returns `{ outcome, js, css }`; `js` is the registration script text when built. */
export async function compile(pack) {
  const outcome = await buildPackRegistrationScript(pack, cacheDir);
  if (outcome.kind !== 'built') return { outcome };
  const js = readFileSync(outcome.scriptPath, 'utf8');
  const css = outcome.stylesheetPath ? readFileSync(outcome.stylesheetPath, 'utf8') : undefined;
  return { outcome, js, css };
}

/**
 * Builds the `.mkp` bytes for one pack, including a terminal script when it
 * declares `ansi` views. The result is `{ kind: 'built', packName, fileName,
 * bytes, warnings }` or `{ kind: 'failed', packName, reason }`.
 */
export async function archive(pack) {
  const packName = pack.manifest.name;
  const result = await buildPackArchive(pack.folder, { cacheDir });
  return { ...result, packName };
}
