// Leonida Platinum — filtering, search, spoiler rule, grade tallies.
// Kinds follow the bounty: story, missable, collectibles, activities and
// online. The game has no online trophies, so that filter honestly shows
// an empty state instead of pretending otherwise.

const KIND_TESTS = {
  all: () => true,
  story: (t) => t.kind === 'story',
  missable: (t) => t.missable === 'yes' || t.missable === 'watch',
  collectible: (t) => t.kind === 'collectible',
  activity: (t) => t.kind === 'activity',
  robbery: (t) => t.kind === 'robbery',
  money: (t) => t.kind === 'money',
  side: (t) => t.kind === 'side',
  online: () => false,
};

export const KIND_DEFS = [
  { id: 'all', label: 'All 55', test: KIND_TESTS.all },
  { id: 'story', label: 'Story', test: KIND_TESTS.story },
  { id: 'missable', label: 'Missable', test: KIND_TESTS.missable },
  { id: 'collectible', label: 'Collectibles', test: KIND_TESTS.collectible },
  { id: 'activity', label: 'Activities', test: KIND_TESTS.activity },
  { id: 'robbery', label: 'Robberies', test: KIND_TESTS.robbery },
  { id: 'money', label: 'Money', test: KIND_TESTS.money },
  { id: 'side', label: 'Side quests', test: KIND_TESTS.side },
  { id: 'online', label: 'Online', test: KIND_TESTS.online },
];

const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function gradeName(grade) {
  return GRADE_LABELS[grade] ?? grade;
}

export function kindName(kind) {
  if (kind === 'platinum') return 'Platinum';
  const found = KIND_DEFS.find((k) => k.id === kind);
  return found ? found.label : kind;
}

export function applyFilters(trophies, opts) {
  const kindTest = (KIND_DEFS.find((k) => k.id === opts.kind) ?? KIND_DEFS[0]).test;
  const q = opts.query.trim().toLowerCase();
  const picked = [];
  for (const t of trophies) {
    if (!kindTest(t)) continue;
    if (opts.grade !== 'all' && t.grade !== opts.grade) continue;
    if (opts.hideEarned && opts.earned && opts.earned.has(t.id)) continue;
    if (q) {
      const hay = `${t.name} ${t.description}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    picked.push(t);
  }
  return picked;
}

// Per-grade earned tallies for the header line:
// "Platinum 0/1 · Gold 0/2 · Silver 0/6 · Bronze 14/46".
export function gradeTallies(trophies, earned) {
  const lines = [];
  for (const g of GRADE_ORDER) {
    let total = 0;
    let done = 0;
    for (const t of trophies) {
      if (t.grade !== g) continue;
      total += 1;
      if (earned.has(t.id)) done += 1;
    }
    lines.push(`${GRADE_LABELS[g]} ${done}/${total}`);
  }
  return lines;
}

// The spoiler rule: with spoilers hidden, an unearned story trophy
// shows no name and no description — only that it exists.
export function isHiddenBySpoiler(trophy, spoilerOn, earned) {
  if (!spoilerOn) return false;
  if (trophy.kind !== 'story') return false;
  return !earned.has(trophy.id);
}
