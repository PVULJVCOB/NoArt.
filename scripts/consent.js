// Consent banner + conditional Plausible loader
(function () {
  const CONSENT_KEY = 'noart_analytics_consent';

  function hasConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setConsent(v) {
    try {
      localStorage.setItem(CONSENT_KEY, v ? '1' : '0');
    } catch (e) {}
  }

  function loadPlausible() {
    if (window.plausible) return;
    const script = document.createElement('script');
    script.setAttribute('defer', '');
  // Default to the production domain if not configured elsewhere
  script.setAttribute('data-domain', window.__NOART && window.__NOART.plausibleDomain ? window.__NOART.plausibleDomain : 'www.noart.de');
    script.src = 'https://plausible.io/js/plausible.js';
    document.head.appendChild(script);
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <p>
        Wir nutzen anonyme Analyse zur Verbesserung der Website. Stimmen Sie zu?
      </p>
      <div class="consent-actions">
        <button class="consent-button ghost" data-action="decline">Ablehnen</button>
        <button class="consent-button primary" data-action="accept">Zustimmen</button>
      </div>
    `;

    banner.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action === 'accept') {
        setConsent(true);
        loadPlausible();
        banner.remove();
      } else if (action === 'decline') {
        setConsent(false);
        banner.remove();
      }
    });

    document.body.appendChild(banner);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (hasConsent()) {
      loadPlausible();
      return;
    }
    createBanner();
  });
})();
