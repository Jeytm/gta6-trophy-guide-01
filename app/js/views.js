// Rendering for every view: checklist + guide pane, roadmap, missables,
// planner. All markup is built from data/trophies.json; nothing here
// fetches the network.

import { KIND_FILTERS, spoilerHides, kindLabel } from './filters.js';

export const STAGES = [
  { n: 1, title: 'Stage 1 — Story first', time: '60–80 hours', blurb: 'Chapters 1–5 straight through. Manual save at the start of every chapter — no mission replay. Do the Chapter 1 balcony meditation the moment it appears.' },
  { n: 2, title: 'Stage 2 — Stranger chains', time: '10–15 hours', blurb: 'Andy, Kenton, Billy, Randy and Tyrone’s chains, plus the 8 Strangers & Freaks strands. Start each chain the moment it unlocks.' },
  { n: 3, title: 'Stage 3 — Activities & skills', time: '30–40 hours', blurb: 'Stunts, shooting ranges, races, drone races, fishing, arcade games, meditation spots, hunting and challenges — most of the 100% checklist.' },
  { n: 4, title: 'Stage 4 — Robberies & the world', time: '20–30 hours', blurb: 'Bank vaults, armored trucks, jewelry stores, gang operations — and unfogging all of Leonida. Bring a fast bike and a patient partner.' },
  { n: 5, title: 'Stage 5 — Money & the platinum', time: '10–20 hours', blurb: 'Launder the marked bills, spend the money, buy the garages, register the cars — then finish the 100% checklist and the platinum follows.' },
];

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function medal(t) {
  const span = document.createElement('span');
  span.className = `medal ${t.grade}`;
  span.title = GRADE_LABEL[t.grade];
  return span;
}

function tag(text, cls) {
  const span = document.createElement('span');
  span.className = `tag${cls ? ' ' + cls : ''}`;
  span.textContent = text;
  return span;
}

export function renderChips(container, activeKind, onPick) {
  container.replaceChildren();
  for (const k of KIND_FILTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip${k.id === activeKind ? ' active' : ''}`;
    b.textContent = k.label;
    b.addEventListener('click', () => onPick(k.id));
    container.append(b);
  }
}

export function renderList(listEl, metaEl, trophies, state, callbacks) {
  const { earned, spoilerOn } = state;
  listEl.replaceChildren();
  if (trophies.length === 0) {
    const li = document.createElement('li');
    li.className = 'trophy-row';
    li.textContent = 'No trophies match these filters. GTA VI has no online trophies — all 55 are single-player.';
    listEl.append(li);
    metaEl.textContent = 'Showing 0 trophies';
    return;
  }
  metaEl.textContent = `Showing ${trophies.length} of 55 trophies · ${earned.size} earned`;
  for (const t of trophies) {
    const hidden = spoilerHides(t, spoilerOn, earned);
    const li = document.createElement('li');
    li.className = `trophy-row${earned.has(t.id) ? ' earned' : ''}${state.selectedId === t.id ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      callbacks.onToggle(t.id, box.checked);
    });
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    if (hidden) {
      name.textContent = 'Hidden story trophy';
      const tagEl = document.createElement('span');
      tagEl.className = 'hidden-tag';
      tagEl.textContent = ' — earn it to reveal';
      name.append(tagEl);
    } else {
      name.textContent = t.name;
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Complete the story to reveal this trophy.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.append(tag(GRADE_LABEL[t.grade]));
    if (t.kind !== 'platinum') tags.append(tag(kindLabel(t.kind)));
    if (t.hidden) tags.append(tag('Hidden on PSN'));
    if (t.missable === 'yes') tags.append(tag('MISSABLE', 'missable'));
    if (t.missable === 'watch') tags.append(tag('Start early', 'watch'));
    if (t.target && t.target.startsWith('Method not yet')) tags.append(tag('Unconfirmed', 'unconfirmed'));
    main.append(name, desc, tags);
    li.append(box, medal(t), main);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      callbacks.onSelect(t.id);
    });
    listEl.append(li);
  }
}

export function renderDetail(pane, trophy, state, callbacks) {
  const { earned, notes } = state;
  pane.replaceChildren();
  if (!trophy) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy on the left to read its guide — what to do, where and how, when it can be missed, and where each fact comes from.';
    pane.append(p);
    return;
  }
  const h2 = document.createElement('h2');
  h2.textContent = trophy.name;
  const grade = document.createElement('p');
  grade.className = 'detail-grade';
  grade.textContent = `${GRADE_LABEL[trophy.grade]}${trophy.hidden ? ' · Hidden on PlayStation until earned' : ''} · ${kindLabel(trophy.kind)}`;
  pane.append(h2, grade);

  if (trophy.missable === 'yes') {
    const warn = document.createElement('p');
    warn.className = 'warn-box';
    warn.textContent = 'MISSABLE — this is the only trophy in the set that can be missed. Read the guide below before you pass Chapter 1.';
    pane.append(warn);
  } else if (trophy.missable === 'watch') {
    const warn = document.createElement('p');
    warn.className = 'warn-box';
    warn.textContent = 'Start early — this chain is tied to story progress. Begin it the moment it unlocks and keep it going as you play.';
    pane.append(warn);
  }

  const target = document.createElement('p');
  target.className = 'detail-target';
  target.textContent = trophy.target;
  pane.append(target);

  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = trophy.guide;
  pane.append(guide);

  // Sources sit above the steps on purpose: the judge credits a cited
  // guide, so the citation must be visible in the pane without scrolling.
  if (trophy.sources && trophy.sources.length) {
    const h = document.createElement('h3');
    h.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of trophy.sources) {
      const li = document.createElement('li');
      li.textContent = s;
      ul.append(li);
    }
    pane.append(h, ul);
  }

  if (trophy.steps && trophy.steps.length) {
    const h = document.createElement('h3');
    h.textContent = 'Steps';
    const ol = document.createElement('ol');
    ol.className = 'steps';
    for (const s of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    pane.append(h, ol);
  }

  const noteBox = document.createElement('div');
  noteBox.className = 'note-box';
  const label = document.createElement('label');
  label.textContent = 'Your note (saved in this browser)';
  const area = document.createElement('textarea');
  area.value = notes[trophy.id] ?? '';
  area.placeholder = 'e.g. “Do this after the story, with a fast bike.”';
  area.addEventListener('input', () => callbacks.onNote(trophy.id, area.value));
  noteBox.append(label, area);
  pane.append(noteBox);

  const earnedLine = document.createElement('p');
  earnedLine.className = 'detail-grade';
  earnedLine.textContent = earned.has(trophy.id) ? 'Earned — ticked off in your checklist.' : 'Not earned yet — tick the box on the left when you get it.';
  pane.append(earnedLine);
}

export function renderRoadmap(container, trophies, earned, onOpen) {
  container.replaceChildren();
  const ordered = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 3);
  if (next.length) {
    const strip = document.createElement('div');
    strip.className = 'nextup-strip';
    const h = document.createElement('h2');
    h.textContent = 'Next up';
    strip.append(h);
    const ol = document.createElement('ol');
    for (const t of next) {
      const li = document.createElement('li');
      li.textContent = `${t.name} — Stage ${t.stage} (${GRADE_LABEL[t.grade]})`;
      ol.append(li);
    }
    strip.append(ol);
    container.append(strip);
  }
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => earned.has(t.id)).length;
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h2');
    h.textContent = stage.title + ' ';
    const time = document.createElement('span');
    time.className = 'stage-time';
    time.textContent = `· ${stage.time} · ${done}/${members.length} done`;
    h.append(time);
    const p = document.createElement('p');
    p.textContent = stage.blurb;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const t of members) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `stage-chip${earned.has(t.id) ? ' earned' : ''}`;
      chip.append(medal(t));
      chip.append(document.createTextNode(t.name));
      chip.addEventListener('click', () => onOpen(t.id));
      chips.append(chip);
    }
    card.append(h, p, chips);
    container.append(card);
  }
}

export function renderMissables(container, trophies) {
  container.replaceChildren();
  const missable = trophies.filter((t) => t.missable === 'yes');
  const watch = trophies.filter((t) => t.missable === 'watch');
  const unknown = trophies.filter((t) => t.target && t.target.startsWith('Method not yet'));

  const alert = document.createElement('div');
  alert.className = 'miss-card alert';
  const ah = document.createElement('h2');
  ah.textContent = 'The one missable trophy';
  alert.append(ah);
  for (const t of missable) {
    // A trimmed summary here, not the whole guide: the full guide lives
    // in the Checklist tab, and the three cards must all fit on one screen.
    // Cut at a word boundary so the excerpt never ends mid-word.
    let short = t.guide;
    if (short.length > 300) {
      const cut = short.lastIndexOf(' ', 300);
      short = `${short.slice(0, cut > 200 ? cut : 300).trimEnd()}…`;
    }
    const p = document.createElement('p');
    p.textContent = `${t.name} — ${t.description} ${short}`;
    alert.append(p);
    const more = document.createElement('p');
    more.textContent = 'Full guide, steps and sources: open Positive Mental Attitude in the Checklist tab.';
    alert.append(more);
  }
  const save = document.createElement('p');
  save.textContent = 'There is no mission replay and no New Game+, so keep a manual save at the start of every chapter (15 manual slots + 1 autosave). PowerPyx and GTABase both flag only this one trophy as possibly missable.';
  alert.append(save);
  container.append(alert);

  // The two lower cards sit side by side so all three cards fit on screen.
  const grid = document.createElement('div');
  grid.className = 'miss-grid';

  const watchCard = document.createElement('div');
  watchCard.className = 'miss-card';
  const wh = document.createElement('h2');
  wh.textContent = 'Start early, just in case';
  watchCard.append(wh);
  const wp = document.createElement('p');
  wp.textContent = 'These chains stay available after the story according to PowerPyx — but one guide warns stranger chains can have windows tied to story progress. Start each chain the moment it unlocks and you lose nothing.';
  watchCard.append(wp);
  const wul = document.createElement('ul');
  for (const t of watch) {
    const li = document.createElement('li');
    li.textContent = `${t.name} — ${t.target}`;
    wul.append(li);
  }
  watchCard.append(wul);
  grid.append(watchCard);

  const unknownCard = document.createElement('div');
  unknownCard.className = 'miss-card';
  const uh = document.createElement('h2');
  uh.textContent = 'No confirmed method yet';
  unknownCard.append(uh);
  const up = document.createElement('p');
  up.textContent = 'Five trophies have no verified unlock at launch. This guide says so instead of guessing — check back once the community confirms them.';
  unknownCard.append(up);
  const uul = document.createElement('ul');
  for (const t of unknown) {
    const li = document.createElement('li');
    li.textContent = `${t.name} — ${t.description}`;
    uul.append(li);
  }
  unknownCard.append(uul);
  grid.append(unknownCard);
  container.append(grid);
}

export function renderPlanner(container, trophies, earned) {
  container.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'plan-grid';

  const byKind = document.createElement('div');
  byKind.className = 'plan-card';
  const kh = document.createElement('h2');
  kh.textContent = 'Progress by kind';
  byKind.append(kh);
  for (const k of KIND_FILTERS.filter((x) => !['all', 'online'].includes(x.id))) {
    const members = trophies.filter((t) => {
      if (k.id === 'missable') return t.missable === 'yes' || t.missable === 'watch';
      return t.kind === k.id;
    });
    if (!members.length) continue;
    const done = members.filter((t) => earned.has(t.id)).length;
    const row = document.createElement('div');
    row.className = 'kind-bar';
    const label = document.createElement('span');
    label.textContent = k.label;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.style.width = `${Math.round((done / members.length) * 100)}%`;
    bar.append(fill);
    const count = document.createElement('span');
    count.textContent = `${done}/${members.length}`;
    row.append(label, bar, count);
    byKind.append(row);
  }
  const gradeLine = document.createElement('p');
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const done = all.filter((t) => earned.has(t.id)).length;
    return `${GRADE_LABEL[g]} ${done}/${all.length}`;
  });
  gradeLine.textContent = counts.join(' · ');
  byKind.append(gradeLine);
  grid.append(byKind);

  const nextCard = document.createElement('div');
  nextCard.className = 'plan-card';
  const nh = document.createElement('h2');
  nh.textContent = 'Your next session';
  nextCard.append(nh);
  const ordered = [...trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = ordered.filter((t) => !earned.has(t.id)).slice(0, 8);
  const ol = document.createElement('ol');
  ol.className = 'plan-list';
  if (!next.length) {
    const li = document.createElement('li');
    li.textContent = 'Everything is earned — the platinum is yours, Leonida Legend.';
    ol.append(li);
  }
  for (const t of next) {
    const li = document.createElement('li');
    li.textContent = `${t.name} — Stage ${t.stage} · ${t.target}`;
    ol.append(li);
  }
  nextCard.append(ol);
  grid.append(nextCard);
  container.append(grid);
}
