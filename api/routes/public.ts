import express from 'express';
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

// Product reviews with entity enrichment for slug lookup
router.get('/product-reviews/slug/:slug', async (req, res) => {
  const reviews = await seo.getPublishedProductReviews();
  const found = (reviews as any[]).find(r => r.slug === req.params.slug || r.id === req.params.slug);
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
router.get('/brands', async (_req, res) => {
  const brands = await dbInstance.getBrands();
  res.json(brands.filter((b: any) => b.status === 'active'));
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
      if (r.categoryId === cat.id) return true;
      const bf = (r.best_for || '').toLowerCase();
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

// Product reviews with filters, sorting, pagination, entity enrichment
router.get('/product-reviews', async (req, res) => {
  let items = await seo.getProductReviews();
  items = items.filter((r: any) => r.status === 'published');
  // Entity enrichment
  items = items.map((r: any) => {
    const pros = Array.isArray(r.pros) ? r.pros : typeof r.pros === 'string' ? [r.pros] : [];
    const cons = Array.isArray(r.cons) ? r.cons : typeof r.cons === 'string' ? [r.cons] : [];
    const entityText = [r.product_name, r.brand, r.review_summary, r.final_verdict, ...pros, ...cons].filter(Boolean).join(' ');
    const entities = findEntities(entityText);
    return { ...r, _entities: entities.map((e: any) => ({ name: e.name, sameAs: e.sameAs, type: e.type })) };
  });
  // Category filter
  const category = req.query.category as string;
  if (category) items = items.filter((r: any) => r.categoryId === category || r.bestFor === category);
  // Brand filter
  const brand = req.query.brand as string;
  if (brand) items = items.filter((r: any) => r.brandId === brand || r.brand === brand);
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
  if (!isNaN(minDiscount)) items = items.filter((r: any) => (r.discountPercentage || 0) >= minDiscount);
  // Featured, deal, trending filters
  if (req.query.featured === 'true') items = items.filter((r: any) => r.isFeatured);
  if (req.query.isDeal === 'true') items = items.filter((r: any) => r.isDeal);
  if (req.query.isTrending === 'true') items = items.filter((r: any) => r.isTrending);
  if (req.query.isTopRated === 'true') items = items.filter((r: any) => r.isTopRated);
  // Availability
  if (req.query.inStock === 'true') items = items.filter((r: any) => r.stockStatus !== 'out_of_stock');
  // Prime eligibility
  if (req.query.primeEligible === 'true') items = items.filter((r: any) => r.primeEligible);
  // BestFor filter
  const bestFor = req.query.bestFor as string;
  if (bestFor) items = items.filter((r: any) => r.bestFor === bestFor);
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
  else if (sort === 'popularity') items.sort((a: any, b: any) => (b.pageViews || 0) - (a.pageViews || 0));
  else if (sort === 'discount') items.sort((a: any, b: any) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
  else if (sort === 'newest') items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

// Search suggestions
router.get('/search/suggestions', async (req, res) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q || q.length < 2) return res.json({ suggestions: [], products: [], categories: [], brands: [] });
  const reviews = await seo.getProductReviews();
  const cats = await dbInstance.getCategories();
  const brands = await dbInstance.getBrands();
  const publishedReviews = reviews.filter((r: any) => r.status === 'published');
  const suggestions = publishedReviews
    .filter((r: any) => r.productName.toLowerCase().includes(q))
    .slice(0, 8)
    .map((r: any) => ({ id: r.id, name: r.productName, image: r.productImage, price: r.price, rating: r.rating, slug: r.slug }));
  const categorySuggestions = cats
    .filter((c: any) => c.name.toLowerCase().includes(q) && c.status === 'active')
    .slice(0, 4)
    .map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }));
  const brandSuggestions = brands
    .filter((b: any) => b.name.toLowerCase().includes(q) && b.status === 'active')
    .slice(0, 4)
    .map((b: any) => ({ id: b.id, name: b.name, slug: b.slug }));
  // Keyword suggestions from product names
  const keywordSugg = [...new Set(publishedReviews.flatMap((r: any) =>
    (r.seoKeywords || r.productName).toLowerCase().split(',').map((k: string) => k.trim())
  ).filter((k: string) => k.includes(q)))].slice(0, 4);
  res.json({ suggestions, products: suggestions, categories: categorySuggestions, brands: brandSuggestions, keywords: keywordSugg });
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
    const alert = await addPriceAlert(req.body.productId, req.body.email, req.body.targetPrice, req.body.currentPrice);
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
