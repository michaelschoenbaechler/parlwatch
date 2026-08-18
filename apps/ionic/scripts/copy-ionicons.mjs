/**
 * Copies the ionicons SVG set into the Angular workspace.
 *
 * The app renders icons as `<ion-icon name="...">` without `addIcons()`, so the
 * SVGs are fetched at runtime from `/svg/<name>.svg` and must be emitted by the
 * build. Angular's asset pipeline refuses inputs outside the workspace root
 * (apps/ionic), while npm workspaces hoists ionicons to the repo root, so the
 * files are staged here instead of referenced across the workspace boundary.
 */
import { createRequire } from 'node:module';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const target = join(workspaceRoot, '.ionicons', 'svg');

// ionicons does not export "./package.json", so walk up from the resolved entry
// point instead. This keeps working regardless of how npm hoists the package.
function packageRoot(entry) {
  let dir = dirname(entry);
  while (basename(dir) !== 'ionicons') {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate the ionicons package root from ${entry}`);
    }
    dir = parent;
  }
  return dir;
}

const source = join(packageRoot(require.resolve('ionicons')), 'dist', 'ionicons', 'svg');

if (!(await stat(source).catch(() => null))?.isDirectory()) {
  throw new Error(`ionicons SVG directory not found at ${source}`);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

console.log(`Copied ionicons SVGs from ${source} to ${target}`);
