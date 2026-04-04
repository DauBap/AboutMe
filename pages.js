/* pages.js — notphuongthao sub-page rendering (blog / hinh-chup / podcast) */

const PAGE = document.body.classList.contains('sub-page')
  ? (document.querySelector('.sub-page-label')?.textContent?.trim() || '')
  : '';

/* ── Helpers ─────────────────────────────────────── */
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function toggleEmpty(gridId, emptyId, hasItems) {
  const grid  = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  if (grid)  grid.classList.toggle('hidden', !hasItems);
  if (empty) empty.classList.toggle('hidden', hasItems);
}

/* ══════════════════════════════════════════════════
   BLOG PAGE
══════════════════════════════════════════════════ */
if (document.getElementById('blogGrid') !== null) {
  const grid    = document.getElementById('blogGrid');
  const overlay = document.getElementById('articleOverlay');
  const closeBtn= document.getElementById('articleClose');

  function renderBlog() {
    const posts = JSON.parse(localStorage.getItem('npt_posts') || '[]');
    grid.innerHTML = '';
    toggleEmpty('blogGrid', 'emptyState', posts.length > 0);

    posts.forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'blog-card';
      card.setAttribute('data-i', i);
      card.setAttribute('data-post', encodeURIComponent(JSON.stringify(p)));
      card.innerHTML = `
        ${p.img ? `<div class="blog-card-img" style="background-image:url('${p.img}')"></div>` : ''}
        <div class="blog-card-body">
          ${p.tag ? `<span class="blog-tag">${p.tag}</span>` : ''}
          <h3 class="blog-card-title">${p.title || ''}</h3>
          <p class="blog-card-summary">${p.summary || ''}</p>
          <div class="blog-card-footer">
            <span class="blog-date">${p.date || ''}</span>
            <button class="btn-read" data-i="${i}">Doc tiep &rarr;</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });

    grid.addEventListener('click', e => {
      // Nếu click vào admin button, bỏ qua
      if (e.target.closest('.card-admin-actions')) return;
      
      // Tìm blog card gần nhất
      const card = e.target.closest('.blog-card');
      if (!card) return;
      
      // Tìm index của post
      const btn = card.querySelector('.btn-read');
      if (!btn) return;
      
      const post = posts[parseInt(btn.dataset.i)];
      openArticle(post);
    });
  }

  function openArticle(post) {
    document.getElementById('articleImg').src         = post.img || '';
    document.getElementById('articleImg').classList.toggle('hidden', !post.img);
    document.getElementById('articleTag').textContent   = post.tag || '';
    document.getElementById('articleTitle').textContent = post.title || '';
    // Render newlines as paragraphs
    const content = (post.content || '')
      .split('\n\n')
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
    document.getElementById('articleContent').innerHTML = content || post.summary || '';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeArticle() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeArticle);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeArticle();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeArticle();
  });

  renderBlog();
}

/* ══════════════════════════════════════════════════
   HINH CHUP PAGE
══════════════════════════════════════════════════ */
if (document.getElementById('photosGrid') !== null) {
  const grid         = document.getElementById('photosGrid');
  const lbOverlay    = document.getElementById('lightboxOverlay');
  const lbImg        = document.getElementById('lightboxImg');
  const lbCaption    = document.getElementById('lightboxCaption');
  const lbClose      = document.getElementById('lightboxClose');
  const lbPrev       = document.getElementById('lightboxPrev');
  const lbNext       = document.getElementById('lightboxNext');
  let currentIdx     = 0;
  let photos         = [];

  function renderPhotos() {
    photos = JSON.parse(localStorage.getItem('npt_photos') || '[]');
    grid.innerHTML = '';
    toggleEmpty('photosGrid', 'emptyState', photos.length > 0);

    photos.forEach((ph, i) => {
      const div = document.createElement('div');
      div.className = 'masonry-item';
      div.innerHTML = `<img src="${ph.img}" alt="${ph.caption || ''}" loading="lazy" data-i="${i}" />
        ${ph.caption ? `<div class="masonry-caption">${ph.caption}</div>` : ''}`;
      grid.appendChild(div);
    });

    grid.addEventListener('click', e => {
      const img = e.target.closest('img[data-i]');
      if (!img) return;
      openLightbox(parseInt(img.dataset.i));
    });
  }

  function openLightbox(i) {
    currentIdx     = i;
    lbImg.src      = photos[i].img;
    lbCaption.textContent = photos[i].caption || '';
    lbOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lbOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function goTo(delta) {
    currentIdx = (currentIdx + delta + photos.length) % photos.length;
    lbImg.src  = photos[currentIdx].img;
    lbCaption.textContent = photos[currentIdx].caption || '';
  }

  lbClose.addEventListener('click', closeLightbox);
  lbOverlay.addEventListener('click', e => { if (e.target === lbOverlay) closeLightbox(); });
  lbPrev.addEventListener('click', () => goTo(-1));
  lbNext.addEventListener('click', () => goTo(1));
  document.addEventListener('keydown', e => {
    if (lbOverlay.classList.contains('hidden')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   goTo(-1);
    if (e.key === 'ArrowRight')  goTo(1);
  });

  renderPhotos();
}

/* ══════════════════════════════════════════════════
   PODCAST PAGE
══════════════════════════════════════════════════ */
if (document.getElementById('episodeList') !== null) {
  const list = document.getElementById('episodeList');

  function renderEpisodes() {
    const eps = JSON.parse(localStorage.getItem('npt_episodes') || '[]');
    list.innerHTML = '';
    toggleEmpty('episodeList', 'emptyState', eps.length > 0);

    eps.forEach(ep => {
      const div = document.createElement('div');
      div.className = 'episode-card';
      div.innerHTML = `
        ${ep.img ? `<img src="${ep.img}" class="episode-thumb" alt="" />` : '<div class="episode-thumb-placeholder"><i class="fas fa-microphone-alt"></i></div>'}
        <div class="episode-body">
          <h3 class="episode-title">${ep.title || ''}</h3>
          <p class="episode-desc">${ep.desc || ''}</p>
          ${ep.link ? `<a href="${ep.link}" target="_blank" rel="noopener noreferrer" class="btn-listen"><i class="fas fa-headphones"></i> Nghe ngay</a>` : ''}
        </div>`;
      list.appendChild(div);
    });
  }

  renderEpisodes();
}
