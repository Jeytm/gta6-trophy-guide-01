// Filtering, search and the spoiler rule for the trophy list.
// Kinds follow the bounty: story, missable, collectibles, activities and
// online (the game has no online trophies, so that filter honestly shows
// an empty state instead of pretending otherwise).

export const KIND_FILTERS = [
  { id: 'all', label: 'All 55' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectible', label: 'Collectibles' },
  { id: 'activity', label: 'Activities' },
  { id: 'robbery', label: 'Robberies' },
  { id: 'money', label: 'Money' },
  { id: 'side', label: 'Side quests' },
  { id: 'online', label: 'Online' },
];

const KIND_MATCH = {
  story: (t) => t.kind === 'story',
  missable: (t) => t.missable === 'yes' || t.missable === 'watch',
  collectible: (t) => t.kind === 'collectible',
  activity: (t) => t.kind === 'activity',
  robbery: (t) => t.kind === 'robbery',
  money: (t) => t.kind === 'money',
  side: (t) => t.kind === 'side',
  online: () => false,
};

export function filterTrophies(trophies, { kind, grade, query, hideEarned, earned }) {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind !== 'all' && !KIND_MATCH[kind](t)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (hideEarned && earned && earned.has(t.id)) return false;
    if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

// Per-grade earned counts for the header line: "Platinum 0/1 · Gold 0/2 …"
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export function gradeCounts(trophies, earned) {
  return ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const done = all.filter((t) => earned.has(t.id)).length;
    return `${GRADE_LABEL[g]} ${done}/${all.length}`;
  });
}

// The spoiler rule: with spoilers hidden, a story trophy the reader has
// not earned yet shows no name and no description — only that it exists.
export function spoilerHides(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function kindLabel(kind) {
  if (kind === 'platinum') return 'Platinum';
  const found = KIND_FILTERS.find((k) => k.id === kind);
  return found ? found.label : kind;
}
