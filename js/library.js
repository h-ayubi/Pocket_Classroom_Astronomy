// js/library.js
// -----------------------------------------------------------------------------
// Library view module
// Responsibilities:
//  - Render the capsule index into a responsive card grid.
//  - Handle delegated click actions for Learn / Edit / Export / Delete.
//  - Escape user content before inserting into DOM to avoid HTML injection.
// -----------------------------------------------------------------------------


import * as pcStorage from './storage.js';


function escapeHtml(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const grid = document.getElementById('library-grid');
const empty = document.getElementById('library-empty');

if (grid && !grid._pcBound) {
  grid.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-learn')) {
      document.dispatchEvent(new CustomEvent('pc:openLearn', { detail: { id } }));
    } else if (btn.classList.contains('btn-edit')) {
      document.dispatchEvent(new CustomEvent('pc:openAuthor', { detail: { id } }));
    } else if (btn.classList.contains('btn-export')) {
      const json = pcStorage.exportCapJSON(id);
      if (json) {
        const cap = pcStorage.loadCap(id) || {};
        const titleSafe = (cap.meta?.title || id).replace(/\s+/g,'_').replace(/[^\w\-_.]/g,'');
        const name = `${titleSafe}-${id}.json`;
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      } else {
        alert('Capsule not found for export!');
      }
    } else if (btn.classList.contains('btn-delete')) {
      if (confirm('Are you sure to delete this capsule?')) {
        pcStorage.deleteCap(id);
        renderLibrary(); 
      }
    }
  });
  grid._pcBound = true;
}


export function renderLibrary() {
  if (!grid) return;
 
  grid.innerHTML = '';


  const items = pcStorage.loadIndex();

  if (!items || items.length === 0) {
    empty.style.display = 'block';
    return;
  } else {
    empty.style.display = 'none';
  }

  items.forEach(cap => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4';
    const best = cap.bestScore || 0;
    const known = cap.knownCount || 0;
    col.innerHTML = `
<div class="card cap-card h-100 shadow-sm card-color">
  <div class="card-body d-flex flex-column">
    <div class="d-flex justify-content-between align-items-start mb-1">
      <div>
        <h5 class="card-title mb-1">${escapeHtml(cap.title)}</h5>
      </div>
      <span class="badge cap-level">${escapeHtml(cap.level)}</span>
    </div>

    <p class="cap-subject small mb-2">${escapeHtml(cap.subject)}</p>
        
    <div class="cap-sub-meta small text-updated">
      Updated: ${new Date(cap.updatedAt).toLocaleDateString()}
    </div>

    <div class="mt-2 mb-3">
      <div class="d-flex align-items-center mb-1 quiz-t">
        <div class=" me-2 small ">Quiz best</div>
        <div class="fw-bold">${escapeHtml(String(best))}%</div>
      </div>
      <div class="progress mb-2" style="height:8px;">
        <div class="progress-bar" role="progressbar" style="width:${best}%" aria-valuenow="${best}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <div class="known-color small">
        Known cards: <span class="fw-bold">${escapeHtml(String(known))}</span>
      </div>
    </div>

    <!-- دکمه‌ها در وسط -->
    <div class="mt-auto text-center">
      <div class="d-inline-flex flex-wrap justify-content-center gap-2 btn-row">
        <button class="btn btn-sm btnoflibrary btn-learn" data-id="${cap.id}" aria-label="Learn ${escapeHtml(cap.title)}">Learn</button>
        <button class="btn btn-sm btnoflibrary btn-edit" data-id="${cap.id}" aria-label="Edit ${escapeHtml(cap.title)}">Edit</button>
        <button class="btn btn-sm btnoflibrary btn-export" data-id="${cap.id}" aria-label="Export ${escapeHtml(cap.title)}">Export</button>
        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${cap.id}" aria-label="Delete ${escapeHtml(cap.title)}">Delete</button>
      </div>
    </div>
  </div>
</div>

`;

    grid.appendChild(col);
  });
}
