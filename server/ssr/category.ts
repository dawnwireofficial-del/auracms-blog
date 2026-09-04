import { dbInstance } from '../db';
import { getPublishedProductReviewsLight } from '../seo-engine';
import { esc, val, mdToSimpleHtml, ssrFooter } from './common';
import { SsrResult, truncateText } from './head';

// Server-side renderer for /categories/:slug (category landing pages).
// Mirrors the category->product matching logic in api/routes/public.ts
// (category_id match, then best_for word overlap, then name/department fallbacks).
// Returns null when the category is not found so the caller falls back to the SPA.

export async function renderCategoryPageHtml(slug: string): Promise<SsrResult | null> {
  let cats: any[] = [];
  try {
    cats = await dbInstance.getCategories();
  } catch (e) {
    console.error('[SSR category] categories:', e);
  }
  const cat = (cats || []).find((c: any) => c.slug === slug && c.status === 'active');
  if (!cat) return null;

  const catName = String(cat.name || '');
  if (!catName) return null;

  let reviews: any[] = [];
  try {
    reviews = await getPublishedProductReviewsLight();
  } catch (e) {
    console.error('[SSR category] reviews:', e);
  }

  const products = (reviews || [])
    .filter((r: any) => {
      if (r.status !== 'published') return false;
      if ((r.category_id || r.categoryId) === cat.id) return true;
      const bf = String(val(r, 'bestFor') || r.best_for || '').toLowerCase();
      const cn = String(catName || '').toLowerCase();
      const pn = String(r.product_name || '').toLowerCase();
      if (!bf) {
        const pnWords = pn.split(/\s+/).filter(Boolean);
        const catWords = cn.split(/\s+/).filter(Boolean);
        const specDept = String(r.specs?.details?.department || '').toLowerCase();
        if (pn.includes(cn)) return true;
        if (specDept && catWords.some((w: string) => specDept.includes(w))) return true;
        return false;
      }
      const catWords = cn.split(/\s+/).filter(Boolean);
      const bestWords = bf.split(/\s+/).filter(Boolean);
      return catWords.some((w: string) => bestWords.includes(w));
    })
    .sort((a: any, b: any) => Number(val(b, 'editorScore') || 0) - Number(val(a, 'editorScore') || 0));

  const description = String(cat.description || '');
  const seoContent = String(cat.seoContent || '');

  const itemRows = products
    .slice(0, 12)
    .map((r) => {
      const name = String(val(r, 'productName') || r.product_name || '');
      const brand = val(r, 'brand');
      const price = val(r, 'price');
      const rating = Number(val(r, 'rating') || 0);
      const score = Number(val(r, 'editorScore') || 0);
      return `<li><a href="/products/${esc(r.slug)}">${esc(name)}</a>${brand ? ` (${esc(brand)})` : ''}${price ? ` — ${esc(price)}` : ''}${rating ? ` — ${rating}/5 stars` : ''}${score ? ` — Editor score ${score}/10` : ''}</li>`;
    })
    .join('\n');

  const subcats = (cats || [])
    .filter((c: any) => c.parentId === cat.id && c.status === 'active' && c.slug !== cat.slug)
    .map((c: any) => `<li><a href="/categories/${esc(c.slug)}">${esc(c.name)}</a></li>`)
    .join('\n');

  // === JSON-LD Structured Data ===
  const baseUrl = 'https://www.dawnwire.com';
  const catUrl = `${baseUrl}/categories/${slug}`;
  const jsonLdSchemas: string[] = [];

  // BreadcrumbList
  jsonLdSchemas.push(`<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${baseUrl}/categories` },
      { '@type': 'ListItem', position: 3, name: catName, item: catUrl },
    ],
  })}</script>`);

  // ItemList (top products in category)
  if (products.length > 0) {
    jsonLdSchemas.push(`<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Best ${catName} Products`,
      description: description || `Top-rated ${catName} products reviewed by DawnWire`,
      numberOfItems: Math.min(products.length, 12),
      itemListElement: products.slice(0, 12).map((r: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${baseUrl}/products/${r.slug || r.id}`,
        name: val(r, 'productName') || r.product_name,
      })),
    })}</script>`);
  }

  const head = {
    title: truncateText(`Best ${catName} Products — Reviews & Buying Guide | DawnWire`, 180),
    description: truncateText(description || `DawnWire's expert picks for the best ${catName} products on the market. Compare prices, read in-depth reviews, and find the right product for your needs.`, 300),
    canonical: catUrl,
    ogType: 'website',
  };

  return { head, body: `${jsonLdSchemas.join('\n')}\n<article class="ssr-content" id="category-seo-content">
<h1>${esc(catName)} — Product Reviews &amp; Buying Guide</h1>
${description ? `<p>${esc(description)}</p>` : `<p>DawnWire's expert picks for the best ${esc(catName)} products on the market. Compare prices, read in-depth reviews, and find the right product for your needs.</p>`}
${seoContent ? `<div class="seo-content">${mdToSimpleHtml(seoContent)}</div>` : ''}
${products.length ? `<h2>Top ${esc(catName)} products</h2><p>${products.length} products reviewed and ranked by our editorial team.</p><ul class="ssr-links">${itemRows}</ul>` : ''}
${subcats ? `<h2>Subcategories</h2><ul class="ssr-links">${subcats}</ul>` : ''}
<section><h2>More from DawnWire</h2><ul class="ssr-links">
<li><a href="/categories">All categories</a></li>
<li><a href="/products">All product reviews</a></li>
<li><a href="/best/${esc(cat.slug)}">Best ${esc(catName)} roundup</a></li>
<li><a href="/buyers-guide/${esc(cat.slug)}">${esc(catName)} buying guide</a></li>
<li><a href="/deals">Today's verified Amazon deals</a></li>
</ul></section>
${ssrFooter()}
</article>` };
}
