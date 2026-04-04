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

const DEFAULT_INTRO_ROWS = [
  { icon: '📍', label: 'Quê quán', value: 'Hồ Chí Minh, Việt Nam' },
  { icon: '💖', label: 'Sở thích', value: 'Viết lách, nhiếp ảnh, podcast, tarot' },
  { icon: '🎓', label: 'Vai trò', value: 'Học sinh / Sinh viên' }
];

/* ── Toast Notification System ── */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
  toast.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });
}



function renderIntroRows(rows) {
  const container = document.getElementById('introInfoRows');
  if (!container) return;
  container.innerHTML = rows.map(r => `
    <div class="info-row">
      <span class="info-icon">${r.icon}</span>
      <div class="info-text">
        <span class="info-label">${r.label}</span>
        <span class="info-value">${r.value}</span>
      </div>
    </div>`).join('');
}

/*  Apply stored content  */
async function applyStoredContent() {
  try {
    const cfg = await db.getConfig();

    const fields = [
      'heroSub', 'heroName', 'heroSlogan',
      'introName', 'introSlogan',
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

    // Load custom contact fields
    if (cfg.contactCustomFields) {
      try {
        const customFields = JSON.parse(cfg.contactCustomFields);
        localStorage.setItem('contactCustomFields', JSON.stringify(customFields));
      } catch (e) {
        console.log('Could not parse custom fields:', e);
      }
    }

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

    // Render dynamic intro rows
    let rows = DEFAULT_INTRO_ROWS;
    try { rows = cfg.intro_rows ? JSON.parse(cfg.intro_rows) : DEFAULT_INTRO_ROWS; } catch {}
    renderIntroRows(rows);
  } catch (err) {
    console.error('applyStoredContent:', err);
  } finally {
    // Always reveal content regardless of errors
    document.body.classList.remove('page-loading');
    document.body.classList.add('page-loaded');
  }
}

/*  Load latest blog post from Supabase  */
async function loadLatestBlog() {
  try {
    const posts = await db.getPosts();
    if (posts.length === 0) return; // No posts

    const latest = posts[0]; // First post (newest, already sorted by created_at DESC)
    
    const titleEl = document.getElementById('latestBlogTitle');
    const summaryEl = document.getElementById('latestBlogSummary');
    const tagEl = document.getElementById('latestBlogTag');
    const dateEl = document.getElementById('latestBlogDate');
    const imgEl = document.getElementById('latestBlogImg');
    const imgWrapEl = document.querySelector('.latest-blog-img-wrap');
    const btnEl = document.getElementById('latestBlogBtn');

    if (titleEl) titleEl.textContent = latest.title || 'Blog mới';
    if (summaryEl) summaryEl.textContent = latest.summary || '';
    if (tagEl) tagEl.textContent = latest.tag || 'Blog';
    if (dateEl) {
      const date = new Date(latest.created_at);
      dateEl.textContent = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (imgEl) {
      imgEl.src = latest.img || '';
      imgEl.style.display = latest.img ? 'block' : 'none';
      // Store post data for click handler
      imgEl.dataset.latestPost = JSON.stringify(latest);
    }
    // Hide image wrapper if no image
    if (imgWrapEl) {
      imgWrapEl.style.display = latest.img ? 'block' : 'none';
    }
    // Adjust layout when image is hidden
    const layoutEl = document.querySelector('.latest-blog-layout');
    if (layoutEl) {
      if (latest.img) {
        layoutEl.style.gridTemplateColumns = '0.65fr 1.35fr';
      } else {
        layoutEl.style.gridTemplateColumns = '1fr';
      }
    }
    
    // Click handler to open blog
    if (btnEl) {
      btnEl.addEventListener('click', (e) => {
        e.preventDefault();
        // Find blog page and open latest post
        const blogLink = document.querySelector('[data-page="blog"]');
        if (blogLink) {
          blogLink.click();
          setTimeout(() => {
            // Trigger modal to open latest post
            const event = new CustomEvent('openLatestPost', { detail: latest });
            window.dispatchEvent(event);
          }, 300);
        }
      });
    }
  } catch (err) {
    console.error('loadLatestBlog:', err);
  }
}

async function loadLatestPhotos() {
  try {
    const photos = await db.getPhotos();
    if (photos.length === 0) return; // No photos

    const latest = photos[0]; // First photo (newest, already sorted by created_at DESC)
    
    const titleEl = document.getElementById('latestPhotosTitle');
    const summaryEl = document.getElementById('latestPhotosSummary');
    const dateEl = document.getElementById('latestPhotosDate');
    const imgEl = document.getElementById('latestPhotosImg');
    const imgWrapEl = document.querySelector('.latest-photos-img-wrap');
    const btnEl = document.getElementById('latestPhotosBtn');

    if (titleEl) titleEl.textContent = latest.caption || 'Hình ảnh mới';
    if (summaryEl) summaryEl.textContent = latest.location || '';
    if (dateEl) {
      const date = new Date(latest.created_at);
      dateEl.textContent = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (imgEl) {
      imgEl.src = latest.img || '';
      imgEl.style.display = latest.img ? 'block' : 'none';
      // Store photo data for click handler
      imgEl.dataset.latestPhoto = JSON.stringify(latest);
    }
    // Hide image wrapper if no image
    if (imgWrapEl) {
      imgWrapEl.style.display = latest.img ? 'block' : 'none';
    }
    // Adjust layout when image is hidden
    const layoutEl = document.querySelector('.latest-photos-layout');
    if (layoutEl) {
      if (latest.img) {
        layoutEl.style.gridTemplateColumns = '1.35fr 0.65fr';
      } else {
        layoutEl.style.gridTemplateColumns = '1fr';
      }
    }
    
    // Click handler to open photos page
    if (btnEl) {
      btnEl.addEventListener('click', (e) => {
        e.preventDefault();
        // Navigate to photos page
        const photosLink = document.querySelector('[data-page="photos"]');
        if (photosLink) {
          photosLink.click();
        }
      });
    }
  } catch (err) {
    console.error('loadLatestPhotos:', err);
  }
}

/*  Header scroll behaviour  */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const onScroll = () => {
    if (document.body.classList.contains('on-subpage')) return;
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 50);
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
  const coverBtn  = document.getElementById('heroCoverEditBtn');
  const avatarBtn = document.getElementById('avatarEditBtn');
  if (isAdmin()) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'adminFloatBar';
      bar.innerHTML = `
        <button class="admin-bar-toggle" title="Admin menu"><i class="fas fa-lock-open"></i></button>
        <span class="admin-bar-label"><i class="fas fa-lock-open"></i> Admin</span>
        <button id="btnLogout" title="Đăng xuất"><i class="fas fa-sign-out-alt"></i> Đăng xuất</button>
      `;
      document.body.appendChild(bar);
      bar.querySelector('.admin-bar-toggle').addEventListener('click', () => {
        bar.classList.toggle('expanded');
      });
      // Click anywhere on bar (except buttons) to toggle
      bar.addEventListener('click', (e) => {
        if (e.target === bar || e.target.closest('.admin-bar-label')) {
          bar.classList.toggle('expanded');
        }
      });
      document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem(ADMIN_KEY);
        bar.remove();
        updateAdminUI();
      });
    }
    if (coverBtn) {
      coverBtn.classList.add('visible');
      const fileInput = document.getElementById('heroCoverFile');
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        fileInput.value = '';
        openCropper(file, 3 / 1, async blob => {
          const icon = coverBtn.querySelector('i');
          icon.className = 'fas fa-spinner fa-spin';
          try {
            const url = await db.uploadImage(blobToFile(blob, file.name), 'covers');
            await db.setConfig('heroBg', url);
            const cover = document.getElementById('heroCover');
            if (cover) cover.style.backgroundImage = `url('${url}')`;
          } catch (err) {
            showToast('Lỗi upload: ' + err.message);
          } finally {
            icon.className = 'fas fa-camera';
          }
        });
      });
    }
    if (avatarBtn) {
      avatarBtn.classList.add('visible');
      const fileInput = document.getElementById('avatarFile');
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        fileInput.value = '';
        openCropper(file, 1, async blob => {
          const icon = avatarBtn.querySelector('i');
          icon.className = 'fas fa-spinner fa-spin';
          try {
            const url = await db.uploadImage(blobToFile(blob, file.name), 'avatars');
            await db.setConfig('avatarUrl', url);
            const img = document.getElementById('introAvatar');
            const placeholder = document.getElementById('introAvatarPlaceholder');
            if (img) { img.src = url; img.classList.add('loaded'); }
            if (placeholder) placeholder.classList.add('hidden');
          } catch (err) {
            showToast('Lỗi upload: ' + err.message);
          } finally {
            icon.className = 'fas fa-camera';
          }
        });
      });
    }
    const introEditBtn = document.getElementById('introEditBtn');
    if (introEditBtn) introEditBtn.classList.remove('hidden');
  } else {
    if (bar) bar.remove();
    if (coverBtn)  coverBtn.classList.remove('visible');
    if (avatarBtn) avatarBtn.classList.remove('visible');
    const introEditBtn = document.getElementById('introEditBtn');
    if (introEditBtn) introEditBtn.classList.add('hidden');
  }
}

/*  Contact form with Formspree + Spam Protection  */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    
    // Get form values
    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const message = form.querySelector('textarea[name="message"]').value.trim();
    
    // ── Validation với Toast Messages ──
    
    // Check name
    if (!name) {
      showToast('❌ Vui lòng nhập tên của bạn');
      return;
    }
    
    if (name.length < 2) {
      showToast('❌ Tên phải dài ít nhất 2 ký tự');
      return;
    }
    
    if (name.length > 100) {
      showToast('❌ Tên quá dài (tối đa 100 ký tự)');
      return;
    }
    
    // Check email
    if (!email) {
      showToast('❌ Vui lòng nhập email của bạn');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('❌ Email không hợp lệ. Vui lòng kiểm tra lại');
      return;
    }
    
    // Check message
    if (!message) {
      showToast('❌ Vui lòng nhập tin nhắn cho mình');
      return;
    }
    
    if (message.length < 5) {
      showToast('❌ Tin nhắn phải dài ít nhất 5 ký tự');
      return;
    }
    
    if (message.length > 5000) {
      showToast('❌ Tin nhắn quá dài (tối đa 5000 ký tự)');
      return;
    }
    
    // Check for spam keywords
    const spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'click here'];
    const messageLower = message.toLowerCase();
    if (spamKeywords.some(keyword => messageLower.includes(keyword))) {
      showToast('❌ Tin nhắn chứa nội dung không hợp lệ');
      return;
    }
    
    // Rate limiting - không cho gửi quá 3 lần trong 1 phút
    const lastSubmitTime = localStorage.getItem('lastContactSubmit');
    const now = Date.now();
    const submitCount = parseInt(localStorage.getItem('contactSubmitCount') || '0');
    
    if (lastSubmitTime && now - parseInt(lastSubmitTime) < 60000) {
      // Trong 1 phút
      if (submitCount >= 3) {
        showToast('⏱️ Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút');
        return;
      }
      localStorage.setItem('contactSubmitCount', (submitCount + 1).toString());
    } else {
      // Reset counter sau 1 phút
      localStorage.setItem('contactSubmitCount', '1');
    }
    localStorage.setItem('lastContactSubmit', now.toString());
    
    btn.textContent = '⏳ Đang gửi...';
    btn.disabled = true;
    
    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        showToast('✅ Cảm ơn bạn! Tin nhắn đã được gửi thành công. Mình sẽ trả lời sớm nhất 💌');
        form.reset();
      } else {
        showToast('❌ Có lỗi khi gửi. Vui lòng thử lại sau');
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối: ' + err.message);
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
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
let pendingPhotoImgFile  = null;
let pendingPhotoImgFiles = [];

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
  document.querySelector('.bn-item[data-bn="home"]')?.classList.remove('active');
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
  document.querySelector('.bn-item[data-bn="home"]')?.classList.add('active');
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

  html += '<div class="blog-wrapper">';
  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewPost"><i class="fas fa-plus"></i> Bài viết mới</button>
    </div>`;
  }

  if (!posts.length) {
    html += `<div class="empty-state"><i class="fas fa-feather-alt"></i><p>Chưa có bài viết nào. Hãy quay lại sau nhé!</p></div>`;
    html += '</div>';
    container.innerHTML = html;
    if (isAdmin()) document.getElementById('btnNewPost').addEventListener('click', () => openPostEditor());
    return;
  }

  html += '<div class="blog-grid">';
  posts.forEach((p, i) => {
    const hasImg = !!p.img;
    const postDataAttr = encodeURIComponent(JSON.stringify(p));
    html += `<article class="blog-card" data-id="${p.id}" data-i="${i}" data-post="${postDataAttr}" tabindex="0" role="button" aria-label="${p.title || 'Bài viết'}">
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
  html += '</div></div>';
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
        } catch (err) { showToast('Lỗi: ' + err.message); }
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

  // Render HTML content from Quill directly
  const rawContent = post.content || post.summary || '';
  const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
  document.getElementById('articleContent').innerHTML = isHtml
    ? rawContent
    : rawContent.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

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
/* ── Photo album helper ── */
function getImgArray(img) {
  if (!img) return [];
  try {
    const parsed = JSON.parse(img);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [img];
}

async function renderPhotosPage(container) {
  const photos = await db.getPhotos();
  lightboxPhotos = photos;
  let html = '';

  html += '<div class="photos-wrapper">';
  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewPhoto"><i class="fas fa-plus"></i> Thêm ảnh</button>
    </div>`;
  }

  if (!photos.length) {
    html += `<div class="empty-state"><i class="fas fa-camera"></i><p>Chưa có hình nào. Hãy quay lại sau nhé!</p></div>`;
    html += '</div>'; // Close photos-wrapper
    container.innerHTML = html;
    if (isAdmin()) document.getElementById('btnNewPhoto').addEventListener('click', () => openPhotoEditor());
    return;
  }

  html += '<div class="ig-grid">';
  photos.forEach((ph, i) => {
    const imgs    = getImgArray(ph.img);
    const thumb   = imgs[0] || '';
    const isAlbum = imgs.length > 1;
    html += `<div class="ig-cell" data-id="${ph.id}" data-i="${i}">
      <img src="${thumb}" alt="${ph.caption || ''}" loading="lazy" />
      ${isAlbum ? `<span class="ig-album-badge"><i class="fas fa-clone"></i></span>` : ''}
      <div class="ig-overlay"><i class="fas fa-expand-alt"></i>${ph.caption ? `<span class="ig-caption-peek">${escHtml(ph.caption)}</span>` : ''}</div>
      ${isAdmin() ? `<div class="ig-admin-actions"><button class="card-btn-edit" data-id="${ph.id}" title="Sửa"><i class="fas fa-pen"></i></button><button class="card-btn-del" data-id="${ph.id}" title="Xoá"><i class="fas fa-trash"></i></button></div>` : ''}
    </div>`;
  });
  html += '</div>';
  html += '</div>'; // Close photos-wrapper
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
        } catch (err) { showToast('Lỗi: ' + err.message); }
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

function fmtRelTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hrs < 24)  return `${hrs} giờ trước`;
  if (days < 7)  return `${days} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderLightboxComments(comments) {
  const el = document.getElementById('lbComments');
  if (!comments.length) {
    el.innerHTML = '';
    return;
  }
  const avatarSrc = document.getElementById('introAvatar')?.src || '';
  el.innerHTML = comments.map(c => `
    <div class="lb-cmt-item">
      ${avatarSrc
        ? `<img class="lb-cmt-avatar" src="${avatarSrc}" alt="" />`
        : `<div class="lb-cmt-avatar-icon"><i class="fas fa-user"></i></div>`}
      <div class="lb-cmt-body">
        <span class="lb-cmt-author">${escHtml(c.author)}</span>
        <span class="lb-cmt-text">${escHtml(c.content)}</span>
        <span class="lb-cmt-time">${fmtRelTime(c.created_at)}</span>
      </div>
    </div>`).join('');
}

let albumIdx = 0; // current index within an album

async function loadLightboxPhoto(i) {
  lightboxIdx = i;
  albumIdx = 0;
  const ph = lightboxPhotos[i];
  const imgs = getImgArray(ph.img);

  // Show image
  document.getElementById('lightboxImg').src = imgs[0] || '';

  // Album arrows + dots
  const albumPrev = document.getElementById('lbAlbumPrev');
  const albumNext = document.getElementById('lbAlbumNext');
  const albumDots = document.getElementById('lbAlbumDots');

  if (imgs.length > 1) {
    albumPrev.classList.remove('hidden');
    albumNext.classList.remove('hidden');
    albumDots.classList.remove('hidden');
    albumPrev.classList.add('disabled');
    albumNext.classList.remove('disabled');
    // Dots
    albumDots.innerHTML = imgs.map((_, di) =>
      `<span class="lb-album-dot${di === 0 ? ' active' : ''}"></span>`
    ).join('');
  } else {
    albumPrev.classList.add('hidden');
    albumNext.classList.add('hidden');
    albumDots.classList.add('hidden');
  }

  // Album arrow click handlers (replace each time)
  const goAlbum = (dir) => {
    const newIdx = albumIdx + dir;
    if (newIdx < 0 || newIdx >= imgs.length) return;
    albumIdx = newIdx;
    document.getElementById('lightboxImg').src = imgs[albumIdx];
    albumPrev.classList.toggle('disabled', albumIdx === 0);
    albumNext.classList.toggle('disabled', albumIdx === imgs.length - 1);
    albumDots.querySelectorAll('.lb-album-dot').forEach((d, di) =>
      d.classList.toggle('active', di === albumIdx));
  };
  albumPrev.onclick = () => goAlbum(-1);
  albumNext.onclick = () => goAlbum(1);

  // Caption
  const captionEl = document.getElementById('lightboxCaption');
  if (captionEl) {
    captionEl.textContent = ph.caption || '';
    captionEl.style.display = ph.caption ? '' : 'none';
  }

  // Between-post arrows — only show if multiple posts
  const showArrows = lightboxPhotos.length > 1;
  document.getElementById('lightboxPrev').style.display = showArrows ? '' : 'none';
  document.getElementById('lightboxNext').style.display = showArrows ? '' : 'none';

  // Profile
  const avatarSrc = document.getElementById('introAvatar')?.src || '';
  const ownerName = document.querySelector('[data-field="introName"]')?.textContent || '';
  const lbAvatar = document.getElementById('lbAvatar');
  if (lbAvatar) lbAvatar.src = avatarSrc;
  if (document.getElementById('lbName')) document.getElementById('lbName').textContent = ownerName;
  if (document.getElementById('lbPostDate')) document.getElementById('lbPostDate').textContent = fmtRelTime(ph.created_at);

  // Location
  const lbLoc = document.getElementById('lbLocation');
  const lbLocText = document.getElementById('lbLocationText');
  if (lbLoc && lbLocText) {
    if (ph.location) {
      lbLocText.textContent = ph.location;
      lbLoc.classList.remove('hidden');
    } else {
      lbLoc.classList.add('hidden');
    }
  }

  // Load comments
  const commentsEl = document.getElementById('lbComments');
  commentsEl.innerHTML = '';
  const comments = await db.getPhotoComments(ph.id);
  renderLightboxComments(comments);

  // Scroll reset
  const scroll = document.getElementById('lbScroll');
  if (scroll) scroll.scrollTop = 0;
}

function openLightbox(i) {
  document.getElementById('lightboxOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  loadLightboxPhoto(i);
}

function initLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  if (!overlay) return;
  const close = () => { overlay.classList.add('hidden'); document.body.style.overflow = ''; };

  document.getElementById('lightboxClose').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('lightboxPrev').addEventListener('click', () =>
    loadLightboxPhoto((lightboxIdx - 1 + lightboxPhotos.length) % lightboxPhotos.length));
  document.getElementById('lightboxNext').addEventListener('click', () =>
    loadLightboxPhoto((lightboxIdx + 1) % lightboxPhotos.length));

  document.addEventListener('keydown', e => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  loadLightboxPhoto((lightboxIdx - 1 + lightboxPhotos.length) % lightboxPhotos.length);
    if (e.key === 'ArrowRight') loadLightboxPhoto((lightboxIdx + 1) % lightboxPhotos.length);
  });

  // Show/hide comment form based on admin
  const commentForm = document.querySelector('.lb-comment-form');
  if (commentForm) commentForm.style.display = isAdmin() ? '' : 'none';

  // Submit comment
  const submit = async () => {
    const name = document.querySelector('[data-field="introName"]')?.textContent?.trim() || 'Admin';
    const text = (document.getElementById('lbCmtText').value || '').trim();
    if (!text) { document.getElementById('lbCmtText').focus(); return; }
    const btn = document.getElementById('lbCmtSubmit');
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const ph = lightboxPhotos[lightboxIdx];
      await db.insertPhotoComment({ photo_id: ph.id, author: name, content: text });
      document.getElementById('lbCmtText').value = '';
      const comments = await db.getPhotoComments(ph.id);
      renderLightboxComments(comments);
      // Scroll to bottom of comments
      const scroll = document.getElementById('lbScroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng';
    }
  };

  document.getElementById('lbCmtSubmit').addEventListener('click', submit);
  document.getElementById('lbCmtText').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });
}

/* ── Podcast ──────────────────────────────────── */
async function renderPodcastPage(container) {
  const eps = await db.getEpisodes();
  let html = '';

  html += '<div class="podcast-wrapper">';
  if (isAdmin()) {
    html += `<div class="subpage-admin-bar">
      <button class="btn-new-item" id="btnNewEp"><i class="fas fa-plus"></i> Thêm video</button>
    </div>`;
  }

  if (!eps.length) {
    html += `<div class="empty-state"><i class="fas fa-microphone-alt"></i><p>Chưa có tập nào. Hãy quay lại sau nhé!</p></div>`;
    html += '</div>'; // Close podcast-wrapper
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
  html += '</div>'; // Close podcast-wrapper
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
        } catch (err) { showToast('Lỗi: ' + err.message); }
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

/* ── Cropper helper ──
   openCropper(file, aspectRatio, onConfirm)
   aspectRatio: 1 = square, 16/9 = landscape, NaN = free
   onConfirm(blob) will be called with cropped image as Blob
*/
let _cropperInstance = null;

function openCropper(file, aspectRatio, onConfirm) {
  const overlay  = document.getElementById('cropOverlay');
  const cropImg  = document.getElementById('cropImg');
  const confirmBtn = document.getElementById('cropConfirmBtn');
  const cancelBtn  = document.getElementById('cropCancelBtn');
  const closeBtn   = document.getElementById('cropCancel');

  // Reset previous cropper
  if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }

  const objectUrl = URL.createObjectURL(file);
  cropImg.src = objectUrl;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  cropImg.onload = () => {
    _cropperInstance = new Cropper(cropImg, {
      aspectRatio: aspectRatio,
      viewMode: 1,
      autoCropArea: 0.9,
      responsive: true,
      background: false,
    });
  };

  const close = () => {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    if (_cropperInstance) { _cropperInstance.destroy(); _cropperInstance = null; }
    URL.revokeObjectURL(objectUrl);
    confirmBtn.removeEventListener('click', onConfirmClick);
    cancelBtn.removeEventListener('click', close);
    closeBtn.removeEventListener('click', close);
  };

  const onConfirmClick = () => {
    if (!_cropperInstance) return;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    _cropperInstance.getCroppedCanvas({ maxWidth: 2048, maxHeight: 2048 }).toBlob(blob => {
      close();
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check"></i> Xác nhận';
      onConfirm(blob);
    }, file.type || 'image/jpeg', 0.92);
  };

  confirmBtn.addEventListener('click', onConfirmClick);
  cancelBtn.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
}

/* blobToFile: chuyển Blob thành File để dùng với db.uploadImage */
function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type });
}

/* ── Post editor ── */
let _quillEditor = null;

function getQuill() {
  if (!_quillEditor) {
    _quillEditor = new Quill('#pf-content-editor', {
      theme: 'snow',
      placeholder: 'Viết nội dung bài ở đây...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });
  }
  return _quillEditor;
}

function openPostEditor(post = null) {
  pendingPostImgFile = null;
  const p = post || {};
  document.getElementById('postEditorTitle').textContent = post ? 'Sửa bài viết' : 'Bài viết mới';
  document.getElementById('pf-id').value      = post ? post.id : -1;
  document.getElementById('pf-img').value     = p.img     || '';
  document.getElementById('pf-tag').value     = p.tag     || '';
  document.getElementById('pf-title').value   = p.title   || '';
  document.getElementById('pf-summary').value = p.summary || '';
  // Load content into Quill
  const quill = getQuill();
  quill.root.innerHTML = p.content || '';
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
    document.getElementById('pf-img-file').value = '';
    openCropper(file, 16 / 9, blob => {
      pendingPostImgFile = blobToFile(blob, file.name);
      document.getElementById('pf-img').value = '';
      const prev = document.getElementById('pf-img-preview');
      prev.src = URL.createObjectURL(blob);
      prev.classList.remove('hidden');
    });
  });

  document.getElementById('postEditorClose').addEventListener('click',  () => closeEditor('postEditorOverlay'));
  document.getElementById('postEditorCancel').addEventListener('click', () => closeEditor('postEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('postEditorOverlay'); });

  document.getElementById('postEditorSave').addEventListener('click', async () => {
    const id    = parseInt(document.getElementById('pf-id').value);
    const title = document.getElementById('pf-title').value.trim();
    if (!title) { showToast('Vui lòng nhập tiêu đề!'); return; }

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
        content: getQuill().root.innerHTML,
        date:    new Date().toLocaleDateString('vi-VN')
      };
      if (id === -1) await db.insertPost(post);
      else           await db.updatePost(id, post);
      closeEditor('postEditorOverlay');
      renderSubPage('blog');
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu bài viết';
    }
  });
}

/* ── Photo editor ── */
function openPhotoEditor(photo = null) {
  pendingPhotoImgFile = null;
  pendingPhotoImgFiles = [];
  const p = photo || {};
  document.getElementById('photoEditorTitle').textContent = photo ? 'Sửa ảnh' : 'Ảnh mới';
  document.getElementById('ph-id').value      = photo ? photo.id : -1;
  document.getElementById('ph-img').value     = p.img     || '';
  document.getElementById('ph-caption').value  = p.caption  || '';
  document.getElementById('ph-location').value  = p.location || '';
  const prev     = document.getElementById('ph-img-preview');
  const previews = document.getElementById('ph-img-previews');
  const dropzone = document.getElementById('phDropzone');
  const previewState = document.getElementById('phPreviewState');
  if (previews) previews.innerHTML = '';

  if (p.img) {
    const imgs = getImgArray(p.img);
    if (imgs.length > 1) {
      // Album: show thumbnails grid
      prev.src = ''; prev.classList.add('hidden');
      imgs.forEach(url => {
        const img = document.createElement('img');
        img.src = url; img.className = 'multi-preview-thumb';
        previews.appendChild(img);
      });
    } else {
      prev.src = imgs[0]; prev.classList.remove('hidden');
    }
    dropzone.classList.add('hidden');
    previewState.classList.remove('hidden');
  } else {
    prev.src = ''; prev.classList.add('hidden');
    dropzone.classList.remove('hidden');
    previewState.classList.add('hidden');
  }
  openEditor('photoEditorOverlay');
}

function initPhotoEditor() {
  const overlay    = document.getElementById('photoEditorOverlay');
  if (!overlay) return;

  const dropzone     = document.getElementById('phDropzone');
  const previewState = document.getElementById('phPreviewState');
  const fileInput    = document.getElementById('ph-img-file');
  const prev         = document.getElementById('ph-img-preview');
  const previews     = document.getElementById('ph-img-previews');

  function showPreviewState() {
    dropzone.classList.add('hidden');
    previewState.classList.remove('hidden');
  }
  function showDropzone() {
    previewState.classList.add('hidden');
    dropzone.classList.remove('hidden');
    prev.src = ''; prev.classList.add('hidden');
    previews.innerHTML = '';
    document.getElementById('ph-img').value = '';
    document.getElementById('ph-caption').value  = '';
    document.getElementById('ph-location').value  = '';
    pendingPhotoImgFile = null;
    pendingPhotoImgFiles = [];
  }

  // Drag-and-drop on drop zone
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    handleFileSelection(files);
  });

  function handleFileSelection(files) {
    previews.innerHTML = '';
    pendingPhotoImgFiles = [];
    if (files.length === 1) {
      openCropper(files[0], 1, blob => {
        pendingPhotoImgFile = blobToFile(blob, files[0].name);
        pendingPhotoImgFiles = [];
        document.getElementById('ph-img').value = '';
        prev.src = URL.createObjectURL(blob);
        prev.classList.remove('hidden');
        previews.innerHTML = '';
        showPreviewState();
      });
    } else {
      pendingPhotoImgFile = null;
      prev.src = ''; prev.classList.add('hidden');
      document.getElementById('ph-img').value = '';
      for (const file of files) {
        pendingPhotoImgFiles.push(file);
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.className = 'multi-preview-thumb';
        previews.appendChild(img);
      }
      showPreviewState();
    }
  }

  fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    handleFileSelection(files);
  });

  // ── Location search (Nominatim) ──
  const locInput    = document.getElementById('ph-location');
  const locDropdown = document.getElementById('phLocationDropdown');
  const locSpinner  = document.getElementById('phLocationSpinner');
  const locClear    = document.getElementById('phLocationClear');
  let locDebounce   = null;

  function hideLocDropdown() {
    locDropdown.classList.add('hidden');
    locDropdown.innerHTML = '';
  }

  locInput.addEventListener('input', () => {
    const q = locInput.value.trim();
    locClear.classList.toggle('hidden', !q);
    clearTimeout(locDebounce);
    if (q.length < 2) { hideLocDropdown(); locSpinner.classList.add('hidden'); return; }
    locSpinner.classList.remove('hidden');
    locDebounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'vi,en' } }
        );
        const data = await res.json();
        locSpinner.classList.add('hidden');
        locDropdown.innerHTML = '';
        if (!data.length) {
          locDropdown.innerHTML = '<li class="phl-no-result">Không tìm thấy địa điểm</li>';
        } else {
          data.forEach(place => {
            const li = document.createElement('li');
            const parts = place.display_name.split(',');
            const main  = parts.slice(0, 2).join(',').trim();
            const sub   = parts.slice(2, 4).join(',').trim();
            li.innerHTML = `<i class="fas fa-map-marker-alt"></i><span><strong>${main}</strong>${sub ? `<br><small style="color:#888">${sub}</small>` : ''}</span>`;
            li.addEventListener('mousedown', e => {
              e.preventDefault();
              locInput.value = main;
              locClear.classList.remove('hidden');
              hideLocDropdown();
            });
            locDropdown.appendChild(li);
          });
        }
        locDropdown.classList.remove('hidden');
      } catch {
        locSpinner.classList.add('hidden');
      }
    }, 400);
  });

  locClear.addEventListener('click', () => {
    locInput.value = '';
    locClear.classList.add('hidden');
    hideLocDropdown();
    locInput.focus();
  });

  locInput.addEventListener('blur', () => setTimeout(hideLocDropdown, 150));

  // "Đổi ảnh" button — go back to drop zone
  document.getElementById('phChangeBtn').addEventListener('click', () => {
    showDropzone();
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
      // Multi-file upload → 1 row with JSON array
      if (pendingPhotoImgFiles && pendingPhotoImgFiles.length > 0) {
        const caption  = document.getElementById('ph-caption').value.trim();
        const location = document.getElementById('ph-location').value.trim();
        const urls = [];
        for (let i = 0; i < pendingPhotoImgFiles.length; i++) {
          saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang lưu ${i + 1}/${pendingPhotoImgFiles.length}...`;
          urls.push(await db.uploadImage(pendingPhotoImgFiles[i], 'photos'));
        }
        const imgValue = urls.length === 1 ? urls[0] : JSON.stringify(urls);
        await db.insertPhoto({ img: imgValue, caption, location });
        pendingPhotoImgFiles = [];
        closeEditor('photoEditorOverlay');
        renderSubPage('photos');
        return;
      }

      let imgUrl = document.getElementById('ph-img').value.trim();
      if (pendingPhotoImgFile) {
        imgUrl = await db.uploadImage(pendingPhotoImgFile, 'photos');
        pendingPhotoImgFile = null;
      }
      if (!imgUrl) { showToast('Vui lòng chọn ảnh!'); return; }
      const photo = {
        img:      imgUrl,
        caption:  document.getElementById('ph-caption').value.trim(),
        location: document.getElementById('ph-location').value.trim()
      };
      if (id === -1) await db.insertPhoto(photo);
      else           await db.updatePhoto(id, photo);
      closeEditor('photoEditorOverlay');
      renderSubPage('photos');
    } catch (err) {
      showToast('Lỗi: ' + err.message);
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
    if (!title || !link) { showToast('Vui lòng nhập tiêu đề và link!'); return; }

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
      showToast('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu video';
    }
  });
}

/* ── Image viewer ─────────────────────────────── */
// Excluded containers: don't open viewer for UI/editor images
const IMG_VIEWER_EXCLUDE = [
  '#cropOverlay', '#imgViewerOverlay', '#lightboxOverlay',
  '.editor-modal', '.img-viewer-img', '.pf-img-preview',
  '.ph-img-preview', '#epYtThumb', '.intro-avatar', '#articleImg',
  '.yt-thumb img', '.hero-cover', '.ig-cell', '.blog-card-img', '.latest-blog-img', '.latest-photos-img'
];

function initImageViewer() {
  const overlay  = document.getElementById('imgViewerOverlay');
  const viewImg  = document.getElementById('imgViewerImg');
  const closeBtn = document.getElementById('imgViewerClose');
  if (!overlay) return;

  const close = () => {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay || e.target === viewImg) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
  });

  document.addEventListener('click', e => {
    const img = e.target.closest('img');
    if (!img) return;
    // Skip if inside excluded containers
    for (const sel of IMG_VIEWER_EXCLUDE) {
      if (img.matches(sel) || img.closest(sel)) return;
    }
    // Skip tiny icons / avatar-like images (< 80px rendered)
    if (img.offsetWidth < 80 || img.offsetHeight < 80) return;
    // Skip if no real src
    if (!img.src || img.src === window.location.href) return;

    // Check if it's a latest blog image with stored post data
    if (img.dataset.latestPost) {
      try {
        const post = JSON.parse(img.dataset.latestPost);
        openArticle(post);
        return;
      } catch (e) {
        console.error('Failed to parse latest post:', e);
      }
    }

    // Check if it's a latest photo image
    if (img.dataset.latestPhoto) {
      const photosLink = document.querySelector('[data-page="photos"]');
      if (photosLink) {
        photosLink.click();
      }
      return;
    }

    // Check if image is inside blog card - open article instead
    const blogCard = img.closest('.blog-card');
    if (blogCard && blogCard.dataset.post) {
      try {
        const post = JSON.parse(decodeURIComponent(blogCard.dataset.post));
        openArticle(post);
        return;
      } catch (e) {
        console.error('Failed to parse blog card post:', e);
      }
    }

    viewImg.src = img.src;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  // Mark clickable images with cursor style via MutationObserver
  const markImages = () => {
    document.querySelectorAll('img').forEach(img => {
      if (img.offsetWidth >= 80 && img.src && img.src !== window.location.href) {
        const excluded = IMG_VIEWER_EXCLUDE.some(sel => img.matches(sel) || img.closest(sel));
        if (!excluded) img.classList.add('img-clickable');
      }
    });
  };
  const observer = new MutationObserver(markImages);
  observer.observe(document.body, { childList: true, subtree: true });
  markImages();

  // Handle clicks on blog card images to open articles instead of lightbox
  document.addEventListener('click', e => {
    const cardImg = e.target.closest('.blog-card-img');
    if (!cardImg) return;
    
    const blogCard = cardImg.closest('.blog-card');
    if (blogCard && blogCard.dataset.post) {
      try {
        const post = JSON.parse(decodeURIComponent(blogCard.dataset.post));
        openArticle(post);
        e.stopPropagation();
        return;
      } catch (err) {
        console.error('Failed to parse blog card post:', err);
      }
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
    if (e.key === 'Escape' && currentPage) {
      const articleOpen  = !document.getElementById('articleOverlay')?.classList.contains('hidden');
      const lightboxOpen = !document.getElementById('lightboxOverlay')?.classList.contains('hidden');
      // Only close subview if no modal is on top
      if (!articleOpen && !lightboxOpen) return;
    }
  });
}

/* ══════════════════════════════════════════════════
   EMOJI PICKER
══════════════════════════════════════════════════ */
const EMOJI_DATA = {
  '😊': ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','😎','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','😈','👿'],
  '👍': ['👋','🤚','✋','🖖','🤙','💪','🦾','🖐️','☝️','👆','👇','👈','👉','👍','👎','✊','👊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤌','🤏','👏','🙌','🫶','🤲','🙏','💅','🫰','🫵'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✨','⭐','🌟','💫','⚡','🔥','🌈','☀️','🌙','🌻','🌸','🌺','🌹','🌷'],
  '🌍': ['🌍','🌎','🌏','🌐','🗺️','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽'],
  '🎵': ['🎵','🎶','🎸','🎹','🥁','🎷','🎺','🎻','🪕','🎤','🎧','🎼','🎹','🎮','🕹️','🎲','♟️','🧩','🎭','🎨','🖼️','🎬','📽️','🎞️','📺','📻','📷','📸','🔭','🔬','💡','🕯️','🪔'],
  '🍎': ['🍎','🍊','🍋','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🥔','🍠','🥐','🥖','🍞','🥨','🥯','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🌮','🌯','🥙','🧆','🥚','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🥮','🍡','🥟','🦪','🍣','🍤','🍙','🧁','🍰','🎂','☕','🍵','🧃','🥤','🧋','🍺','🥂'],
  '✈️': ['✈️','🚀','🛸','🚁','🛺','🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','🚢','⛵','🚤','🛥️','🛳️','⛴️','🚤','🚂','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋'],
  '📚': ['📚','📖','📝','✏️','🖊️','🖋️','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗂️','🗄️','📦','📫','📪','📬','📭','📮','🗳️','📥','📤','📧','💬','💭','🗨️','💡','🔍','🔎','🔐','🔑','🗝️','🔒','🔓','🔏','🏷️','📋','📊','📈','📉','🗒️','🗓️','📅','📆','🔖'],
  '🌱': ['🌱','🌿','☘️','🍀','🎋','🍃','🍂','🍁','🪺','🪸','🌾','🌵','🌲','🌳','🌴','🪵','🪨','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌟','⭐','🌠','☁️','⛅','🌤️'],
};

const EP_CAT_ICONS = { '😊':'😊','👍':'✋','❤️':'❤️','🌍':'🌍','🎵':'🎵','🍎':'🍎','✈️':'✈️','📚':'📚','🌱':'🌱' };

let _epTarget = null;

function initEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  const grid   = document.getElementById('epGrid');
  const cats   = document.getElementById('epCats');
  const search = document.getElementById('epSearch');
  if (!picker) return;

  let activeCat = Object.keys(EMOJI_DATA)[0];
  const allEmojis = Object.values(EMOJI_DATA).flat();

  // Build category buttons
  Object.entries(EP_CAT_ICONS).forEach(([key, icon]) => {
    const btn = document.createElement('button');
    btn.className = 'ep-cat-btn' + (key === activeCat ? ' active' : '');
    btn.textContent = icon;
    btn.title = key;
    btn.addEventListener('click', () => {
      activeCat = key;
      cats.querySelectorAll('.ep-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      search.value = '';
      renderGrid(EMOJI_DATA[key]);
    });
    cats.appendChild(btn);
  });

  function renderGrid(emojis) {
    grid.innerHTML = '';
    emojis.forEach(em => {
      const btn = document.createElement('button');
      btn.className = 'ep-item';
      btn.textContent = em;
      btn.addEventListener('click', () => {
        if (_epTarget) {
          _epTarget.value = em;
          _epTarget.dispatchEvent(new Event('input'));
        }
        closePicker();
      });
      grid.appendChild(btn);
    });
  }

  search.addEventListener('input', () => {
    const q = search.value.trim();
    if (!q) {
      renderGrid(EMOJI_DATA[activeCat]);
    } else {
      renderGrid(allEmojis.filter(e => e.includes(q)));
    }
  });

  renderGrid(EMOJI_DATA[activeCat]);

  // Close on outside click
  document.addEventListener('click', e => {
    if (!picker.contains(e.target) && !e.target.classList.contains('ie-row-icon-input')) {
      closePicker();
    }
  }, true);
}

function openEmojiPicker(targetInput) {
  const picker = document.getElementById('emojiPicker');
  if (!picker) return;
  _epTarget = targetInput;

  // Position below the input
  const rect = targetInput.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const pickerH = 340;

  picker.style.left = Math.min(rect.left, window.innerWidth - 308) + 'px';
  if (spaceBelow >= pickerH + 8) {
    picker.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
    picker.style.bottom = 'auto';
  } else {
    picker.style.top  = (rect.top + window.scrollY - pickerH - 6) + 'px';
    picker.style.bottom = 'auto';
  }

  picker.classList.remove('hidden');
  document.getElementById('epSearch').focus();
}

function closePicker() {
  const picker = document.getElementById('emojiPicker');
  if (picker) picker.classList.add('hidden');
  _epTarget = null;
}

function initIntroEditor() {
  const overlay = document.getElementById('introEditorOverlay');
  if (!overlay) return;

  document.getElementById('introEditBtn').addEventListener('click', async () => {
    const cfg = await db.getConfig();
    document.getElementById('ie-name').value = cfg.introName || document.getElementById('introName').textContent;
    document.getElementById('ie-slogan').value = cfg.introSlogan || document.getElementById('introSlogan').textContent;
    const rows = cfg.intro_rows ? JSON.parse(cfg.intro_rows) : DEFAULT_INTRO_ROWS;
    renderIeRows(rows);
    openEditor('introEditorOverlay');
  });

  function makeRowCard(icon, label, value) {
    const div = document.createElement('div');
    div.className = 'ie-row-card';
    div.innerHTML = `
      <input type="text" class="ie-row-icon-input ie-icon" value="${icon}" placeholder="😊" maxlength="4" readonly />
      <div class="ie-row-fields">
        <input type="text" class="ie-row-field-input ie-label" value="${label}" placeholder="Nhãn (VD: Quê quán)" />
        <input type="text" class="ie-row-field-input ie-value" value="${value}" placeholder="Nội dung..." />
      </div>
      <button class="ie-row-del-btn" title="Xóa dòng"><i class="fas fa-trash-alt"></i></button>`;
    div.querySelector('.ie-row-del-btn').addEventListener('click', () => div.remove());
    div.querySelector('.ie-row-icon-input').addEventListener('click', function(e) {
      e.stopPropagation();
      openEmojiPicker(this);
    });
    return div;
  }

  function renderIeRows(rows) {
    const list = document.getElementById('ie-rows-list');
    list.innerHTML = '';
    rows.forEach(r => list.appendChild(makeRowCard(r.icon, r.label, r.value)));
  }

  document.getElementById('ie-add-row').addEventListener('click', () => {
    const list = document.getElementById('ie-rows-list');
    const card = makeRowCard('', '', '');
    list.appendChild(card);
    card.querySelector('.ie-row-icon-input').focus();
  });

  document.getElementById('introEditorClose').addEventListener('click', () => closeEditor('introEditorOverlay'));
  document.getElementById('introEditorCancel').addEventListener('click', () => closeEditor('introEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('introEditorOverlay'); });

  document.getElementById('introEditorSave').addEventListener('click', async () => {
    const saveBtn = document.getElementById('introEditorSave');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    try {
      const name   = document.getElementById('ie-name').value.trim();
      const slogan = document.getElementById('ie-slogan').value.trim();
      const rows = [...document.querySelectorAll('#ie-rows-list .ie-row-card')].map(card => ({
        icon:  card.querySelector('.ie-icon').value.trim(),
        label: card.querySelector('.ie-label').value.trim(),
        value: card.querySelector('.ie-value').value.trim(),
      })).filter(r => r.label || r.value);

      await Promise.all([
        db.setConfig('introName', name),
        db.setConfig('introSlogan', slogan),
        db.setConfig('intro_rows', JSON.stringify(rows)),
      ]);

      if (name)   document.getElementById('introName').textContent   = name;
      if (slogan) document.getElementById('introSlogan').textContent = slogan;
      renderIntroRows(rows);
      closeEditor('introEditorOverlay');
    } catch (err) {
      showToast('Lỗi: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Lưu thay đổi';
    }
  });
}

/*  Init  */
document.addEventListener('DOMContentLoaded', () => {
  applyStoredContent().catch(err => console.error('applyStoredContent failed:', err));
  loadLatestBlog().catch(err => console.error('loadLatestBlog failed:', err));
  loadLatestPhotos().catch(err => console.error('loadLatestPhotos failed:', err));
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
  initImageViewer();
  initIntroEditor();
  initEmojiPicker();
});

/*  Edit Contact Modal  */
(() => {
  const overlay = document.getElementById('contactEditorOverlay');
  if (!overlay) return;

  const openBtn = document.getElementById('btnEditContact');
  const closeBtn = document.getElementById('contactEditorClose');
  const cancelBtn = document.getElementById('contactEditorCancel');
  const saveBtn = document.getElementById('contactEditorSave');
  const addFieldBtn = document.getElementById('ce-add-field');

  // Make custom field card
  function makeContactFieldCard(label = '', value = '') {
    const card = document.createElement('div');
    card.className = 'ie-row-card';
    card.innerHTML = `
      <div class="ie-row-fields" style="flex-direction: row; gap: 8px;">
        <input type="text" class="ie-row-field-input ce-field-label" style="flex: 1;" placeholder="Nhãn (vd: Telegram)" value="${label}" />
        <input type="text" class="ie-row-field-input ce-field-value" style="flex: 1.5;" placeholder="Giá trị (vd: @username)" value="${value}" />
      </div>
      <button type="button" class="ie-row-del-btn" title="Xóa trường"><i class="fas fa-trash-alt"></i></button>
    `;
    
    card.querySelector('.ie-row-del-btn').addEventListener('click', () => card.remove());
    return card;
  }

  // Load values into form
  function loadContactForm() {
    const emailEl = document.getElementById('contactEmail');
    const locationEl = document.getElementById('contactLocation');
    const fbEl = document.getElementById('socialFb');
    const igEl = document.getElementById('socialIg');
    const ttkEl = document.getElementById('socialTtk');

    document.getElementById('ce-email').value = emailEl.textContent.replace(/✉️\s*/, '').trim();
    document.getElementById('ce-location').value = locationEl.textContent.replace(/📍\s*/, '').trim();
    document.getElementById('ce-fb').value = fbEl.href || '';
    document.getElementById('ce-ig').value = igEl.href || '';
    document.getElementById('ce-ttk').value = ttkEl.href || '';

    // Load custom fields
    const customFields = JSON.parse(localStorage.getItem('contactCustomFields') || '[]');
    const fieldsList = document.getElementById('ce-fields-list');
    fieldsList.innerHTML = '';
    customFields.forEach(field => {
      fieldsList.appendChild(makeContactFieldCard(field.label, field.value));
    });
  }

  // Add field button
  addFieldBtn.addEventListener('click', () => {
    const fieldsList = document.getElementById('ce-fields-list');
    const card = makeContactFieldCard('', '');
    fieldsList.appendChild(card);
    card.querySelector('.ce-field-label').focus();
  });

  // Open editor
  openBtn.addEventListener('click', () => {
    loadContactForm();
    openEditor('contactEditorOverlay');
  });

  // Close editor
  closeBtn.addEventListener('click', () => closeEditor('contactEditorOverlay'));
  cancelBtn.addEventListener('click', () => closeEditor('contactEditorOverlay'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEditor('contactEditorOverlay'); });

  // Save changes
  saveBtn.addEventListener('click', async () => {
    const email = document.getElementById('ce-email').value.trim();
    const location = document.getElementById('ce-location').value.trim();
    const fb = document.getElementById('ce-fb').value.trim();
    const ig = document.getElementById('ce-ig').value.trim();
    const ttk = document.getElementById('ce-ttk').value.trim();

    if (!email) {
      showToast('❌ Vui lòng nhập email');
      return;
    }
    if (!location) {
      showToast('❌ Vui lòng nhập địa chỉ');
      return;
    }

    try {
      // Collect custom fields
      const customFields = [...document.querySelectorAll('#ce-fields-list .ie-row-card')].map(card => ({
        label: card.querySelector('.ce-field-label').value.trim(),
        value: card.querySelector('.ce-field-value').value.trim(),
      })).filter(f => f.label && f.value);

      // Save to Supabase
      await db.setConfig('contactEmail', email);
      await db.setConfig('contactLocation', location);
      await db.setConfig('socialFb', fb);
      await db.setConfig('socialIg', ig);
      await db.setConfig('socialTtk', ttk);
      await db.setConfig('contactCustomFields', JSON.stringify(customFields));

      // Update display
      document.getElementById('contactEmail').textContent = '✉️ ' + email;
      document.getElementById('contactLocation').textContent = '📍 ' + location;
      document.getElementById('socialFb').href = fb || '#';
      document.getElementById('socialIg').href = ig || '#';
      document.getElementById('socialTtk').href = ttk || '#';

      // Save backup to localStorage
      localStorage.setItem('contactCustomFields', JSON.stringify(customFields));

      showToast('✅ Lưu thông tin thành công!');
      closeEditor('contactEditorOverlay');
    } catch (err) {
      showToast('❌ Lỗi lưu: ' + err.message);
      console.error('Error saving contact:', err);
    }
  });
})();
