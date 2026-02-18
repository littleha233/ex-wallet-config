const form = document.getElementById('noteForm');
const noteList = document.getElementById('noteList');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');

async function loadNotes() {
    const response = await fetch('/api/notes');
    const notes = await response.json();
    noteList.innerHTML = '';

    if (notes.length === 0) {
        noteList.innerHTML = '<div>No notes yet.</div>';
        return;
    }

    notes
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((note) => {
            const card = document.createElement('div');
            card.className = 'card';

            const title = document.createElement('div');
            title.className = 'note-title';
            title.textContent = note.title;

            const content = document.createElement('div');
            content.textContent = note.content;

            const meta = document.createElement('div');
            meta.className = 'note-meta';
            meta.textContent = `Created at: ${new Date(note.createdAt).toLocaleString()}`;

            card.appendChild(title);
            card.appendChild(content);
            card.appendChild(meta);
            noteList.appendChild(card);
        });
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
        title: titleInput.value.trim(),
        content: contentInput.value.trim()
    };
    if (!payload.title || !payload.content) {
        return;
    }

    form.querySelector('button').disabled = true;
    await fetch('/api/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    form.querySelector('button').disabled = false;
    titleInput.value = '';
    contentInput.value = '';
    await loadNotes();
});

loadNotes();
