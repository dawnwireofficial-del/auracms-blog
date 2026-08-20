import { dbInstance } from '../db';
import { getPublishedProductReviews } from '../seo-engine';

// Lightweight server-side renderer for the DawnWire homepage.
// Produces semantic HTML (H1, headings, paragraphs, internal links) that is
// injected into the SPA shell before the client app hydrates over it. This is
// what crawlers without JavaScript see; real users get the interactive app.

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function val(row: any, key: string): any {
  if (row == null) return undefined;
  if (row[key] !== undefined && row[key] !== null) return row[key];
  const snake = key.replace(/[A-Z]/g, (c: string) => '_' + c.toLowerCase());
  return row[snake];
}

async function loadHomeData() {
  let categories: any[] = [];
  let products: any[] = [];
  let posts: any[] = [];
  try {
    categories = (await dbInstance.getCategories()).filter((c: any) => c.status === 'active');
  } catch (e) {
    console.error('[SSR home] categories:', e);
  }
  try {
    const rows = await getPublishedProductReviews();
    products = (rows || [])
      .filter((r: any) => r.product_name)
      .sort((a: any, b: any) => Number(val(b, 'editorScore') || 0) - Number(val(a, 'editorScore') || 0))
      .slice(0, 8);
  } catch (e) {
    console.error('[SSR home] products:', e);
  }
  try {
    const rows = await dbInstance.getPosts();
    posts = (rows || [])
      .filter((p: any) => p.status === 'published' && p.title && p.slug)
      .slice(0, 6);
  } catch (e) {
    console.error('[SSR home] posts:', e);
  }
  return { categories, products, posts };
}

function buildCategoryLinks(categories: any[]): string {
  const top = categories.slice(0, 12);
  if (top.length === 0) return '';
  const items = top
    .map(
      (c) =>
        `<li><a href="/categories/${esc(c.slug)}">${esc(c.name)}</a></li>`
    )
    .join('\n');
  return `<section><h2>Explore product sectors</h2><ul class="ssr-links">${items}<li><a href="/categories">View all categories</a></li></ul></section>`;
}

function buildProductLinks(products: any[]): string {
  if (products.length === 0) return '';
  const items = products
    .slice(0, 6)
    .map((p) => {
      const score = Number(val(p, 'editorScore') || 0);
      const brand = val(p, 'brand');
      return `<li><a href="/product/${esc(p.slug)}">${esc(
        val(p, 'productName') || p.product_name
      )}${score ? ` — Editor score ${score}/10` : ''}${brand ? ` (${esc(brand)})` : ''}</a></li>`;
    })
    .join('\n');
  return `<section><h2>Top-rated product reviews</h2><ul class="ssr-links">${items}<li><a href="/reviews">Browse all reviews</a></li></ul></section>`;
}

function buildGuideLinks(posts: any[]): string {
  if (posts.length === 0) return '';
  const items = posts
    .map((p) => `<li><a href="/post/${esc(p.slug)}">${esc(p.title)}</a></li>`)
    .join('\n');
  return `<section><h2>Latest buying guides</h2><ul class="ssr-links">${items}<li><a href="/guides">View all guides</a></li></ul></section>`;
}

export async function renderHomePageHtml(): Promise<string> {
  const { categories, products, posts } = await loadHomeData();
  const productCount = products.length;
  const categoryCount = categories.length;

  const links = [
    buildCategoryLinks(categories),
    buildProductLinks(products),
    buildGuideLinks(posts),
    `<section><h2>More from DawnWire</h2><ul class="ssr-links">
      <li><a href="/deals">Today's verified Amazon deals</a></li>
      <li><a href="/best">Best-of roundup lists</a></li>
      <li><a href="/brands">Shop by brand</a></li>
      <li><a href="/compare">Head-to-head product comparisons</a></li>
      <li><a href="/buying-guides">Buying guides</a></li>
      <li><a href="/about">About DawnWire</a></li>
    </ul></section>`,
  ]
    .filter(Boolean)
    .join('\n');

  const baseUrl = 'https://www.dawnwire.com';

  // JSON-LD: WebSite + SearchAction
  const webSiteSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DawnWire',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });

  // JSON-LD: Organization with social links
  const orgSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DawnWire',
    url: baseUrl,
    logo: `${baseUrl}/logo/logo-transparent.png`,
    description: 'Independent Amazon product reviews, AI-powered price-drop deals, and expert buying guides.',
    sameAs: [
      'https://www.facebook.com/profile.php?id=61591752300472',
      'https://www.instagram.com/dawnwire/',
      'https://www.pinterest.com/dawnwireofficial/',
    ],
  });

  // JSON-LD: ItemList of top products (for Google rich results)
  let itemListSchema = '';
  if (products.length > 0) {
    itemListSchema = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Top-Rated Product Reviews on DawnWire',
      description: 'Expert-reviewed products ranked by our editorial team',
      numberOfItems: products.length,
      itemListElement: products.map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${baseUrl}/products/${p.slug || p.id}`,
        name: val(p, 'productName') || p.product_name,
      })),
    })}</script>`;
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl }],
  });

  return `<script type="application/ld+json">${webSiteSchema}</script>
<script type="application/ld+json">${orgSchema}</script>
<script type="application/ld+json">${breadcrumbSchema}</script>
${itemListSchema}
<article class="ssr-content" id="home-seo-content">
  <h1>Done-For-You Shopping: Honest Product Scores &amp; Verified Amazon Deals</h1>
  <p>DawnWire researches, price-checks, and scores the best products of 2026 — so you buy the right thing at the right price, in seconds instead of hours. Our AI-powered engine surfaces independent benchmarks, live price drops, and honest editor's verdicts across
  ${productCount > 0 ? `over ${productCount} products across ` : ''}${categoryCount > 0 ? `${categoryCount} categories` : 'popular categories'} including
  beauty, personal care, tech, and home essentials — alongside in-depth buying guides, head-to-head comparisons,
  and best-of roundup lists so you can shop with confidence.</p>
  <p>Every product review includes honest pros and cons, lab-style test notes, an editor's score out of ten, and a
  clear final verdict. We track Amazon prices daily and surface genuine price-drop deals, coupon codes, and stock
  availability — then link you straight to the best current price.</p>
  <p>Our editorial team updates reviews whenever prices, ratings, or packaging change, and our buying guides are
  rewritten each season to match what's actually in stock. Use the links below to jump into a category, read our
  latest reviews, or start with one of our top-rated picks.</p>
${links}
</article>`;
}
