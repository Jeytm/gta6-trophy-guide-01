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

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function abort(message) {
  throw new Error(message);
}

function mustExist(rel) {
  const path = join(repoRoot, rel);
  if (!existsSync(path) || !statSync(path).isFile()) abort(`missing required file: ${rel}`);
  return path;
}

function readTrophies() {
  const path = mustExist('app/data/trophies.json');
  const doc = JSON.parse(readFileSync(path, 'utf8'));
  const list = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(list) || list.length < 55) {
    abort(`trophies.json names ${Array.isArray(list) ? list.length : 0} trophies, expected at least 55`);
  }
  return list;
}

// Fail fast, here, if the trophy file does not name all 55 trophies with
// a non-blank guide each — the gate would refuse the entry for it, and a
// clear message here beats a silent rejection there.
function checkGuides(list) {
  const bad = [];
  for (const t of list) {
    const okName = t && typeof t.name === 'string' && t.name.trim() !== '';
    const okGuide = t && typeof t.guide === 'string' && t.guide.trim() !== '';
    if (!okName || !okGuide) bad.push(t);
  }
  if (bad.length > 0) abort(`trophies.json has ${bad.length} trophies with no name or no guide`);
}

function checkShots() {
  const dir = join(repoRoot, 'screenshots');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) abort('missing screenshots/ folder');
  const shots = [];
  for (const f of readdirSync(dir)) {
    if (f.startsWith('.')) continue;
    if (statSync(join(dir, f)).isFile()) shots.push(f);
  }
  if (shots.length < 3 || shots.length > 4) {
    abort(`screenshots/ holds ${shots.length} images, expected 3 or 4`);
  }
  // The gate caps each screenshot at 256 KiB — refuse an oversized one
  // here with a clear message instead of failing at the gate.
  for (const f of shots) {
    const size = statSync(join(dir, f)).size;
    if (size > 262144) abort(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
  }
  return shots;
}

function handIn() {
  mustExist('app/index.html');
  const list = readTrophies();
  checkGuides(list);
  checkShots();

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
}

handIn();
