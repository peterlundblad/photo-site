document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const menuEsc = document.querySelector('.menu-esc');
  const menu = document.querySelector('.menu');
  const logo = document.querySelector('.logo');

  if (hamburger && menuEsc && menu) {
    const openMenu = (event) => {
      event.preventDefault();
      menu.classList.add('is-open');
      if (logo) logo.classList.add('is-hidden');
      hamburger.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = (event) => {
      if (event) event.preventDefault();
      menu.classList.remove('is-open');
      if (logo) logo.classList.remove('is-hidden');
      hamburger.setAttribute('aria-expanded', 'false');
    };

    hamburger.addEventListener('click', openMenu);
    menuEsc.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  const blogImages = document.querySelectorAll('.blog-item img');
  blogImages.forEach((img) => {
    if (img.complete) return;

    img.classList.add('is-loading');

    const reveal = () => {
      img.classList.remove('is-loading');
    };

    img.addEventListener(
      'load',
      () => {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {}).then(reveal);
        } else {
          reveal();
        }
      },
      { once: true }
    );

    img.addEventListener('error', reveal, { once: true });
  });

  // Tablet & desktop fullscreen image lightbox (min-width: 601px)
  const lightboxMedia = window.matchMedia('(min-width: 601px)');
  const columns = Array.from(document.querySelectorAll('.row .column'));

  const getOrderedGalleryImages = () => {
    if (columns.length > 0) {
      const colImages = columns.map((col) => Array.from(col.querySelectorAll('img')));
      const ordered = [];
      const interleaveGroup = (group) => {
        const maxRows = Math.max(0, ...group.map((imgs) => imgs.length));
        for (let r = 0; r < maxRows; r += 1) {
          for (let c = 0; c < group.length; c += 1) {
            if (group[c][r]) {
              ordered.push(group[c][r]);
            }
          }
        }
      };

      // At <= 900px, the 4 columns wrap into 2x2 (Col 1 & 2 above Col 3 & 4)
      if (window.innerWidth <= 900 && colImages.length === 4) {
        interleaveGroup(colImages.slice(0, 2));
        interleaveGroup(colImages.slice(2, 4));
      } else {
        interleaveGroup(colImages);
      }
      return ordered;
    }

    if (document.body.classList.contains('layout-post')) {
      return Array.from(
        document.querySelectorAll('body.layout-post .container-hero img')
      ).filter((img) => !img.closest('.PageNavigation'));
    }

    return [];
  };

  let galleryImages = getOrderedGalleryImages();

  if (galleryImages.length > 0) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Image view');
    lightbox.setAttribute('aria-hidden', 'true');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close image view');
    closeBtn.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M6 6L22 22M22 6L6 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-img';
    lightboxImg.alt = '';

    const createNavButton = (direction, label, pathD) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `lightbox-nav lightbox-${direction}`;
      btn.setAttribute('aria-label', label);
      btn.innerHTML = `<svg width="28" height="48" viewBox="0 0 28 48" fill="none" aria-hidden="true"><path d="${pathD}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return btn;
    };

    const prevBtn = createNavButton('prev', 'Previous image', 'M20 6L6 24L20 42');
    const nextBtn = createNavButton('next', 'Next image', 'M8 6L22 24L8 42');

    lightbox.appendChild(closeBtn);
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(nextBtn);
    document.body.appendChild(lightbox);

    if (galleryImages.length === 1) {
      lightbox.classList.add('is-single');
    }

    let currentIndex = 0;
    let isOpen = false;
    let activeTrigger = null;
    let swapToken = 0;

    const preloadAdjacent = (index) => {
      if (galleryImages.length <= 1) return;
      const nextIdx = (index + 1) % galleryImages.length;
      const prevIdx = (index - 1 + galleryImages.length) % galleryImages.length;
      [nextIdx, prevIdx].forEach((idx) => {
        const src = galleryImages[idx].currentSrc || galleryImages[idx].src;
        if (src) {
          const preloadImg = new Image();
          preloadImg.src = src;
        }
      });
    };

    const showImage = (index) => {
      currentIndex = (index + galleryImages.length) % galleryImages.length;
      const sourceImg = galleryImages[currentIndex];
      const nextSrc = sourceImg.currentSrc || sourceImg.src;
      const nextAlt = sourceImg.alt || '';
      const token = ++swapToken;

      lightboxImg.alt = nextAlt;

      if (lightboxImg.src !== nextSrc) {
        lightboxImg.classList.add('is-loading');
        lightboxImg.src = nextSrc;

        const revealLightboxImg = () => {
          if (token === swapToken) {
            lightboxImg.classList.remove('is-loading');
          }
        };

        if (lightboxImg.complete && lightboxImg.naturalWidth > 0) {
          if (typeof lightboxImg.decode === 'function') {
            lightboxImg.decode().catch(() => {}).then(revealLightboxImg);
          } else {
            revealLightboxImg();
          }
        } else {
          lightboxImg.addEventListener(
            'load',
            () => {
              if (typeof lightboxImg.decode === 'function') {
                lightboxImg.decode().catch(() => {}).then(revealLightboxImg);
              } else {
                revealLightboxImg();
              }
            },
            { once: true }
          );
          lightboxImg.addEventListener('error', revealLightboxImg, { once: true });
        }
      } else {
        lightboxImg.classList.remove('is-loading');
      }

      preloadAdjacent(currentIndex);
    };

    const openLightbox = (triggerEl) => {
      if (!lightboxMedia.matches) return;
      galleryImages = getOrderedGalleryImages();
      const index = galleryImages.indexOf(triggerEl);
      if (index === -1) return;
      activeTrigger = triggerEl;
      showImage(index);
      isOpen = true;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      closeBtn.focus({ preventScroll: true });
    };

    const closeLightbox = () => {
      if (!isOpen) return;
      isOpen = false;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (activeTrigger && typeof activeTrigger.focus === 'function') {
        activeTrigger.focus({ preventScroll: true });
      }
      activeTrigger = null;
    };

    galleryImages.forEach((img) => {
      img.classList.add('lightbox-trigger');
      img.addEventListener('click', (event) => {
        if (!lightboxMedia.matches) return;
        event.preventDefault();
        openLightbox(img);
      });
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let justSwiped = false;
    let swipeTimer = null;

    lightbox.addEventListener(
      'touchstart',
      (event) => {
        if (!isOpen || event.touches.length !== 1) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      'touchend',
      (event) => {
        if (!isOpen || event.changedTouches.length !== 1 || galleryImages.length <= 1) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        const deltaY = event.changedTouches[0].clientY - touchStartY;

        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          justSwiped = true;
          if (swipeTimer) window.clearTimeout(swipeTimer);
          swipeTimer = window.setTimeout(() => {
            justSwiped = false;
          }, 300);
          showImage(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
        }
      },
      { passive: true }
    );

    closeBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (justSwiped) return;
      closeLightbox();
    });

    prevBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (justSwiped) return;
      if (galleryImages.length > 1) {
        showImage(currentIndex - 1);
      }
    });

    nextBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (justSwiped) return;
      if (galleryImages.length > 1) {
        showImage(currentIndex + 1);
      }
    });

    lightbox.addEventListener('click', (event) => {
      if (justSwiped) return;
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    lightboxImg.addEventListener('click', (event) => {
      event.stopPropagation();
      if (justSwiped || galleryImages.length <= 1) return;
      const rect = lightboxImg.getBoundingClientRect();
      const clickedLeftHalf = event.clientX < rect.left + rect.width / 2;
      showImage(clickedLeftHalf ? currentIndex - 1 : currentIndex + 1);
    });

    document.addEventListener('keydown', (event) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowRight' && galleryImages.length > 1) {
        event.preventDefault();
        showImage(currentIndex + 1);
      } else if (event.key === 'ArrowLeft' && galleryImages.length > 1) {
        event.preventDefault();
        showImage(currentIndex - 1);
      }
    });

    if (typeof lightboxMedia.addEventListener === 'function') {
      lightboxMedia.addEventListener('change', (event) => {
        if (!event.matches && isOpen) {
          closeLightbox();
        }
      });
    }
  }
});
