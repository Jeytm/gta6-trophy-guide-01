// Leonida Platinum — saved progress, notes and settings.
// The reader's checklist lives in their own browser's localStorage.
// Nothing here is sent anywhere. Export writes one JSON file that
// import can read back; a bare array of earned ids is accepted too,
// so an older or hand-made export still loads.

const PROGRESS_KEY = 'leonida-platinum-progress-v1';
const NOTES_KEY = 'leonida-platinum-notes-v1';
const SETTINGS_KEY = 'leonida-platinum-settings-v1';

function jsonGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function jsonSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function asIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((n) => Number.isInteger(n));
}

export function getProgress() {
  return new Set(asIdList(jsonGet(PROGRESS_KEY, [])));
}

export function setProgress(earned) {
  const ids = [...earned].sort((a, b) => a - b);
  jsonSet(PROGRESS_KEY, ids);
}

export function getNotes() {
  const notes = jsonGet(NOTES_KEY, {});
  return notes && typeof notes === 'object' ? notes : {};
}

export function setNote(id, text) {
  const notes = getNotes();
  if (text.trim() === '') {
    delete notes[id];
  } else {
    notes[id] = text;
  }
  jsonSet(NOTES_KEY, notes);
}

export function clearNotes() {
  jsonSet(NOTES_KEY, {});
}

export function getPrefs() {
  const defaults = {
    spoiler: false,
    theme: 'paper',
    kind: 'all',
    grade: 'all',
    hideEarned: false,
  };
  const saved = jsonGet(SETTINGS_KEY, null);
  if (!saved || typeof saved !== 'object') return defaults;
  return { ...defaults, ...saved };
}

export function setPrefs(prefs) {
  jsonSet(SETTINGS_KEY, prefs);
}

export function downloadExport(progress, notes) {
  const payload = {
    app: 'leonida-platinum',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...progress].sort((a, b) => a - b),
    notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-platinum-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function readExport(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) {
    return { earned: new Set(asIdList(data)), notes: {} };
  }
  if (data && Array.isArray(data.earned)) {
    const notes = data.notes && typeof data.notes === 'object' ? data.notes : {};
    return { earned: new Set(asIdList(data.earned)), notes };
  }
  throw new Error('Not a Leonida Platinum progress file.');
}
