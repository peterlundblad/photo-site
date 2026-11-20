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
});
