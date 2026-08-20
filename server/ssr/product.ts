import { dbInstance } from '../db';
import { getPublishedProductReviews } from '../seo-engine';
import { esc, val, mdToSimpleHtml, ssrFooter } from './common';

// Server-side renderer for /products/:slug (product review detail pages).
// Mirrors the matching logic in api/routes/public.ts so SSR and the API agree
// on which product a slug resolves to. Returns null when the slug does not
// resolve to a published product (caller then falls back to the SPA shell).

function findProduct(reviews: any[], rawSlug: string): any {
  const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
  const normTarget = decodedSlug.replace(/[^a-z0-9]/g, '');

  let found = (reviews || []).find((r) => r.slug === rawSlug || r.slug === decodedSlug || r.id === rawSlug);
  if (!found) {
    found = (reviews || []).find((r) => {
      if (!r.slug) return false;
      const normSlug = String(r.slug).toLowerCase().replace(/[^a-z0-9]/g, '');
      return normSlug === normTarget || normTarget.startsWith(normSlug) || normSlug.startsWith(normTarget) || normTarget.includes(normSlug) || normSlug.includes(normTarget);
    });
  }
  if (!found) {
    found = (reviews || []).find((r) => {
      const asin = r.specifications?.ASIN || r.specs?.asin || r.asin;
      return asin && decodedSlug.includes(String(asin).toLowerCase());
    });
  }
  return found;
}

export async function renderProductPageHtml(slug: string): Promise<string | null> {
  let reviews: any[] = [];
  try {
    reviews = await getPublishedProductReviews();
  } catch (e) {
    console.error('[SSR product] reviews:', e);
  }
  const p = findProduct(reviews, slug);
  if (!p) return null;

  const name = String(val(p, 'productName') || p.product_name || '');
  if (!name) return null;

  const brand = val(p, 'brand');
  const price = val(p, 'price');
  const originalPrice = val(p, 'originalPrice');
  const rating = Number(val(p, 'rating') || 0);
  const reviewCount = Number(val(p, 'reviewCount') || val(p, 'review_count') || 0);
  const bestFor = val(p, 'bestFor') || p.best_for;
  const score = Number(val(p, 'editorScore') || val(p, 'editor_score') || 0);
  const image = val(p, 'productImage') || p.product_image;
  const reviewSummary = val(p, 'reviewSummary') || p.review_summary;
  const finalVerdict = val(p, 'finalVerdict') || p.final_verdict;
  const categoryId = val(p, 'categoryId') || p.category_id;

  let pros: string[] = [];
  let cons: string[] = [];
  let features: string[] = [];
  try {
    pros = Array.isArray(p.pros) ? p.pros : typeof p.pros === 'string' ? [p.pros] : [];
    cons = Array.isArray(p.cons) ? p.cons : typeof p.cons === 'string' ? [p.cons] : [];
    features = Array.isArray(p.key_features) ? p.key_features : typeof p.key_features === 'string' ? [p.key_features] : [];
  } catch {}

  // Category breadcrumb + related links
  let categorySlug = '';
  let categoryName = '';
  let related: any[] = [];
  try {
    const cats = await dbInstance.getCategories();
    const cat = (cats || []).find((c: any) => c.id === categoryId || c.slug === categoryId);
    if (cat) {
      categorySlug = cat.slug;
      categoryName = cat.name;
    }
    const catId = cat?.id || categoryId;
    related = (reviews || [])
      .filter((r) => r.id !== p.id && r.status === 'published' && (r.category_id === catId || r.best_for === bestFor) && r.product_name)
      .sort((a: any, b: any) => Number(val(b, 'editorScore') || 0) - Number(val(a, 'editorScore') || 0))
      .slice(0, 4);
  } catch (e) {
    console.error('[SSR product] categories:', e);
  }

  const meta = [
    brand ? `<span>Brand: ${esc(brand)}</span>` : '',
    price ? `<span>Price: ${esc(price)}</span>` : '',
    rating ? `<span>Rating: ${rating}/5 (${reviewCount || 'N/A'} reviews)</span>` : '',
    score ? `<span>Editor score: ${score}/10</span>` : '',
    bestFor ? `<span>Best for: ${esc(bestFor)}</span>` : '',
  ].filter(Boolean).join(' · ');

  // === JSON-LD Structured Data for Google Rich Results ===
  const baseUrl = 'https://www.dawnwire.com';
  const productUrl = `${baseUrl}/products/${p.slug || p.id}`;
  const imgSrc = image && image.startsWith('http') ? image : image ? `${baseUrl}${image}` : '';

  const jsonLdSchemas: string[] = [];

  // Product schema (enables rich product results in Google)
  const productSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    url: productUrl,
    description: reviewSummary || finalVerdict || `${name} review by DawnWire`,
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    ...(imgSrc ? { image: imgSrc } : {}),
    ...(price ? { offers: { '@type': 'Offer', priceCurrency: 'USD', price: parseFloat(String(price).replace(/[^0-9.]/g, '')) || undefined, availability: 'https://schema.org/InStock', url: productUrl, seller: { '@type': 'Organization', name: 'DawnWire' } } } : {}),
    ...(rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, bestRating: 5, reviewCount: reviewCount || 1 } } : {}),
    ...(reviewCount ? { review: { '@type': 'Review', author: { '@type': 'Organization', name: 'DawnWire Editorial Team' }, reviewRating: { '@type': 'Rating', ratingValue: rating || 0, bestRating: 5 }, reviewBody: reviewSummary || finalVerdict || '' } } : {}),
  };
  jsonLdSchemas.push(`<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`);

  // BreadcrumbList schema
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Products', url: `${baseUrl}/products` },
  ];
  if (categorySlug && categoryName) {
    breadcrumbItems.push({ name: categoryName, url: `${baseUrl}/categories/${categorySlug}` });
  }
  breadcrumbItems.push({ name: name, url: productUrl });
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((bc, i) => ({ '@type': 'ListItem', position: i + 1, name: bc.name, item: bc.url })),
  };
  jsonLdSchemas.push(`<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`);

  const parts: string[] = [];

  parts.push(`<div class="meta">${meta}</div>`);

  if (categorySlug && categoryName) {
    parts.push(`<p><a href="/categories/${esc(categorySlug)}">Browse more in ${esc(categoryName)}</a></p>`);
  }

  if (image) {
    parts.push(`<p class="ssr-img"><img src="${esc(image)}" alt="${esc(name)}" width="800" height="450" loading="eager" decoding="async"></p>`);
  }

  if (reviewSummary) {
    parts.push(`<h2>Quick Summary</h2><p>${esc(reviewSummary)}</p>`);
  }

  if (finalVerdict) {
    parts.push(`<h2>Final Verdict</h2><p>${esc(finalVerdict)}</p>`);
  }

  if (pros.length || cons.length) {
    parts.push('<h2>Pros &amp; Cons</h2>');
    if (pros.length) {
      parts.push(`<h3>Pros</h3><ul>${pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
    }
    if (cons.length) {
      parts.push(`<h3>Cons</h3><ul>${cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
    }
  }

  if (features.length) {
    parts.push(`<h2>Key Features</h2><ul>${features.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
  }

  if (related.length) {
    const items = related
      .map((r) => `<li><a href="/product/${esc(r.slug)}">${esc(val(r, 'productName') || r.product_name)}${Number(val(r, 'editorScore') || 0) ? ` — Editor score ${Number(val(r, 'editorScore'))}/10` : ''}</a></li>`)
      .join('\n');
    parts.push(`<h2>You may also like</h2><ul class="ssr-links">${items}</ul>`);
  }

  const discount = originalPrice && price
    ? `<li><a href="/products?cat=${categorySlug ? esc(categorySlug) : ''}">Compare prices across ${esc(name)}</a></li>`
    : '';

  return `${jsonLdSchemas.join('\n')}\n<article class="ssr-content" id="product-seo-content">
<h1>${esc(name)} Review</h1>
${parts.join('\n')}
<section><h2>More from DawnWire</h2><ul class="ssr-links">
<li><a href="/products">All product reviews</a></li>
<li><a href="/categories">Browse categories</a></li>
<li><a href="/deals">Today's verified Amazon deals</a></li>
<li><a href="/best">Best-of roundup lists</a></li>
${discount}
</ul></section>
${ssrFooter()}
</article>`;
}
