// js/learn.js
// -----------------------------------------------------------------------------
// Learn view module
// Responsibilities:
//  - Load a capsule and present three subviews: Notes, Flashcards, Quiz.
//  - Manage flashcard state (index, flip, known set) and persist progress.
//  - Provide keyboard shortcuts (Space to flip, [ / ] to cycle tabs).
// Notes:
//  - Keep DOM queries localized to openLearn so module is easy to reason about.
// -----------------------------------------------------------------------------

import * as pcStorage from './storage.js';

let currentCap = null;

// flashcard state
let fcIndex = 0;
let isFlipped = false;
let knownSet = new Set();
let fcList = []; 


let metaEl, searchEl, notesListEl;
let notesViewEl, flashViewEl, quizViewEl;
let prevBtn, nextBtn, flipCardEl, frontEl, backEl, markKnownBtn, markUnknownBtn, counterEl, knownCountEl;
let learnSelectEl;

let keydownBound = false;

export function openLearn(id) {

  metaEl = document.getElementById('learn-meta');
  searchEl = document.getElementById('notes-search');
  notesListEl = document.getElementById('notes-list');

  notesViewEl = document.getElementById('notes-view');
  flashViewEl = document.getElementById('flash-view');
  quizViewEl = document.getElementById('quiz-view');

  prevBtn = document.getElementById('prev-card');
  nextBtn = document.getElementById('next-card');
  flipCardEl = document.getElementById('flip-card');
  frontEl = document.getElementById('card-front');
  backEl = document.getElementById('card-back');
  markKnownBtn = document.getElementById('mark-known');
  markUnknownBtn = document.getElementById('mark-unknown');
  counterEl = document.getElementById('fc-counter');
  knownCountEl = document.getElementById('known-count');

  learnSelectEl = document.getElementById('learn-select');

 
  if (searchEl) searchEl.value = '';

 
  populateLearnSelect(id);


  currentCap = pcStorage.loadCap(id);
  if (!currentCap) {
    alert('Capsule not found!');
    return;
  }

 
  const prog = pcStorage.loadProg(id) || {};
  knownSet = new Set(Array.isArray(prog.knownFlashcards) ? prog.knownFlashcards : []);

  // notes
  renderMeta();
  renderNotes();
  renderDescription();


  // flashcards
  fcList = Array.isArray(currentCap.flashcards) ? currentCap.flashcards : [];
  fcIndex = 0;
  isFlipped = false;
  renderFlashcard(); 


  showSubView('notes');

 
  let t;
  searchEl.value = '';
  searchEl.oninput = () => {
    clearTimeout(t);
    t = setTimeout(() => renderNotes(searchEl.value), 250);
  };


  document.getElementById('tab-notes').onclick = () => showSubView('notes');
  document.getElementById('tab-flash').onclick = () => showSubView('flash');
  document.getElementById('tab-quiz').onclick = () => showSubView('quiz');

  // flashcard controls
  prevBtn.onclick = () => { changeIndex(fcIndex - 1); };
  nextBtn.onclick = () => { changeIndex(fcIndex + 1); };
  flipCardEl.onclick = toggleFlip;
  markKnownBtn.onclick = () => { markKnown(true); };
  markUnknownBtn.onclick = () => { markKnown(false); };

 
  if (keydownBound) window.removeEventListener('keydown', handleKeydown);
  window.addEventListener('keydown', handleKeydown);
  keydownBound = true;
}

function populateLearnSelect(selectedId) {
  const idx = pcStorage.loadIndex();
  if (!learnSelectEl) return;
  learnSelectEl.innerHTML = '';
  idx.forEach(it => {
    const opt = document.createElement('option');
    opt.value = it.id;
    opt.textContent = it.title;
    if (it.id === selectedId) opt.selected = true;
    learnSelectEl.appendChild(opt);
  });
 
  learnSelectEl.onchange = () => {
    const id = learnSelectEl.value;
    openLearn(id);
  };
}

function renderMeta() {
  metaEl.innerHTML = `
    <strong>${escapeHtml(currentCap.meta.title)}</strong>
    <div class="small text-title ">
      ${escapeHtml(currentCap.meta.subject)} • ${escapeHtml(currentCap.meta.level)}
    </div>

  `;
}


function renderNotes(filter = '') {
  notesListEl.innerHTML = '';
  if (!currentCap.notes || currentCap.notes.length === 0) {
    notesListEl.innerHTML = '<li class="list-group-item form-color">No notes available</li>';
    return;
  }
  const q = String(filter || '').toLowerCase();
  const matches = currentCap.notes.filter(n => n.toLowerCase().includes(q));
  if (matches.length === 0) {
    notesListEl.innerHTML = '<li class="list-group-item form-color">No matching notes</li>';
    return;
  }
  matches.forEach(n => {
    const li = document.createElement('li');
    li.className = 'list-group-item form-color';
    li.textContent = n;
    notesListEl.appendChild(li);
  });
}

function renderDescription() {
  const descEl = document.getElementById('learn-description');
  if (!descEl) return;
  descEl.textContent = currentCap.meta.desc || currentCap.meta.description || 'No description available.';
}


function renderFlashcard() {

  isFlipped = false;
  flipCardEl.classList.remove('flipped');

  if (frontEl) frontEl.textContent = '';
  if (backEl) backEl.textContent = '';


  const total = fcList.length;
  if (total === 0) {
    if (frontEl) frontEl.textContent = 'No flashcards';
    if (backEl) backEl.textContent = '';
    if (counterEl) counterEl.textContent = '0 / 0';
    if (knownCountEl) knownCountEl.textContent = 'Known: 0';
    if (markKnownBtn) markKnownBtn.disabled = true;
    if (markUnknownBtn) markUnknownBtn.disabled = true;
    return;
  }

  const card = fcList[fcIndex];
  frontEl.textContent = card.front ?? '';
  backEl.textContent = card.back ?? '';
  counterEl.textContent = `${fcIndex + 1} / ${total}`;
  knownCountEl.textContent = `Known: ${knownSet.size}`;
  
  if (knownSet.has(fcIndex)) {
    markKnownBtn.disabled = true;
    markUnknownBtn.disabled = false;
  } else {
    markKnownBtn.disabled = false;
    markUnknownBtn.disabled = true;
  }
}

function changeIndex(nextIdx) {
  if (fcList.length === 0) return;
  if (nextIdx < 0) nextIdx = 0;
  if (nextIdx >= fcList.length) nextIdx = fcList.length - 1;
  fcIndex = nextIdx;
  isFlipped = false;
  flipCardEl.classList.remove('flipped');
  renderFlashcard();
}

function toggleFlip() {
  if (fcList.length === 0) return;
  isFlipped = !isFlipped;
  if (isFlipped) {
    flipCardEl.classList.add('flipped');
  } else {
    flipCardEl.classList.remove('flipped');
  }
}

function markKnown(yes) {
  if (fcList.length === 0) return;
  if (yes) knownSet.add(fcIndex);
  else knownSet.delete(fcIndex);

  pcStorage.saveProg(currentCap.id, { ...(pcStorage.loadProg(currentCap.id) || {}), knownFlashcards: [...knownSet] });

  const capObj = pcStorage.loadCap(currentCap.id);
  if (capObj) pcStorage.upsertIndexEntryFromCap(capObj);
  renderFlashcard();
}

function showSubView(name) {

  if (name === 'notes') {
    notesViewEl.classList.remove('d-none');
    flashViewEl.classList.add('d-none');
    quizViewEl.classList.add('d-none');
  } else if (name === 'flash') {
    notesViewEl.classList.add('d-none');
    flashViewEl.classList.remove('d-none');
    quizViewEl.classList.add('d-none');
  } else {
    notesViewEl.classList.add('d-none');
    flashViewEl.classList.add('d-none');
    quizViewEl.classList.remove('d-none');
  
    renderQuiz();
  }
}

// ----------------- Quiz -----------------
let quizIndex = 0;
let quizCorrect = 0;

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  const questions = Array.isArray(currentCap.quiz) ? currentCap.quiz : [];
  if (questions.length === 0) {
    container.innerHTML = '<div class="title-text">No quiz questions available</div>';
    return;
  }

  quizIndex = 0;
  quizCorrect = 0;
  renderQuestion();
}

function renderQuestion() {
  const container = document.getElementById('quiz-container');
  const questions = Array.isArray(currentCap.quiz) ? currentCap.quiz : [];
  if (quizIndex >= questions.length) {
    finishQuiz();
    return;
  }

  const q = questions[quizIndex];
  container.innerHTML = `
    <div>
      <div class="mb-2 title-text"><strong>Question ${quizIndex+1} / ${questions.length}</strong></div>
      <div class="mb-3 title-text">${escapeHtml(q.q)}</div>
      <div id="choices" class="d-grid gap-2 title-text choices"></div>
    </div> 
  `;

    const choicesDiv = container.querySelector('#choices');
  q.choices.forEach((ch, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
  
    btn.className = 'quiz-option';
    btn.textContent = ch || '';
  
    btn.dataset.correct = (idx === q.answerIndex) ? 'true' : 'false';
    btn.onclick = () => pickChoice(idx, q.answerIndex, q.explain || '');
    choicesDiv.appendChild(btn);
  });

}

function pickChoice(idx, answerIndex, explain) {

  const buttons = Array.from(document.querySelectorAll('#choices .quiz-option'));
  if (!buttons || buttons.length === 0) return;


  buttons.forEach(b => b.disabled = true);


  buttons.forEach(b => {
    b.classList.remove('correct', 'wrong');
  });

  const chosen = buttons[idx];
  const isCorrect = idx === answerIndex;

  if (isCorrect) {
    if (chosen) chosen.classList.add('correct');
    quizCorrect++;
  } else {
    if (chosen) chosen.classList.add('wrong');
    const correctBtn = buttons.find(b => b.dataset && b.dataset.correct === 'true');
    if (correctBtn) correctBtn.classList.add('correct');
  }

  if (explain) {
    const cont = document.getElementById('quiz-container');
    const ex = document.createElement('div');
    ex.className = 'mt-2 title-text';
    ex.innerHTML = explain;
    cont.appendChild(ex);
  }


  setTimeout(() => {
    quizIndex++;
    renderQuestion();
  }, 2500);
}

function finishQuiz() {
  const container = document.getElementById('quiz-container');
  const questions = Array.isArray(currentCap.quiz) ? currentCap.quiz : [];
  const score = Math.round((quizCorrect / Math.max(1, questions.length)) * 100);
  container.innerHTML = `
    <div class="text-center">
      <h4>Your score: ${score}%</h4>
      <div class="small ">Correct: ${quizCorrect} / ${questions.length}</div>
      <div class="mt-3">
        <button id="quiz-done" class="btn btn-author">Back to Learn</button>
      </div>
    </div>
  `;


  const prog = pcStorage.loadProg(currentCap.id) || {};
  const prevBest = typeof prog.bestScore === 'number' ? prog.bestScore : 0;
  pcStorage.saveProg(currentCap.id, { ...prog, bestScore: Math.max(prevBest, score) });

  const capObj = pcStorage.loadCap(currentCap.id);
  if (capObj) pcStorage.upsertIndexEntryFromCap(capObj);

  document.getElementById('quiz-done').onclick = () => {
    showSubView('notes');
  };
}


function handleKeydown(e) {
  try {

    const active = document.activeElement;
    const tag = active?.tagName;
    const isEditable = active?.isContentEditable;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return;

    const k = e.key;   
    const c = e.code;  

    if (c === 'Space' || k === ' ') {
  
      e.preventDefault?.();
      if (!flashViewEl.classList.contains('d-none')) toggleFlip();
      return;
    }

    const isLeftBracket = k === '[' || c === 'BracketLeft';
    const isRightBracket = k === ']' || c === 'BracketRight';

    if (isLeftBracket) {
      e.preventDefault?.();
      cycleSubView(-1);
      return;
    } else if (isRightBracket) {
      e.preventDefault?.();
      cycleSubView(1);
      return;
    }

  } catch (err) {

    console.warn('handleKeydown error', err);
  }
}

function cycleSubView(dir = 1) {
  const order = ['notes', 'flash', 'quiz'];
  let current;
  if (!notesViewEl.classList.contains('d-none')) current = 0;
  else if (!flashViewEl.classList.contains('d-none')) current = 1;
  else current = 2;
  let next = (current + dir + order.length) % order.length;
  showSubView(order[next]);
}

function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


export function closeLearn() {
  if (keydownBound) {
    window.removeEventListener('keydown', handleKeydown);
    keydownBound = false;
  }
}
