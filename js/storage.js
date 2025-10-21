// js/storage.js
// -----------------------------------------------------------------------------
// Storage helpers for Pocket Classroom (module)
// Responsibilities:
//  - Provide simple LocalStorage-backed persistence for capsules, index, and progress.
//  - Export/import capsule JSON with schema validation.
//  - Expose developer helpers on window.pcStorage for convenience during development.
// -----------------------------------------------------------------------------


const IDX_KEY = 'pc_capsules_index';
const CAP_KEY = id => `pc_capsule_${id}`;
const PROG_KEY = id => `pc_progress_${id}`;


function safeParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}


export function generateId() {

  const t = Date.now();
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `cap_${t}_${r}`;
}


export function loadIndex() {
  const raw = localStorage.getItem(IDX_KEY);
  const parsed = safeParse(raw, []);

  return Array.isArray(parsed) ? parsed : [];
}

export function saveIndex(idx = []) {
  if (!Array.isArray(idx)) throw new Error('saveIndex expects array');
  localStorage.setItem(IDX_KEY, JSON.stringify(idx));
}


export function loadCap(id) {
  if (!id) return null;
  const raw = localStorage.getItem(CAP_KEY(id));
  return safeParse(raw, null);
}

export function saveCap(cap) {
  if (!cap || typeof cap !== 'object') throw new Error('saveCap expects an object');
  if (!cap.id) cap.id = generateId();

  const now = new Date().toISOString();
  if (!cap.meta) cap.meta = {};
  if (!cap.meta.createdAt) cap.meta.createdAt = now;
  cap.meta.updatedAt = now;


  cap.schema = cap.schema || 'pocket-classroom/v1';

  localStorage.setItem(CAP_KEY(cap.id), JSON.stringify(cap));
  
  upsertIndexEntryFromCap(cap);
  return cap.id;
}


export function deleteCap(id) {
  if (!id) return false;
  localStorage.removeItem(CAP_KEY(id));
  localStorage.removeItem(PROG_KEY(id));

  const idx = loadIndex().filter(e => e.id !== id);
  saveIndex(idx);
  return true;
}


export function loadProg(id) {
  if (!id) return {};
  const raw = localStorage.getItem(PROG_KEY(id));
  return safeParse(raw, {});
}

export function saveProg(id, prog = {}) {
  if (!id) throw new Error('saveProg requires id');
  const copy = { ...loadProg(id), ...prog };
  localStorage.setItem(PROG_KEY(id), JSON.stringify(copy));
  return copy;
}


export function upsertIndexEntryFromCap(cap) {
  if (!cap || !cap.id) return;
  const idx = loadIndex();
  const meta = cap.meta || {};
  const entry = {
    id: cap.id,
    title: meta.title || (cap.title || 'Untitled'),
    subject: meta.subject || '',
    level: meta.level || '',
    updatedAt: meta.updatedAt || meta.createdAt || new Date().toISOString()
  };


  const prog = loadProg(cap.id) || {};
  entry.bestScore = typeof prog.bestScore === 'number' ? prog.bestScore : 0;
  entry.knownCount = Array.isArray(prog.knownFlashcards) ? prog.knownFlashcards.length : 0;

  const existing = idx.find(i => i.id === cap.id);
  if (existing) {

    existing.title = entry.title;
    existing.subject = entry.subject;
    existing.level = entry.level;
    existing.updatedAt = entry.updatedAt;
    existing.bestScore = entry.bestScore;
    existing.knownCount = entry.knownCount;
  } else {
    idx.push(entry);
  }
  saveIndex(idx);
}


export function exportCapJSON(id) {
  const cap = loadCap(id);
  if (!cap) return null;

  if (!cap.schema) cap.schema = 'pocket-classroom/v1';
  return JSON.stringify(cap, null, 2);
}

export function importCapObject(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON object');
  if (obj.schema !== 'pocket-classroom/v1') throw new Error('Schema mismatch');
  if (!obj.meta || !obj.meta.title || typeof obj.meta.title !== 'string') throw new Error('Missing meta.title');
 
  const hasNotes = Array.isArray(obj.notes) && obj.notes.length > 0;
  const hasFlash = Array.isArray(obj.flashcards) && obj.flashcards.length > 0;
  const hasQuiz = Array.isArray(obj.quiz) && obj.quiz.length > 0;
  if (!(hasNotes || hasFlash || hasQuiz)) throw new Error('Imported capsule must contain notes, flashcards, or quiz');


  const incomingId = obj.id;
  let newId = incomingId || generateId();
  if (loadCap(newId)) newId = generateId();


  const now = new Date().toISOString();
  if (!obj.meta.createdAt) obj.meta.createdAt = now;
  obj.meta.updatedAt = now;

  obj.id = newId;

  obj.schema = obj.schema || 'pocket-classroom/v1';
  saveCap(obj);
  return newId;
}


if (typeof window !== 'undefined') {
  window.pcStorage = {
    IDX_KEY, CAP_KEY, PROG_KEY,
    loadIndex, saveIndex,
    loadCap, saveCap, deleteCap,
    loadProg, saveProg,
    exportCapJSON, importCapObject,
    generateId
  };
}


