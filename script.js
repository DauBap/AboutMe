/* script.js  notphuongthao main page logic */

const ADMIN_KEY = 'npt_isAdmin';
const DEFAULT_PASS = '14101999';
const PASS_KEY = 'npt_adminPass';

/*  Helpers  */
function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === '1';
}

function getPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

/*  Apply stored content to the page 
   Every element with [data-field] gets its text/href
   filled in from localStorage on load.               */
async function applyStoredContent() {
  const cfg = await db.getConfig();

  const fields = [
    'heroSub', 'heroName', 'heroSlogan',
    'introName', 'introSlogan', 'introHometown', 'introHobbies', 'introBio',
    'contactEmail', 'contactLocation'
  ];
  fields.forEach(key => {
    const el = document.querySelector(`[data-field="${key}"]`);
    if (el && cfg[key]) el.textContent = cfg[key];
  });

  ['socialFb', 'socialIg', 'socialTtk'].forEach(key => {
    const el = document.getElementById(key);
    if (el && cfg[key]) el.setAttribute('href', cfg[key]);
  });

  const introAvatar      = document.getElementById('introAvatar');
  const introPlaceholder = document.getElementById('introAvatarPlaceholder');
  if (introAvatar && introPlaceholder) {
    if (cfg.avatarUrl) {
      introAvatar.src = cfg.avatarUrl;
      introAvatar.classList.add('loaded');
      introPlaceholder.classList.add('hidden');
    } else {
      introAvatar.classList.remove('loaded');
      introPlaceholder.classList.remove('hidden');
    }
  }

  const cover = document.getElementById('heroCover');
  if (cfg.heroBg && cover) cover.style.backgroundImage = `url('${cfg.heroBg}')`;
}

/*  Header scroll behaviour  */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const onScroll = () => {
    if (document.body.classList.contains('on-subpage')) return;
    header.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/*  Hamburger / mobile menu  */
function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
    btn.innerHTML = menu.classList.contains('open')
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  });

  // Close menu when a link is clicked
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

/*  Smooth scroll với tốc độ tùy chỉnh  */
function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const diff   = targetY - startY;
  let start    = null;
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  function step(timestamp) {
    if (!start) start = timestamp;
    const elapsed  = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + diff * easeInOut(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('.scroll-link');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY, 1000);
  });
}

/*  Show/hide admin floating bar based on session  */
function updateAdminUI() {
  let bar = document.getElementById('adminFloatBar');
  if (isAdmin()) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'adminFloatBar';
      bar.innerHTML = `
        <span class="admin-bar-label"><i class="fas fa-lock-open"></i> Admin</span>
        <button id="btnLogout" title="Đăng xuất"><i class="fas fa-sign-out-alt"></i> Đăng xuất</button>
      `;
      document.body.appendChild(bar);
      document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem(ADMIN_KEY);
        bar.remove();
        updateAdminUI();
      });
    }
  } else {
    if (bar) bar.remove();
  }
}

/*  Contact form (basic)  */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Da gui! ';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
      form.reset();
    }, 2500);
  });
}

/* ══════════════════════════════════════════════════
   SPA PAGE ROUTER
══════════════════════════════════════════════════ */
const PAGE_META = {
  blog:    { title: 'Blog',       sub: 'Những điều mình muốn kể',          theme: '#4a0080' },
  photos:  { title: 'Hình Chụp', sub: 'Những khoảnh khắc mình lưu giữ',    theme: '#6a0080' },
  podcast: { title: 'Podcast',    sub: 'Ngồi nghe mình kể chuyện nhé',      theme: '#1a0033' }
};

let currentPage       = null;
let lightboxPhotos    = [];
let lightboxIdx       = 0;
let pendingPostImgFile  = null;
let pendingPhotoImgFile = null;

function skeletonCards(n, type) {
  let html = '';
  for (let i = 0; i < n; i++) {
    if (type === 'blog') {
      html += `<div class="blog-card sk-card">
        <div class="sk-img sk-pulse"></div>
        <div class="blog-card-body">
          <div class="sk-line sk-pulse" style="width:60px;height:20px;margin-bottom:10px"></div>
          <div class="sk-line sk-pulse" style="width:80%;height:22px;margin-bottom:8px"></div>
          <div class="sk-line sk-pulse" style="width:100%;height:14px;margin-bottom:4px"></div>
          <div class="sk-line sk-pulse" style="width:70%;height:14px"></div>
        </div>
      </div>`;
    } else if (type === 'photos') {
      html += `<div class="masonry-item sk-pulse" style="height:${180 + (i % 3) * 60}px;border-radius:12px"></div>`;
    } else if (type === 'podcast') {
      html += `<div class="episode-card sk-card">
        <div class="sk-thumb sk-pulse"></div>
        <div class="episode-body">
          <div class="sk-line sk-pulse" style="width:70%;height:20px;margin-bottom:8px"></div>
          <div class="sk-line sk-pulse" style="width:100%;height:14px;margin-bottom:4px"></div>
          <div class="sk-line sk-pulse" style="width:50%;height:14px"></div>
        </div>
      </div>`;
    }
  }
  return html;
}

function openSubView(page) {
  currentPage = page;
  const meta     = PAGE_META[page];
  const mainView = document.getElementById('mainView');
  const subView  = document.getElementById('subView');
  const body     = document.getElementById('subviewBody');
  const header   = document.getElementById('siteHeader');

  // Swap views
  mainView.classList.add('hidden');
  subView.classList.remove('hidden');

  // Force header visible
  document.body.classList.add('on-subpage');
  header.classList.add('scrolled');

  // Show skeleton
  const skType    = page === 'photos' ? 'photos' : page === 'podcast' ? 'podcast' : 'blog';
  const gridClass = page === 'blog' ? 'blog-grid' : page === 'photos' ? 'masonry-grid' : 'episode-list';
  body.innerHTML = `<div class="${gridClass}" id="subviewGrid">${skeletonCards(6, skType)}</div>`;

  window.scrollTo({ top: 0, behavior: 'instant' });

  // Fetch and render (skeleton visible while loading)
  renderSubPage(page);

  // Mark active nav
  document.querySelectorAll('[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function closeSubView() {
  const mainView = document.getElementById('mainView');
  const subView  = document.getElementById('subView');
  const header   = document.getElementById('siteHeader');
  mainView.classList.remove('hidden');
  subView.classList.add('hidden');
  document.body.classList.remove('on-subpage');
  currentPage = null;
  document.querySelectorAll('[data-page]').forEach(a => a.classList.remove('active'));
  window.scrollTo({ top: 0, behavior: 'instant' });
  header.classList.toggle('scrolled', false);
}

async function renderSubPage(page) {
  const body = document.getElementById('subviewBody');
  if (page === 'blog')    await renderBlogPage(body);
  if (page === 'photos')  await renderPhotosPage(body);
  if (page === 'podcast') await renderPodcastPage(body);
}

/* ── Blog ─────────────────────────────────────── */
async function renderBlogPage(container) {
  const posts = await db.getPosts();
  let html = '';

  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewPost"><i class="fas fa-plus"></i> Bài viết mới</button>
    </div>`;
  }

  if (!posts.length) {
    html += `<div class="empty-state"><i class="fas fa-feather-alt"></i><p>Chưa có bài viết nào. Hãy quay lại sau nhé!</p></div>`;
    container.innerHTML = html;
    if (isAdmin()) document.getElementById('btnNewPost').addEventListener('click', () => openPostEditor());
    return;
  }

  html += '<div class="blog-grid">';
  posts.forEach((p, i) => {
    const hasImg = !!p.img;
    html += `<article class="blog-card" data-id="${p.id}" data-i="${i}" tabindex="0" role="button" aria-label="${p.title || 'Bài viết'}">
      <div class="blog-card-img ${hasImg ? '' : 'blog-card-img--placeholder'}">
        ${hasImg ? `<img src="${p.img}" alt="${p.title || ''}" loading="lazy" />` : `<span class="blog-placeholder-icon">✍️</span>`}
      </div>
      <div class="blog-card-body">
        <div class="blog-card-top">
          ${p.tag ? `<span class="blog-tag">${p.tag}</span>` : '<span></span>'}
          ${p.date ? `<span class="blog-date">${p.date}</span>` : ''}
        </div>
        <h3 class="blog-card-title">${p.title || ''}</h3>
        <p class="blog-card-summary">${p.summary || ''}</p>
        <span class="blog-read-hint">Đọc tiếp <i class="fas fa-arrow-right"></i></span>
      </div>
      ${isAdmin() ? `<div class="card-admin-actions">
        <button class="card-btn-edit" data-id="${p.id}" title="Sửa"><i class="fas fa-pen"></i></button>
        <button class="card-btn-del" data-id="${p.id}" title="Xoá"><i class="fas fa-trash"></i></button>
      </div>` : ''}
    </article>`;
  });
  html += '</div>';
  container.innerHTML = html;

  if (isAdmin()) {
    document.getElementById('btnNewPost').addEventListener('click', () => openPostEditor());
    container.querySelectorAll('.card-btn-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        openPostEditor(posts.find(p => p.id === id));
      });
    });
    container.querySelectorAll('.card-btn-del').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Xoá bài viết này?')) return;
        try {
          await db.deletePost(parseInt(btn.dataset.id));
          renderSubPage('blog');
        } catch (err) { alert('Lỗi: ' + err.message); }
      });
    });
  }

  container.addEventListener('click', e => {
    if (e.target.closest('.card-admin-actions')) return;
    const card = e.target.closest('.blog-card');
    if (!card) return;
    const id = parseInt(card.dataset.id);
    openArticle(posts.find(p => p.id === id));
  });
  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.blog-card');
      if (!card) return;
      const id = parseInt(card.dataset.id);
      openArticle(posts.find(p => p.id === id));
    }
  });
}

function openArticle(post) {
  const overlay = document.getElementById('articleOverlay');
  const modal   = document.getElementById('articleModal');

  // Hero image
  const imgEl = document.getElementById('articleImg');
  if (post.img) {
    imgEl.src = post.img;
    imgEl.classList.remove('hidden');
  } else {
    imgEl.src = '';
    imgEl.classList.add('hidden');
  }

  const tagEl = document.getElementById('articleTag');
  tagEl.textContent  = post.tag || '';
  tagEl.style.display = post.tag ? '' : 'none';

  document.getElementById('articleDate').textContent  = post.date || '';
  document.getElementById('articleDate').style.display = post.date ? '' : 'none';
  document.getElementById('articleTitle').textContent = post.title || '';

  const content = (post.content || post.summary || '')
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  document.getElementById('articleContent').innerHTML = content;

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  modal.scrollTop = 0;
}

function initArticleModal() {
  const overlay = document.getElementById('articleOverlay');
  const closeBtn = document.getElementById('articleClose');
  if (!overlay) return;
  const close = () => { overlay.classList.add('hidden'); document.body.style.overflow = ''; };
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

/* ── Photos ───────────────────────────────────── */
async function renderPhotosPage(container) {
  const photos = await db.getPhotos();
  lightboxPhotos = photos;
  let html = '';

  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewPhoto"><i class="fas fa-plus"></i> Thêm ảnh</button>
    </div>`;
  }

  if (!photos.length) {
    html += `<div class="empty-state"><i class="fas fa-camera"></i><p>Chưa có hình nào. Hãy quay lại sau nhé!</p></div>`;
    container.innerHTML = html;
    if (isAdmin()) document.getElementById('btnNewPhoto').addEventListener('click', () => openPhotoEditor());
    return;
  }

  html += '<div class="ig-grid">';
  photos.forEach((ph, i) => {
    html += `<div class="ig-cell" data-id="${ph.id}" data-i="${i}">
      <img src="${ph.img}" alt="${ph.caption || ''}" loading="lazy" />
      <div class="ig-overlay"><i class="fas fa-expand-alt"></i>${ph.caption ? `<span class="ig-caption-peek">${ph.caption}</span>` : ''}</div>
      ${isAdmin() ? `<div class="ig-admin-actions"><button class="card-btn-edit" data-id="${ph.id}" title="Sửa"><i class="fas fa-pen"></i></button><button class="card-btn-del" data-id="${ph.id}" title="Xoá"><i class="fas fa-trash"></i></button></div>` : ''}
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;

  if (isAdmin()) {
    document.getElementById('btnNewPhoto').addEventListener('click', () => openPhotoEditor());
    container.querySelectorAll('.ig-cell .card-btn-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        openPhotoEditor(photos.find(p => p.id === id));
      });
    });
    container.querySelectorAll('.ig-cell .card-btn-del').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Xoá ảnh này?')) return;
        try {
          await db.deletePhoto(parseInt(btn.dataset.id));
          renderSubPage('photos');
        } catch (err) { alert('Lỗi: ' + err.message); }
      });
    });
  }

  container.addEventListener('click', e => {
    if (e.target.closest('.ig-admin-actions')) return;
    const cell = e.target.closest('.ig-cell');
    if (!cell) return;
    openLightbox(parseInt(cell.dataset.i));
  });
}

function openLightbox(i) {
  lightboxIdx = i;
  const ph = lightboxPhotos[i];
  document.getElementById('lightboxImg').src = ph.img;
  document.getElementById('lightboxCaption').textContent = ph.caption || '';
  document.getElementById('lightboxCaptionWrap').classList.toggle('hidden', !ph.caption);
  document.getElementById('lightboxCounter').textContent = `${i + 1} / ${lightboxPhotos.length}`;
  // hide arrows if only 1 photo
  const showArrows = lightboxPhotos.length > 1;
  document.getElementById('lightboxPrev').style.display = showArrows ? '' : 'none';
  document.getElementById('lightboxNext').style.display = showArrows ? '' : 'none';
  document.getElementById('lightboxOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function initLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  if (!overlay) return;
  const close = () => { overlay.classList.add('hidden'); document.body.style.overflow = ''; };
  const go = d => {
    lightboxIdx = (lightboxIdx + d + lightboxPhotos.length) % lightboxPhotos.length;
    const ph = lightboxPhotos[lightboxIdx];
    document.getElementById('lightboxImg').src = ph.img;
    document.getElementById('lightboxCaption').textContent = ph.caption || '';
    document.getElementById('lightboxCaptionWrap').classList.toggle('hidden', !ph.caption);
    document.getElementById('lightboxCounter').textContent = `${lightboxIdx + 1} / ${lightboxPhotos.length}`;
  };
  document.getElementById('lightboxClose').addEventListener('click', close);
  // click on the dark backdrop (left side image area) to close
  document.getElementById('lightboxBackdrop').addEventListener('click', close);
  document.getElementById('lightboxPrev').addEventListener('click', () => go(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => go(1));
  document.addEventListener('keydown', e => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
}

/* ── Podcast ──────────────────────────────────── */
async function renderPodcastPage(container) {
  const eps = await db.getEpisodes();
  let html = '';

  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewEp"><i class="fas fa-plus"></i> Thêm video</button>
    </div>`;
  }

  if (!eps.length) {
    html += `<div class="empty-state"><i class="fas fa-microphone-alt"></i><p>Chưa có tập nào. Hãy quay lại sau nhé!</p></div>`;
    container.innerHTML = html;
    if (isAdmin()) document.getElementById('btnNewEp').addEventListener('click', () => openPodcastEditor());
    return;
  }

  html += '<div class="yt-list">';
  eps.forEach((ep, i) => {
    const ytId = getYouTubeId(ep.link || '');
    const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : '';
    const href = ep.link || '#';
    html += `<div class="yt-row" data-id="${ep.id}" data-i="${i}">
      <a class="yt-card" href="${href}" target="_blank" rel="noopener noreferrer">
        <div class="yt-thumb">
          ${thumb ? `<img src="${thumb}" alt="${ep.title || ''}" loading="lazy" />` : `<div class="yt-thumb-empty"><i class="fab fa-youtube"></i></div>`}
          <span class="yt-play-icon"><i class="fas fa-play"></i></span>
        </div>
        <div class="yt-info"><h3 class="yt-title">${ep.title || ''}</h3></div>
      </a>
      ${isAdmin() ? `<div class="yt-admin-actions"><button class="card-btn-edit" data-id="${ep.id}" title="Sửa"><i class="fas fa-pen"></i></button><button class="card-btn-del" data-id="${ep.id}" title="Xoá"><i class="fas fa-trash"></i></button></div>` : ''}
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;

  if (isAdmin()) {
    document.getElementById('btnNewEp').addEventListener('click', () => openPodcastEditor());
    container.querySelectorAll('.card-btn-edit[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        openPodcastEditor(eps.find(e => e.id === id));
      });
    });
    container.querySelectorAll('.card-btn-del[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Xoá video này?')) return;
        try {
          await db.deleteEpisode(parseInt(btn.dataset.id));
          renderSubPage('podcast');
        } catch (err) { alert('Lỗi: ' + err.message); }
      });
    });
  }
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ══════════════════════════════════════════════════
   INLINE ADMIN EDITORS
══════════════════════════════════════════════════ */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openEditor(overlayId) {
  document.getElementById(overlayId).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeEditor(overlayId) {
  document.getElementById(overlayId).classList.add('hidden');
  document.body.style.overflow = '';
}

/* ── Post editor ── */
function openPostEditor(post = null) {
  pendingPostImgFile = null;
  const p = post || {};
  document.getElementById('postEditorTitle').textContent = post ? 'Sửa bài viết' : 'Bài viết mới';
  document.getElementById('pf-id').value      = post ? post.id : -1;
  document.getElementById('pf-img').value     = p.img     || '';
  document.getElementById('pf-tag').value     = p.tag     || '';
  document.getElementById('pf-title').value   = p.title   || '';
  document.getElementById('pf-summary').value = p.summary || '';
  document.getElementById('pf-content').value = p.content || '';
  const prev = document.getElementById('pf-img-preview');
  if (p.img) { prev.src = p.img; prev.classList.remove('hidden'); }
  else       { prev.src = ''; prev.classList.add('hidden'); }
  openEditor('postEditorOverlay');
}

function initPostEditor() {
  const overlay = document.getElementById('postEditorOverlay');
  if (!overlay) return;

  document.getElementById('pf-img').addEventListener('input', e => {
    const v = e.target.value.trim();
    const prev = document.getElementById('pf-img-preview');
    prev.src = v; prev.classList.toggle('hidden', !v);
  });

  document.getElementById('pf-img-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    pendingPostImgFile = file;
    document.getElementById('pf-img').value = '';
    const prev = document.getElementById('pf-img-preview');
    prev.src = URL.createObjectURL(file);
    prev.classList.remove('hidden');
  });

  document.getElementById('postEditorClose').addEventListener('click',  () => closeEditor('postEditorOverlay'));
  document.getElementById('postEditorCancel').addEventListener('click', () => closeEditor('postEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('postEditorOverlay'); });

  document.getElementById('postEditorSave').addEventListener('click', async () => {
    const id    = parseInt(document.getElementById('pf-id').value);
    const title = document.getElementById('pf-title').value.trim();
    if (!title) { alert('Vui lòng nhập tiêu đề!'); return; }

    const saveBtn = document.getElementById('postEditorSave');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
      let imgUrl = document.getElementById('pf-img').value.trim();
      if (pendingPostImgFile) {
        imgUrl = await db.uploadImage(pendingPostImgFile, 'posts');
        pendingPostImgFile = null;
      }
      const post = {
        img:     imgUrl,
        tag:     document.getElementById('pf-tag').value.trim(),
        title,
        summary: document.getElementById('pf-summary').value.trim(),
        content: document.getElementById('pf-content').value.trim(),
        date:    new Date().toLocaleDateString('vi-VN')
      };
      if (id === -1) await db.insertPost(post);
      else           await db.updatePost(id, post);
      closeEditor('postEditorOverlay');
      renderSubPage('blog');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu bài viết';
    }
  });
}

/* ── Photo editor ── */
function openPhotoEditor(photo = null) {
  pendingPhotoImgFile = null;
  const p = photo || {};
  document.getElementById('photoEditorTitle').textContent = photo ? 'Sửa ảnh' : 'Ảnh mới';
  document.getElementById('ph-id').value      = photo ? photo.id : -1;
  document.getElementById('ph-img').value     = p.img     || '';
  document.getElementById('ph-caption').value = p.caption || '';
  const prev = document.getElementById('ph-img-preview');
  if (p.img) { prev.src = p.img; prev.classList.remove('hidden'); }
  else       { prev.src = ''; prev.classList.add('hidden'); }
  openEditor('photoEditorOverlay');
}

function initPhotoEditor() {
  const overlay = document.getElementById('photoEditorOverlay');
  if (!overlay) return;

  document.getElementById('ph-img').addEventListener('input', e => {
    const v = e.target.value.trim();
    const prev = document.getElementById('ph-img-preview');
    prev.src = v; prev.classList.toggle('hidden', !v);
  });

  document.getElementById('ph-img-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    pendingPhotoImgFile = file;
    document.getElementById('ph-img').value = '';
    const prev = document.getElementById('ph-img-preview');
    prev.src = URL.createObjectURL(file);
    prev.classList.remove('hidden');
  });

  document.getElementById('photoEditorClose').addEventListener('click',  () => closeEditor('photoEditorOverlay'));
  document.getElementById('photoEditorCancel').addEventListener('click', () => closeEditor('photoEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('photoEditorOverlay'); });

  document.getElementById('photoEditorSave').addEventListener('click', async () => {
    const id = parseInt(document.getElementById('ph-id').value);

    const saveBtn = document.getElementById('photoEditorSave');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
      let imgUrl = document.getElementById('ph-img').value.trim();
      if (pendingPhotoImgFile) {
        imgUrl = await db.uploadImage(pendingPhotoImgFile, 'photos');
        pendingPhotoImgFile = null;
      }
      if (!imgUrl) { alert('Vui lòng chọn ảnh!'); return; }
      const photo = { img: imgUrl, caption: document.getElementById('ph-caption').value.trim() };
      if (id === -1) await db.insertPhoto(photo);
      else           await db.updatePhoto(id, photo);
      closeEditor('photoEditorOverlay');
      renderSubPage('photos');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu ảnh';
    }
  });
}

/* ── Podcast editor ── */
function openPodcastEditor(ep = null) {
  const e = ep || {};
  document.getElementById('podcastEditorTitle').textContent = ep ? 'Sửa video' : 'Video mới';
  document.getElementById('ep-id').value    = ep ? ep.id : -1;
  document.getElementById('ep-link').value  = e.link  || '';
  document.getElementById('ep-title').value = e.title || '';
  const ytId = getYouTubeId(e.link || '');
  const wrap = document.getElementById('epYtPreview');
  if (ytId) {
    document.getElementById('epYtThumb').src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    wrap.classList.remove('hidden');
  } else { wrap.classList.add('hidden'); }
  openEditor('podcastEditorOverlay');
}

function initPodcastEditor() {
  const overlay = document.getElementById('podcastEditorOverlay');
  if (!overlay) return;

  document.getElementById('ep-link').addEventListener('input', e => {
    const ytId = getYouTubeId(e.target.value);
    const wrap  = document.getElementById('epYtPreview');
    if (ytId) {
      document.getElementById('epYtThumb').src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
      wrap.classList.remove('hidden');
    } else { wrap.classList.add('hidden'); }
  });

  document.getElementById('podcastEditorClose').addEventListener('click',  () => closeEditor('podcastEditorOverlay'));
  document.getElementById('podcastEditorCancel').addEventListener('click', () => closeEditor('podcastEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('podcastEditorOverlay'); });

  document.getElementById('podcastEditorSave').addEventListener('click', async () => {
    const id    = parseInt(document.getElementById('ep-id').value);
    const title = document.getElementById('ep-title').value.trim();
    const link  = document.getElementById('ep-link').value.trim();
    if (!title || !link) { alert('Vui lòng nhập tiêu đề và link!'); return; }

    const saveBtn = document.getElementById('podcastEditorSave');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
      const ep = { title, link };
      if (id === -1) await db.insertEpisode(ep);
      else           await db.updateEpisode(id, ep);
      closeEditor('podcastEditorOverlay');
      renderSubPage('podcast');
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu video';
    }
  });
}

/* ── Router init ──────────────────────────────── */
function initPageRouter() {
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    const page = link.dataset.page;
    if (PAGE_META[page]) openSubView(page);
  });

  // Click scroll-link while on sub-page → close sub-view, then smooth scroll to section
  document.addEventListener('click', e => {
    if (!currentPage) return;
    const link = e.target.closest('.scroll-link');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeSubView(); // resets to top=0
    setTimeout(() => {
      const target = document.querySelector(href);
      if (target) smoothScrollTo(target.getBoundingClientRect().top + window.scrollY, 1000);
    }, 50);
  });

  // Click logo → go back to home if on sub-page
  document.querySelector('.header-logo')?.addEventListener('click', e => {
    if (currentPage) { e.preventDefault(); closeSubView(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && currentPage &&
        document.getElementById('articleOverlay')?.classList.contains('hidden') &&
        document.getElementById('lightboxOverlay')?.classList.contains('hidden')) {
      closeSubView();
    }
  });
}

/*  Init  */
document.addEventListener('DOMContentLoaded', () => {
  applyStoredContent();
  updateAdminUI();
  initHeaderScroll();
  initHamburger();
  initSmoothScroll();
  initContactForm();
  initPageRouter();
  initArticleModal();
  initLightbox();
  initPostEditor();
  initPhotoEditor();
  initPodcastEditor();
});