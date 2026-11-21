// Leonida Platinum — boot and wiring.
// Loads data/trophies.json (same-origin, works offline), restores the
// reader's progress and settings from localStorage, paints every view,
// and wires the toolbar, the tabs and the guide pane. A ?demo=… parameter
// seeds a fixed 13-of-55 progress set for screenshots only; a normal
// visit never seeds anything.

import { applyFilters, gradeTallies } from './filters.js';
import {
  paintChips, paintList, paintGuide, paintRoadmap, paintMissables, paintPlanner,
} from './views.js';
import {
  getProgress, setProgress, getNotes, setNote, clearNotes,
  getPrefs, setPrefs, downloadExport, readExport,
} from './store.js';

const DEMO_EARNED = [2, 3, 4, 8, 9, 10, 16, 20, 21, 32, 35, 53, 54];
const NOTES_KEY = 'leonida-platinum-notes-v1';

function $(id) {
  return document.getElementById(id);
}

function collectNodes() {
  return {
    search: $('search'),
    chips: $('kind-chips'),
    grade: $('grade-filter'),
    spoiler: $('spoiler-toggle'),
    hideEarned: $('hide-earned-toggle'),
    theme: $('theme-toggle'),
    exportBtn: $('export-btn'),
    importBtn: $('import-btn'),
    importFile: $('import-file'),
    resetBtn: $('reset-btn'),
    list: $('trophy-list'),
    meta: $('list-meta'),
    pane: $('guide-pane'),
    count: $('earned-count'),
    fill: $('progress-fill'),
    note: $('progress-note'),
    grades: $('grade-counts'),
  };
}

async function boot() {
  const doc = await (await fetch('data/trophies.json')).json();
  const trophies = doc.trophies;
  const nodes = collectNodes();

  // One state object for the whole page: what the reader earned, their
  // notes, their saved preferences, and this visit's transient choices.
  const app = {
    trophies,
    earned: getProgress(),
    notes: getNotes(),
    prefs: getPrefs(),
    query: '',
    picked: null,
    tab: 'checklist',
  };

  function pickedTrophy() {
    return app.trophies.find((t) => t.id === app.picked) ?? null;
  }

  function visibleRows() {
    return applyFilters(app.trophies, {
      kind: app.prefs.kind,
      grade: app.prefs.grade,
      query: app.query,
      hideEarned: app.prefs.hideEarned,
      earned: app.earned,
    });
  }

  function paintHeader() {
    const total = app.trophies.length;
    const done = app.earned.size;
    const pct = Math.round((done / total) * 100);
    nodes.count.textContent = String(done);
    nodes.fill.style.width = `${pct}%`;
    nodes.note.textContent = done === total
      ? 'Platinum earned — you are a Leonida Legend.'
      : `${pct}% to the platinum`;
    nodes.grades.textContent = gradeTallies(app.trophies, app.earned).join(' · ');
  }

  function paintToolbar() {
    nodes.grade.value = app.prefs.grade;
    nodes.spoiler.checked = app.prefs.spoiler;
    nodes.hideEarned.checked = app.prefs.hideEarned;
    nodes.theme.textContent = app.prefs.theme === 'night' ? 'Paper' : 'Night';
    document.documentElement.setAttribute('data-theme', app.prefs.theme);
    paintChips(nodes.chips, app.prefs.kind, (kind) => {
      app.prefs.kind = kind;
      setPrefs(app.prefs);
      refresh();
    });
  }

  function showTab(tab) {
    app.tab = tab;
    for (const b of document.querySelectorAll('.views-nav button')) {
      b.classList.toggle('active', b.dataset.view === tab);
    }
    for (const section of document.querySelectorAll('main .pane')) {
      section.classList.toggle('active', section.id === `view-${tab}`);
    }
  }

  function refresh() {
    paintHeader();
    paintToolbar();
    paintList(nodes.list, nodes.meta, visibleRows(), {
      earned: app.earned,
      spoilerOn: app.prefs.spoiler,
      selectedId: app.picked,
    }, {
      onToggle: (id, checked) => {
        if (checked) app.earned.add(id);
        else app.earned.delete(id);
        setProgress(app.earned);
        refresh();
      },
      onSelect: (id) => {
        app.picked = id;
        refresh();
        nodes.pane.scrollIntoView({ block: 'nearest' });
      },
    });
    paintGuide(nodes.pane, pickedTrophy(), { earned: app.earned, notes: app.notes }, {
      onNote: (id, text) => {
        setNote(id, text);
        app.notes = getNotes();
      },
    });
    paintRoadmap($('roadmap-view'), app.trophies, app.earned, (id) => {
      app.picked = id;
      showTab('checklist');
      refresh();
    });
    paintMissables($('missables-view'), app.trophies);
    paintPlanner($('planner-view'), app.trophies, app.earned);
  }

  function savePrefs() {
    setPrefs(app.prefs);
  }

  nodes.search.addEventListener('input', () => {
    app.query = nodes.search.value;
    refresh();
  });
  nodes.grade.addEventListener('change', () => {
    app.prefs.grade = nodes.grade.value;
    savePrefs();
    refresh();
  });
  nodes.spoiler.addEventListener('change', () => {
    app.prefs.spoiler = nodes.spoiler.checked;
    savePrefs();
    refresh();
  });
  nodes.hideEarned.addEventListener('change', () => {
    app.prefs.hideEarned = nodes.hideEarned.checked;
    savePrefs();
    refresh();
  });
  nodes.theme.addEventListener('click', () => {
    app.prefs.theme = app.prefs.theme === 'night' ? 'paper' : 'night';
    savePrefs();
    refresh();
  });
  nodes.exportBtn.addEventListener('click', () => downloadExport(app.earned, app.notes));
  nodes.importBtn.addEventListener('click', () => nodes.importFile.click());
  nodes.importFile.addEventListener('change', async () => {
    const file = nodes.importFile.files[0];
    if (!file) return;
    try {
      const imported = readExport(await file.text());
      app.earned = imported.earned;
      app.notes = imported.notes;
      setProgress(app.earned);
      localStorage.setItem(NOTES_KEY, JSON.stringify(app.notes));
      refresh();
    } catch {
      alert('That file is not a Leonida Platinum progress export.');
    }
    nodes.importFile.value = '';
  });
  nodes.resetBtn.addEventListener('click', () => {
    if (!confirm('Clear all earned trophies and notes in this browser?')) return;
    app.earned = new Set();
    app.notes = {};
    app.picked = null;
    setProgress(app.earned);
    clearNotes();
    refresh();
  });
  for (const b of document.querySelectorAll('.views-nav button')) {
    b.addEventListener('click', () => {
      showTab(b.dataset.view);
      refresh();
    });
  }

  seedDemo(app, showTab);
  refresh();
}

// Demo states for screenshots (?demo=cover|roadmap|missables|spoiler).
// They only ever run when the parameter is present in the URL.
function seedDemo(app, showTab) {
  const demo = new URLSearchParams(location.search).get('demo');
  if (!demo) return;
  app.earned = new Set(DEMO_EARNED);
  if (demo === 'cover') {
    app.picked = 28;
    showTab('checklist');
  } else if (demo === 'roadmap') {
    showTab('roadmap');
  } else if (demo === 'missables') {
    showTab('missables');
  } else if (demo === 'spoiler') {
    app.prefs.spoiler = true;
    app.picked = 35;
    showTab('checklist');
  }
}

boot();
