// Simple serverless contact handler compatible with Vercel (api/contact)
// Behavior:
// - If SENDGRID_API_KEY is provided in env, send email via SendGrid
// - Otherwise, in non-production, log payload and return success (dev-mode)

// Optional: Sentry for error monitoring
let Sentry;
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  } catch (e) {
    console.warn('Sentry init failed', e);
    Sentry = null;
  }
}

// Rate limiter helper (supports Redis via REDIS_URL or an in-memory fallback)
const { checkAndIncrement } = require('../lib/rateLimiter');

// Allowed origins for CORS (comma-separated env var). If empty, allow all origins (legacy behavior).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

// helpers: simple sanitizers/validators
function stripTags(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]*>/g, '').trim();
}

function isValidEmail(email) {
  if (!email) return false;
  // simple email regex (not perfect but sufficient for basic validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


const sendViaSendGrid = async (payload) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const fetch = global.fetch || (await import('node-fetch')).default;
  const msg = {
    personalizations: [
      {
        to: [{ email: process.env.CONTACT_RECIPIENT || 'hello@noart.gallery' }],
        subject: payload.subject || 'Neue Kontaktanfrage von NoArt.'
      }
    ],
    from: { email: process.env.SEND_FROM || (payload.email || 'no-reply@noart.gallery') },
    content: [
      {
        type: 'text/plain',
        value: `Name: ${payload.name}\nEmail: ${payload.email}\n\nMessage:\n${payload.message}`
      }
    ]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(msg)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error: ${res.status} ${text}`);
  }
};

module.exports = async (req, res) => {
  // CORS handling: only allow configured origins when provided
  const origin = req.headers.origin || req.headers.referer || '';
  let allowOrigin = '*';
  if (ALLOWED_ORIGINS.length) {
    if (ALLOWED_ORIGINS.includes(origin)) allowOrigin = origin;
    else allowOrigin = 'null';
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  Object.entries(defaultHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const payload = req.body && Object.keys(req.body).length ? req.body : await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data || '{}')));
      req.on('error', reject);
    });

    // sanitize + validate
    const name = stripTags(payload.name || '');
    const email = (payload.email || '').trim();
    const message = stripTags(payload.message || '');
    const subject = stripTags(payload.subject || 'Kontaktanfrage');

    if (!name || name.length > 100) {
      res.status(400).json({ ok: false, error: 'Invalid name' });
      return;
    }
    if (!isValidEmail(email) || email.length > 254) {
      res.status(400).json({ ok: false, error: 'Invalid email' });
      return;
    }
    if (!message || message.length > 5000) {
      res.status(400).json({ ok: false, error: 'Invalid message' });
      return;
    }

    // Rate limiting: per-IP using shared Redis if available, otherwise in-memory fallback
    try {
      const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.connection && req.connection.remoteAddress) || 'unknown';
      const rl = await checkAndIncrement(ip);
      if (!rl.allowed) {
        res.status(429).json({ ok: false, error: 'Too many requests' });
        return;
      }
    } catch (e) {
      console.warn('Rate-limit check failed', e && e.message);
    }

    // spam protection: honeypot
    if (payload._hp && String(payload._hp).trim()) {
      res.status(200).json({ ok: true });
      return;
    }

    // Optional: reCAPTCHA server-side verification if secret provided
    if (process.env.RECAPTCHA_SECRET) {
      if (!payload.recaptchaToken) {
        res.status(400).json({ ok: false, error: 'Missing reCAPTCHA token' });
        return;
      }
      try {
        const fetch = global.fetch || (await import('node-fetch')).default;
        const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(payload.recaptchaToken || '')}`
        });
        const json = await r.json();
        if (!json || !json.success) {
          res.status(400).json({ ok: false, error: 'reCAPTCHA verification failed' });
          return;
        }
      } catch (e) {
        console.error('reCAPTCHA verification error', e && e.message);
        res.status(500).json({ ok: false, error: 'reCAPTCHA verification failed' });
        return;
      }
    }

    const safePayload = { name, email, message, subject };

    if (process.env.SENDGRID_API_KEY) {
      // include reply_to when the sender provided a valid email
      const sendPayload = Object.assign({}, safePayload);
      try {
        await sendViaSendGrid(sendPayload);
      } catch (e) {
        console.error('SendGrid error', e && e.message);
        if (Sentry && Sentry.captureException) {
          try { Sentry.captureException(e); } catch (s) { console.warn('Sentry capture failed', s && s.message); }
        }
        res.status(502).json({ ok: false, error: 'Email delivery failed' });
        return;
      }
    } else {
      // Dev-mode: log and pretend success
      console.log('Contact payload (dev):', safePayload);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact API error:', err && err.message);
    if (Sentry && Sentry.captureException) {
      try { Sentry.captureException(err); } catch (e) { console.warn('Sentry capture failed', e && e.message); }
    }
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
