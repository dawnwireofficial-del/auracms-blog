import { esc } from './common';
import { getPublishedProductReviewsLight } from '../seo-engine';
import type { SsrResult } from './head';

// Lightweight SSR for the two SPA hub pages so crawlers get semantic HTML:
//  - /products  (catalog landing)
//  - /events    (shopping-events directory)

export async function renderProductsHubHtml(): Promise<SsrResult> {
  const baseUrl = 'https://www.dawnwire.com';
  let reviews: any[] = [];
  try { reviews = await getPublishedProductReviewsLight(); } catch {}
  const items = (reviews || [])
    .filter((r: any) => r.slug && r.product_name)
    .sort((a: any, b: any) => Number(b.editor_score || 0) - Number(a.editor_score || 0))
    .slice(0, 36);

  const cards = items.map((r: any) => {
    const name = String(r.product_name);
    const brand = r.brand ? `<p style="font-size:11px;font-weight:700;color:#246BFF;text-transform:uppercase;margin:0">${esc(r.brand)}</p>` : '';
    const score = Number(r.editor_score || 0);
    return `<a href="${baseUrl}/products/${esc(r.slug)}" style="display:block;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:12px;text-decoration:none;color:inherit">
      ${brand}
      <p style="font-size:13px;font-weight:700;margin:4px 0;line-height:1.35">${esc(name)}</p>
      ${score ? `<p style="font-size:12px;color:#246BFF;font-weight:700;margin:0">DawnWire Score: ${score}/10</p>` : ''}
    </a>`;
  }).join('');

  const body = `<article class="ssr-content" id="products-seo-content">
<h1>All Product Reviews &amp; Amazon Deals</h1>
<p>DawnWire independently benchmarks thousands of Amazon products across ${esc(String(new Set(items.map((r: any) => r.brand).filter(Boolean)).size || 30))}+ brands. Browse every editor-scored review below or jump into a category for curated picks.</p>
<section><h2>Top-rated products</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-top:1rem">${cards}</div></section>
<section><h2>Browse by department</h2><ul class="ssr-links">
<li><a href="/categories/electronics">Electronics</a></li>
<li><a href="/categories/beauty-personal-care">Beauty &amp; Personal Care</a></li>
<li><a href="/categories/home-kitchen">Home &amp; Kitchen</a></li>
<li><a href="/categories/school-office-supplies">School &amp; Office Supplies</a></li>
<li><a href="/categories">All categories</a></li>
</ul></section>
${'<footer class="ssr-footer"><p>DawnWire — independent product reviews, buying guides &amp; AI-powered deals.</p></footer>'}
</article>`;

  return {
    head: {
      title: 'All Product Reviews & Amazon Deals — Editor Scores | DawnWire',
      description: 'Browse every DawnWire product review: independent editor scores, verified Amazon ratings, live prices and deal badges across electronics, beauty, home, school and more.',
      canonical: `${baseUrl}/products`,
    },
    body,
  };
}

export async function renderEventsHubHtml(): Promise<SsrResult> {
  const baseUrl = 'https://www.dawnwire.com';
  let events: any[] = [];
  try {
    const { listEvents } = await import('../events-db');
    events = await listEvents(true);
  } catch {}

  const fmt = (d?: string | null) => {
    try { return new Date(d || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
  };

  const cards = events.map((e) => `<a href="${baseUrl}/events/${esc(e.slug)}" style="display:block;background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:16px;text-decoration:none;color:inherit">
    <p style="font-size:26px;margin:0">${esc(e.emoji || '🎉')}</p>
    <p style="font-size:15px;font-weight:800;margin:6px 0 2px">${esc(e.name)}</p>
    ${e.tagline ? `<p style="font-size:12px;color:#334155;margin:0">${esc(e.tagline)}</p>` : ''}
    ${(e.start_date || e.end_date) ? `<p style="font-size:11px;font-weight:700;color:#64748b;margin-top:6px">${[fmt(e.start_date), fmt(e.end_date)].filter(Boolean).join(' – ')}</p>` : ''}
  </a>`).join('');

  const body = `<article class="ssr-content" id="events-seo-content">
<h1>Shopping Events &amp; Seasonal Amazon Deals</h1>
<p>Every major shopping event of the year — Black Friday, Cyber Monday, Christmas, Prime Day, Back-to-School and more — with editor-picked, price-tracked Amazon deals collected in one place.</p>
${events.length ? `<section><h2>Live &amp; upcoming events</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;margin-top:1rem">${cards}</div></section>`
    : '<p>No events are live right now — check back soon.</p>'}
<section><h2>More from DawnWire</h2><ul class="ssr-links">
<li><a href="/deals">Today's verified Amazon deals</a></li>
<li><a href="/products">All product reviews</a></li>
<li><a href="/guides">Buying guides</a></li>
</ul></section>
<footer class="ssr-footer"><p>DawnWire — independent product reviews, buying guides &amp; AI-powered deals. As an Amazon Associate we earn from qualifying purchases.</p></footer>
</article>`;

  return {
    head: {
      title: 'Shopping Events & Seasonal Amazon Deals | DawnWire',
      description: 'Black Friday, Cyber Monday, Christmas, Prime Day & Back-to-School deals — editor-picked, price-tracked Amazon offers updated daily by DawnWire.',
      canonical: `${baseUrl}/events`,
    },
    body,
  };
}
