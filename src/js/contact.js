/**
 * Kontaktformular Validierung & Submit.
 */

export function initializeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

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

    if (!data.name || !data.email || !data.message) {
      showStatus('Bitte füllen Sie alle Felder aus.', true);
      contactForm.querySelector('[name="name"]')?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showStatus('Bitte geben Sie eine gültige E-Mail-Adresse ein.', true);
      contactForm.querySelector('[name="email"]')?.focus();
      return;
    }

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
        showStatus('Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.', false);
        contactForm.reset();
      } else {
        showStatus(result.error || 'Beim Senden ist ein Fehler aufgetreten.', true);
      }
    } catch (error) {
      console.warn('Contact form submission failed:', error);
      showStatus('Netzwerkfehler: Nachricht konnte nicht gesendet werden.', true);
    } finally {
      if (submitBtn) {
        if (btnTextEl && originalText) btnTextEl.textContent = originalText;
        submitBtn.removeAttribute('aria-busy');
        submitBtn.disabled = false;
      }
    }
  });

  function showStatus(message, isError) {
    statusContainer.textContent = message;
    statusContainer.classList.toggle('status-error', isError);
    statusContainer.focus();
  }
}
