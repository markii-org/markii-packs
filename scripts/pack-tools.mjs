// The one place this repository talks to the published Markii pack toolchain.
// Discovery comes from @markii/host, compilation and archive export from
// @markii/pack-build. The check scripts and build:mkp all go through here.

import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { readdir, readFile as readFileAsync } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverPacks } from '@markii/host';
import {
  buildPackRegistrationScript,
  buildPackTerminalScript,
  exportPackArchive,
} from '@markii/pack-build';

export const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
export const packsDir = join(rootDir, 'packs');
export const templateDir = join(rootDir, 'template');

// Compiled scripts are cached here, never inside a pack's own folder.
const cacheDir = join(rootDir, 'node_modules', '.cache', 'markii-packs');

// Written here rather than taken from '@markii/host/node', whose entry
// imports @markii/html at load time and would make it a dependency.
const readFile = async (path) => {
  try {
    return await readFileAsync(path, 'utf8');
  } catch {
    return undefined;
  }
};

const fsSeam = {
  readFile,
  listDirectory: async (dir) => {
    try {
      return await readdir(dir);
    } catch {
      return [];
    }
  },
};

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

/**
 * Discovers packs (manifest validated by @markii/pack). Returns
 * `{ packs, skipped, collisions }` as @markii/host reports them.
 */
export async function discover(options) {
  return discoverPacks(
    packFolders(options),
    readFile,
    async (dir) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
      } catch {
        return [];
      }
    },
  );
}

/** Compiles one pack. Returns `{ outcome, js, css }`; `js` is the registration script text when built. */
export async function compile(pack) {
  const outcome = await buildPackRegistrationScript(pack, cacheDir);
  if (outcome.kind !== 'built') return { outcome };
  const js = readFileSync(outcome.scriptPath, 'utf8');
  const css = outcome.stylesheetPath ? readFileSync(outcome.stylesheetPath, 'utf8') : undefined;
  return { outcome, js, css };
}

/** Builds the `.mkp` bytes for one pack, including a terminal script when it declares `ansi` views. */
export function archive(pack) {
  return exportPackArchive({
    pack,
    cacheDir,
    build: buildPackRegistrationScript,
    buildTerminal: buildPackTerminalScript,
    fs: fsSeam,
  });
}
