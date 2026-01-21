/**
 * ==========================================================================
 * MAIN JAVASCRIPT - NoArt. Website
 * ==========================================================================
 *
 * Core functionality for the NoArt. website including:
 * - Smooth scroll navigation
 * - Intersection Observer-based scroll animations
 * - Parallax effects for visual depth
 * - Light/dark theme toggle with localStorage persistence
 * - Accessible legal modal dialogs
 * - Contact form validation and submission
 * - Hero section animations and video control
 *
 * Architecture:
 * - All functionality is encapsulated in named functions
 * - Functions are initialized on DOMContentLoaded
 * - Uses modern ES6+ features with graceful degradation
 * - Respects user preferences (reduced motion, color scheme)
 *
 * @author NoArt. Team
 * @version 2.0.0
 * ==========================================================================
 */


/* ==========================================================================
   INITIALIZATION
   ==========================================================================
   Entry point - initializes all modules when DOM is ready.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeScrollEffects();
  initializeLegalModals();
  initializeContactForm();
  initializeAnimations();
  initializeThemeToggle();
  enablePerformanceOptimizations();
});

/* ==========================================================================
   NAVIGATION
   ==========================================================================
  Handles navbar scroll behavior and smooth scrolling.
   ========================================================================== */

/**
 * Initialize navigation functionality.
 * - Toggles navbar style on scroll
 * - Enables smooth scrolling for anchor links
 */
function initializeNavigation() {
  const navbar = document.querySelector('.navbar');

  // Add/remove scrolled class for navbar styling
  window.addEventListener('scroll', () => {
    const scrollingElement = document.scrollingElement || document.documentElement;
    const scrolled = scrollingElement.scrollTop;
    if (navbar) {
      navbar.classList.toggle('scrolled', scrolled > 100);
    }
  });

  // Smooth scroll for internal anchor links
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        closeMobileMenu();
      }
    });
  });

  // Initialize burger / overlay behavior
  initializeMobileMenu();
}

/**
 * Initialize mobile hamburger menu functionality.
 * Always available (desktop and mobile) because nav links live in drawer.
 */
function initializeMobileMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (!navToggle || !navMenu) return;

  let overlay = document.getElementById('nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  // Toggle menu on hamburger click
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', () => closeMobileMenu());

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
  });

  // Close when resizing up to desktop widths
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeMobileMenu();
    }
  });
}

/**
 * Open the navigation drawer.
 */
function openMobileMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('nav-overlay');

  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Menü schließen');
  }
  if (navMenu) navMenu.classList.add('active');
  if (overlay) overlay.classList.add('active');

  // Prevent body scroll when menu is open
  document.body.style.overflow = 'hidden';
}

/**
 * Close the navigation drawer.
 */
function closeMobileMenu() {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const overlay = document.getElementById('nav-overlay');
  
  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Menü öffnen');
  }
  if (navMenu) navMenu.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  
  // Restore body scroll
  document.body.style.overflow = '';
}


/* ==========================================================================
   SCROLL EFFECTS
   ==========================================================================
   Intersection Observer for scroll-triggered animations and parallax.
   ========================================================================== */

/**
 * Initialize scroll-triggered animations using Intersection Observer.
 * Elements with [data-scroll] attribute will animate when entering viewport.
 * Supports parallax effects for elements with data-scroll="parallax-*".
 */
function initializeScrollEffects() {
  const observerOptions = {
    threshold: [0, 0.1],
    rootMargin: '0px 0px -100px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const scrollType = el.getAttribute('data-scroll');

      if (entry.isIntersecting) {
        // Element is visible - trigger animation
        el.classList.add('visible');
        el.classList.remove('scroll-init');

        if (scrollType) {
          el.classList.add(`scroll-${scrollType}`);
        }

        // Unobserve if one-time animation
        if (el.hasAttribute('data-scroll-once')) {
          observer.unobserve(el);
        }
      } else if (!el.hasAttribute('data-scroll-once')) {
        // Element left viewport - reset animation
        el.classList.remove('visible');
        el.classList.add('scroll-init');

        if (scrollType) {
          el.classList.remove(`scroll-${scrollType}`);
        }

        // Reset parallax transform
        if (scrollType?.includes('parallax')) {
          el.style.transform = '';
        }
      }
    });
  }, observerOptions);

  // Observe all scroll-animated elements
  const scrollElements = document.querySelectorAll('[data-scroll]');
  scrollElements.forEach((el) => {
    observer.observe(el);
    el.classList.add('scroll-init');
  });

  // Initialize parallax scrolling
  initializeParallax();
}

/**
 * Initialize parallax scrolling effect.
 * Moves elements at different rates based on scroll position.
 * Respects prefers-reduced-motion preference.
 */
function initializeParallax() {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;

  /**
   * Calculate parallax offset based on element type.
   * @param {string} type - Parallax type (slow, medium, fast)
   * @param {number} distanceFromCenter - Distance from viewport center
   * @returns {number} Pixel offset
   */
  function computeRate(type, distanceFromCenter) {
    const base = distanceFromCenter / window.innerHeight;
    const rates = {
      'parallax-slow': -30,
      'parallax-medium': -50,
      'parallax-fast': -90,
    };
    return base * (rates[type] || -40);
  }

  /**
   * Update parallax positions for all elements.
   */
  function updateParallax() {
    const parallaxElements = document.querySelectorAll('[data-scroll*="parallax"]');

    parallaxElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      
      // Skip elements outside viewport buffer
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

  // Throttled scroll listener using requestAnimationFrame
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateParallax, { passive: true });
}


/* ==========================================================================
   LEGAL MODALS
   ==========================================================================
   Accessible modal dialogs for Impressum and Datenschutz.
   ========================================================================== */

/**
 * Initialize legal overlay modals with full accessibility support.
 * - Traps focus within modal when open
 * - Closes on Escape key or backdrop click
 * - Returns focus to trigger element on close
 */
function initializeLegalModals() {
  const impressumLink = document.querySelector('a[href="#impressum"]');
  const datenschutzLink = document.querySelector('a[href="#datenschutz"]');
  const impressumOverlay = document.getElementById('impressum-overlay');
  const datenschutzOverlay = document.getElementById('datenschutz-overlay');

  let lastActiveTrigger = null;

  /**
   * Get all focusable elements within a container.
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement[]} Array of focusable elements
   */
  function getFocusable(container) {
    if (!container) return [];
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const nodes = Array.from(container.querySelectorAll(focusableSelectors.join(',')));
    return nodes.filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  const openOverlay = (overlay, trigger) => {
    if (!overlay) return;
    lastActiveTrigger = trigger || null;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    const focusables = getFocusable(overlay);
    focusables[0]?.focus();
    overlay.addEventListener('keydown', trapFocus);
    document.addEventListener('keydown', handleEsc);
  };

  const closeOverlay = (overlay) => {
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.removeEventListener('keydown', trapFocus);
    document.removeEventListener('keydown', handleEsc);

    if (lastActiveTrigger?.focus) {
      lastActiveTrigger.focus();
    }
    lastActiveTrigger = null;
  };

  function handleEsc(e) {
    if (e.key === 'Escape') {
      const active = document.querySelector('.legal-overlay.active');
      if (active) closeOverlay(active);
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const overlay = e.currentTarget;
    const focusables = getFocusable(overlay);
    if (!focusables.length) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  impressumLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openOverlay(impressumOverlay, impressumLink);
  });

  datenschutzLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openOverlay(datenschutzOverlay, datenschutzLink);
  });

  document.querySelectorAll('.close-legal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.legal-overlay');
      if (overlay) closeOverlay(overlay);
    });
  });

  [impressumOverlay, datenschutzOverlay].forEach((overlay) => {
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay(overlay);
    });
    overlay.setAttribute('aria-hidden', 'true');
  });
}


/* ==========================================================================
   THEME TOGGLE
   ==========================================================================
   Light/dark mode toggle with system preference detection.
   ========================================================================== */

/**
 * Initialize theme toggle functionality.
 * - Persists preference to localStorage
 * - Respects system color scheme preference
 * - Provides screen reader announcements
 */
function initializeThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Create screen reader announcement element
  let srAnnouncer = document.getElementById('theme-status-sr');
  if (!srAnnouncer) {
    srAnnouncer = document.createElement('div');
    srAnnouncer.id = 'theme-status-sr';
    srAnnouncer.setAttribute('aria-live', 'polite');
    srAnnouncer.className = 'sr-only';
    document.body.appendChild(srAnnouncer);
  }

  /**
   * Apply theme and update UI state.
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);
    
    if (toggle) {
      toggle.setAttribute('aria-checked', String(isDark));
    }

    const desc = document.getElementById('theme-desc');
    if (desc) {
      desc.textContent = 'Hell / Dunkel';
    }

    srAnnouncer.textContent = isDark 
      ? 'Dunkelmodus aktiviert' 
      : 'Hellmodus aktiviert';
  }

  // Determine initial theme
  const savedTheme = localStorage.getItem('noart-theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (!toggle) return;

  // Toggle on click
  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('noart-theme', next);
  });

  // Keyboard support
  toggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle.click();
    }
  });
}


/* ==========================================================================
   CONTACT FORM
   ==========================================================================
   Form validation and submission handling.
   ========================================================================== */

/**
 * Initialize contact form with validation and async submission.
 * - Client-side validation for required fields
 * - Email format validation
 * - Accessible error messaging
 * - Async form submission with loading state
 */
function initializeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  // Create/get status container
  let statusContainer = document.getElementById('contact-status');
  if (!statusContainer) {
    statusContainer = document.createElement('div');
    statusContainer.id = 'contact-status';
    statusContainer.setAttribute('tabindex', '-1');
    statusContainer.setAttribute('role', 'status');
    statusContainer.setAttribute('aria-live', 'polite');
    statusContainer.setAttribute('aria-atomic', 'true');
    statusContainer.className = 'contact-status';
    contactForm.prepend(statusContainer);
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      subject: formData.get('subject')?.trim() || '',
      message: formData.get('message')?.trim() || '',
    };

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      showStatus('Bitte fÃ¼llen Sie alle Felder aus.', true);
      contactForm.querySelector('[name="name"]')?.focus();
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showStatus('Bitte geben Sie eine gÃ¼ltige E-Mail-Adresse ein.', true);
      contactForm.querySelector('[name="email"]')?.focus();
      return;
    }

    // Get submit button and set loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const btnTextEl = submitBtn?.querySelector('span') || submitBtn?.firstChild;
    const originalText = btnTextEl?.textContent;

    if (submitBtn) {
      if (btnTextEl) btnTextEl.textContent = 'Wird gesendet...';
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.disabled = true;
    }

    statusContainer.textContent = '';
    statusContainer.classList.remove('status-error');

    try {
      // Submit form
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const result = await response.json();

      if (result.ok) {
        showStatus('Vielen Dank fÃ¼r Ihre Nachricht! Wir werden uns bald bei Ihnen melden.', false);
        contactForm.reset();
      } else {
        showStatus(result.error || 'Beim Senden ist ein Fehler aufgetreten.', true);
      }
    } catch (error) {
      console.warn('Contact form submission failed:', error);
      showStatus('Netzwerkfehler: Nachricht konnte nicht gesendet werden.', true);
    } finally {
      // Restore button state
      if (submitBtn) {
        if (btnTextEl && originalText) btnTextEl.textContent = originalText;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
      }
    }
  });

  /**
   * Display status message to user.
   * @param {string} message - Message to display
   * @param {boolean} isError - Whether this is an error message
   */
  function showStatus(message, isError) {
    statusContainer.textContent = message;
    statusContainer.classList.toggle('status-error', isError);
    statusContainer.focus();
  }
}


/* ==========================================================================
   ANIMATIONS
   ==========================================================================
   Hero section entrance animations and video control.
   ========================================================================== */

/**
 * Initialize hero section animations.
 * - Staggered text reveal animations
 * - Video playback control with reduced motion support
 * - Ping-pong video loop effect
 */
function initializeAnimations() {
  const heroLines = document.querySelectorAll('.hero-line');

  // Animate hero lines with stagger
  heroLines.forEach((line, index) => {
    const delay = line.getAttribute('data-delay') || index * 200;
    setTimeout(() => {
      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';
    }, delay);
  });

  // Initialize hero video
  initializeHeroVideo();
}

/**
 * Initialize hero video with ping-pong loop effect.
 * Video plays forward then reverses, creating a seamless loop.
 * Respects reduced motion preferences.
 */
function initializeHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  video.playbackRate = 0.5;
  video.play().catch(() => {});

  // Set up ping-pong loop
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
  });

  const setupPingPong = () => {
    if (video.readyState < 2) {
      video.addEventListener('loadeddata', setupPingPong, { once: true });
      return;
    }

    const duration = video.duration || 5;
    const loopSegment = Math.min(6, duration);
    const start = Math.max(0, (duration - loopSegment) / 2);
    const end = Math.min(duration, start + loopSegment);
    const stepSeconds = 0.02;
    let direction = 1;

    function animate() {
      if (!running) {
        requestAnimationFrame(animate);
        return;
      }

      // Playing forward - let browser handle it
      if (direction === 1 && !video.paused && video.currentTime < end - 0.05) {
        requestAnimationFrame(animate);
        return;
      }

      // Switch direction at boundaries
      if (direction === 1 && video.currentTime >= end - 0.03) {
        direction = -1;
        video.pause();
      } else if (direction === -1 && video.currentTime <= start + 0.03) {
        direction = 1;
        video.play().catch(() => {});
      }

      // Manually step backwards
      if (direction === -1) {
        video.currentTime = Math.max(start, video.currentTime - stepSeconds);
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  };

  setupPingPong();
}


/* ==========================================================================
   PERFORMANCE OPTIMIZATIONS
   ==========================================================================
   GPU hints and animation pausing for background tabs.
   ========================================================================== */

/**
 * Enable performance optimizations.
 * - Sets will-change hints for animated elements
 * - Pauses animations when tab is not visible
 */
function enablePerformanceOptimizations() {
  // GPU hints for frequently animated elements
  const elementsToOptimize = document.querySelectorAll('.content-section');
  elementsToOptimize.forEach((el) => {
    el.style.willChange = 'transform';
  });

  // Pause animations when tab is hidden
  document.addEventListener('visibilitychange', () => {
    document.body.style.animationPlayState = document.hidden ? 'paused' : 'running';
  });
}