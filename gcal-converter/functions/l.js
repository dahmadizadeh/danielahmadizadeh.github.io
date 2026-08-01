// Cloudflare Pages Function for the /l route.
//
// Renders a branded booking link: OUR preview tags for social crawlers,
// instant JS redirect for humans. Stateless — everything comes from the query
// string, so there is no database and no per-user setup.
//
// Example: /l?u=https%3A%2F%2Fcalendar.app.google%2Fxyz&t=Book+15+min&d=...&i=...&s=Acme
import { renderLinkPage, readParams } from '../lib/render.js';

export function onRequestGet(context) {
  const url = new URL(context.request.url);
  const { status, html } = renderLinkPage(readParams(url.searchParams));

  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Let crawlers and CDNs cache the card briefly; links are immutable per URL.
      'cache-control': 'public, max-age=300',
    },
  });
}
