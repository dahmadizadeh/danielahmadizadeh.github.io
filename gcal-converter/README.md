# CalCard — better booking-link previews

Turn a plain Google Calendar / Calendly link into a **branded link** that unfurls
into a clean, professional card when you share it in Slack, iMessage, LinkedIn,
or Twitter/X — instead of Google's generic "Easier Time Management" box.

Self-serve for a whole team, **no login and no database**: the branding is
encoded into the link itself.

```
Your booking link:   https://calendar.app.google/xTPk16Kcx87zxwSy7
Shareable link:      https://book.yourcompany.com/l?u=…&t=Book+15+min…&s=Crustdata
```

## Why the raw link looks bad

When you paste `calendar.app.google/…` into Slack, Slack's crawler fetches
**Google's** page and reads **Google's** Open Graph tags — so you get the generic
Google Workspace card and can't change a thing.

CalCard hosts a tiny page on **your** domain that:

1. Serves **your** Open Graph / Twitter Card tags → Slack renders your branded card.
2. Instantly forwards a real person to the actual booking page.

Social crawlers (Slackbot, Twitterbot, LinkedInBot, facebookexternalhit) read the
meta tags but don't run JavaScript, so they see the card; humans have JS and get
redirected. The page returns `200` HTML (never a `302`) so crawlers read *our*
tags instead of following through to Google.

## Layout

```
gcal-converter/
  public/index.html     the link builder UI colleagues use (static)
  functions/l.js        Cloudflare Pages Function serving /l  (the redirect + tags)
  lib/render.js         pure render logic (shared, unit-tested)
  test/render.test.mjs  unit tests
```

## Run the tests

```bash
cd gcal-converter
npm test
```

## Deploy to a working URL (free, ~2 min, no domain required)

You need a free host that can run one serverless function. GitHub Pages alone
can't do this — each link must serve its own preview tags.

**You do NOT need to buy a domain to start.** Both hosts below give you a free,
fully working web address (like `calcard.pages.dev`) the moment you deploy —
that's the link you share with colleagues. A custom domain is an optional
upgrade later.

### Option A — Cloudflare Pages (recommended, matches this repo layout)

1. Push this repo to GitHub (already done on your branch).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   pick this repo.
3. Build settings:
   - **Root directory:** `gcal-converter`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
   - Functions in `functions/` are detected automatically, so `/l` just works.
4. Deploy. You now have a live URL like `https://calcard.pages.dev` — **share this.**
5. *(Optional)* **Custom domains → Set up a domain** to point your own booking
   domain (e.g. `book.yourcompany.com`) at it. Cloudflare handles DNS + HTTPS.

Local preview: `npm run dev`.

### Option B — Vercel

1. **Add New → Project**, import the repo, set **Root Directory** to `gcal-converter`.
2. Move `functions/l.js` to `api/l.js` and change its export to a default handler:
   ```js
   import { renderLinkPage, readParams } from '../lib/render.js';
   export default function handler(req, res) {
     const url = new URL(req.url, `https://${req.headers.host}`);
     const { status, html } = renderLinkPage(readParams(url.searchParams));
     res.status(status).setHeader('content-type', 'text/html; charset=utf-8').send(html);
   }
   ```
3. Add a rewrite so `public/` is served at the root, then attach your domain under
   **Settings → Domains**.

## Verifying an unfurl

- Slack: paste the link into any channel — the card renders in a second or two.
  Slack caches aggressively; if you tweak tags, change the link slightly to bust it.
- Preview without spamming Slack:
  [opengraph.xyz](https://www.opengraph.xyz/) or
  [Twitter Card Validator](https://cards-dev.twitter.com/validator).

## Notes / upgrade paths

- **Pretty short links** (`/r/robert` instead of a long query string) need a small
  key-value store (Cloudflare KV / Vercel KV) to map slug → config. Easy follow-up.
- **Auto-generated preview images** (a rendered card with the rep's name/photo) can
  be added with an `/og` image function. Currently you supply an image URL.
