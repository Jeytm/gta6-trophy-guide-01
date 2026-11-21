// Progress, notes and settings for Leonida Platinum.
// Everything lives in localStorage on the reader's own browser; nothing
// is sent anywhere. Export writes one JSON file; import reads one back.

export const PROGRESS_KEY = 'leonida-platinum-progress-v1';
export const NOTES_KEY = 'leonida-platinum-notes-v1';
export const SETTINGS_KEY = 'leonida-platinum-settings-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

export function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch {
    return {};
  }
}

export function saveNote(id, text) {
  const notes = loadNotes();
  if (text.trim() === '') delete notes[id];
  else notes[id] = text;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadSettings() {
  const defaults = { spoiler: false, theme: 'paper', kind: 'all', grade: 'all', hideEarned: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportFile(progress, notes) {
  const payload = {
    app: 'leonida-platinum',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...progress].sort((a, b) => a - b),
    notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(text) {
  const data = JSON.parse(text);
  // Accept our own export shape, or a bare array of earned trophy ids.
  if (Array.isArray(data)) return { earned: new Set(data.filter(Number.isInteger)), notes: {} };
  if (data && Array.isArray(data.earned)) {
    const notes = data.notes && typeof data.notes === 'object' ? data.notes : {};
    return { earned: new Set(data.earned.filter(Number.isInteger)), notes };
  }
  throw new Error('Not a Leonida Platinum progress file.');
}
