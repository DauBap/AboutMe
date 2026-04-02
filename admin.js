/* admin.js — notphuongthao admin panel */

const ADMIN_KEY   = 'npt_isAdmin';
const PASS_KEY    = 'npt_adminPass';
const DEFAULT_PASS = 'phuongthao2024';

/* ── Auth check ─────────────────────────────────── */
(function checkAuth() {
  const guard   = document.getElementById('authGuard');
  const wrapper = document.getElementById('adminWrapper');
  if (localStorage.getItem(ADMIN_KEY) !== '1') {
    guard.classList.remove('hidden');
    wrapper.classList.add('hidden');
  } else {
    guard.classList.add('hidden');
    wrapper.classList.remove('hidden');
  }
})();

/* ── Helpers ─────────────────────────────────────── */
function getPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

function store(key, val) {
  localStorage.setItem(`npt_${key}`, val);
}

function load(key) {
  return localStorage.getItem(`npt_${key}`) || '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Sidebar navigation ──────────────────────────── */
document.querySelectorAll('.admin-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
  });
});

/* ── Logout ─────────────────────────────────────── */
const logoutBtn = document.getElementById('adminLogoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_KEY);
    window.location.href = 'index.html';
  });
}

/* ── Generic save buttons (panels with data-panel) ─ */
document.querySelectorAll('.btn-save[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.dataset.panel;
    const inputs = document.querySelectorAll(
      `#panel-${panel} [data-key]`
    );
    inputs.forEach(el => store(el.dataset.key, el.value));
    showToast('Luu thanh cong! 💖');
  });
});

/* ── Load existing values into inputs ────────────── */
function populateFields() {
  document.querySelectorAll('[data-key]').forEach(el => {
    el.value = load(el.dataset.key);
  });
}

/* ── Image upload helper ─────────────────────────── */
function bindImageUpload(inputId, previewId, fieldId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const field   = document.getElementById(fieldId);
  if (!input) return;

  // Update preview when URL field changes
  field.addEventListener('input', () => {
    preview.src = field.value;
    preview.classList.toggle('hidden', !field.value);
  });

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    field.value = b64;
    preview.src = b64;
    preview.classList.remove('hidden');
  });
}

bindImageUpload('heroBgUpload',  'heroBgPreview',   'f-heroBg');
bindImageUpload('avatarUpload',  'avatarPreview',   'f-avatarUrl');

/* ── Sync save for hero (includes heroBg + avatarUrl) */
document.querySelector('.btn-save[data-panel="hero"]').addEventListener('click', () => {
  ['heroName','heroSub','heroSlogan','heroBg','avatarUrl'].forEach(k => {
    const el = document.getElementById(`f-${k}`);
    if (el) store(k, el.value);
  });
  showToast('Luu Hero thanh cong! 💖');
}, { capture: true });

/* ══════════════════════════════════════════════════
   BLOG
══════════════════════════════════════════════════ */
function getPosts()       { return JSON.parse(localStorage.getItem('npt_posts') || '[]'); }
function savePosts(posts) { localStorage.setItem('npt_posts', JSON.stringify(posts)); }

function renderPostsList() {
  const posts = getPosts();
  const list  = document.getElementById('postsList');
  list.innerHTML = '';
  if (!posts.length) {
    list.innerHTML = '<p style="color:var(--text-muted);padding:12px 0">Chua co bai viet nao.</p>';
    return;
  }
  posts.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-info">
        ${p.img ? `<img src="${p.img}" class="list-thumb" alt="" />` : ''}
        <div>
          <strong>${p.title || '(Chua co tieu de)'}</strong>
          <small>${p.tag || ''}</small>
        </div>
      </div>
      <div class="list-actions">
        <button class="btn-edit" data-i="${i}"><i class="fas fa-pen"></i></button>
        <button class="btn-del"  data-i="${i}"><i class="fas fa-trash"></i></button>
      </div>`;
    list.appendChild(div);
  });
}

function openPostForm(post, idx) {
  const form = document.getElementById('postForm');
  document.getElementById('postFormTitle').textContent = idx === -1 ? 'Bai viet moi' : 'Chinh sua bai viet';
  document.getElementById('pf-img').value     = post.img     || '';
  document.getElementById('pf-tag').value     = post.tag     || '';
  document.getElementById('pf-title').value   = post.title   || '';
  document.getElementById('pf-summary').value = post.summary || '';
  document.getElementById('pf-content').value = post.content || '';
  document.getElementById('pf-id').value      = idx;
  const preview = document.getElementById('postImgPreview');
  preview.src = post.img || '';
  preview.classList.toggle('hidden', !post.img);
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnAddPost').addEventListener('click', () => {
  openPostForm({}, -1);
});

document.getElementById('postsList').addEventListener('click', e => {
  const editBtn = e.target.closest('.btn-edit');
  const delBtn  = e.target.closest('.btn-del');
  if (editBtn) {
    const i = parseInt(editBtn.dataset.i);
    openPostForm(getPosts()[i], i);
  }
  if (delBtn) {
    const i = parseInt(delBtn.dataset.i);
    if (!confirm('Xoa bai viet nay?')) return;
    const posts = getPosts();
    posts.splice(i, 1);
    savePosts(posts);
    renderPostsList();
    showToast('Da xoa bai viet!');
  }
});

document.getElementById('btnSavePost').addEventListener('click', () => {
  const idx = parseInt(document.getElementById('pf-id').value);
  const post = {
    img:     document.getElementById('pf-img').value.trim(),
    tag:     document.getElementById('pf-tag').value.trim(),
    title:   document.getElementById('pf-title').value.trim(),
    summary: document.getElementById('pf-summary').value.trim(),
    content: document.getElementById('pf-content').value.trim(),
    date:    new Date().toLocaleDateString('vi-VN')
  };
  const posts = getPosts();
  if (idx === -1) {
    posts.unshift(post);
  } else {
    posts[idx] = post;
  }
  savePosts(posts);
  renderPostsList();
  document.getElementById('postForm').classList.add('hidden');
  showToast('Luu bai viet thanh cong! 💖');
});

document.getElementById('btnCancelPost').addEventListener('click', () => {
  document.getElementById('postForm').classList.add('hidden');
});

// Post image upload
document.getElementById('postImgUpload').addEventListener('change', async function() {
  if (!this.files[0]) return;
  const b64 = await fileToBase64(this.files[0]);
  document.getElementById('pf-img').value = b64;
  const p = document.getElementById('postImgPreview');
  p.src = b64;
  p.classList.remove('hidden');
});

document.getElementById('pf-img').addEventListener('input', function() {
  const p = document.getElementById('postImgPreview');
  p.src = this.value;
  p.classList.toggle('hidden', !this.value);
});

/* ══════════════════════════════════════════════════
   PHOTOS
══════════════════════════════════════════════════ */
function getPhotos()       { return JSON.parse(localStorage.getItem('npt_photos') || '[]'); }
function savePhotos(items) { localStorage.setItem('npt_photos', JSON.stringify(items)); }

function renderPhotosGrid() {
  const grid   = document.getElementById('photosGrid');
  const photos = getPhotos();
  grid.innerHTML = '';
  photos.forEach((ph, i) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb-wrap';
    div.innerHTML = `
      <img src="${ph.img}" alt="${ph.caption || ''}" class="photo-thumb" />
      <div class="photo-thumb-actions">
        <span class="photo-caption-text">${ph.caption || ''}</span>
        <button class="btn-del-photo" data-i="${i}" title="Xoa"><i class="fas fa-trash"></i></button>
      </div>`;
    grid.appendChild(div);
  });
}

document.getElementById('btnAddPhoto').addEventListener('click', () => {
  const url     = document.getElementById('ph-url').value.trim();
  const caption = document.getElementById('ph-caption').value.trim();
  if (!url) { showToast('Vui long nhap URL hoac upload anh!'); return; }
  const photos = getPhotos();
  photos.unshift({ img: url, caption });
  savePhotos(photos);
  renderPhotosGrid();
  document.getElementById('ph-url').value     = '';
  document.getElementById('ph-caption').value = '';
  showToast('Da them anh! 📷');
});

// Multi-file upload for photos
document.getElementById('photoUpload').addEventListener('change', async function() {
  const files  = Array.from(this.files);
  const photos = getPhotos();
  for (const file of files) {
    const b64 = await fileToBase64(file);
    photos.unshift({ img: b64, caption: '' });
  }
  savePhotos(photos);
  renderPhotosGrid();
  this.value = '';
  showToast(`Da them ${files.length} anh! 📷`);
});

document.getElementById('photosGrid').addEventListener('click', e => {
  const btn = e.target.closest('.btn-del-photo');
  if (!btn) return;
  const i = parseInt(btn.dataset.i);
  if (!confirm('Xoa anh nay?')) return;
  const photos = getPhotos();
  photos.splice(i, 1);
  savePhotos(photos);
  renderPhotosGrid();
  showToast('Da xoa anh!');
});

/* ══════════════════════════════════════════════════
   PODCAST
══════════════════════════════════════════════════ */
function getEpisodes()     { return JSON.parse(localStorage.getItem('npt_episodes') || '[]'); }
function saveEpisodes(eps) { localStorage.setItem('npt_episodes', JSON.stringify(eps)); }

function renderEpisodeList() {
  const eps  = getEpisodes();
  const list = document.getElementById('episodeList');
  list.innerHTML = '';
  if (!eps.length) {
    list.innerHTML = '<p style="color:var(--text-muted);padding:12px 0">Chua co tap nao.</p>';
    return;
  }
  eps.forEach((ep, i) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <div class="list-item-info">
        ${ep.img ? `<img src="${ep.img}" class="list-thumb" alt="" />` : ''}
        <div>
          <strong>${ep.title || '(Chua co tieu de)'}</strong>
          <small>${ep.link || ''}</small>
        </div>
      </div>
      <div class="list-actions">
        <button class="btn-edit" data-i="${i}"><i class="fas fa-pen"></i></button>
        <button class="btn-del"  data-i="${i}"><i class="fas fa-trash"></i></button>
      </div>`;
    list.appendChild(div);
  });
}

function openEpisodeForm(ep, idx) {
  const form = document.getElementById('episodeForm');
  document.getElementById('epFormTitle').textContent = idx === -1 ? 'Tap moi' : 'Chinh sua tap';
  document.getElementById('ep-img').value   = ep.img   || '';
  document.getElementById('ep-title').value = ep.title || '';
  document.getElementById('ep-desc').value  = ep.desc  || '';
  document.getElementById('ep-link').value  = ep.link  || '';
  document.getElementById('ep-id').value    = idx;
  const preview = document.getElementById('epImgPreview');
  preview.src = ep.img || '';
  preview.classList.toggle('hidden', !ep.img);
  form.classList.remove('hidden');
  form.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnAddEpisode').addEventListener('click', () => {
  openEpisodeForm({}, -1);
});

document.getElementById('episodeList').addEventListener('click', e => {
  const editBtn = e.target.closest('.btn-edit');
  const delBtn  = e.target.closest('.btn-del');
  if (editBtn) {
    const i = parseInt(editBtn.dataset.i);
    openEpisodeForm(getEpisodes()[i], i);
  }
  if (delBtn) {
    const i = parseInt(delBtn.dataset.i);
    if (!confirm('Xoa tap nay?')) return;
    const eps = getEpisodes();
    eps.splice(i, 1);
    saveEpisodes(eps);
    renderEpisodeList();
    showToast('Da xoa tap!');
  }
});

document.getElementById('btnSaveEpisode').addEventListener('click', () => {
  const idx = parseInt(document.getElementById('ep-id').value);
  const ep  = {
    img:   document.getElementById('ep-img').value.trim(),
    title: document.getElementById('ep-title').value.trim(),
    desc:  document.getElementById('ep-desc').value.trim(),
    link:  document.getElementById('ep-link').value.trim()
  };
  const eps = getEpisodes();
  if (idx === -1) {
    eps.unshift(ep);
  } else {
    eps[idx] = ep;
  }
  saveEpisodes(eps);
  renderEpisodeList();
  document.getElementById('episodeForm').classList.add('hidden');
  showToast('Luu tap thanh cong! 🎙️');
});

document.getElementById('btnCancelEpisode').addEventListener('click', () => {
  document.getElementById('episodeForm').classList.add('hidden');
});

document.getElementById('epImgUpload').addEventListener('change', async function() {
  if (!this.files[0]) return;
  const b64 = await fileToBase64(this.files[0]);
  document.getElementById('ep-img').value = b64;
  const p = document.getElementById('epImgPreview');
  p.src = b64;
  p.classList.remove('hidden');
});

document.getElementById('ep-img').addEventListener('input', function() {
  const p = document.getElementById('epImgPreview');
  p.src = this.value;
  p.classList.toggle('hidden', !this.value);
});

/* ══════════════════════════════════════════════════
   SETTINGS — Password change & clear data
══════════════════════════════════════════════════ */
document.getElementById('btnChangePass').addEventListener('click', () => {
  const oldPass = document.getElementById('f-oldPass').value;
  const newPass = document.getElementById('f-newPass').value;
  const newPass2= document.getElementById('f-newPass2').value;
  const err     = document.getElementById('passError');

  err.classList.add('hidden');

  if (oldPass !== getPass()) {
    err.textContent = 'Mat khau hien tai khong dung!';
    err.classList.remove('hidden');
    return;
  }
  if (!newPass || newPass.length < 6) {
    err.textContent = 'Mat khau moi phai co it nhat 6 ky tu!';
    err.classList.remove('hidden');
    return;
  }
  if (newPass !== newPass2) {
    err.textContent = 'Mat khau moi khong khop!';
    err.classList.remove('hidden');
    return;
  }

  localStorage.setItem(PASS_KEY, newPass);
  document.getElementById('f-oldPass').value  = '';
  document.getElementById('f-newPass').value  = '';
  document.getElementById('f-newPass2').value = '';
  showToast('Doi mat khau thanh cong! 🔒');
});

document.getElementById('btnClearData').addEventListener('click', () => {
  if (!confirm('Ban co chac muon xoa toan bo du lieu? Thao tac nay khong the hoan tac!')) return;
  const keepKeys = [ADMIN_KEY, PASS_KEY];
  const keys = Object.keys(localStorage).filter(k => k.startsWith('npt_') && !keepKeys.includes(k));
  keys.forEach(k => localStorage.removeItem(k));
  populateFields();
  renderPostsList();
  renderPhotosGrid();
  renderEpisodeList();
  showToast('Da xoa du lieu! 🗑️');
});

/* ── Init ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  populateFields();
  renderPostsList();
  renderPhotosGrid();
  renderEpisodeList();
});
