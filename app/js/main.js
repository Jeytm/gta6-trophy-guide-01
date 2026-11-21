// Leonida Platinum — boot, wiring and demo states.
// Loads data/trophies.json (same-origin, works offline), restores progress
// and settings from localStorage, renders every view, and wires the
// toolbar, tabs and detail pane. A ?demo=… parameter seeds a fixed
// 13-of-55 progress set for screenshots only; normal visits never seed.

import { filterTrophies, gradeCounts } from './filters.js';
import {
  renderChips, renderList, renderDetail, renderRoadmap, renderMissables, renderPlanner,
} from './views.js';
import {
  loadProgress, saveProgress, loadNotes, saveNote, loadSettings, saveSettings,
  exportFile, parseImportFile,
} from './store.js';

const DEMO_EARNED = [2, 3, 4, 8, 9, 10, 16, 20, 21, 32, 35, 53, 54];

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const state = {
  earned: loadProgress(),
  notes: loadNotes(),
  settings: loadSettings(),
  query: '',
  selectedId: null,
  view: 'checklist',
};

const $ = (id) => document.getElementById(id);
const els = {
  search: $('search'), chips: $('kind-chips'), grade: $('grade-filter'),
  spoiler: $('spoiler-toggle'), hideEarned: $('hide-earned-toggle'), theme: $('theme-toggle'),
  exportBtn: $('export-btn'), importBtn: $('import-btn'), importFile: $('import-file'),
  resetBtn: $('reset-btn'), list: $('trophy-list'), meta: $('list-meta'),
  pane: $('detail-pane'), earnedCount: $('earned-count'),
  fill: $('progress-fill'), note: $('progress-note'), gradeCounts: $('grade-counts'),
};

function currentTrophy() {
  return trophies.find((t) => t.id === state.selectedId) ?? null;
}

function visibleTrophies() {
  return filterTrophies(trophies, {
    kind: state.settings.kind,
    grade: state.settings.grade,
    query: state.query,
    hideEarned: state.settings.hideEarned,
    earned: state.earned,
  });
}

function renderAll() {
  const earned = state.earned;
  els.earnedCount.textContent = String(earned.size);
  els.fill.style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  els.note.textContent = earned.size === trophies.length
    ? 'Platinum earned — you are a Leonida Legend.'
    : `${Math.round((earned.size / trophies.length) * 100)}% to the platinum`;
  els.gradeCounts.textContent = gradeCounts(trophies, earned).join(' · ');
  renderChips(els.chips, state.settings.kind, (kind) => {
    state.settings.kind = kind;
    saveSettings(state.settings);
    renderAll();
  });
  els.grade.value = state.settings.grade;
  els.spoiler.checked = state.settings.spoiler;
  els.hideEarned.checked = state.settings.hideEarned;
  els.theme.textContent = state.settings.theme === 'night' ? 'Paper' : 'Night';
  document.documentElement.setAttribute('data-theme', state.settings.theme);
  renderList(els.list, els.meta, visibleTrophies(), {
    earned, spoilerOn: state.settings.spoiler, selectedId: state.selectedId,
  }, {
    onToggle: (id, checked) => {
      if (checked) earned.add(id);
      else earned.delete(id);
      saveProgress(earned);
      renderAll();
    },
    onSelect: (id) => {
      state.selectedId = id;
      renderAll();
      els.pane.scrollIntoView({ block: 'nearest' });
    },
  });
  renderDetail(els.pane, currentTrophy(), { earned, notes: state.notes }, {
    onNote: (id, text) => {
      saveNote(id, text);
      state.notes = loadNotes();
    },
  });
  renderRoadmap($('roadmap-view'), trophies, earned, (id) => {
    state.selectedId = id;
    switchView('checklist');
  });
  renderMissables($('missables-view'), trophies);
  renderPlanner($('planner-view'), trophies, earned);
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tabs button').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('main .view').forEach((s) => {
    s.classList.toggle('active', s.id === `view-${view}`);
  });
}

els.search.addEventListener('input', () => {
  state.query = els.search.value;
  renderAll();
});
els.grade.addEventListener('change', () => {
  state.settings.grade = els.grade.value;
  saveSettings(state.settings);
  renderAll();
});
els.spoiler.addEventListener('change', () => {
  state.settings.spoiler = els.spoiler.checked;
  saveSettings(state.settings);
  renderAll();
});
els.hideEarned.addEventListener('change', () => {
  state.settings.hideEarned = els.hideEarned.checked;
  saveSettings(state.settings);
  renderAll();
});
els.theme.addEventListener('click', () => {
  state.settings.theme = state.settings.theme === 'night' ? 'paper' : 'night';
  saveSettings(state.settings);
  renderAll();
});
els.exportBtn.addEventListener('click', () => exportFile(state.earned, state.notes));
els.importBtn.addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', async () => {
  const file = els.importFile.files[0];
  if (!file) return;
  try {
    const { earned, notes } = parseImportFile(await file.text());
    state.earned = earned;
    state.notes = notes;
    saveProgress(earned);
    localStorage.setItem('leonida-platinum-notes-v1', JSON.stringify(notes));
    renderAll();
  } catch {
    alert('That file is not a Leonida Platinum progress export.');
  }
  els.importFile.value = '';
});
els.resetBtn.addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and notes in this browser?')) return;
  state.earned = new Set();
  state.notes = {};
  state.selectedId = null;
  saveProgress(state.earned);
  localStorage.setItem('leonida-platinum-notes-v1', JSON.stringify({}));
  renderAll();
});
document.querySelectorAll('.tabs button').forEach((b) => {
  b.addEventListener('click', () => switchView(b.dataset.view));
});

// Demo states for screenshots (?demo=cover|roadmap|missables|spoiler).
// They only ever run when the parameter is present in the URL.
const demo = new URLSearchParams(location.search).get('demo');
if (demo) {
  state.earned = new Set(DEMO_EARNED);
  if (demo === 'cover') {
    state.selectedId = 28;
    switchView('checklist');
  } else if (demo === 'roadmap') {
    switchView('roadmap');
  } else if (demo === 'missables') {
    switchView('missables');
  } else if (demo === 'spoiler') {
    state.settings.spoiler = true;
    state.selectedId = 35;
    switchView('checklist');
  }
}

renderAll();
