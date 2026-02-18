const STORAGE_KEYS = {
  done: 'sonic_sql_done_lessons',
  bookmarks: 'sonic_sql_bookmarked_lessons',
  notes: 'sonic_sql_lesson_notes'
};

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || '{}'); }
  catch { return {}; }
}
function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
}

function doCopy(btn) {
  const pre = btn.closest('.code-wrap')?.querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('ok');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('ok');
    }, 1800);
  });
}

function durationToMinutes(duration) {
  const m = duration.match(/([\d.]+)/);
  if (!m) return 0;
  return Math.round(parseFloat(m[1]) * 60);
}

function renderIndexPage() {
  if (typeof LESSONS === 'undefined') return;
  const library = document.getElementById('lessonLibrary');
  if (!library) return;

  const searchInput = document.getElementById('searchInput');
  const phaseFilter = document.getElementById('phaseFilter');
  const sortFilter = document.getElementById('sortFilter');
  const resetFilters = document.getElementById('resetFilters');

  buildSequenceCards();

  const doneSet = loadSet(STORAGE_KEYS.done);
  const bookmarkSet = loadSet(STORAGE_KEYS.bookmarks);

  function updateKpis() {
    const total = LESSONS.length;
    const done = doneSet.size;
    document.getElementById('kpiLessons').textContent = total;
    document.getElementById('kpiDone').textContent = done;
    document.getElementById('kpiBookmarks').textContent = bookmarkSet.size;
    document.getElementById('kpiProgress').textContent = `${Math.round((done / total) * 100)}%`;
  }

  function cardTemplate(lesson) {
    const done = doneSet.has(lesson.id);
    const bookmarked = bookmarkSet.has(lesson.id);
    return `
      <article class="lesson-card ${done ? 'done' : ''}">
        <div class="lesson-top">
          <span class="lesson-id">${lesson.id.toUpperCase()}</span>
          <span class="lesson-phase">Phase ${lesson.phase}</span>
        </div>
        <h3>${lesson.title}</h3>
        <p>${lesson.duration} · ${done ? 'Completed' : 'In progress'}</p>
        <div class="lesson-actions">
          <a class="nav-btn primary" href="lesson-${lesson.id}.html">Open lesson</a>
          <button class="nav-btn bookmark-toggle" data-id="${lesson.id}">${bookmarked ? '★ Saved' : '☆ Save'}</button>
        </div>
      </article>
    `;
  }

  function render() {
    const term = (searchInput.value || '').toLowerCase().trim();
    const phase = phaseFilter.value;
    const sortBy = sortFilter.value;

    let list = LESSONS.filter((l) => {
      const matchPhase = phase === 'all' || String(l.phase) === phase;
      const hay = `${l.id} ${l.title}`.toLowerCase();
      const matchTerm = !term || hay.includes(term);
      return matchPhase && matchTerm;
    });

    if (sortBy === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'duration') list.sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
    if (sortBy === 'day') list.sort((a, b) => parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10));

    library.innerHTML = list.map(cardTemplate).join('') || '<p class="empty-state">No lessons found. Try broader filters.</p>';

    library.querySelectorAll('.bookmark-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (bookmarkSet.has(id)) bookmarkSet.delete(id);
        else bookmarkSet.add(id);
        saveSet(STORAGE_KEYS.bookmarks, bookmarkSet);
        updateKpis();
        render();
      });
    });
  }

  searchInput.addEventListener('input', render);
  phaseFilter.addEventListener('change', render);
  sortFilter.addEventListener('change', render);
  resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    phaseFilter.value = 'all';
    sortFilter.value = 'day';
    render();
  });

  updateKpis();
  render();
}


function buildSequenceCards() {
  const lessonBody = document.getElementById('lessonBody');
  if (!lessonBody || lessonBody.dataset.sequenced === '1') return;

  const blocks = [...lessonBody.children].filter((el) => el.nodeType === 1);
  if (!blocks.length) return;

  const groups = [];
  let carry = [];

  blocks.forEach((block) => {
    const isHeading = block.classList?.contains('c-hd');
    if (isHeading) {
      carry.push(block);
      return;
    }

    groups.push([...carry, block]);
    carry = [];
  });

  if (carry.length) {
    if (groups.length) groups[groups.length - 1].push(...carry);
    else groups.push(carry);
  }

  const frag = document.createDocumentFragment();
  groups.forEach((group, i) => {
  const frag = document.createDocumentFragment();
  blocks.forEach((block, i) => {
    const card = document.createElement('article');
    card.className = 'seq-card';

    const badge = document.createElement('div');
    badge.className = 'seq-badge';
    badge.textContent = `Step ${String(i + 1).padStart(2, '0')}`;

    card.appendChild(badge);
    group.forEach((node) => card.appendChild(node));
    card.appendChild(block);
    frag.appendChild(card);
  });

  lessonBody.innerHTML = '';
  lessonBody.appendChild(frag);
  lessonBody.dataset.sequenced = '1';
}

function setupLessonPage() {
  const body = document.body;
  if (!body.classList.contains('lesson-page')) return;
  const lessonId = body.dataset.lesson;
  if (!lessonId) return;

  buildSequenceCards();

  const doneSet = loadSet(STORAGE_KEYS.done);
  const bookmarkSet = loadSet(STORAGE_KEYS.bookmarks);
  const notes = loadNotes();

  const status = document.getElementById('lessonStatus');
  const markComplete = document.getElementById('markComplete');
  const bookmarkBtn = document.getElementById('bookmarkLesson');
  const notesInput = document.getElementById('lessonNotes');

  function syncUi() {
    const done = doneSet.has(lessonId);
    const bookmarked = bookmarkSet.has(lessonId);
    markComplete.textContent = done ? 'Completed ✓' : 'Mark complete';
    markComplete.classList.toggle('primary', done);
    bookmarkBtn.textContent = bookmarked ? 'Bookmarked ★' : 'Bookmark';
    status.textContent = done
      ? 'Completed. Keep refining your notes and query patterns.'
      : 'Complete the exercises, then mark this lesson done.';
  }

  markComplete.addEventListener('click', () => {
    if (doneSet.has(lessonId)) doneSet.delete(lessonId);
    else doneSet.add(lessonId);
    saveSet(STORAGE_KEYS.done, doneSet);
    syncUi();
  });

  bookmarkBtn.addEventListener('click', () => {
    if (bookmarkSet.has(lessonId)) bookmarkSet.delete(lessonId);
    else bookmarkSet.add(lessonId);
    saveSet(STORAGE_KEYS.bookmarks, bookmarkSet);
    syncUi();
  });

  notesInput.value = notes[lessonId] || '';
  notesInput.addEventListener('input', () => {
    notes[lessonId] = notesInput.value;
    saveNotes(notes);
  });

  const progressBar = document.getElementById('readingProgress');
  const updateReading = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  };
  document.addEventListener('scroll', updateReading, { passive: true });
  updateReading();

  syncUi();
}

renderIndexPage();
setupLessonPage();
function doCopy(btn){const pre=btn.closest('.code-wrap')?.querySelector('pre');if(!pre)return;navigator.clipboard.writeText(pre.innerText).then(()=>{btn.textContent='Copied!';btn.classList.add('ok');setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('ok');},1800);});}
