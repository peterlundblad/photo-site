// Applies one-shot fade-in reveal to observed elements
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        entry.target.classList.remove('not-in-view');
        obs.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: '50px 0px',
    threshold: 0,
  }
);

const tags = document.querySelectorAll('.container-hero, .row img, .masonry img, footer');

tags.forEach((tag) => {
  observer.observe(tag);
});
