import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderLinkPage, safeUrl, escapeHtml, readParams } from '../lib/render.js';

test('renders our OG tags for a valid booking link', () => {
  const { status, html } = renderLinkPage({
    url: 'https://calendar.app.google/xTPk16Kcx87zxwSy7',
    title: 'Book 15 min with Robert',
    description: 'Grab a time that works.',
    siteName: 'Crustdata',
    image: 'https://example.com/robert.png',
  });
  assert.equal(status, 200);
  assert.match(html, /<meta property="og:title" content="Book 15 min with Robert" \/>/);
  assert.match(html, /<meta property="og:description" content="Grab a time that works." \/>/);
  assert.match(html, /<meta property="og:site_name" content="Crustdata" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/example.com\/robert.png" \/>/);
  assert.match(html, /twitter:card" content="summary_large_image"/);
  // Human redirect present, and pointed at the real destination.
  assert.match(html, /window\.location\.replace/);
  assert.match(html, /calendar\.app\.google\/xTPk16Kcx87zxwSy7/);
});

test('uses summary card and no image tag when image omitted', () => {
  const { html } = renderLinkPage({ url: 'https://calendly.com/acme/intro' });
  assert.match(html, /twitter:card" content="summary"/);
  assert.doesNotMatch(html, /og:image/);
});

test('rejects a missing or non-http destination', () => {
  assert.equal(renderLinkPage({ url: '' }).status, 400);
  assert.equal(renderLinkPage({ url: 'javascript:alert(1)' }).status, 400);
  assert.equal(renderLinkPage({ url: 'ftp://example.com/x' }).status, 400);
});

test('safeUrl only passes http(s)', () => {
  assert.equal(safeUrl('https://a.com/'), 'https://a.com/');
  assert.equal(safeUrl('http://a.com/'), 'http://a.com/');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('data:text/html,x'), null);
  assert.equal(safeUrl('not a url'), null);
});

test('escapes user input so it cannot break out of attributes or inject markup', () => {
  const { html } = renderLinkPage({
    url: 'https://calendar.app.google/ok',
    title: '"><script>alert(1)</script>',
    description: 'a & b < c > d',
    siteName: "O'Brien",
  });
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&quot;&gt;&lt;script&gt;/);
  assert.match(html, /a &amp; b &lt; c &gt; d/);
  assert.match(html, /O&#39;Brien/);
});

test('escapeHtml handles all five characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(escapeHtml(null), '');
});

test('readParams maps short query keys', () => {
  const p = readParams(new URLSearchParams('u=https://x.com&t=Hi&d=Desc&i=https://img&s=Brand'));
  assert.deepEqual(p, {
    url: 'https://x.com', title: 'Hi', description: 'Desc', image: 'https://img', siteName: 'Brand',
  });
});
