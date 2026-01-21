/**
 * Scroll Effekte und Parallax.
 */

export function initializeScrollEffects() {
  const observerOptions = {
    threshold: [0, 0.1],
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const scrollType = el.getAttribute('data-scroll');

      if (entry.isIntersecting) {
        el.classList.add('visible');
        el.classList.remove('scroll-init');

        if (scrollType) {
          el.classList.add(`scroll-${scrollType}`);
        }

        if (el.hasAttribute('data-scroll-once')) {
          observer.unobserve(el);
        }
      } else if (!el.hasAttribute('data-scroll-once')) {
        el.classList.remove('visible');
        el.classList.add('scroll-init');

        if (scrollType) {
          el.classList.remove(`scroll-${scrollType}`);
        }

        if (scrollType?.includes('parallax')) {
          el.style.transform = '';
        }
      }
    });
  }, observerOptions);

  const scrollElements = document.querySelectorAll('[data-scroll]');
  scrollElements.forEach((el) => {
    observer.observe(el);
    el.classList.add('scroll-init');
  });

  initializeParallax();
}

function initializeParallax() {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;

  function computeRate(type, distanceFromCenter) {
    const base = distanceFromCenter / window.innerHeight;
    const rates = {
      'parallax-slow': -30,
      'parallax-medium': -50,
      'parallax-fast': -90,
    };
    return base * (rates[type] || -40);
  }

  function updateParallax() {
    const parallaxElements = document.querySelectorAll('[data-scroll*="parallax"]');

    parallaxElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

      const elCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = elCenter - viewportCenter;
      const type = el.getAttribute('data-scroll');
      const rate = computeRate(type, distance);

      el.style.transform = `translate3d(0, ${rate}px, 0)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateParallax, { passive: true });
}
