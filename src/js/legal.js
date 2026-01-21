/**
 * Rechtliche Overlays (Impressum/Datenschutz).
 */

export function initializeLegalModals() {
  const impressumLink = document.querySelector('a[href="#impressum"]');
  const datenschutzLink = document.querySelector('a[href="#datenschutz"]');
  const impressumOverlay = document.getElementById('impressum-overlay');
  const datenschutzOverlay = document.getElementById('datenschutz-overlay');

  let lastActiveTrigger = null;

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
