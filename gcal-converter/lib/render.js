// Pure, dependency-free rendering for a branded booking link.
//
// A shared "link page" does two jobs at once:
//   1. Serves OUR Open Graph / Twitter Card tags so Slack, iMessage, LinkedIn,
//      Twitter/X etc. render a clean, branded preview card.
//   2. Redirects a real human who clicks the link straight to the real
//      booking URL (Google Calendar, Calendly, whatever).
//
// The trick: social crawlers (Slackbot, Twitterbot, facebookexternalhit,
// LinkedInBot) read the meta tags but do NOT execute JavaScript, so they see
// the card. Humans have JS and get redirected instantly. We deliberately serve
// a 200 with HTML (never a 302) so crawlers read OUR tags instead of following
// through to Google's generic page.

const DEFAULTS = {
  title: 'Book a time',
  description: 'Grab a slot that works for you.',
  siteName: 'Book a call',
};

// Escape a string for safe interpolation into HTML text or a double-quoted
// attribute. Covers &, <, >, ", '.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only allow http(s) destinations. This blocks javascript:, data:, etc. from
// being smuggled into the client-side redirect (XSS) and keeps the redirector
// from pointing anywhere dangerous.
export function safeUrl(raw) {
  if (!raw) return null;
  try {
    const parsed = new URL(String(raw).trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    /* not a valid absolute URL */
  }
  return null;
}

// Embed a value inside a <script> as a JS string literal without letting it
// break out of the string or close the script tag.
function jsString(value) {
  return JSON.stringify(String(value ?? ''))
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

// Build the query-string params object from a URLSearchParams-like reader.
export function readParams(searchParams) {
  const get = (k) => searchParams.get(k) || '';
  return {
    url: get('u'),
    title: get('t'),
    description: get('d'),
    image: get('i'),
    siteName: get('s'),
  };
}

// Render the full link page. Returns { status, html }.
export function renderLinkPage(params) {
  const destination = safeUrl(params.url);

  if (!destination) {
    const body = renderErrorPage();
    return { status: 400, html: body };
  }

  const title = (params.title || DEFAULTS.title).slice(0, 200);
  const description = (params.description || DEFAULTS.description).slice(0, 400);
  const siteName = (params.siteName || DEFAULTS.siteName).slice(0, 120);
  const image = safeUrl(params.image);

  const eTitle = escapeHtml(title);
  const eDesc = escapeHtml(description);
  const eSite = escapeHtml(siteName);
  const eDest = escapeHtml(destination);
  const twitterCard = image ? 'summary_large_image' : 'summary';

  const imageTags = image
    ? `
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${eTitle}</title>
  <meta name="description" content="${eDesc}" />

  <!-- Open Graph (Slack, iMessage, LinkedIn, Facebook) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${eSite}" />
  <meta property="og:title" content="${eTitle}" />
  <meta property="og:description" content="${eDesc}" />${imageTags}

  <!-- Twitter / X -->
  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${eTitle}" />
  <meta name="twitter:description" content="${eDesc}" />

  <!-- Fallback redirect for crawlers that don't run JS but do follow refresh.
       Slack does NOT follow this for the card, so our tags win. -->
  <meta http-equiv="refresh" content="0; url=${eDest}" />

  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #0b0d12; color: #e8ebf0; text-align: center; padding: 24px;
    }
    .card { max-width: 420px; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 8px; }
    p { color: #9aa3b2; margin: 0 0 20px; line-height: 1.5; }
    a.btn {
      display: inline-block; padding: 12px 22px; border-radius: 10px;
      background: #4f7cff; color: #fff; text-decoration: none; font-weight: 600;
    }
    .spinner {
      width: 28px; height: 28px; margin: 0 auto 20px; border-radius: 50%;
      border: 3px solid #2a2f3a; border-top-color: #4f7cff;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <main class="card">
    <div class="spinner" aria-hidden="true"></div>
    <h1>${eTitle}</h1>
    <p>Taking you to the booking page&hellip;</p>
    <a class="btn" id="go" href="${eDest}" rel="noopener">Continue to booking</a>
  </main>
  <script>
    // Send real humans straight through. Crawlers never run this.
    var dest = ${jsString(destination)};
    try { window.location.replace(dest); } catch (e) { window.location.href = dest; }
  </script>
</body>
</html>`;

  return { status: 200, html };
}

function renderErrorPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invalid link</title>
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center;
      font-family: system-ui, sans-serif; background:#0b0d12; color:#e8ebf0;
      text-align:center; padding:24px; }
    p { color:#9aa3b2; }
    a { color:#4f7cff; }
  </style>
</head>
<body>
  <main>
    <h1>This link is missing its destination</h1>
    <p>Generate a fresh one on the <a href="/">link builder</a>.</p>
  </main>
</body>
</html>`;
}
