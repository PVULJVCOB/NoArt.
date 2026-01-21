/**
 * Theme Toggle (Light/Dark).
 */

export function initializeThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);
    
    if (toggle) {
      toggle.setAttribute('aria-checked', String(isDark));
    }

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
