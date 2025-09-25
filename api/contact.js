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

// Simple in-memory rate limiter (per-IP). Note: not reliable in serverless (cold starts); use Redis for production.
const { checkAndIncrement } = require('../lib/rateLimiter');

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
  // Basic CORS support & preflight
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // set headers for all responses
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

    // basic server-side validation
    if (!payload.name || !payload.email || !payload.message) {
      res.status(400).json({ ok: false, error: 'Missing required fields' });
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
      console.warn('Rate-limit check failed', e);
    }

    // spam protection: simple honeypot field
    if (payload._hp && payload._hp.trim()) {
      // pretend success to bots
      res.status(200).json({ ok: true });
      return;
    }

    // Optional: reCAPTCHA server-side verification if secret provided
    if (process.env.RECAPTCHA_SECRET) {
      try {
        const fetch = global.fetch || (await import('node-fetch')).default;
        const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(payload.recaptchaToken || '')}`
        });
        const json = await r.json();
        if (!json.success) {
          res.status(400).json({ ok: false, error: 'reCAPTCHA verification failed' });
          return;
        }
      } catch (e) {
        console.error('reCAPTCHA verification error', e);
        res.status(500).json({ ok: false, error: 'reCAPTCHA verification failed' });
        return;
      }
    }

    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid(payload);
    } else {
      // Dev-mode: log and pretend success
      console.log('Contact payload (dev):', payload);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact API error:', err);
    if (Sentry && Sentry.captureException) {
      try { Sentry.captureException(err); } catch (e) { console.warn('Sentry capture failed', e); }
    }
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};
