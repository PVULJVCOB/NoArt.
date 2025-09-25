// Client-side helper to fetch reCAPTCHA token and attach to form
(function () {
  const SITE_KEY = (window.__NOART && window.__NOART.recaptchaSiteKey) || '';
  if (!SITE_KEY) return;

  function ensureRecaptchaLoaded(cb) {
    if (window.grecaptcha) return cb();
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=' + SITE_KEY;
    s.defer = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      if (!SITE_KEY || !window.grecaptcha) return; // allow submit to continue if recaptcha not configured
      e.preventDefault();
      ensureRecaptchaLoaded(() => {
        grecaptcha.ready(() => {
          grecaptcha.execute(SITE_KEY, { action: 'submit' }).then(function (token) {
            // attach token to form as hidden input
            let t = form.querySelector('input[name="recaptchaToken"]');
            if (!t) {
              t = document.createElement('input');
              t.type = 'hidden';
              t.name = 'recaptchaToken';
              form.appendChild(t);
            }
            t.value = token;
            form.submit();
          });
        });
      });
    });
  });
})();
