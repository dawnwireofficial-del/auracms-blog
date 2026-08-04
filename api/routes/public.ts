import express from 'express';
import { Readable } from 'stream';
import { dbInstance } from '../../server/db';
import * as seo from '../../server/seo-engine';
import { findEntities } from '../../server/entities';
import { sendContactNotification, sendCommentNotification } from '../../server/email';
import { sendDripEmail, getNextDripStep } from '../../server/drip-campaign';

const router = express.Router();

router.get('/settings', async (_req, res) => res.json(await dbInstance.getSettings()));
router.get('/posts', async (req, res) => {
  let posts = (await dbInstance.getPosts()).filter(p => p.status === 'published' && p.visibility === 'public');
  const limit = parseInt(req.query.limit as string) || 0;
  const offset = parseInt(req.query.offset as string) || 0;
  const total = posts.length;
  if (limit > 0) posts.splice(0, posts.length, ...posts.slice(offset, offset + limit));
  res.json({ data: posts, total, limit, offset });
});
router.get('/posts/slug/:slug', async (req, res) => {
  const post = await dbInstance.getPostBySlug(req.params.slug);
  if (!post || post.status !== 'published' || post.visibility !== 'public') return res.status(404).json({ error: 'Article not found' });
  res.json(post);
});
router.get('/categories', async (_req, res) => res.json((await dbInstance.getCategories()).filter(c => c.status === 'active')));
router.get('/tags', async (_req, res) => res.json(await dbInstance.getTags()));
router.get('/pages', async (_req, res) => res.json((await dbInstance.getPages()).filter(p => p.status === 'published')));
router.get('/pages/:slug', async (req, res) => {
  const page = await dbInstance.getPageBySlug(req.params.slug);
  if (!page || page.status !== 'published') return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});
router.get('/affiliate', async (_req, res) => res.json((await dbInstance.getAffiliateLinks()).filter(l => l.status === 'active')));

router.get('/comments/post/:postId', async (req, res) => res.json((await dbInstance.getComments()).filter(c => c.postId === req.params.postId && c.status === 'approved')));

router.post('/comments', async (req, res) => {
  const settings = await dbInstance.getSettings();
  if (!settings?.enableComments) return res.status(400).json({ error: 'Comments are disabled' });
  const { postId, parentId, name, email, content, userId } = req.body;
  if (!content || !postId) return res.status(400).json({ error: 'Post ID and content are required' });
  if (!userId && !settings?.allowGuestComments) return res.status(400).json({ error: 'Guest comments not permitted' });
  if (!userId && (!name || !email)) return res.status(400).json({ error: 'Name and email required' });
  const spamWords = ['viagra', 'cialis', 'make money fast', 'earn $', 'casino', 'lottery'];
  const isSpam = spamWords.some(w => content.toLowerCase().includes(w));
  let fn = name, fe = email;
  if (userId) { const u = await dbInstance.getUserById(userId); fn = u?.name || 'Member'; fe = u?.email || 'member@dawnwire.com'; }
  const nc = await dbInstance.createComment({ postId, parentId: parentId || undefined, name: fn, email: fe, userId: userId || undefined, content });
  if (isSpam) await dbInstance.updateCommentStatus(nc.id, 'spam');
  else if (settings?.requireCommentApproval) await dbInstance.updateCommentStatus(nc.id, 'pending');
  if (nc.status === 'approved' || !settings?.requireCommentApproval) {
    const cp = await dbInstance.getPostById(postId);
    if (cp) { const a = await dbInstance.getUserById(cp.authorId); if (a) sendCommentNotification(cp.title, nc.name, nc.content.substring(0, 200), a.email, `${process.env.APP_URL || ''}/#/post/${cp.slug}`); }
  }
  res.json(nc);
});

router.post('/comments/:id/like', async (req, res) => { const s = await dbInstance.likeComment(req.params.id, req.ip || 'anonymous'); if (!s) return res.status(404).json({ error: 'Not found' }); res.json({ success: true }); });

router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields required' });
  const m = await dbInstance.submitMessage({ name, email, subject, message });
  sendContactNotification(name, email, subject, message);
  res.json({ success: true, message: m });
});

router.post('/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  const sub = await dbInstance.addNewsletterSubscriber(email);
  if (!sub) return res.status(400).json({ error: 'Already subscribed' });
  try {
    await dbInstance.updateSubscriberDripProgress(sub.id, 0, new Date().toISOString());
    const sent = await sendDripEmail(sub, 1);
    if (sent) {
      await dbInstance.updateSubscriberDripProgress(sub.id, 1, new Date().toISOString());
    }
  } catch (e) {
    console.error('[Drip] Failed to send welcome drip:', e);
  }
  res.json({ success: true, subscriber: sub });
});

router.get('/seo-meta', async (req, res) => {
  const { pageType, pageId } = req.query;
  if (!pageType || !pageId) return res.status(400).json({ error: 'pageType and pageId required' });
  const meta = await seo.getSeoMeta(pageType as string, pageId as string);
  res.json(meta);
});

router.get('/faqs', async (_req, res) => {
  const faqs = await seo.getFaqs();
  res.json(faqs.filter((f: any) => f.status === 'published'));
});

router.get('/price-history/:id', async (req, res) => {
  try {
    const history = await dbInstance.getAmazonPriceHistory(req.params.id, 50);
    res.json(history.map((h: any) => ({
      price: parseFloat(h.price) || 0,
      date: h.created_at || h.recorded_at || new Date().toISOString(),
      source: h.source || 'amazon-sync'
    })));
  } catch (e: any) {
    res.json([]);
  }
});

// Product reviews with entity enrichment for slug lookup
router.get('/product-reviews/slug/:slug', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const reviews = await seo.getPublishedProductReviews();
  const rawSlug = req.params.slug;
  const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
  const normTarget = decodedSlug.replace(/[^a-z0-9]/g, '');

  // 1. Try exact match first
  let found = (reviews as any[]).find(r => r.slug === rawSlug || r.slug === decodedSlug || r.id === rawSlug);

  // 2. Try normalized alphanumeric match (strips punctuation differences like dots vs hyphens)
  if (!found) {
    found = (reviews as any[]).find(r => {
      if (!r.slug) return false;
      const normSlug = r.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normSlug === normTarget || normTarget.startsWith(normSlug) || normSlug.startsWith(normTarget) || normTarget.includes(normSlug) || normSlug.includes(normTarget);
    });
  }

  // 3. Try ASIN match
  if (!found) {
    found = (reviews as any[]).find(r => {
      const asin = r.specifications?.ASIN || r.asin;
      return asin && decodedSlug.includes(asin.toLowerCase());
    });
  }

  if (!found) return res.status(404).json({ error: 'Product review not found' });
  const pros = Array.isArray(found.pros) ? found.pros : typeof found.pros === 'string' ? [found.pros] : [];
  const cons = Array.isArray(found.cons) ? found.cons : typeof found.cons === 'string' ? [found.cons] : [];
  const entityText = [found.product_name, found.brand, found.review_summary, found.final_verdict, ...pros, ...cons].filter(Boolean).join(' ');
  const entities = findEntities(entityText);
  res.json({ ...found, _entities: entities.map((e: any) => ({ name: e.name, sameAs: e.sameAs, type: e.type })) });
});

router.get('/portfolio', async (_req, res) => res.json(await seo.getPublishedPortfolioProjects()));

router.get('/testimonials', async (_req, res) => { try { res.json(await seo.getPublishedTestimonials()); } catch (e: any) { res.status(500).json({ error: e.message }); } });

router.get('/services', async (_req, res) => res.json(await seo.getPublishedServices()));
router.get('/services/:slug', async (req, res) => {
  const svc = await seo.getServiceBySlug(req.params.slug);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  res.json(svc);
});

router.post('/track/upgrade-download/:id', async (req, res) => {
  const success = await seo.trackUpgradeDownload(req.params.id);
  res.json({ success });
});

router.post('/track/helpful', async (req, res) => {
  try {
    const { postId, title } = req.body;
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

router.post('/track/affiliate', async (req, res) => {
  try {
    const { slug } = req.body;
    if (slug) await dbInstance.trackAffiliateClick(slug);
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

router.post('/track/page-view', async (req, res) => {
  try {
    const { path, referrer, userAgent, sessionId } = req.body;
    const { trackPageView } = await import('../../server/analytics');
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    await trackPageView(path, referrer, userAgent, sessionId, ip);
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// Server-side proxy for HLS video streams (avoids CORS issues with Amazon CDN)
router.get('/video-proxy', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Failed to fetch video' });
    const contentType = response.headers.get('content-type') || '';
    const isManifest = url.endsWith('.m3u8') || contentType.includes('mpegurl');
    if (isManifest) {
      let body = await response.text();
      // Rewrite relative segment URLs to go through our proxy
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      body = body.replace(/^([^#\s].+)$/gm, (match) => {
        if (match.startsWith('http')) return match;
        return `/api/public/video-proxy?url=${encodeURIComponent(baseUrl + match)}`;
      });
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(body);
    } else {
      // Segment or other binary content - proxy through
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set('Content-Type', contentType || 'video/MP2T');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Server-side image proxy for Amazon CDN (avoids hotlinking blocks)
const ALLOWED_IMAGE_DOMAINS = ['m.media-amazon.com', 'images-na.ssl-images-amazon.com', 'images.unsplash.com'];

const IMAGE_PLACEHOLDER_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#e2e8f0"/><rect x="240" y="180" width="320" height="240" rx="24" fill="#cbd5e1"/><circle cx="352" cy="268" r="36" fill="#94a3b8"/><path d="M252 552 L380 424 L486 530 L560 456 L672 568" stroke="#94a3b8" stroke-width="26" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="400" cy="616" r="14" fill="#94a3b8"/><text x="400" y="692" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#94a3b8" text-anchor="middle">Image unavailable</text></svg>',
  'utf8',
);

router.get('/image-proxy', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const parsed = new URL(url);
    if (!ALLOWED_IMAGE_DOMAINS.includes(parsed.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    let response = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        clearTimeout(timeout);
        if (response.ok) break;
      } catch (e) {
        clearTimeout(timeout);
        if (attempt === 1) {
          // Serve a placeholder instead of erroring so pages never show 502s
          res.set('Content-Type', 'image/svg+xml');
          res.set('Cache-Control', 'public, max-age=86400');
          res.set('Access-Control-Allow-Origin', '*');
          return res.status(200).send(IMAGE_PLACEHOLDER_SVG);
        }
      }
    }
    if (!response || !response.ok) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).send(IMAGE_PLACEHOLDER_SVG);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.set('Access-Control-Allow-Origin', '*');
    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    }
  } catch (e: any) {
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send(IMAGE_PLACEHOLDER_SVG);
  }
});

router.get('/topic-clusters', async (_req, res) => {
  const clusters = await dbInstance.getTopicClusters();
  res.json(clusters.filter((c: any) => c.status === 'active'));
});
router.get('/topic-cluster/:slug', async (req, res) => {
  const clusters = await dbInstance.getTopicClusters();
  const cluster = clusters.find((c: any) => c.slug === req.params.slug);
  if (!cluster) return res.status(404).json({ error: 'Cluster not found' });
  const posts = await dbInstance.getPosts();
  const clusterPosts = posts.filter((p: any) => cluster.clusterPostIds.includes(p.id));
  res.json({ ...cluster, clusterPosts });
});

// ====== Affiliate Platform Public Routes ======

// Brands
router.get('/brands', async (req, res) => {
  const brands = await dbInstance.getBrands();
  const active = brands.filter((b: any) => b.status === 'active');
  const limit = parseInt(req.query.limit as string);
  const offset = parseInt(req.query.offset as string) || 0;
  // Paginated mode: { data, total, limit, offset } — used by /brands page.
  if (limit > 0) {
    const sorted = active.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    const page = sorted.slice(offset, offset + limit);
    return res.json({ data: page, total: active.length, limit, offset });
  }
  // Legacy mode: plain array (homepage/category consumers).
  res.json(active);
});

// Category with banners, sections, subcategories, featured products
router.get('/categories/:slug', async (req, res) => {
  const cats = await dbInstance.getCategories();
  const cat = cats.find((c: any) => c.slug === req.params.slug && c.status === 'active');
  if (!cat) return res.status(404).json({ error: 'Category not found' });
    const [banners, sections, subcategories, reviews] = await Promise.all([
    dbInstance.getCategoryBanners(cat.id),
    dbInstance.getCategorySections(cat.id),
    dbInstance.getCategories(),
    seo.getProductReviews(),
  ]);
  res.json({
    ...cat,
    banners: banners.filter((b: any) => b.isActive && !b.isArchived),
    sections: sections.filter((s: any) => s.isActive),
    subcategories: subcategories.filter((s: any) => s.parentId === cat.id && s.status === 'active'),
    products: reviews.filter((r: any) => {
      if (r.status !== 'published') return false;
      if ((r.category_id || r.categoryId) === cat.id) return true;
      const bf = (r.best_for || r.bestFor || '').toLowerCase();
      const cn = (cat.name || '').toLowerCase();
      const pn = (r.product_name || '').toLowerCase();
      if (!bf) {
        // Fall back: product name must include the full category name or match by spec department/subcategory
        const pnWords = pn.split(/\s+/).filter(Boolean);
        const catWords = cn.split(/\s+/).filter(Boolean);
        const specDept = ((r.specs?.details?.department) || '').toLowerCase();
        // Match if: product name contains entire category name, OR specs department matches, OR 2+ category words appear in product name
        if (pn.includes(cn)) return true;
        if (specDept && catWords.some((w: string) => specDept.includes(w))) return true;
        return false;
      }
      const catWords = cn.split(/\s+/).filter(Boolean);
      const bestWords = bf.split(/\s+/).filter(Boolean);
      return catWords.some((w: string) => bestWords.includes(w));
    }),
  });
});

// Subcategories for a category
router.get('/categories/:slug/subcategories', async (req, res) => {
  const cats = await dbInstance.getCategories();
  const cat = cats.find((c: any) => c.slug === req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Not found' });
  res.json(cats.filter((c: any) => c.parentId === cat.id && c.status === 'active'));
});

// Product reviews & products with filters, sorting, pagination, entity enrichment
router.get(['/product-reviews', '/products'], async (req, res) => {
  let items = await seo.getProductReviews();
  items = items.filter((r: any) => r.status === 'published');
  // Lightweight projection for catalog/list contexts: strips heavy blobs
  // (review summaries, articles, specs, faqs) to cut payload size dramatically.
  // The product detail page uses GET /product-reviews/slug/:slug for the full row.
  const light = req.query.light === '1' || req.query.light === 'true';
  if (light) {
    // Heavy blobs dropped entirely; review_summary truncated for card snippets.
    const LIGHT = ['review_article', 'final_verdict', 'pros', 'cons', 'faq', 'seo_description', 'seo_keywords', 'seo_title', 'specs', 'affiliate_disclosure', '_entities'];
    items = items.map((r: any) => {
      const slim: Record<string, any> = {};
      Object.keys(r).forEach((k) => {
        if (LIGHT.includes(k)) return;
        slim[k] = r[k];
      });
      if (typeof slim.review_summary === 'string' && slim.review_summary.length > 280) {
        slim.review_summary = slim.review_summary.slice(0, 280) + '…';
      }
      if (Array.isArray(slim.key_features)) slim.key_features = slim.key_features.slice(0, 6);
      return slim;
    });
  }
  // Entity enrichment
  items = items.map((r: any) => {
    const pros = Array.isArray(r.pros) ? r.pros : typeof r.pros === 'string' ? [r.pros] : [];
    const cons = Array.isArray(r.cons) ? r.cons : typeof r.cons === 'string' ? [r.cons] : [];
    const entityText = [r.product_name, r.brand, r.review_summary, r.final_verdict, ...pros, ...cons].filter(Boolean).join(' ');
    const entities = findEntities(entityText);
    return { ...r, _entities: entities.map((e: any) => ({ name: e.name, sameAs: e.sameAs, type: e.type })) };
  });
  // Helper: access property with fallback for snake_case DB data
  const val = (r: any, key: string) => r[key] || r[key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())];
  // Category filter (by UUID or exact bestFor)
  const category = req.query.category as string;
  if (category) items = items.filter((r: any) => val(r, 'categoryId') === category || val(r, 'bestFor') === category);
  // Category filter by slug with subcategory cascade
  const categorySlug = req.query.categorySlug as string;
  if (categorySlug) {
    const allCats = await dbInstance.getCategories();
    const matched = allCats.find((c: any) => c.slug === categorySlug && c.status === 'active');
    if (matched) {
      const ids = new Set<string>();
      const collect = (parentId: string) => {
        ids.add(parentId);
        allCats.filter((c: any) => c.parentId === parentId && c.status === 'active').forEach((c: any) => collect(c.id));
      };
      collect(matched.id);
      items = items.filter((r: any) => val(r, 'categoryId') && ids.has(val(r, 'categoryId')));
    }
  }
  // Brand filter
  const brand = req.query.brand as string;
  if (brand) items = items.filter((r: any) => val(r, 'brandId') === brand || r.brand === brand);
  // Price range
  const minPrice = parseFloat(req.query.minPrice as string);
  const maxPrice = parseFloat(req.query.maxPrice as string);
  if (!isNaN(minPrice)) items = items.filter((r: any) => parseFloat(r.price || '0') >= minPrice);
  if (!isNaN(maxPrice)) items = items.filter((r: any) => parseFloat(r.price || '0') <= maxPrice);
  // Rating filter
  const minRating = parseFloat(req.query.minRating as string);
  if (!isNaN(minRating)) items = items.filter((r: any) => r.rating >= minRating);
  // Discount filter
  const minDiscount = parseInt(req.query.minDiscount as string);
  if (!isNaN(minDiscount)) items = items.filter((r: any) => (val(r, 'discountPercentage') || 0) >= minDiscount);
  // Featured, deal, trending filters
  if (req.query.featured === 'true') items = items.filter((r: any) => val(r, 'isFeatured'));
  if (req.query.isDeal === 'true') items = items.filter((r: any) => val(r, 'isDeal'));
  if (req.query.isTrending === 'true') items = items.filter((r: any) => val(r, 'isTrending'));
  if (req.query.isTopRated === 'true') items = items.filter((r: any) => val(r, 'isTopRated'));
  // Availability
  if (req.query.inStock === 'true') items = items.filter((r: any) => val(r, 'stockStatus') !== 'out_of_stock');
  // Prime eligibility
  if (req.query.primeEligible === 'true') items = items.filter((r: any) => val(r, 'primeEligible'));
  // BestFor filter
  const bestFor = req.query.bestFor as string;
  if (bestFor) items = items.filter((r: any) => val(r, 'bestFor') === bestFor);
  // Search query
  const search = (req.query.search as string || '').toLowerCase();
  if (search) items = items.filter((r: any) =>
    (r.product_name || r.productName || '').toLowerCase().includes(search) ||
    r.brand?.toLowerCase().includes(search) ||
    (r.keyFeatures || r.key_features || []).some((f: string) => f.toLowerCase().includes(search))
  );
  // Sorting
  const sort = req.query.sort as string;
  if (sort === 'price_asc') items.sort((a: any, b: any) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
  else if (sort === 'price_desc') items.sort((a: any, b: any) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
  else if (sort === 'rating') items.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
  else if (sort === 'popularity') items.sort((a: any, b: any) => (val(b, 'pageViews') || 0) - (val(a, 'pageViews') || 0));
  else if (sort === 'discount') items.sort((a: any, b: any) => (val(b, 'discountPercentage') || 0) - (val(a, 'discountPercentage') || 0));
  else if (sort === 'newest') items.sort((a: any, b: any) => new Date(val(b, 'createdAt') || '').getTime() - new Date(val(a, 'createdAt') || '').getTime());
  else items.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)); // default: best rated
  // Pagination
  const limit = parseInt(req.query.limit as string) || 0;
  const offset = parseInt(req.query.offset as string) || 0;
  const total = items.length;
  if (limit > 0) items.splice(0, items.length, ...items.slice(offset, offset + limit));
  res.json({ data: items, total, limit, offset });
});

// Active deals with product data
router.get('/deals', async (req, res) => {
  const categoryId = req.query.categoryId as string;
  const dealType = req.query.dealType as string;
  let deals = await dbInstance.getDeals(categoryId, 'active');
  if (dealType) deals = deals.filter((d: any) => d.dealType === dealType);
  res.json(deals);
});

// Homepage hero slides
router.get('/homepage-hero', async (_req, res) => {
  const heroSlides = (await dbInstance.getHomepageHeroSlides()).filter((s: any) => s.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  res.json(heroSlides);
});

// Homepage data (sections + hero slides)
router.get('/homepage', async (_req, res) => {
  const [sections, heroSlides] = await Promise.all([
    dbInstance.getHomepageSections(),
    dbInstance.getHomepageHeroSlides(),
  ]);
  const allReviews = await seo.getProductReviews();
  const publishedReviews = allReviews.filter((r: any) => r.status === 'published');
  res.json({
    heroSlides: heroSlides.filter((s: any) => s.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
    sections: sections.filter((s: any) => s.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
    products: publishedReviews,
  });
});

// Public Search Endpoint
router.get('/search', async (req, res) => {
  const q = (req.query.q as string || req.query.search as string || '').toLowerCase().trim();
  const reviews = await seo.getProductReviews();
  const published = reviews.filter((r: any) => r.status === 'published');
  if (!q) return res.json(published);
  const matched = published.filter((r: any) =>
    (r.product_name || r.productName || '').toLowerCase().includes(q) ||
    (r.brand || '').toLowerCase().includes(q) ||
    (r.best_for || r.bestFor || '').toLowerCase().includes(q) ||
    (r.review_summary || r.reviewSummary || '').toLowerCase().includes(q)
  );
  res.json(matched);
});

// Search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const q = (req.query.q as string || '').toLowerCase().trim();
    if (!q || q.length < 2) return res.json({ suggestions: [], products: [], categories: [], brands: [], keywords: [] });
    const reviews = await seo.getProductReviews();
    const cats = await dbInstance.getCategories();
    const brands = await dbInstance.getBrands();
    const val = (r: any, key: string) => r[key] ?? r[key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())];
    const publishedReviews = reviews.filter((r: any) => r.status === 'published');
    const suggestions = publishedReviews
      .filter((r: any) => String(val(r, 'productName') || '').toLowerCase().includes(q))
      .slice(0, 8)
      .map((r: any) => ({ id: r.id, name: val(r, 'productName'), image: val(r, 'productImage'), price: r.price, rating: r.rating, slug: r.slug }));
    const categorySuggestions = cats
      .filter((c: any) => c.name.toLowerCase().includes(q) && c.status === 'active')
      .slice(0, 4)
      .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));
    const brandSuggestions = brands
      .filter((b: any) => b.name.toLowerCase().includes(q) && b.status === 'active')
      .slice(0, 4)
      .map((b: any) => ({ id: b.id, name: b.name, slug: b.slug }));
    // Keyword suggestions from product names / seo_keywords (may be array or comma string)
    const keywordSugg = [...new Set(publishedReviews.flatMap((r: any) => {
      let raw = val(r, 'seoKeywords') || val(r, 'productName') || '';
      if (Array.isArray(raw)) raw = raw.join(',');
      else if (typeof raw === 'string' && raw.trim().startsWith('[')) { try { raw = JSON.parse(raw).join(','); } catch {} }
      return String(raw).toLowerCase().split(',').map((k: string) => k.trim());
    }).filter((k: string) => k && k.includes(q)))].slice(0, 4);
    res.json({ suggestions, products: suggestions, categories: categorySuggestions, brands: brandSuggestions, keywords: keywordSugg });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Log search
router.post('/search/log', async (req, res) => {
  const { query, categoryId, resultsCount, sessionId } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  await dbInstance.logSearch({ query, categoryId, resultsCount: resultsCount || 0, hasResults: (resultsCount || 0) > 0, sessionId });
  res.json({ success: true });
});

// Wishlist
router.get('/wishlist', async (req, res) => {
  const { userId, sessionId } = req.query;
  if (!userId && !sessionId) return res.json([]);
  res.json(await dbInstance.getWishlist(userId as string, sessionId as string));
});
router.post('/wishlist', async (req, res) => {
  try { res.json(await dbInstance.addWishlistItem(req.body)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.post('/wishlist/merge', async (req, res) => {
  try {
    const { userId, sessionId, productIds } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const idsToMerge: string[] = Array.isArray(productIds) ? productIds : [];
    for (const pid of idsToMerge) {
      try {
        await dbInstance.addWishlistItem({ userId, sessionId, productId: pid });
      } catch {}
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
router.delete('/wishlist/:id', async (req, res) => {
  res.json({ success: await dbInstance.removeWishlistItem(req.params.id) });
});

// Recently viewed
router.post('/recently-viewed', async (req, res) => {
  await dbInstance.addRecentlyViewed(req.body);
  res.json({ success: true });
});
router.get('/recently-viewed', async (req, res) => {
  const { userId, sessionId } = req.query;
  if (!userId && !sessionId) return res.json([]);
  res.json(await dbInstance.getRecentlyViewed(userId as string, sessionId as string));
});

// Saved comparisons
router.get('/comparisons', async (req, res) => {
  const { userId, sessionId } = req.query;
  if (!userId && !sessionId) return res.json([]);
  res.json(await dbInstance.getSavedComparisons(userId as string, sessionId as string));
});
router.post('/comparisons', async (req, res) => {
  res.json(await dbInstance.saveComparison(req.body));
});
router.delete('/comparisons/:id', async (req, res) => {
  res.json({ success: await dbInstance.deleteSavedComparison(req.params.id) });
});

// Price alerts
router.post('/price-alerts', async (req, res) => {
  try { 
    const { addPriceAlert } = await import('../../server/db/price-alerts-db');
    const alert = await addPriceAlert(req.body.productId, req.body.email, req.body.targetPrice, req.body.currentPrice, req.body.userId, {
      alertType: req.body.alertType || 'price_drop',
      sessionId: req.body.sessionId,
    });
    res.json(alert); 
  }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.get('/price-alerts', async (req, res) => {
  const { userId, sessionId } = req.query;
  if (!userId && !sessionId) return res.json([]);
  res.json(await dbInstance.getPriceAlerts(userId as string, sessionId as string));
});
router.delete('/price-alerts/:id', async (req, res) => {
  res.json({ success: await dbInstance.deletePriceAlert(req.params.id) });
});

// Track affiliate click
router.post('/track/affiliate-click', async (req, res) => {
  const { productId, categoryId, pageUrl, pageType, ctaPosition, deviceType, sessionId, userId, campaign, articleId } = req.body;
  await dbInstance.logAffiliateClick({ productId, categoryId, pageUrl, pageType, ctaPosition, deviceType, sessionId, userId, campaign, articleId });
  res.json({ success: true });
});

// ====== Knock notifications client config (public key is safe for the browser) ======
router.get('/knock-config', async (_req, res) => {
  const publicKey = process.env.KNOCK_PUBLIC_API_KEY || '';
  const feedId = process.env.KNOCK_IN_APP_CHANNEL_ID || 'e36a561c-62bf-4387-8084-2aafddb1ee2e';
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ enabled: !!publicKey, publicKey, feedId });
});

// ====== Product cloak redirect (applies Amazon tag + tracks click, no pre-created rows needed) ======
router.get('/go/product/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const reviews = await seo.getPublishedProductReviews();
    const product = reviews.find((r: any) => r.slug === slug || r.product_name === slug);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const asin = product.asin || (product.amazon_url ? (product.amazon_url.match(/\/dp\/([A-Z0-9]{10})/i) || [])[1] : null) || null;
    const tag = process.env.AMAZON_PARTNER_TAG || 'dawnwire-20';
    let destination = product.affiliate_url || product.amazon_url || '';
    if (destination) {
      if (asin && !destination.includes('tag=')) destination = destination + (destination.includes('?') ? '&' : '?') + 'tag=' + encodeURIComponent(tag);
      else if (asin && !destination.includes('dawnwire')) destination = destination.replace(/([?&])tag=[^&]*/, `$1tag=${encodeURIComponent(tag)}`);
    }
    if (!destination && asin) destination = `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}`;
    if (!destination) return res.status(404).json({ error: 'No destination URL' });
    await dbInstance.logAffiliateClick({ productId: product.id, ctaPosition: 'go_cloak', pageUrl: `/products/${product.slug}`, deviceType: 'desktop' });
    return res.redirect(302, destination);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ====== AI Shopping Assistant Chat ======
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, context } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message are required' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    const { chat } = await import('../../server/ai-shopping-assistant');
    const result = await chat(sessionId, message, context);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/chat/history', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) return res.json([]);
    const { getSessionHistory } = await import('../../server/ai-shopping-assistant');
    res.json(getSessionHistory(sessionId));
  } catch { res.json([]); }
});

router.post('/chat/clear', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const { clearSession } = await import('../../server/ai-shopping-assistant');
    clearSession(sessionId);
    res.json({ success: true });
  } catch { res.json({ success: false }); }
});

import jwt from 'jsonwebtoken';

function getUserIdFromToken(req: any) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret');
      return decoded.id;
    } catch { return null; }
  }
  return null;
}

// ====== User Specific Endpoints ======
router.get('/user/wishlist', async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  const userId = getUserIdFromToken(req);
  const data = await dbInstance.getWishlist(userId, sessionId);
  res.json(data);
});
router.get('/user/history', async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  const userId = getUserIdFromToken(req);
  const data = await dbInstance.getRecentlyViewed(userId, sessionId, 20);
  res.json(data);
});
router.get('/user/comparisons', async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  const userId = getUserIdFromToken(req);
  const data = await dbInstance.getSavedComparisons(userId, sessionId);
  res.json(data);
});

export default router;
