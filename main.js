document.addEventListener("DOMContentLoaded", function () {
  initializeNavigation();
  initializeScrollEffects();
  initializeLegalModals();
  initializeContactForm();
  initializeAnimations();
  initializeThemeToggle();
  enablePerformanceOptimizations();
});

if (typeof window !== "undefined") {
  window.__NOART = window.__NOART || {};
  window.__NOART.initializeContactForm = initializeContactForm;
  // Optional: Browser Sentry initialization when DSN is provided
  if (window.__NOART && window.__NOART.sentryDsn) {
    (function initSentry() {
      try {
        // load Sentry after DOM ready to avoid blocking
        const script = document.createElement('script');
        script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.min.js';
        script.crossorigin = 'anonymous';
        script.onload = function () {
          try {
            Sentry.init({ dsn: window.__NOART.sentryDsn });
          } catch (e) {
            console.warn('Sentry browser init failed', e);
          }
        };
        document.head.appendChild(script);
      } catch (e) {
        console.warn('Sentry load error', e);
      }
    })();
  }
}

// Service Worker update handling: show toast when new SW is waiting
function setupServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;
    if (reg.waiting) {
      showUpdateToast(reg);
      return;
    }
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(reg);
        }
      });
    });
  });

  function showUpdateToast(reg) {
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.innerHTML = `<span>Neues Update verfügbar</span><button class="update-button">Neu laden</button>`;
    document.body.appendChild(toast);
    toast.querySelector('.update-button').addEventListener('click', () => {
      if (!reg.waiting) return;
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // reload when controller changes
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        window.location.reload();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => setupServiceWorkerUpdate());

function initializeNavigation() {
  const navbar = document.querySelector(".navbar");
  const navbarProgress = document.querySelector(".navbar-progress");

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrolled / documentHeight) * 100;

    if (navbarProgress) {
      navbarProgress.style.width = scrollPercent + "%";
    }

    if (navbar) {
      if (scrolled > 100) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  });

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function initializeScrollEffects() {
  const observerOptions = {
    threshold: [0, 0.1],
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;

      if (entry.isIntersecting) {
        el.classList.add("visible");
        el.classList.remove("scroll-init");

        const scrollType = el.getAttribute("data-scroll");
        if (scrollType) {
          el.classList.add(`scroll-${scrollType}`);
        }

        if (el.hasAttribute("data-scroll-once")) {
          observer.unobserve(el);
        }
        return;
      }

      if (!el.hasAttribute("data-scroll-once")) {
        el.classList.remove("visible");
        el.classList.add("scroll-init");

        const scrollType = el.getAttribute("data-scroll");
        if (scrollType) {
          el.classList.remove(`scroll-${scrollType}`);
        }

        if (scrollType && scrollType.indexOf("parallax") !== -1) {
          el.style.transform = "";
        }
      }
    });
  }, observerOptions);

  const scrollElements = document.querySelectorAll("[data-scroll]");
  scrollElements.forEach((el) => {
    observer.observe(el);
    el.classList.add("scroll-init");
  });

  let ticking = false;

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function computeRate(type, distanceFromCenter) {
    const base = distanceFromCenter / window.innerHeight;
    switch (type) {
      case "parallax-slow":
        return base * -30;
      case "parallax-medium":
        return base * -50;
      case "parallax-fast":
        return base * -90;
      default:
        return base * -40;
    }
  }

  function updateParallax() {
    if (prefersReducedMotion) return;

    const parallaxElements = document.querySelectorAll(
      '[data-scroll*="parallax"]',
    );

    parallaxElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = elCenter - viewportCenter;
      const type = el.getAttribute("data-scroll");

      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

      const rate = computeRate(type, distance);
      el.style.transform = `translate3d(0, ${rate}px, 0)`;
    });

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (prefersReducedMotion) return;
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "resize",
    () => {
      if (prefersReducedMotion) return;
      updateParallax();
    },
    { passive: true },
  );
}

function initializeLegalModals() {
  const impressumLink = document.querySelector('a[href="#impressum"]');
  const datenschutzLink = document.querySelector('a[href="#datenschutz"]');
  const impressumOverlay = document.getElementById("impressum-overlay");
  const datenschutzOverlay = document.getElementById("datenschutz-overlay");

  function getFocusable(container) {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
  }

  let lastActiveTrigger = null;

  function openOverlay(overlay, trigger) {
    if (!overlay) return;
    lastActiveTrigger = trigger || null;
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // focus management: move focus to first focusable element inside overlay
    const focusables = getFocusable(overlay);
    if (focusables.length) {
      focusables[0].focus();
    } else {
      // fallback: focus the overlay itself
      overlay.setAttribute("tabindex", "-1");
      overlay.focus();
    }

    // trap focus
    overlay.addEventListener("keydown", trapFocus);
    // close on escape
    document.addEventListener("keydown", handleEsc);
  }

  function closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    overlay.removeEventListener("keydown", trapFocus);
    document.removeEventListener("keydown", handleEsc);

    // restore focus to trigger if possible
    try {
      if (lastActiveTrigger && typeof lastActiveTrigger.focus === "function") {
        lastActiveTrigger.focus();
      }
    } catch (e) {
      // ignore
    }
    lastActiveTrigger = null;
  }

  function handleEsc(e) {
    if (e.key === "Escape" || e.key === "Esc") {
      const active = document.querySelector(".legal-overlay.active");
      if (active) closeOverlay(active);
    }
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const overlay = e.currentTarget;
    const focusables = getFocusable(overlay);
    if (!focusables.length) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (impressumLink && impressumOverlay) {
    impressumLink.addEventListener("click", (e) => {
      e.preventDefault();
      openOverlay(impressumOverlay, impressumLink);
    });
  }

  if (datenschutzLink && datenschutzOverlay) {
    datenschutzLink.addEventListener("click", (e) => {
      e.preventDefault();
      openOverlay(datenschutzOverlay, datenschutzLink);
    });
  }

  const closeButtons = document.querySelectorAll(".close-legal");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const overlay = btn.closest(".legal-overlay");
      if (overlay) closeOverlay(overlay);
    });
  });

  [impressumOverlay, datenschutzOverlay].forEach((overlay) => {
    if (!overlay) return;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOverlay(overlay);
    });
    // Initialize aria-hidden state
    overlay.setAttribute(
      "aria-hidden",
      overlay.classList.contains("active") ? "false" : "true",
    );
  });
}

/**
 * Initialize the theme toggle (light/dark).
 * Persists selection to localStorage and supports keyboard activation.
 */
function initializeThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;

  function ensureSR() {
    let sr = document.getElementById("theme-status-sr");
    if (!sr) {
      sr = document.createElement("div");
      sr.id = "theme-status-sr";
      sr.setAttribute("aria-live", "polite");
      sr.style.position = "absolute";
      sr.style.left = "-9999px";
      sr.style.width = "1px";
      sr.style.height = "1px";
      sr.style.overflow = "hidden";
      document.body.appendChild(sr);
    }
    return sr;
  }

  const saved = localStorage.getItem("noart-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (toggle) toggle.setAttribute("aria-checked", "true");
    } else {
      root.setAttribute("data-theme", "light");
      if (toggle) toggle.setAttribute("aria-checked", "false");
    }
    const desc = document.getElementById("theme-desc");
    if (desc) desc.textContent = "Hell / Dunkel";
    const sr = ensureSR();
    sr.textContent =
      theme === "dark" ? "Dunkelmodus aktiviert" : "Hellmodus aktiviert";
  }

  if (saved === "dark" || (!saved && prefersDark)) {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("noart-theme", next);
    setTimeout(() => {
      const pill = toggle.closest(".theme-toggle-float");
      if (pill) pill.blur();
    }, 100);
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      toggle.click();
    }
  });
}

/**
 * On touch devices, auto-collapse the floating theme pill after a timeout.
 */
function enableThemePillAutoCollapse() {
  const pill = document.querySelector(".theme-toggle-float");
  if (!pill) return;

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  let timer = null;
  pill.addEventListener("click", (e) => {
    if (e.target && e.target.id === "theme-toggle") return;

    pill.classList.add("expanded");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => pill.classList.remove("expanded"), 2000);
  });

  pill.addEventListener(
    "blur",
    () => {
      pill.classList.remove("expanded");
      window.clearTimeout(timer);
    },
    true,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  enableThemePillAutoCollapse();
});

/**
 * Initialize contact form client-side validation and submission.
 * - Validates required fields
 * - Uses fetch to POST to `/api/contact` when available
 * - Provides accessible status messaging and button busy state
 */
function initializeContactForm() {
  const contactForm = document.getElementById("contact-form");

  if (!contactForm) return;

  let statusContainer = document.getElementById("contact-status");
  if (!statusContainer) {
    statusContainer = document.createElement("div");
    statusContainer.id = "contact-status";
    statusContainer.setAttribute("tabindex", "-1");
    statusContainer.setAttribute("role", "status");
    statusContainer.setAttribute("aria-live", "polite");
    statusContainer.className = "contact-status";
    contactForm.prepend(statusContainer);
  }
  statusContainer.setAttribute("aria-atomic", "true");

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    data.name = (data.name || "").trim();
    data.email = (data.email || "").trim();
    data.message = (data.message || "").trim();

    if (!data.name || !data.email || !data.message) {
      statusContainer.textContent = "Bitte füllen Sie alle Felder aus.";
      statusContainer.classList.add("status-error");
      const nameField = contactForm.querySelector('[name="name"]');
      if (nameField && typeof nameField.focus === "function") nameField.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      statusContainer.textContent =
        "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      statusContainer.classList.add("status-error");
      const emailField = contactForm.querySelector('[name="email"]');
      if (emailField && typeof emailField.focus === "function")
        emailField.focus();
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    // preserve a reference to the original text node (if present) so we only change text
    let originalButtonText = null;
    if (submitBtn) {
      // find a first child text node or span and update it instead of replacing innerHTML
      const textNode = submitBtn.querySelector("span") || submitBtn.firstChild;
      if (textNode) originalButtonText = textNode.textContent;
      // visually indicate busy state but preserve structure
      if (textNode) textNode.textContent = "Wird gesendet...";
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.disabled = true;
    }
    statusContainer.textContent = "";
    statusContainer.classList.remove("status-error");

    // Try to POST to /api/contact if available (local mock server)
    const controller = window.AbortController ? new AbortController() : null;
    const signal = controller ? controller.signal : null;
    let didRespond = false;

    const payload = {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    };

    function finalize(success, message) {
      if (didRespond) return;
      didRespond = true;
      statusContainer.textContent = message;
      statusContainer.classList.remove("status-error");
      if (!success) statusContainer.classList.add("status-error");

      // Only reset the form when the message has been successfully delivered
      if (success) contactForm.reset();

      // Restore submit button text and state
      if (submitBtn) {
        const textNode =
          submitBtn.querySelector("span") || submitBtn.firstChild;
        if (textNode && originalButtonText !== null)
          textNode.textContent = originalButtonText;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.disabled = false;
      }

      // Announce result and focus the status container for screen readers
      if (typeof statusContainer.focus === "function") statusContainer.focus();
    }

    if (window.fetch) {
      // set a timeout for the request (5s)
      const timeout = setTimeout(() => {
        if (controller) controller.abort();
      }, 5000);

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      })
        .then((res) => res.json())
        .then((res) => {
          clearTimeout(timeout);
          if (!res.ok) {
            return res.json().then((json) => {
              const errMsg =
                (json && json.error) ||
                "Serverfehler beim Senden der Nachricht.";
              finalize(false, errMsg);
            });
          }
          return res.json().then((json) => {
            if (json && json.ok) {
              finalize(
                true,
                "Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.",
              );
            } else {
              const errMsg =
                (json && json.error) ||
                "Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.";
              finalize(false, errMsg);
            }
          });
        })
        .catch((err) => {
          clearTimeout(timeout);
          console.warn("Contact fetch failed", err);
          // Inform user that sending failed and suggest retry
          finalize(
            false,
            "Netzwerkfehler: Nachricht konnte nicht gesendet werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
          );
        });
    } else {
      // no fetch available, keep old simulated behavior
      setTimeout(() => {
        finalize(
          true,
          "Vielen Dank für Ihre Nachricht! Wir werden uns bald bei Ihnen melden.",
        );
      }, 2000);
    }
  });
}

function initializeAnimations() {
  const heroLines = document.querySelectorAll(".hero-line");
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const heroCta = document.querySelector(".hero-cta");

  heroLines.forEach((line, index) => {
    const delay = line.getAttribute("data-delay") || index * 200;
    setTimeout(() => {
      line.style.opacity = "1";
      line.style.transform = "translateY(0)";
    }, delay);
  });

  if (heroSubtitle) {
    const delay = heroSubtitle.getAttribute("data-delay") || 600;
    setTimeout(() => {
      heroSubtitle.style.opacity = "1";
      heroSubtitle.style.transform = "translateY(0)";
    }, delay);
  }

  if (heroCta) {
    const delay = heroCta.getAttribute("data-delay") || 800;
    setTimeout(() => {
      heroCta.style.opacity = "1";
      heroCta.style.transform = "translateY(0)";
    }, delay);
  }

  try {
    const heroVideo = document.querySelector(".hero-video");
    if (heroVideo) {
      const prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        heroVideo.pause();
      } else {
        heroVideo.playbackRate = 0.5;
        const playPromise = heroVideo.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn("Hero video control failed", e);
  }

  (function setupPingPong() {
    const video = document.querySelector(".hero-video");
    if (!video) return;

    const mq =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) return;

    let running = true;
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
    });

    function whenReady(cb) {
      if (video.readyState >= 2) return cb();
      const onLoaded = () => {
        video.removeEventListener("loadeddata", onLoaded);
        cb();
      };
      video.addEventListener("loadeddata", onLoaded);
    }

    whenReady(() => {
      const duration = video.duration || 5;
      const loopSegment = Math.min(6, duration);
      const start = Math.max(0, (duration - loopSegment) / 2);
      const end = Math.min(duration, start + loopSegment);

      let direction = 1;
      const stepSeconds = 0.02;

      video.playbackRate = 0.5;
      const tryPlay = () => {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      };
      tryPlay();

      function raf() {
        if (!running) {
          requestAnimationFrame(raf);
          return;
        }

        if (
          !video.paused &&
          !video.seeking &&
          video.playbackRate > 0 &&
          direction === 1 &&
          video.currentTime < end - 0.05
        ) {
          requestAnimationFrame(raf);
          return;
        }

        if (direction === 1 && video.currentTime >= end - 0.03) {
          direction = -1;
          video.pause();
        } else if (direction === -1 && video.currentTime <= start + 0.03) {
          direction = 1;
          tryPlay();
        }

        if (direction === -1) {
          const step = stepSeconds;
          video.currentTime = Math.max(start, video.currentTime - step);
        }

        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    });
  })();
}

function enablePerformanceOptimizations() {
  const elementsToOptimize = document.querySelectorAll(
    ".hero-layer, .cursor, .content-section",
  );
  elementsToOptimize.forEach((el) => {
    el.style.willChange = "transform";
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.body.style.animationPlayState = "paused";
    } else {
      document.body.style.animationPlayState = "running";
    }
  });

  console.log("Performance optimizations enabled");
  const pill = document.querySelector(".theme-toggle-float");
  if (pill) {
    pill.addEventListener("focusout", () => {
      pill.blur();
    });
  }
  document.addEventListener("mousedown", (e) => {
    const pill = document.querySelector(".theme-toggle-float");
    if (!pill) return;
    if (!pill.contains(e.target)) {
      pill.blur();
    }
  });
}
