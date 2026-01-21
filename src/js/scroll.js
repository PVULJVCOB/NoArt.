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
  let lastScrollY = window.scrollY;
  let currentTransforms = new Map();
  
  // Detect if device is mobile/touch for smoother handling
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.matchMedia('(max-width: 768px)').matches
    || 'ontouchstart' in window;

  function computeRate(type, distanceFromCenter) {
    const base = distanceFromCenter / window.innerHeight;
    // Reduce parallax intensity on mobile for smoother experience
    const mobileFactor = isMobile ? 0.5 : 1;
    const rates = {
      'parallax-slow': -30 * mobileFactor,
      'parallax-medium': -50 * mobileFactor,
      'parallax-fast': -90 * mobileFactor,
    };
    return base * (rates[type] || -40 * mobileFactor);
  }

  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function updateParallax() {
    const parallaxElements = document.querySelectorAll('[data-scroll*="parallax"]');
    // Smoother interpolation on mobile
    const smoothFactor = isMobile ? 0.15 : 0.1;

    parallaxElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

      const elCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = elCenter - viewportCenter;
      const type = el.getAttribute('data-scroll');
      const targetRate = computeRate(type, distance);

      // Get current transform value or default to 0
      const currentRate = currentTransforms.get(el) || 0;
      // Smooth interpolation for less jerky movement
      const newRate = lerp(currentRate, targetRate, smoothFactor);
      currentTransforms.set(el, newRate);

      // Use will-change and GPU acceleration
      el.style.willChange = 'transform';
      el.style.transform = `translate3d(0, ${newRate}px, 0)`;
    });

    ticking = false;
    lastScrollY = window.scrollY;
  }

  // Use passive scroll listener with throttling
  let scrollTimeout;
  function onScroll() {
    if (!ticking) {
      // On mobile, use smoother animation loop
      if (isMobile) {
        cancelAnimationFrame(scrollTimeout);
        scrollTimeout = requestAnimationFrame(() => {
          requestAnimationFrame(updateParallax);
        });
      } else {
        requestAnimationFrame(updateParallax);
      }
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    requestAnimationFrame(updateParallax);
  }, { passive: true });
  
  // Initial update
  requestAnimationFrame(updateParallax);
}
