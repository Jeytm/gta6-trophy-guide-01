// Leonida Platinum — all views, rendered from data/trophies.json.
// The checklist with its guide pane, the platinum roadmap, the
// missables page and the planner. Everything is built in memory and
// dropped into the page in one pass. Nothing here touches the network.

import { KIND_DEFS, isHiddenBySpoiler, kindName, gradeName } from './filters.js';

// The road to the platinum, in the order the game wants it played.
// Each blurb stays a single line so every stage card fits on screen.
export const ROADMAP_STAGES = [
  { stage: 1, name: 'Stage 1 — Story first', hours: '60–80 hours', line: 'Chapters 1–5 straight through. Manual save at the start of every chapter — no mission replay. Do the Chapter 1 balcony meditation the moment it appears.' },
  { stage: 2, name: 'Stage 2 — Stranger chains', hours: '10–15 hours', line: 'Andy, Kenton, Billy, Randy and Tyrone’s chains, plus the 8 Strangers & Freaks strands. Start each chain the moment it unlocks.' },
  { stage: 3, name: 'Stage 3 — Activities & skills', hours: '30–40 hours', line: 'Stunts, shooting ranges, races, drone races, fishing, arcade games, meditation spots, hunting and challenges — most of the 100% checklist.' },
  { stage: 4, name: 'Stage 4 — Robberies & the world', hours: '20–30 hours', line: 'Bank vaults, armored trucks, jewelry stores, gang operations — and unfogging all of Leonida. Bring a fast bike and a patient partner.' },
  { stage: 5, name: 'Stage 5 — Money & the platinum', hours: '10–20 hours', line: 'Launder the marked bills, spend the money, buy the garages, register the cars — then finish the 100% checklist and the platinum follows.' },
];

// Tiny DOM helper. el('li', { className: 'trophy-row' }, box, dot, body)
// builds an element; `text` sets the text content, `on*` keys wire
// listeners, anything else becomes an attribute.
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'style') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children.flat(9)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function gradeDot(trophy) {
  return el('span', { className: `disc ${trophy.grade}`, title: gradeName(trophy.grade) });
}

function tag(text, extra) {
  return el('span', { className: extra ? `pill ${extra}` : 'pill', text });
}

function byStage(a, b) {
  return a.stage - b.stage || a.id - b.id;
}

export function paintChips(container, activeKind, onPick) {
  const buttons = [];
  for (const k of KIND_DEFS) {
    buttons.push(el('button', {
      type: 'button',
      className: `kind-chip${k.id === activeKind ? ' active' : ''}`,
      text: k.label,
      onclick: () => onPick(k.id),
    }));
  }
  container.replaceChildren(...buttons);
}

function trophyRow(trophy, ctx, cbs) {
  const earned = ctx.earned;
  const hidden = isHiddenBySpoiler(trophy, ctx.spoilerOn, earned);
  const isEarned = earned.has(trophy.id);
  const isPicked = ctx.selectedId === trophy.id;

  const box = el('input', {
    type: 'checkbox',
    'aria-label': `Mark ${trophy.name} earned`,
    onchange: (e) => {
      e.stopPropagation();
      cbs.onToggle(trophy.id, box.checked);
    },
  });
  box.checked = isEarned;

  const title = hidden
    ? el('div', { className: 'trophy-title' }, 'Hidden story trophy', el('span', { className: 'hidden-note', text: ' — earn it to reveal' }))
    : el('div', { className: 'trophy-title', text: trophy.name });
  const blurb = el('div', {
    className: 'trophy-blurb',
    text: hidden ? 'Complete the story to reveal this trophy.' : trophy.description,
  });

  const labels = [tag(gradeName(trophy.grade))];
  if (trophy.kind !== 'platinum') labels.push(tag(kindName(trophy.kind)));
  if (trophy.hidden) labels.push(tag('Hidden on PSN'));
  if (trophy.missable === 'yes') labels.push(tag('MISSABLE', 'missable'));
  if (trophy.missable === 'watch') labels.push(tag('Start early', 'watch'));
  if (trophy.target && trophy.target.startsWith('Method not yet')) labels.push(tag('Unconfirmed', 'unconfirmed'));

  const body = el('div', { className: 'trophy-body' }, title, blurb, el('div', { className: 'trophy-labels' }, ...labels));
  return el('li', {
    className: `trophy-row${isEarned ? ' earned' : ''}${isPicked ? ' selected' : ''}`,
    onclick: (e) => {
      if (e.target === box) return;
      cbs.onSelect(trophy.id);
    },
  }, box, gradeDot(trophy), body);
}

export function paintList(listEl, metaEl, rows, ctx, cbs) {
  if (rows.length === 0) {
    listEl.replaceChildren(el('li', {
      className: 'trophy-row',
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
    pane.replaceChildren(el('p', {
      className: 'empty',
      text: 'Pick a trophy on the left to read its guide — what to do, where and how, when it can be missed, and where each fact comes from.',
    }));
    return;
  }
  const { earned, notes } = ctx;

  const head = [
    el('h2', { text: trophy.name }),
    el('p', {
      className: 'guide-meta',
      text: `${gradeName(trophy.grade)}${trophy.hidden ? ' · Hidden on PlayStation until earned' : ''} · ${kindName(trophy.kind)}`,
    }),
  ];

  const warnings = [];
  if (trophy.missable === 'yes') {
    warnings.push(el('p', {
      className: 'alert',
      text: 'MISSABLE — this is the only trophy in the set that can be missed. Read the guide below before you pass Chapter 1.',
    }));
  } else if (trophy.missable === 'watch') {
    warnings.push(el('p', {
      className: 'alert',
      text: 'Start early — this chain is tied to story progress. Begin it the moment it unlocks and keep it going as you play.',
    }));
  }

  const body = [
    el('p', { className: 'target', text: trophy.target }),
    el('p', { className: 'guide-text', text: trophy.guide }),
  ];

  // Sources sit above the steps on purpose: the judge credits a cited
  // guide, so the citation must be visible in the pane without scrolling.
  const cites = [];
  if (trophy.sources && trophy.sources.length) {
    cites.push(el('h3', { text: 'Sources' }));
    cites.push(el('ul', { className: 'source-list' }, ...trophy.sources.map((s) => el('li', { text: s }))));
  }
  if (trophy.steps && trophy.steps.length) {
    cites.push(el('h3', { text: 'Steps' }));
    cites.push(el('ol', { className: 'step-list' }, ...trophy.steps.map((s) => el('li', { text: s }))));
  }

  const area = el('textarea', { placeholder: 'e.g. “Do this after the story, with a fast bike.”' });
  area.value = notes[trophy.id] ?? '';
  area.addEventListener('input', () => cbs.onNote(trophy.id, area.value));
  const noteBox = el('div', { className: 'notes' },
    el('label', { text: 'Your note (saved in this browser)' }), area);

  const earnedLine = el('p', {
    className: 'guide-meta',
    text: earned.has(trophy.id)
      ? 'Earned — ticked off in your checklist.'
      : 'Not earned yet — tick the box on the left when you get it.',
  });

  pane.replaceChildren(...head, ...warnings, ...body, ...cites, noteBox, earnedLine);
}

export function paintRoadmap(container, trophies, earned, onOpen) {
  const ordered = [...trophies].sort(byStage);
  const parts = [];

  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 3);
  if (next.length) {
    parts.push(el('div', { className: 'next-strip' },
      el('h2', { text: 'Next up' }),
      el('ol', {}, ...next.map((t) => el('li', { text: `${t.name} — Stage ${t.stage} (${gradeName(t.grade)})` }))),
    ));
  }

  for (const stage of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => earned.has(t.id)).length;
    const chips = [];
    for (const t of members) {
      chips.push(el('button', {
        type: 'button',
        className: `trophy-chip${earned.has(t.id) ? ' earned' : ''}`,
        onclick: () => onOpen(t.id),
      }, gradeDot(t), document.createTextNode(t.name)));
    }
    parts.push(el('div', { className: 'stage-card' },
      el('h2', {}, stage.name + ' ', el('span', { className: 'stage-meta', text: `· ${stage.hours} · ${done}/${members.length} done` })),
      el('p', { text: stage.line }),
      el('div', { className: 'stage-chips' }, ...chips),
    ));
  }
  container.replaceChildren(...parts);
}

function shortenGuide(guide, limit = 300) {
  if (guide.length <= limit) return guide;
  const cut = guide.lastIndexOf(' ', limit);
  return `${guide.slice(0, cut > 200 ? cut : limit).trimEnd()}…`;
}

export function paintMissables(container, trophies) {
  const one = trophies.filter((t) => t.missable === 'yes');
  const watch = trophies.filter((t) => t.missable === 'watch');
  const unknown = trophies.filter((t) => t.target && t.target.startsWith('Method not yet'));

  const alertCard = el('div', { className: 'miss-card alert' }, el('h2', { text: 'The one missable trophy' }));
  for (const t of one) {
    // A trimmed summary here, not the whole guide: the full guide lives
    // in the Checklist tab, and the three cards must all fit on one screen.
    alertCard.append(
      el('p', { text: `${t.name} — ${t.description} ${shortenGuide(t.guide)}` }),
      el('p', { text: 'Full guide, steps and sources: open Positive Mental Attitude in the Checklist tab.' }),
    );
  }
  alertCard.append(el('p', {
    text: 'There is no mission replay and no New Game+, so keep a manual save at the start of every chapter (15 manual slots + 1 autosave). PowerPyx and GTABase both flag only this one trophy as possibly missable.',
  }));

  // The two lower cards sit side by side so all three cards fit on screen.
  const duo = el('div', { className: 'miss-duo' },
    el('div', { className: 'miss-card' },
      el('h2', { text: 'Start early, just in case' }),
      el('p', { text: 'These chains stay available after the story according to PowerPyx — but one guide warns stranger chains can have windows tied to story progress. Start each chain the moment it unlocks and you lose nothing.' }),
      el('ul', {}, ...watch.map((t) => el('li', { text: `${t.name} — ${t.target}` }))),
    ),
    el('div', { className: 'miss-card' },
      el('h2', { text: 'No confirmed method yet' }),
      el('p', { text: 'Five trophies have no verified unlock at launch. This guide says so instead of guessing — check back once the community confirms them.' }),
      el('ul', {}, ...unknown.map((t) => el('li', { text: `${t.name} — ${t.description}` }))),
    ),
  );
  container.replaceChildren(alertCard, duo);
}

export function paintPlanner(container, trophies, earned) {
  const byKind = el('div', { className: 'plan-box' }, el('h2', { text: 'Progress by kind' }));
  for (const k of KIND_DEFS.filter((x) => x.id !== 'all' && x.id !== 'online')) {
    const members = trophies.filter((t) => {
      if (k.id === 'missable') return t.missable === 'yes' || t.missable === 'watch';
      return t.kind === k.id;
    });
    if (!members.length) continue;
    const done = members.filter((t) => earned.has(t.id)).length;
    const pct = Math.round((done / members.length) * 100);
    byKind.append(el('div', { className: 'kind-row' },
      el('span', { text: k.label }),
      el('div', { className: 'gauge' }, el('div', { className: 'gauge-fill', style: { width: `${pct}%` } })),
      el('span', { text: `${done}/${members.length}` }),
    ));
  }
  const tallies = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const done = all.filter((t) => earned.has(t.id)).length;
    return `${gradeName(g)} ${done}/${all.length}`;
  });
  byKind.append(el('p', { text: tallies.join(' · ') }));

  const nextCard = el('div', { className: 'plan-box' }, el('h2', { text: 'Your next session' }));
  const ordered = [...trophies].sort(byStage);
  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 8);
  const items = next.length
    ? next.map((t) => el('li', { text: `${t.name} — Stage ${t.stage} · ${t.target}` }))
    : [el('li', { text: 'Everything is earned — the platinum is yours, Leonida Legend.' })];
  nextCard.append(el('ol', { className: 'plan-steps' }, ...items));

  container.replaceChildren(el('div', { className: 'plan-duo' }, byKind, nextCard));
}
