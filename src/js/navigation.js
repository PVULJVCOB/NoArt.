/**
 * Navigation: Scroll-Style, Smooth Scroll, Mobile Drawer.
 */

export function initializeNavigation() {
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
