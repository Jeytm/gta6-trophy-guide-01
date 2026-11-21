// Leonida Platinum — filtering, search, spoiler rule, grade tallies.
// Kinds follow the bounty: story, missable, collectibles, activities and
// online. The game has no online trophies, so that filter honestly shows
// an empty state instead of pretending otherwise.

export const KIND_DEFS = [
  { id: 'all', label: 'All 55', test: () => true },
  { id: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { id: 'missable', label: 'Missable', test: (t) => t.missable === 'yes' || t.missable === 'watch' },
  { id: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { id: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { id: 'robbery', label: 'Robberies', test: (t) => t.kind === 'robbery' },
  { id: 'money', label: 'Money', test: (t) => t.kind === 'money' },
  { id: 'side', label: 'Side quests', test: (t) => t.kind === 'side' },
  { id: 'online', label: 'Online', test: () => false },
];

const GRADE_NAMES = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export function gradeName(grade) {
  return GRADE_NAMES[grade] ?? grade;
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
// "Platinum 0/1 · Gold 0/2 · Silver 0/6 · Bronze 13/46".
export function gradeTallies(trophies, earned) {
  return GRADE_ORDER.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    let done = 0;
    for (const t of trophies) {
      if (t.grade === g && earned.has(t.id)) done += 1;
    }
    return `${GRADE_NAMES[g]} ${done}/${total}`;
  });
}

// The spoiler rule: with spoilers hidden, an unearned story trophy
// shows no name and no description — only that it exists.
export function isHiddenBySpoiler(trophy, spoilerOn, earned) {
  if (!spoilerOn) return false;
  if (trophy.kind !== 'story') return false;
  return !earned.has(trophy.id);
}
