/**
 * Theme Toggle (Light/Dark).
 */

export function initializeThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  let srAnnouncer = document.getElementById('theme-status-sr');
  if (!srAnnouncer) {
    srAnnouncer = document.createElement('div');
    srAnnouncer.id = 'theme-status-sr';
    srAnnouncer.setAttribute('aria-live', 'polite');
    srAnnouncer.className = 'sr-only';
    document.body.appendChild(srAnnouncer);
  }

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

  const savedTheme = localStorage.getItem('noart-theme');
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('noart-theme', next);
  });

  toggle.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle.click();
    }
  });
}
