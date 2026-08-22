import { dbInstance } from '../db';
import { createClient } from '@supabase/supabase-js';
import { readStaticCatalog } from '../api-cache';
import { SsrResult } from './head';

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

// In-memory cache — persists across warm invocations on Vercel
let _cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 minutes

async function loadHomeData() {
  // Return cached data if fresh
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  let categories: any[] = [];
  let products: any[] = [];
  let posts: any[] = [];

  // Categories: try DB first, fallback to static
  try {
    categories = (await dbInstance.getCategories()).filter((c: any) => c.status === 'active');
  } catch (e) {
    console.error('[SSR home] categories:', e);
  }
  if (categories.length === 0) {
    const staticCats = readStaticCatalog('categories.json');
    if (staticCats) { categories = staticCats; console.log('[SSR] Using static categories'); }
  }

  // Products & Posts: try Supabase with 8s timeout, fallback to static
  try {
    const sb = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
    );
    const queryPromise = Promise.all([
      sb.from('product_reviews')
        .select('id, slug, product_name, brand, product_image, price, editor_score, rating, review_count, best_for')
        .eq('status', 'published')
        .order('editor_score', { ascending: false })
        .limit(20),
      sb.from('posts')
        .select('id, slug, title, excerpt, featured_image, category_id, reading_time')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase query timeout (8s)')), 8000)
    );
    const [prodRes, postRes] = await Promise.race([queryPromise, timeoutPromise]) as any;
    products = (prodRes.data || []).filter((r: any) => r.product_name);
    posts = (postRes.data || []).filter((p: any) => p.title && p.slug);
  } catch (e) {
    console.error('[SSR home] queries failed, using static fallback:', (e as Error).message);
  }
  
  // Fallback: use static homepage.json if Supabase failed
  if (products.length === 0 || posts.length === 0) {
    const staticHome = readStaticCatalog('homepage.json');
    if (staticHome) {
      if (products.length === 0 && staticHome.products) products = staticHome.products;
      if (posts.length === 0 && staticHome.posts) posts = staticHome.posts;
      if (categories.length === 0 && staticHome.categories) categories = staticHome.categories;
      console.log(`[SSR] Using static homepage data (${products.length} products, ${posts.length} posts)`);
    }
  }

  const result = { categories, products, posts };
  _cache = { data: result, ts: Date.now() };
  return result;
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

export async function renderHomePageHtml(): Promise<SsrResult> {
  const { categories, products, posts } = await loadHomeData();
  const productCount = products.length;
  const categoryCount = categories.length;

  // Build product cards with images for SSR (Google sees these)
  const productCards = products.length > 0 ? `<section><h2>Top-rated product reviews</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-top:1rem">${products.slice(0, 6).map((p: any) => {
    const name = val(p, 'productName') || p.product_name || '';
    const brand = val(p, 'brand') || '';
    const image = val(p, 'productImage') || p.product_image || '';
    const price = val(p, 'price');
    const score = Number(val(p, 'editorScore') || 0);
    const rating = Number(val(p, 'rating') || 0);
    const slug = p.slug || p.id;
    return `<a href="/products/${esc(slug)}" style="display:block;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;text-decoration:none;color:inherit">
      <div style="padding:16px;display:flex;align-items:center;justify-content:center;height:200px;background:#f8fafc">
        ${image ? `<img src="${esc(image)}" alt="${esc(name)}" width="180" height="180" loading="lazy" style="max-height:100%;max-width:100%;object-fit:contain" />` : `<span style="font-size:48px">📦</span>`}
      </div>
      <div style="padding:12px 16px">
        <p style="font-size:11px;font-weight:700;color:#246BFF;text-transform:uppercase;margin:0">${esc(brand)}</p>
        <p style="font-size:13px;font-weight:700;margin:4px 0 8px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(name)}</p>
        ${score ? `<p style="font-size:12px;color:#246BFF;font-weight:700;margin:0">DawnWire Score: ${score}/10</p>` : ''}
        ${rating ? `<p style="font-size:12px;color:#f59e0b;margin:4px 0 0">${'★'.repeat(Math.round(rating))} ${rating}/5</p>` : ''}
      </div>
    </a>`;
  }).join('')}</div><p style="margin-top:1rem"><a href="/reviews">Browse all reviews →</a></p></section>` : '';

  // Build category cards with images
  const categoryCards = categories.length > 0 ? `<section><h2>Shop by Category</h2><div style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem">${categories.slice(0, 12).map((c: any) => {
    const img = c.image || c.desktopBanner || '';
    return `<a href="/categories/${esc(c.slug)}" style="display:flex;flex-direction:column;align-items:center;width:100px;text-decoration:none;color:inherit">
      <div style="width:80px;height:80px;border-radius:50%;background:#fff;border:3px solid #e2e8f0;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
        ${img ? `<img src="${esc(img)}" alt="${esc(c.name)}" width="72" height="72" loading="lazy" style="width:100%;height:100%;object-fit:cover" />` : `<span style="font-size:28px">🏷️</span>`}
      </div>
      <p style="font-size:12px;font-weight:700;margin-top:8px;text-align:center">${esc(c.name)}</p>
    </a>`;
  }).join('')}</div></section>` : '';

  const links = [
    categoryCards,
    productCards,
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
  const head = {
    title: 'DawnWire.com — AI-Powered Amazon Product Reviews, Price-Drop Alerts & Buying Guides',
    description: 'DawnWire (dawnwire.com) is an AI-powered Amazon product review platform — independently scoring 800+ products across 30+ categories. Expert buying guides, live price-drop alerts, and honest editor scores. Not a retailer — we help you find the best deal on Amazon.',
    canonical: `${baseUrl}/`,
    ogType: 'website',
  };

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

  // JSON-LD: Organization with social links (distinct from 'Dawn Wire Service' — a 1990s Pakistani newspaper digest)
  const orgSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DawnWire',
    alternateName: ['DawnWire.com', 'DawnWire Product Reviews', 'DawnWire AI Shopping'],
    url: baseUrl,
    logo: `${baseUrl}/logo/logo-transparent.png`,
    description: 'DawnWire (dawnwire.com) is an American AI-powered product review and comparison platform — NOT the historical Dawn Wire Service (a 1990s Pakistani newspaper digest). DawnWire independently researches, prices-checks, and scores Amazon products across 30+ categories to help US consumers buy the right thing at the right price.',
    foundingDate: '2024',
    foundingLocation: { '@type': 'Place', name: 'United States' },
    industry: 'Product Reviews, Consumer Technology, Affiliate Marketing',
    category: 'Product Review Platform',
    knowsAbout: ['Amazon Product Reviews', 'AI-Powered Shopping', 'Price Comparison', 'Buying Guides', 'Consumer Electronics Reviews', 'Beauty Product Reviews', 'Home and Kitchen Reviews'],
    areaServed: { '@type': 'Country', name: 'United States' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: 'tech@dawnwire.com' },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61591752300472',
      'https://www.instagram.com/dawnwire/',
      'https://www.pinterest.com/dawnwireofficial/',
      'https://x.com/dawn_wire_',
    ],
  });

  // JSON-LD: FAQPage for brand disambiguation (helps Google understand what DawnWire IS)
  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is DawnWire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DawnWire (dawnwire.com) is an AI-powered product review and comparison platform that independently researches, price-checks, and scores Amazon products across 30+ categories. DawnWire is not a retailer and does not sell products directly — we link you to the best deals on Amazon.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is DawnWire the same as Dawn Wire Service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. DawnWire (dawnwire.com) is a modern AI-powered product review platform launched in 2024. Dawn Wire Service (DWS) was a historical weekly news digest from the Dawn Group of Newspapers in Pakistan during the 1990s. These are completely unrelated entities.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does DawnWire make money?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DawnWire earns a small commission when you purchase products through our affiliate links marked "Check Price on Amazon." This is at no extra cost to you. Our editorial reviews and scores are independently produced and are not influenced by affiliate commissions.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many products has DawnWire reviewed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `DawnWire has independently reviewed and scored over ${productCount || '800'} products across ${categoryCount || '30'}+ categories including electronics, beauty, home & kitchen, fashion, and more.`,
        },
      },
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

  return { head, body: `<script type="application/ld+json">${webSiteSchema}</script>
<script type="application/ld+json">${orgSchema}</script>
<script type="application/ld+json">${faqSchema}</script>
<script type="application/ld+json">${breadcrumbSchema}</script>
${itemListSchema}
<article class="ssr-content" id="home-seo-content">
  <h1>DawnWire: AI-Powered Amazon Product Reviews, Price-Drop Deals &amp; Buying Guides</h1>
  <p><strong>DawnWire</strong> (dawnwire.com) is an independent, AI-powered product review and comparison platform — not a retailer. We research, price-check, and score the best products available on Amazon so you can buy the right thing at the right price, in seconds instead of hours. Our editorial engine surfaces independent benchmarks, live price drops, and honest editor's verdicts across
  ${productCount > 0 ? `over ${productCount} products in ` : ''}${categoryCount > 0 ? `${categoryCount} categories` : 'popular categories'} including
  beauty, personal care, tech, home, and kitchen essentials — alongside in-depth buying guides, head-to-head comparisons,
  and best-of roundup lists so you can shop with confidence.</p>
  <p>Every DawnWire product review includes honest pros and cons, lab-style test notes, an editor's score out of ten, and a
  clear final verdict. We track Amazon prices daily and surface genuine price-drop deals, coupon codes, and stock
  updates — then link you straight to the best current price on Amazon.</p>
  <p>Our editorial team updates reviews whenever prices, ratings, or packaging change, and our buying guides are
  rewritten each season to match what's actually in stock. Use the links below to jump into a category, read our
  latest reviews, or start with one of our top-rated picks.</p>
${links}
</article>` };
}
