// Leonida Platinum — the entry program for gta6-trophy-guide-01.
// Node 22, standard library only. It takes this repository's app/ folder
// (the offline guide: index.html, its ES modules and styles, and
// data/trophies.json with all 55 trophies) and screenshots/ (3 or 4 real
// renders of the guide), copies both into /output, and writes
// /output/dossier.json with the kit's vendored library — the summary the
// judge reads. vendor/makefun-frontend.ts is the kit's copy, unchanged:
// the scorer rebuilds the dossier with its own copy and compares bytes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
// Serve the guide itself with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The entry is not handable-in without these two: the page itself and
// the trophy file the gate checks for all 55 names and guides.
for (const needed of ['app/index.html', 'app/data/trophies.json']) {
  if (!existsSync(join(repoRoot, needed)) || !statSync(join(repoRoot, needed)).isFile()) {
    throw new Error(`missing required file: ${needed}`);
  }
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: at most 4 screenshots of 256 KiB each, app/ at
// most 993 files and directories and 48 MiB in all. buildDossier refuses
// anything past them, so a bad entry fails here instead of at the gate.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
