// js/author.js
// -----------------------------------------------------------------------------
// Author view module
// Responsibilities:
//  - Render authoring form (meta, notes, flashcards, quiz).
//  - Collect/validate capsule data and persist to LocalStorage via pcStorage.
//  - Provide autosave (non-final) and explicit Save/Cancel actions.
// Notes:
//  - Comments explain key logic (DOM building, form collection, validation,
//    autosave behavior and storage interactions).
// -----------------------------------------------------------------------------


import * as pcStorage from './storage.js';

let currentCap = null;
let autosaveTimer = null;
const AUTOSAVE_DELAY = 1500; // ms

const root = document.getElementById('author-root');

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildAuthorForm() {
  return `
    <form id="author-form" class="author-section">
      <div class="mb-2">
        <label class="form-label title-text">Title <span class="text-danger">*</span></label>
        <input id="a-title" class="form-control form-color" type="text" required aria-required="true" placeholder="e.g., Journey Beyond the Stars"/>
      </div>
<br>
      <div class="mb-2 d-flex gap-2">
        <div style="flex:1">
          <label class="form-label title-text">Subject</label>
          <input id="a-subject" class="form-control form-color" type="text"  placeholder="e.g., Astronomy"/>
        </div>

        <div style="width:160px">
          <label class="form-label title-text ">Level</label>
          <select id="a-level" class="form-select form-color">
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
<br>

      <div class="mb-2">
        <label class="form-label title-text">Description</label>
        <textarea id="a-desc" class="form-control form-color" rows="2"  placeholder="e.g., A short intro to how stars are born and die in the vast universe."></textarea>
      </div>

 <br>    
      <div class="mb-2">
        <label class="form-label title-text">Notes (one per line)</label>
        <textarea id="a-notes" class="form-control form-color" rows="4" placeholder="e.g.,  
- Space is mostly silent.  
- Stars have life cycles.  
- Our Sun is a medium-sized star.  "></textarea>
      </div>

<br>

      <div class="mb-2 d-flex justify-content-between align-items-center">
        <label class="form-label title-text">Flashcards</label>
        <div>
          <button id="fc-add" type="button" class="btn btn-author btn-sm">Add card</button>
        </div>
      </div>
      <div id="flashcardsEditor" class="mb-2"></div>

      <hr />

      <div class="mb-2 d-flex justify-content-between align-items-center">
        <label class="form-label title-text">Quiz (each question needs 4 choices)</label>
        <div>
          <button id="q-add" type="button" class="btn btn-sm btn-author">Add question</button>
        </div>
      </div>
      <div id="quizEditor" class="mb-2"></div>
<br><br>
      <div class="d-flex gap-2">
        <button id="saveCapBtn" type="button" class="btn btn-author">Save Capsule</button>
        <button id="cancelAuthorBtn" type="button" class="btn btn-author">Cancel</button>
      </div>
      <div id="author-msg" class="mt-2 small text-muted"></div>
    </form>
  `;
}

function addFlashcardRow(front = '', back = '') {
  const container = document.getElementById('flashcardsEditor');
  const row = document.createElement('div');
  row.className = 'row g-2 align-items-end mb-2';
  row.innerHTML = `
    <div class="col">
      <label class="form-label title-text visually-hidden">Front</label>
      <input class="form-control form-color fc-front" value="${escapeHtml(front)}" placeholder="Front">
    </div>
    <div class="col">
      <label class="form-label title-text visually-hidden">Back</label>
      <input class="form-control form-color fc-back" value="${escapeHtml(back)}" placeholder="Back">
    </div>
    <div class="col-auto">
      <button class="btn btn-outline-danger btn-sm btnDel" type="button" aria-label="Delete card">Delete</button>
    </div>
  `;

    // Remove row when Delete pressed
  row.querySelector('.btnDel').onclick = () => row.remove();
  container.appendChild(row);
}

function addQuestionBlock(q = '', choices = ['', '', '', ''], answerIndex = 0, explain = '') {
  const container = document.getElementById('quizEditor');
  const idx = container.children.length;
  const wrap = document.createElement('div');
  wrap.className = 'card p-2 mb-2 form-color ';
  wrap.innerHTML = `
    <div class="mb-2 ">
      <label class="form-label title-text">Q ${idx+1}</label>
      <input class="form-control form-color q-text" value="${escapeHtml(q)}" placeholder="Question">
    </div>
    <div class="row g-2 mb-2">
      <div class="col-6"><input class="form-control form-color choice-0" value="${escapeHtml(choices[0])}" placeholder="Choice A"></div>
      <div class="col-6"><input class="form-control form-color choice-1" value="${escapeHtml(choices[1])}" placeholder="Choice B"></div>
      <div class="col-6"><input class="form-control form-color choice-2" value="${escapeHtml(choices[2])}" placeholder="Choice C"></div>
      <div class="col-6"><input class="form-control form-color choice-3" value="${escapeHtml(choices[3])}" placeholder="Choice D"></div>
    </div>
    <div class="d-flex gap-2 align-items-center">
      <label class="form-label title-text mb-0 small">Correct</label>
      <select class="form-select form-color form-select-sm answer-index" style="width:80px;">
        <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
      </select>
      <input class="form-control form-color ms-2 explain" value="${escapeHtml(explain)}" placeholder="Optional explanation">
      <button class="btn btn-outline-danger btn-sm ms-2 btnDelQ" type="button">Delete</button>
    </div>
  `;
  wrap.querySelector('.answer-index').value = String(answerIndex || 0);
  wrap.querySelector('.btnDelQ').onclick = () => wrap.remove();
  container.appendChild(wrap);
}

function collectForm() {
  const title = document.getElementById('a-title').value.trim();
  const subject = document.getElementById('a-subject').value.trim();
  const level = document.getElementById('a-level').value;
  const desc = document.getElementById('a-desc').value.trim();

  const notesRaw = document.getElementById('a-notes').value.split('\n').map(s => s.trim()).filter(Boolean);

  const flashcards = [];
  document.querySelectorAll('#flashcardsEditor .row').forEach(r => {
    const front = r.querySelector('.fc-front')?.value.trim() || '';
    const back = r.querySelector('.fc-back')?.value.trim() || '';
    if (front || back) flashcards.push({ front, back });
  });

  const quiz = [];
  document.querySelectorAll('#quizEditor .card').forEach(card => {
    const q = card.querySelector('.q-text')?.value.trim() || '';
    const choices = [
      card.querySelector('.choice-0')?.value.trim() || '',
      card.querySelector('.choice-1')?.value.trim() || '',
      card.querySelector('.choice-2')?.value.trim() || '',
      card.querySelector('.choice-3')?.value.trim() || ''
    ];
    const answerIndex = parseInt(card.querySelector('.answer-index')?.value || '0', 10);
    const explain = card.querySelector('.explain')?.value.trim() || '';
    
    if (q && choices.some(c => c !== '')) {
      quiz.push({ q, choices, answerIndex, explain });
    }
  });

  const cap = {
    schema: 'pocket-classroom/v1',
    id: currentCap?.id, 
    meta: {
      title,
      subject,
      level,
      desc,
      createdAt: currentCap?.meta?.createdAt
    },
    notes: notesRaw,
    flashcards,
    quiz,
    resources: currentCap?.resources || []
  };
  return cap;
}

function validateCap(cap) {
  if (!cap.meta || !cap.meta.title || cap.meta.title.trim() === '') {
    throw new Error('Title is required');
  }
  const hasNotes = Array.isArray(cap.notes) && cap.notes.length > 0;
  const hasFlash = Array.isArray(cap.flashcards) && cap.flashcards.length > 0;
  const hasQuiz = Array.isArray(cap.quiz) && cap.quiz.length > 0;
  if (!(hasNotes || hasFlash || hasQuiz)) {
    throw new Error('At least one of Notes, Flashcards, or Quiz must be present');
  }
}

function showMessage(msg, danger = false) {
  const el = document.getElementById('author-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'mt-2 small ' + (danger ? 'text-danger' : 'text-muted');
}

function doSave(final = true) {
  try {
    const cap = collectForm();
    validateCap(cap);
    const id = pcStorage.saveCap(cap);
  
    currentCap = pcStorage.loadCap(id);
    
    pcStorage.upsertIndexEntryFromCap(currentCap);
    if (final) showMessage('Saved ✓');
  
    return id;
  } catch (e) {
    showMessage(e.message, true);
    throw e;
  }
}

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      const id = doSave(false);
     
      showMessage('Auto-saved');
    
      document.dispatchEvent(new CustomEvent('pc:capSaved', { detail: { id } }));
    } catch (e) {

    }
  }, AUTOSAVE_DELAY);
}

export function openAuthor(id = null) {
 
  root.innerHTML = buildAuthorForm();

  // wire controls
  document.getElementById('fc-add').onclick = () => addFlashcardRow();
  document.getElementById('q-add').onclick = () => addQuestionBlock();

  document.getElementById('saveCapBtn').onclick = () => {
    try {
      const idSaved = doSave(true);
     
      document.dispatchEvent(new CustomEvent('pc:capSaved', { detail: { id: idSaved } }));
   
    } catch (e) {

    }
  };

  document.getElementById('cancelAuthorBtn').onclick = () => {

    document.dispatchEvent(new CustomEvent('pc:cancelAuthor'));
  };


  if (id) {
    currentCap = pcStorage.loadCap(id);
  } else {
    currentCap = {
      meta: { title: '', subject: '', level: 'Beginner', desc: '' },
      notes: [],
      flashcards: [],
      quiz: [],
      resources: []
    };
  }

  // populate fields
  document.getElementById('a-title').value = currentCap.meta?.title || '';
  document.getElementById('a-subject').value = currentCap.meta?.subject || '';
  document.getElementById('a-level').value = currentCap.meta?.level || 'Beginner';
  document.getElementById('a-desc').value = currentCap.meta?.desc || '';
  document.getElementById('a-notes').value = (currentCap.notes || []).join('\n');

  const fcEditor = document.getElementById('flashcardsEditor');
  fcEditor.innerHTML = '';
  (currentCap.flashcards || []).forEach(f => addFlashcardRow(f.front, f.back));

  const qEditor = document.getElementById('quizEditor');
  qEditor.innerHTML = '';
  (currentCap.quiz || []).forEach(q => addQuestionBlock(q.q, q.choices || ['', '', '', ''], q.answerIndex || 0, q.explain || ''));

  
  root.querySelectorAll('input, textarea, select').forEach(inp => {
    inp.addEventListener('input', scheduleAutosave);
  });

 
  document.addEventListener('pc:capSaved', (e) => {
    
  });
}

export function closeAuthor() {

  clearTimeout(autosaveTimer);
}
