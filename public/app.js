const notesListEl = document.getElementById('notes-list');
const notesCountEl = document.getElementById('notes-count');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const createForm = document.getElementById('create-form');
const titleInput = document.getElementById('title-input');
const contentInput = document.getElementById('content-input');
const createStatus = document.getElementById('create-status');
const noteFrame = document.getElementById('note-frame');
const singleNoteSection = document.getElementById('single-note-section');
const closeNoteBtn = document.getElementById('close-note');
const editForm = document.getElementById('edit-form');
const editIdInput = document.getElementById('edit-id');
const editTitleInput = document.getElementById('edit-title');
const editContentInput = document.getElementById('edit-content');
const editStatus = document.getElementById('edit-status');
const deleteBtn = document.getElementById('delete-note');

let lastFocusBeforeViewer = null;

loadNotes();

async function loadNotes(query) {
  try {
    setNotesLoading(true);
    let url = '/notes';
    if (query) url += `?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Failed to fetch notes');
    const data = await res.json();
    notesCountEl.textContent = `${data.count} note(s)`;
    renderNotes(data.notes);
  } catch (err) {
    console.error(err);
    notesCountEl.textContent = 'Error loading notes';
    notesCountEl.classList.add('error');
  } finally {
    setNotesLoading(false);
  }
}

function setNotesLoading(isLoading) {
  if (isLoading) {
    notesListEl.classList.add('fade-in');
    notesCountEl.textContent = 'Loading…';
  } else {
    notesListEl.classList.remove('fade-in');
  }
}

function renderNotes(notes) {
  notesListEl.innerHTML = '';
  if (!notes.length) {
    notesListEl.textContent = 'No notes found.';
    return;
  }
  notes.forEach(note => {
    const div = document.createElement('div');
    div.className = 'note-card';
    div.setAttribute('role', 'listitem');
    div.tabIndex = 0;
    div.innerHTML = `<strong>${escapeHtml(note.title)}</strong><span class="note-meta">ID: ${note.id}</span>`;
    const open = () => viewNoteHtml(note.id, div, note);
    div.addEventListener('click', open);
    div.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    notesListEl.appendChild(div);
  });
}

async function viewNoteHtml(id, sourceEl, noteDataFromList) {
  try {
    lastFocusBeforeViewer = sourceEl || document.activeElement;
    notesCountEl.textContent = `Loading note ${id}…`;
    const res = await fetch(`/notes/${id}`, {
      headers: { 'Accept': 'text/html' }
    });

    console.log('ETag:', res.headers.get('ETag'));
    console.log('Cache-Control:', res.headers.get('Cache-Control'));

    if (res.status === 304) {
      console.log('304 Not Modified: Using cached version');
    }

    if (!res.ok) throw new Error('Failed to fetch note HTML');
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    noteFrame.src = url;
    singleNoteSection.classList.remove('hidden');

    editStatus.textContent = '';
    if (noteDataFromList) {
      populateEditForm(noteDataFromList);
    } else {
      const jsonRes = await fetch(`/notes/${id}`, { headers: { 'Accept': 'application/json' } });
      if (jsonRes.ok) populateEditForm(await jsonRes.json());
    }

    closeNoteBtn.focus();
  } catch (err) {
    alert('Error loading note: ' + err.message);
  }
}

function populateEditForm(note) {
  editIdInput.value = note.id;
  editTitleInput.value = note.title;
  editContentInput.value = note.content;
}

closeNoteBtn.addEventListener('click', () => {
  singleNoteSection.classList.add('hidden');
  noteFrame.src = 'about:blank';
  if (lastFocusBeforeViewer) lastFocusBeforeViewer.focus();
});

// Handle search form submission
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  loadNotes(q || undefined);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  loadNotes();
  searchInput.focus();
});

// Create note (POST /notes) with required x-api-key header
createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createStatus.textContent = 'Creating…';
  createStatus.classList.remove('error', 'success');
  try {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      createStatus.textContent = 'Both fields required.';
      createStatus.classList.add('error');
      return;
    }
    const res = await fetch('/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': 'secret123' // Custom auth header required by server
      },
      body: JSON.stringify({ title, content })
    });

    if (res.status === 401) {
      createStatus.textContent = 'Unauthorized (check x-api-key).';
      createStatus.classList.add('error');
      return;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Failed to create note');
    }

    const note = await res.json();
    createStatus.textContent = `Created note #${note.id}`;
    createStatus.classList.add('success');
    titleInput.value = '';
    contentInput.value = '';
    titleInput.focus();
    loadNotes(); // refresh list
  } catch (err) {
    createStatus.textContent = 'Error: ' + err.message;
    createStatus.classList.add('error');
  }
});

// Update note (PUT)
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editStatus.textContent = 'Updating…';
  editStatus.classList.remove('error', 'success');
  const id = editIdInput.value;
  const title = editTitleInput.value.trim();
  const content = editContentInput.value.trim();
  if (!title || !content) {
    editStatus.textContent = 'Both fields required.';
    editStatus.classList.add('error');
    return;
  }
  try {
    const res = await fetch(`/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': 'secret123' // Custom auth header required by server
      },
      body: JSON.stringify({ title, content })
    });

    if (res.status === 401) {
      editStatus.textContent = 'Unauthorized.';
      editStatus.classList.add('error');
      return;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Update failed');
    }

    const updated = await res.json();
    editStatus.textContent = `Updated #${updated.id}`;
    editStatus.classList.add('success');
    loadNotes();
    viewNoteHtml(updated.id, null, updated);
  } catch (err) {
    editStatus.textContent = 'Error: ' + err.message;
    editStatus.classList.add('error');
  }
});

if (deleteBtn) {
  deleteBtn.addEventListener('click', async () => {
    const id = editIdInput.value;
    if (!id) return;
    if (!confirm(`Delete note #${id}? This cannot be undone.`)) return;
    editStatus.textContent = 'Deleting…';
    editStatus.classList.remove('error', 'success');
    try {
      const res = await fetch(`/notes/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': 'secret123' } // Custom auth header required by server
      });

      if (res.status === 401) {
        editStatus.textContent = 'Unauthorized.';
        editStatus.classList.add('error');
        return;
      }

      if (res.status === 404) {
        editStatus.textContent = 'Already deleted.';
        editStatus.classList.add('error');
      }

      if (res.status !== 204 && !res.ok) {
        throw new Error('Delete failed');
      }

      editStatus.textContent = `Deleted #${id}`;
      editStatus.classList.add('success');
      singleNoteSection.classList.add('hidden');
      noteFrame.src = 'about:blank';
      loadNotes();
      searchInput.focus();
    } catch (err) {
      editStatus.textContent = 'Error: ' + err.message;
      editStatus.classList.add('error');
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
