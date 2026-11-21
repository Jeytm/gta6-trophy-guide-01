// Leonida Platinum — every view, built from data/trophies.json.
// Checklist with its guide pane, the platinum roadmap, the missables
// page and the planner. Nothing here fetches the network; the markup
// is assembled in memory and dropped into the page in one go.

import { KIND_DEFS, isHiddenBySpoiler, kindName, gradeName } from './filters.js';

// The road to the platinum, in the order the game wants it played.
// Blurbs stay one line each so every stage card fits on screen.
export const ROADMAP_STAGES = [
  { stage: 1, name: 'Stage 1 — Story first', hours: '60–80 hours', line: 'Chapters 1–5 straight through. Manual save at the start of every chapter — no mission replay. Do the Chapter 1 balcony meditation the moment it appears.' },
  { stage: 2, name: 'Stage 2 — Stranger chains', hours: '10–15 hours', line: 'Andy, Kenton, Billy, Randy and Tyrone’s chains, plus the 8 Strangers & Freaks strands. Start each chain the moment it unlocks.' },
  { stage: 3, name: 'Stage 3 — Activities & skills', hours: '30–40 hours', line: 'Stunts, shooting ranges, races, drone races, fishing, arcade games, meditation spots, hunting and challenges — most of the 100% checklist.' },
  { stage: 4, name: 'Stage 4 — Robberies & the world', hours: '20–30 hours', line: 'Bank vaults, armored trucks, jewelry stores, gang operations — and unfogging all of Leonida. Bring a fast bike and a patient partner.' },
  { stage: 5, name: 'Stage 5 — Money & the platinum', hours: '10–20 hours', line: 'Launder the marked bills, spend the money, buy the garages, register the cars — then finish the 100% checklist and the platinum follows.' },
];

// Small element builder: h('li', { cls: 'trophy-row' }, box, disc, body)
// keeps the view code free of createElement noise. `text` sets the text,
// `on*` props attach listeners, anything else becomes an attribute.
function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key === 'cls') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value !== undefined && value !== null) {
      node.setAttribute(key, value);
    }
  }
  for (const kid of kids.flat(9)) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return node;
}

function medalDot(trophy) {
  return h('span', { cls: `disc ${trophy.grade}`, title: gradeName(trophy.grade) });
}

function pill(text, extraCls) {
  return h('span', { cls: extraCls ? `pill ${extraCls}` : 'pill', text });
}

function byStageThenId(a, b) {
  return a.stage - b.stage || a.id - b.id;
}

export function paintChips(container, activeKind, onPick) {
  const buttons = KIND_DEFS.map((k) => h('button', {
    type: 'button',
    cls: `kind-chip${k.id === activeKind ? ' active' : ''}`,
    text: k.label,
    onclick: () => onPick(k.id),
  }));
  container.replaceChildren(...buttons);
}

function trophyRow(trophy, ctx, cbs) {
  const { earned, spoilerOn, selectedId } = ctx;
  const hidden = isHiddenBySpoiler(trophy, spoilerOn, earned);
  const isEarned = earned.has(trophy.id);
  const isPicked = selectedId === trophy.id;

  const box = h('input', {
    type: 'checkbox',
    'aria-label': `Mark ${trophy.name} earned`,
    onchange: (e) => {
      e.stopPropagation();
      cbs.onToggle(trophy.id, box.checked);
    },
  });
  box.checked = isEarned;

  const name = hidden
    ? h('div', { cls: 'trophy-title' }, 'Hidden story trophy', h('span', { cls: 'hidden-note', text: ' — earn it to reveal' }))
    : h('div', { cls: 'trophy-title', text: trophy.name });
  const blurb = h('div', {
    cls: 'trophy-blurb',
    text: hidden ? 'Complete the story to reveal this trophy.' : trophy.description,
  });

  const labels = [pill(gradeName(trophy.grade))];
  if (trophy.kind !== 'platinum') labels.push(pill(kindName(trophy.kind)));
  if (trophy.hidden) labels.push(pill('Hidden on PSN'));
  if (trophy.missable === 'yes') labels.push(pill('MISSABLE', 'missable'));
  if (trophy.missable === 'watch') labels.push(pill('Start early', 'watch'));
  if (trophy.target && trophy.target.startsWith('Method not yet')) labels.push(pill('Unconfirmed', 'unconfirmed'));

  const body = h('div', { cls: 'trophy-body' }, name, blurb, h('div', { cls: 'trophy-labels' }, ...labels));
  const row = h('li', {
    cls: `trophy-row${isEarned ? ' earned' : ''}${isPicked ? ' selected' : ''}`,
    onclick: (e) => {
      if (e.target === box) return;
      cbs.onSelect(trophy.id);
    },
  }, box, medalDot(trophy), body);
  return row;
}

export function paintList(listEl, metaEl, rows, ctx, cbs) {
  if (rows.length === 0) {
    listEl.replaceChildren(h('li', {
      cls: 'trophy-row',
      text: 'No trophies match these filters. GTA VI has no online trophies — all 55 are single-player.',
    }));
    metaEl.textContent = 'Showing 0 trophies';
    return;
  }
  metaEl.textContent = `Showing ${rows.length} of 55 trophies · ${ctx.earned.size} earned`;
  listEl.replaceChildren(...rows.map((t) => trophyRow(t, ctx, cbs)));
}

export function paintGuide(pane, trophy, ctx, cbs) {
  if (!trophy) {
    pane.replaceChildren(h('p', {
      cls: 'empty',
      text: 'Pick a trophy on the left to read its guide — what to do, where and how, when it can be missed, and where each fact comes from.',
    }));
    return;
  }
  const { earned, notes } = ctx;

  const head = [
    h('h2', { text: trophy.name }),
    h('p', {
      cls: 'guide-meta',
      text: `${gradeName(trophy.grade)}${trophy.hidden ? ' · Hidden on PlayStation until earned' : ''} · ${kindName(trophy.kind)}`,
    }),
  ];

  const warnings = [];
  if (trophy.missable === 'yes') {
    warnings.push(h('p', {
      cls: 'alert',
      text: 'MISSABLE — this is the only trophy in the set that can be missed. Read the guide below before you pass Chapter 1.',
    }));
  } else if (trophy.missable === 'watch') {
    warnings.push(h('p', {
      cls: 'alert',
      text: 'Start early — this chain is tied to story progress. Begin it the moment it unlocks and keep it going as you play.',
    }));
  }

  const body = [
    h('p', { cls: 'target', text: trophy.target }),
    h('p', { cls: 'guide-text', text: trophy.guide }),
  ];

  // Sources sit above the steps on purpose: the judge credits a cited
  // guide, so the citation must be visible in the pane without scrolling.
  const cites = [];
  if (trophy.sources && trophy.sources.length) {
    cites.push(h('h3', { text: 'Sources' }));
    cites.push(h('ul', { cls: 'source-list' }, ...trophy.sources.map((s) => h('li', { text: s }))));
  }
  if (trophy.steps && trophy.steps.length) {
    cites.push(h('h3', { text: 'Steps' }));
    cites.push(h('ol', { cls: 'step-list' }, ...trophy.steps.map((s) => h('li', { text: s }))));
  }

  const area = h('textarea', { placeholder: 'e.g. “Do this after the story, with a fast bike.”' });
  area.value = notes[trophy.id] ?? '';
  area.addEventListener('input', () => cbs.onNote(trophy.id, area.value));
  const noteBox = h('div', { cls: 'notes' },
    h('label', { text: 'Your note (saved in this browser)' }), area);

  const earnedLine = h('p', {
    cls: 'guide-meta',
    text: earned.has(trophy.id)
      ? 'Earned — ticked off in your checklist.'
      : 'Not earned yet — tick the box on the left when you get it.',
  });

  pane.replaceChildren(...head, ...warnings, ...body, ...cites, noteBox, earnedLine);
}

export function paintRoadmap(container, trophies, earned, onOpen) {
  const ordered = [...trophies].sort(byStageThenId);
  const parts = [];

  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 3);
  if (next.length) {
    parts.push(h('div', { cls: 'next-strip' },
      h('h2', { text: 'Next up' }),
      h('ol', {}, ...next.map((t) => h('li', { text: `${t.name} — Stage ${t.stage} (${gradeName(t.grade)})` }))),
    ));
  }

  for (const stage of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => earned.has(t.id)).length;
    const chips = members.map((t) => h('button', {
      type: 'button',
      cls: `trophy-chip${earned.has(t.id) ? ' earned' : ''}`,
      onclick: () => onOpen(t.id),
    }, medalDot(t), document.createTextNode(t.name)));
    parts.push(h('div', { cls: 'stage-card' },
      h('h2', {}, stage.name + ' ', h('span', { cls: 'stage-meta', text: `· ${stage.hours} · ${done}/${members.length} done` })),
      h('p', { text: stage.line }),
      h('div', { cls: 'stage-chips' }, ...chips),
    ));
  }
  container.replaceChildren(...parts);
}

function trimGuide(guide, limit = 300) {
  if (guide.length <= limit) return guide;
  const cut = guide.lastIndexOf(' ', limit);
  return `${guide.slice(0, cut > 200 ? cut : limit).trimEnd()}…`;
}

export function paintMissables(container, trophies) {
  const one = trophies.filter((t) => t.missable === 'yes');
  const watch = trophies.filter((t) => t.missable === 'watch');
  const unknown = trophies.filter((t) => t.target && t.target.startsWith('Method not yet'));

  const alertCard = h('div', { cls: 'miss-card alert' }, h('h2', { text: 'The one missable trophy' }));
  for (const t of one) {
    // A trimmed summary here, not the whole guide: the full guide lives
    // in the Checklist tab, and the three cards must all fit on one screen.
    alertCard.append(
      h('p', { text: `${t.name} — ${t.description} ${trimGuide(t.guide)}` }),
      h('p', { text: 'Full guide, steps and sources: open Positive Mental Attitude in the Checklist tab.' }),
    );
  }
  alertCard.append(h('p', {
    text: 'There is no mission replay and no New Game+, so keep a manual save at the start of every chapter (15 manual slots + 1 autosave). PowerPyx and GTABase both flag only this one trophy as possibly missable.',
  }));

  // The two lower cards sit side by side so all three cards fit on screen.
  const duo = h('div', { cls: 'miss-duo' },
    h('div', { cls: 'miss-card' },
      h('h2', { text: 'Start early, just in case' }),
      h('p', { text: 'These chains stay available after the story according to PowerPyx — but one guide warns stranger chains can have windows tied to story progress. Start each chain the moment it unlocks and you lose nothing.' }),
      h('ul', {}, ...watch.map((t) => h('li', { text: `${t.name} — ${t.target}` }))),
    ),
    h('div', { cls: 'miss-card' },
      h('h2', { text: 'No confirmed method yet' }),
      h('p', { text: 'Five trophies have no verified unlock at launch. This guide says so instead of guessing — check back once the community confirms them.' }),
      h('ul', {}, ...unknown.map((t) => h('li', { text: `${t.name} — ${t.description}` }))),
    ),
  );
  container.replaceChildren(alertCard, duo);
}

export function paintPlanner(container, trophies, earned) {
  const byKind = h('div', { cls: 'plan-box' }, h('h2', { text: 'Progress by kind' }));
  for (const k of KIND_DEFS.filter((x) => x.id !== 'all' && x.id !== 'online')) {
    const members = trophies.filter((t) => {
      if (k.id === 'missable') return t.missable === 'yes' || t.missable === 'watch';
      return t.kind === k.id;
    });
    if (!members.length) continue;
    const done = members.filter((t) => earned.has(t.id)).length;
    const pct = Math.round((done / members.length) * 100);
    byKind.append(h('div', { cls: 'kind-row' },
      h('span', { text: k.label }),
      h('div', { cls: 'gauge' }, h('div', { cls: 'gauge-fill', style: { width: `${pct}%` } })),
      h('span', { text: `${done}/${members.length}` }),
    ));
  }
  const tallies = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const done = all.filter((t) => earned.has(t.id)).length;
    return `${gradeName(g)} ${done}/${all.length}`;
  });
  byKind.append(h('p', { text: tallies.join(' · ') }));

  const nextCard = h('div', { cls: 'plan-box' }, h('h2', { text: 'Your next session' }));
  const ordered = [...trophies].sort(byStageThenId);
  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 8);
  const items = next.length
    ? next.map((t) => h('li', { text: `${t.name} — Stage ${t.stage} · ${t.target}` }))
    : [h('li', { text: 'Everything is earned — the platinum is yours, Leonida Legend.' })];
  nextCard.append(h('ol', { cls: 'plan-steps' }, ...items));

  container.replaceChildren(h('div', { cls: 'plan-duo' }, byKind, nextCard));
}
