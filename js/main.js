// js/main.js
// -----------------------------------------------------------------------------
// Main bootstrap for Pocket Classroom SPA
// Responsibilities:
//  - Import storage helper to expose window.pcStorage (dev helpers).
//  - Wire top-level modules: library, learn, author.
//  - Handle global events and view switching (Library / Author / Learn).
//  - Wire import file input and top navbar buttons.
//    library/author/learn content — those live in their respective modules.
// -----------------------------------------------------------------------------


import './storage.js';
import { renderLibrary } from './library.js';
import { openLearn, closeLearn } from './learn.js';
import { openAuthor, closeAuthor } from './author.js';



document.addEventListener('pc:openLearn', e => {
  showView('learn');
  openLearn(e.detail.id);
});


const VIEWS = {
  library: document.getElementById('library-section'),
  author: document.getElementById('author-section'),
  learn: document.getElementById('learn-section')
};


function showView(name) {
  Object.keys(VIEWS).forEach(k => {
    const el = VIEWS[k];
    if (!el) return;
    if (k === name) el.classList.remove('d-none');
    else el.classList.add('d-none');
  });

 
  if (name !== 'learn') {
    try { closeLearn(); } catch (e) { }
  }
  if (name !== 'author') {
    try { closeAuthor(); } catch (e) {  }
  }


  const heading = VIEWS[name]?.querySelector('h2');
  if (heading) heading.focus();
}


document.querySelectorAll('button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view');
    showView(view);
    if (view === 'library') renderLibrary();
    if (view === 'author') openAuthor(); 
  });
});


document.addEventListener('pc:openLearn', (e) => {
  const id = e.detail?.id;
  showView('learn');
  openLearn(id);
});

document.addEventListener('pc:openAuthor', (e) => {
  const id = e.detail?.id;
  showView('author');
  openAuthor(id);
});

// new capsule button
document.getElementById('newCapsuleBtn').addEventListener('click', () => {
  showView('author');
  openAuthor(); 
});


const importInput = document.getElementById('importFileInput');
document.getElementById('importBtn').addEventListener('click', () => importInput.click());

importInput.addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    const newId = window.pcStorage.importCapObject(obj);
    renderLibrary(); 
    alert('Capsule imported successfully!');
  } catch (e) {
    alert('Failed to import: ' + (e.message || e));
  } finally {
    importInput.value = ''; 
  }
});

document.addEventListener('pc:capSaved', (e) => {
  renderLibrary();
});

document.addEventListener('pc:cancelAuthor', () => {
  renderLibrary();
  showView('library');
});


window.addEventListener('DOMContentLoaded', () => {
  renderLibrary();
  showView('library');
});
