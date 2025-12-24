// main.js (versi full-page / scroll-snap + fitur sebelumnya)
// - Mengatur section full-screen dan menandai section aktif (IntersectionObserver)
// - Navigasi keyboard (ArrowUp/ArrowDown), tombol "Mulai Perjalanan", dan dots navigation
// - Play/Pause backsound per momen (shared audio element)
// - Modal galeri foto
// Komentar lengkap agar mudah diikuti pemula.

document.addEventListener('DOMContentLoaded', function () {
  /* --------------------------
     Setup: sections & dots nav
     -------------------------- */
  const pagesEl = document.getElementById('pages');
  const sections = Array.from(document.querySelectorAll('.page'));
  const dotsNav = document.getElementById('dots-nav');

  // Buat dot untuk setiap section
  sections.forEach((sec, idx) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Halaman ${idx + 1}: ${sec.dataset.title || 'section'}`);
    dot.addEventListener('click', () => {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    dotsNav.appendChild(dot);
  });

  const dots = Array.from(dotsNav.querySelectorAll('.dot'));

  // IntersectionObserver untuk menandai section yang sedang di-viewport (aktif)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sec = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // Tandai active
        sec.classList.add('is-active');
        sec.setAttribute('aria-hidden', 'false');
        // update dot UI
        const index = sections.indexOf(sec);
        dots.forEach(d => d.classList.remove('active'));
        if (index >= 0) dots[index].classList.add('active');
        // optional: bisa update URL hash (non-mandatory)
        // history.replaceState(null, '', `#${sec.id}`);
      } else {
        sec.classList.remove('is-active');
        sec.setAttribute('aria-hidden', 'true');
      }
    });
  }, {
    threshold: [0.5] // dianggap aktif jika >= 50% terlihat
  });

  sections.forEach(sec => observer.observe(sec));

  /* --------------------------
     Navigasi keyboard
     -------------------------- */
  document.addEventListener('keydown', function (e) {
    // Jangan ganggu input/textarea fokus
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      scrollToNeighbor(1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      scrollToNeighbor(-1);
    }
  });

  function scrollToNeighbor(direction) {
    // direction: 1 = next, -1 = prev
    const activeIndex = sections.findIndex(s => s.classList.contains('is-active'));
    let targetIndex = activeIndex;
    if (direction === 1) targetIndex = Math.min(sections.length - 1, activeIndex + 1);
    else targetIndex = Math.max(0, activeIndex - 1);
    if (targetIndex !== activeIndex) {
      sections[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* --------------------------
     Tombol "Mulai Perjalanan" dan hero-next
     -------------------------- */
  const startBtn = document.getElementById('start-journey');
  const heroNext = document.getElementById('hero-next');
  const timelineSection = document.getElementById('timeline');

  if (startBtn && timelineSection) {
    startBtn.addEventListener('click', function () {
      timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (heroNext && timelineSection) {
    heroNext.addEventListener('click', function () {
      timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* --------------------------
     Shared audio (backsound per momen)
     -------------------------- */
  const sharedAudio = document.getElementById('shared-audio');
  const momentCards = Array.from(document.querySelectorAll('.moment'));

  momentCards.forEach(card => {
    const audioSrc = card.dataset.audio;
    const playBtn = card.querySelector('.play-btn');
    const statusEl = card.querySelector('.audio-status');

    if (!audioSrc) {
      if (playBtn) playBtn.style.display = 'none';
      if (statusEl) statusEl.textContent = '';
      return;
    }

    playBtn.addEventListener('click', function () {
      // Jika sharedAudio belum memuat atau berbeda file -> set src baru
      if (!sharedAudio.src || !sharedAudio.src.includes(audioSrc)) {
        sharedAudio.src = audioSrc;
        sharedAudio.currentTime = 0;
        sharedAudio.play().catch(() => {
          // Beberapa browser memblokir autoplay tanpa interaksi, tapi ini dipicu oleh klik -> aman.
        });
        updateAllPlayButtons();
      } else {
        // Toggle play/pause
        if (sharedAudio.paused) {
          sharedAudio.play();
          playBtn.textContent = 'Pause ⏸';
        } else {
          sharedAudio.pause();
          playBtn.textContent = 'Play ▶';
        }
      }
    });

    // Update waktu tampilan saat audio diputar (hanya untuk card terkait)
    sharedAudio.addEventListener('timeupdate', function () {
      if (sharedAudio.src && sharedAudio.src.includes(audioSrc)) {
        statusEl.textContent = formatTime(sharedAudio.currentTime);
      }
    });

    sharedAudio.addEventListener('ended', function () {
      if (sharedAudio.src && sharedAudio.src.includes(audioSrc)) {
        playBtn.textContent = 'Play ▶';
        statusEl.textContent = formatTime(0);
      }
    });
  });

  function updateAllPlayButtons() {
    momentCards.forEach(card => {
      const audioSrc = card.dataset.audio || '';
      const playBtn = card.querySelector('.play-btn');
      const statusEl = card.querySelector('.audio-status');
      if (!audioSrc || !playBtn) return;
      if (sharedAudio.src && sharedAudio.src.includes(audioSrc)) {
        playBtn.textContent = sharedAudio.paused ? 'Play ▶' : 'Pause ⏸';
      } else {
        playBtn.textContent = 'Play ▶';
        statusEl.textContent = formatTime(0);
      }
    });
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Pause audio saat keluar halaman / hide page
  window.addEventListener('pagehide', () => {
    if (!sharedAudio.paused) sharedAudio.pause();
  });

  /* --------------------------
     Modal Galeri Foto
     -------------------------- */
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');
  const modalClose = document.getElementById('modal-close');

  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', function () {
      const src = this.src;
      const alt = this.alt || '';
      const caption = this.dataset.caption || '';
      openModal(src, alt, caption);
    });
  });

  function openModal(src, alt, caption) {
    modalImg.src = src;
    modalImg.alt = alt;
    modalCaption.textContent = caption;
    modal.setAttribute('aria-hidden', 'false');
    // pause audio agar fokus ke modal
    if (!sharedAudio.paused) sharedAudio.pause();
    updateAllPlayButtons();
    // optional: trap focus (bisa ditambahkan jika diperlukan)
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalCaption.textContent = '';
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  /* --------------------------
     Inisialisasi state awal
     -------------------------- */
  // Jika ada hash di URL, scroll ke section tersebut saat load
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  } else {
    // scroll ke top (hero)
    sections[0].scrollIntoView();
  }

  // Pastikan tombol play diperbarui
  updateAllPlayButtons();
});