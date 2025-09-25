# Deployment guide

This document explains how to host the static site on GitHub Pages and run the contact serverless function on Netlify. It also covers domain registration, DNS records and environment variables required for production email sending and spam protection.

Summary:
- Static site: GitHub Pages (built with Vite, output in `dist`)
- Serverless functions: Netlify Functions (source in `netlify/functions`)

Prerequisites
- GitHub repository connected to this project
- Netlify account and a site created (you'll need `NETLIFY_SITE_ID` and a personal access token `NETLIFY_AUTH_TOKEN`)

Required environment variables (set in Netlify and GitHub Actions secrets):
- SENDGRID_API_KEY: SendGrid API key (optional in dev; required to send email)
- SEND_FROM: From email address for outgoing messages (e.g. no-reply@yourdomain)
- CONTACT_RECIPIENT: Destination email that receives messages
- SITE_URL: Public URL of the site (e.g. https://example.com)
- RECAPTCHA_SECRET: (optional) secret for server-side reCAPTCHA validation
- SENTRY_DSN: (optional) Sentry DSN for error reporting
- REDIS_URL: (optional) URL for Redis used by rate-limiter in production
- NETLIFY_AUTH_TOKEN: Netlify personal access token (used by GitHub Actions if you deploy via CLI)
- NETLIFY_SITE_ID: Netlify Site ID to publish to

DNS / Domain notes
- To use a root/apex domain with GitHub Pages you generally need A records pointing to GitHub Pages IPs. For a subdomain (www) create a CNAME to `your-github-username.github.io`.
- If you want Netlify to manage the domain (and functions together), you can point the domain to Netlify instead and set up Netlify to serve the site (then you can skip GitHub Pages).
- Add an SPF TXT record for the sending domain if you use SendGrid. Example:
  v=spf1 include:sendgrid.net ~all

Deploy via GitHub Actions (already added)
- The workflow `.github/workflows/deploy.yml` will:
  1. Build the site with `npm run build` (Vite creates `dist`)
  2. Publish `dist` to GitHub Pages
  3. Deploy the site and Netlify functions via `netlify deploy` (requires Netlify token & site id)

Local testing
- To test functions locally use the Netlify CLI:
Local testing
- To test functions locally use the Netlify CLI (preferred):

  npm install -g netlify-cli
  # from project root
  netlify dev

  # Or use the provided helper (makes sure netlify is installed):
  chmod +x scripts/run-functions-dev.sh
  ./scripts/run-functions-dev.sh

- When running `netlify dev` you can set local environment variables in a `.env` file
  (Netlify CLI reads `.env` by default). Create a `.env` in the project root with the keys from
  `.env.example` (copy `.env.example` -> `.env` and fill values). Example `.env`:

  SENDGRID_API_KEY=
  SEND_FROM=no-reply@noart.gallery
  CONTACT_RECIPIENT=hello@noart.gallery
  SITE_URL=http://localhost:8888
  RECAPTCHA_SECRET=
  SENTRY_DSN=
  RATE_LIMIT_WINDOW_SECONDS=60
  RATE_LIMIT_MAX_REQUESTS=10

- Or run the static site locally:

  npm install
  npm run dev

Verifying the contact form
- Ensure `SENDGRID_API_KEY` is set in Netlify. If empty the function logs the payload instead of sending.
- Submit the contact form on the deployed site. Check Netlify function logs for delivery attempts.

Domain & HTTPS
- GitHub Pages and Netlify both provide HTTPS automatically for custom domains once DNS is configured.
- For GitHub Pages add the `CNAME` file at the repo root with your domain (we can add this file once you provide the domain).

Next steps / optional improvements
- Use Netlify-only hosting if you prefer functions and static assets in one place (connect GitHub repo in Netlify dashboard).
- Add automated tests that hit the function via Playwright in CI (existing e2e tests are present).

Environment variable best-practices
- Store secrets in the provider's secure secret store (Netlify/GitHub Actions/Vercel) — never commit them to git.
- Example `ALLOWED_ORIGINS` value (comma-separated): `https://www.noart.de,https://noart.gallery`
- `REDIS_URL` should point to a production Redis instance (e.g. `redis://:password@hostname:6379/0`) if you enable cross-instance rate-limiting.
- Keep `RECAPTCHA_SECRET`, `SENDGRID_API_KEY` and `SENTRY_DSN` in secrets and not in `.env` that is committed.

Additional GitHub Pages notes
----------------------------
- This repository includes a workflow at `.github/workflows/deploy-pages.yml` which builds the site and publishes the `dist` directory to GitHub Pages using the official `upload-pages-artifact` and `deploy-pages` actions.
- After the first successful run you can verify Pages settings in the repository Settings → Pages. To use a custom domain, add a `CNAME` file at the repo root with your domain (or configure it in the Pages UI) and ensure DNS points to GitHub Pages as explained above.

