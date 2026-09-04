import express from 'express';
import { dbInstance } from '../../server/db';
import * as seo from '../../server/seo-engine';
import { findEntities } from '../../server/entities';
import { findLinkSuggestions, applyLinkSuggestions } from '../../server/internal-linking';
import {
  getOptimizationCandidates,
  optimizePost,
  optimizeProduct,
  previewOptimization,
  bulkOptimize,
  getOptimizationStats,
} from '../../server/seo-optimizer';
import { authenticate, requireRole } from './middleware';

const router = express.Router();

// SEO Dashboard
router.get('/dashboard', authenticate, async (_req, res) => {
  const stats = await seo.getSeoDashboardStats();
  res.json(stats);
});

// SEO analysis
router.post('/analyze', authenticate, async (req, res) => {
  const result = seo.analyzeSeo(req.body);
  res.json(result);
});

// Content freshness
router.get('/content-freshness', authenticate, async (_req, res) => {
  try { res.json(await seo.getContentFreshness()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Refresh article content via AI
router.post('/refresh-content/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const post = await dbInstance.getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.status !== 'published') return res.status(400).json({ error: 'Only published posts can be refreshed' });
    const { refreshArticleContent } = await import('../../server/ai');
    const result = await refreshArticleContent(post);
    if (!result) return res.status(500).json({ error: 'Content refresh failed' });
    const u = (req as any).user;
    const updated = await dbInstance.updatePost(req.params.id, {
      title: result.title, content: result.content, excerpt: result.excerpt.substring(0, 300),
      updatedAt: new Date().toISOString(),
    });
    dbInstance.log('Content Refreshed', `AI refreshed: "${post.title}" -> "${result.title}"`, u.id, u.name);
    res.json({ post: updated, changes: result.title !== post.title ? { oldTitle: post.title, newTitle: result.title } : {} });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk refresh stale content
router.post('/bulk-refresh', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const maxPosts = Math.min(req.body.maxPosts || 10, 50);
    const posts = await Promise.resolve(dbInstance.getPosts());
    const now = Date.now();
    const DAY_MS = 86400000;
    const STALE_DAYS = 180;
    const stalePosts = (posts as any[])
      .filter((p: any) => p.status === 'published')
      .filter((p: any) => {
        const updated = p.updatedAt || p.publishedAt || p.createdAt;
        return Math.floor((now - new Date(updated).getTime()) / DAY_MS) >= STALE_DAYS;
      })
      .sort((a: any, b: any) => {
        const aU = new Date(a.updatedAt || a.publishedAt || a.createdAt).getTime();
        const bU = new Date(b.updatedAt || b.publishedAt || b.createdAt).getTime();
        return aU - bU;
      })
      .slice(0, maxPosts);

    const { refreshArticleContent } = await import('../../server/ai');
    const u = (req as any).user;
    const results: any[] = [];

    for (const post of stalePosts) {
      try {
        const result = await refreshArticleContent(post);
        if (result) {
          await dbInstance.updatePost(post.id, {
            title: result.title, content: result.content, excerpt: result.excerpt.substring(0, 300),
            updatedAt: new Date().toISOString(),
          });
          dbInstance.log('Content Refreshed', `Bulk AI refresh: "${post.title}"`, u.id, u.name);
          results.push({ id: post.id, title: post.title, success: true, newTitle: result.title });
        }
      } catch (e: any) {
        results.push({ id: post.id, title: post.title, success: false, error: e.message });
      }
    }

    res.json({ refreshed: results.filter((r: any) => r.success).length, failed: results.filter((r: any) => !r.success).length, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// AI SEO Optimizer
router.get('/optimization/stats', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try {
    const stats = await getOptimizationStats();
    res.json(stats);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/optimization/candidates', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try {
    const candidates = await getOptimizationCandidates();
    res.json(candidates);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/optimization/preview/:type/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const result = await previewOptimization(req.params.type as 'post' | 'product', req.params.id);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/optimization/apply/post/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const u = (req as any).user;
    const result = await optimizePost(req.params.id);
    if (result.success) {
      dbInstance.log('AI SEO Optimized', `Optimized post "${req.params.id}" - score ${result.oldScore}% → ${result.newScore}%`, u.id, u.name);
    }
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/optimization/apply/product/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const u = (req as any).user;
    const result = await optimizeProduct(req.params.id);
    if (result.success) {
      dbInstance.log('AI SEO Optimized', `Optimized product "${req.params.id}" - score ${result.oldScore}% → ${result.newScore}%`, u.id, u.name);
    }
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/optimization/bulk', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const u = (req as any).user;
    const { threshold = 70, types = ['post', 'product'], maxItems = 50 } = req.body;
    const result = await bulkOptimize(threshold, types, maxItems);
    dbInstance.log('AI SEO Bulk Optimize', `Bulk optimized ${result.optimized}/${result.total} items`, u.id, u.name);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Structured data validation
router.get('/structured-data-check', authenticate, async (_req, res) => {
  try {
    const posts = await Promise.resolve(dbInstance.getPosts());
    const published = (posts as any[]).filter((p: any) => p.status === 'published');
    const results = published.map((p: any) => {
      const content = p.content || '';
      const hasFaqSchema = content.includes('## Frequently Asked Questions') || content.includes('**Q:**');
      const hasHowToSchema = content.includes('## Buying Guide') || content.includes('## How to');
      const hasVideoSchema = !!p.featuredImage;
      const hasProductSchema = content.toLowerCase().includes('rating') || content.toLowerCase().includes('price');
      return {
        id: p.id, title: p.title, slug: p.slug,
        checks: {
          hasH1: content.includes('# '),
          hasH2: /## /.test(content),
          hasMetaDescription: !!p.seoDescription,
          hasSeoTitle: !!p.seoTitle,
          hasFeaturedImage: !!p.featuredImage,
          hasExcerpt: !!p.excerpt,
          hasFaqSchema, hasHowToSchema, hasVideoSchema, hasProductSchema,
          minWordCount: (content.split(/\s+/).filter(Boolean).length) >= 300,
        },
        score: 0,
      };
    });
    for (const r of results) {
      const checks = Object.values(r.checks);
      r.score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }
    res.json({
      total: results.length,
      averageScore: Math.round(results.reduce((s: number, r: any) => s + r.score, 0) / results.length),
      posts: results.sort((a: any, b: any) => a.score - b.score),
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Bulk SEO issues
router.get('/bulk-seo-issues', authenticate, async (_req, res) => {
  try {
    const posts = await Promise.resolve(dbInstance.getPosts());
    const published = (posts as any[]).filter((p: any) => p.status === 'published');
    const issues = {
      missingMetaDescription: [] as any[],
      missingSeoTitle: [] as any[],
      missingFeaturedImage: [] as any[],
      missingExcerpt: [] as any[],
      shortContent: [] as any[],
      noHeadings: [] as any[],
    };
    for (const p of published) {
      const content = p.content || '';
      const words = content.split(/\s+/).filter(Boolean).length;
      if (!p.seoDescription) issues.missingMetaDescription.push({ id: p.id, title: p.title, slug: p.slug });
      if (!p.seoTitle) issues.missingSeoTitle.push({ id: p.id, title: p.title, slug: p.slug });
      if (!p.featuredImage) issues.missingFeaturedImage.push({ id: p.id, title: p.title, slug: p.slug });
      if (!p.excerpt) issues.missingExcerpt.push({ id: p.id, title: p.title, slug: p.slug });
      if (words < 300) issues.shortContent.push({ id: p.id, title: p.title, slug: p.slug, wordCount: words });
      if (!/#+\s/.test(content)) issues.noHeadings.push({ id: p.id, title: p.title, slug: p.slug });
    }
    res.json(issues);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Apply bulk fix
router.post('/bulk-fix', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { fixType, postIds } = req.body;
    if (!fixType || !Array.isArray(postIds)) return res.status(400).json({ error: 'fixType and postIds required' });
    const u = (req as any).user;
    let count = 0;
    for (const id of postIds) {
      const posts = await Promise.resolve(dbInstance.getPosts());
      const post = (posts as any[]).find((p: any) => p.id === id);
      if (!post) continue;
      const updates: any = { updatedAt: new Date().toISOString() };
      if (fixType === 'missingMetaDescription' && !post.seoDescription) {
        updates.seoDescription = (post.excerpt || post.title || '').substring(0, 160);
        count++;
      }
      if (fixType === 'missingSeoTitle' && !post.seoTitle) {
        updates.seoTitle = post.title;
        count++;
      }
      if (fixType === 'missingExcerpt' && !post.excerpt) {
        const firstP = (post.content || '').split('\n').find((l: string) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-') && !l.startsWith('|'));
        updates.excerpt = (firstP || post.title || '').substring(0, 300);
        count++;
      }
      if (count > 0) {
        await dbInstance.updatePost(id, updates);
      }
    }
    dbInstance.log('Bulk SEO Fix', `Applied "${fixType}" to ${count} posts`, u.id, u.name);
    res.json({ fixed: count, fixType });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Auto internal linking
router.get('/auto-link/:postId', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const [post, allPosts] = await Promise.all([
      dbInstance.getPostById(req.params.postId),
      dbInstance.getPosts(),
    ]);
    const posts = (allPosts as any[]) || [];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const suggestions = findLinkSuggestions(post, posts);
    res.json({
      postId: post.id,
      postTitle: post.title,
      totalSuggestions: suggestions.length,
      suggestions,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-link/:postId/apply', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const [post, allPosts] = await Promise.all([
      dbInstance.getPostById(req.params.postId),
      dbInstance.getPosts(),
    ]);
    const posts = (allPosts as any[]) || [];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const suggestions = findLinkSuggestions(post, posts as any[]);
    if (!suggestions.length) return res.json({ applied: 0, message: 'No link suggestions found' });
    const newContent = applyLinkSuggestions(post.content || '', suggestions);
    await dbInstance.updatePost(post.id, { content: newContent, updatedAt: new Date().toISOString() });
    res.json({ applied: suggestions.length, links: suggestions });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-link-all', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const posts = await Promise.resolve(dbInstance.getPosts());
    const published = (posts as any[]).filter(p => p.status === 'published' && p.content);
    let totalApplied = 0;
    const postResults: { postId: string; postTitle: string; applied: number }[] = [];
    for (const post of published) {
      const suggestions = findLinkSuggestions(post, posts as any[]);
      if (suggestions.length) {
        const newContent = applyLinkSuggestions(post.content || '', suggestions);
        await dbInstance.updatePost(post.id, { content: newContent, updatedAt: new Date().toISOString() });
        totalApplied += suggestions.length;
        postResults.push({ postId: post.id, postTitle: post.title, applied: suggestions.length });
      }
    }
    res.json({ totalPosts: published.length, postsWithLinks: postResults.length, totalLinksApplied: totalApplied, results: postResults });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Auto affiliate linking
router.post('/auto-affiliate', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const { autoLinkAffiliates } = await import('../../server/auto-affiliate');
    res.json(await autoLinkAffiliates(content));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/auto-affiliate-bulk', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { bulkAutoLinkAffiliates } = await import('../../server/auto-affiliate');
    const u = (req as any).user;
    const result = await bulkAutoLinkAffiliates();
    dbInstance.log('Auto Affiliate Link', `Auto-linked ${result.totalLinksAdded} affiliates across ${result.postsWithChanges} posts`, u.id, u.name);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// AI Meta Suggestion
router.post('/suggest-meta', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { title, content, currentFocus } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const { suggestPostMeta } = await import('../../server/seo-optimizer');
    const suggestion = await suggestPostMeta(title, content, currentFocus);
    res.json({ success: true, suggestion });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Redirects
router.get('/redirects', authenticate, async (req, res) => {
    let items = await seo.getRedirects();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/redirects', authenticate, async (req, res) => res.json(await seo.createRedirect(req.body)));
router.put('/redirects/:id', authenticate, async (req, res) => res.json(await seo.updateRedirect(req.params.id, req.body)));
router.delete('/redirects/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteRedirect(req.params.id) }));

// 404 logs
router.get('/404-logs', authenticate, async (req, res) => {
    let items = await seo.get404Logs();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.delete('/404-logs', authenticate, async (_req, res) => res.json({ success: await seo.clear404Logs() }));

// Keywords
router.get('/keywords', authenticate, async (req, res) => {
    let items = await seo.getKeywords();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/keywords', authenticate, async (req, res) => res.json(await seo.createKeyword(req.body)));
router.put('/keywords/:id', authenticate, async (req, res) => res.json(await seo.updateKeyword(req.params.id, req.body)));
router.delete('/keywords/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteKeyword(req.params.id) }));

// Content briefs
router.get('/content-briefs', authenticate, async (req, res) => {
    let items = await seo.getContentBriefs();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/content-briefs', authenticate, async (req, res) => res.json(await seo.createContentBrief(req.body)));
router.put('/content-briefs/:id', authenticate, async (req, res) => res.json(await seo.updateContentBrief(req.params.id, req.body)));
router.delete('/content-briefs/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteContentBrief(req.params.id) }));

// FAQs (admin)
router.get('/faqs', authenticate, async (req, res) => {
    let items = await seo.getFaqs();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/faqs', authenticate, async (req, res) => res.json(await seo.createFaq(req.body)));
router.put('/faqs/:id', authenticate, async (req, res) => res.json(await seo.updateFaq(req.params.id, req.body)));
router.delete('/faqs/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteFaq(req.params.id) }));

// Product reviews
router.get('/product-reviews', authenticate, async (req, res) => {
    let items = await seo.getProductReviews();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

// Export full product catalogue as CSV (names, live URLs, brand, price, ASIN,
// stock, deals, scores) so you can cross-check everything in one download.
router.get('/product-reviews/export', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try {
    const items = await seo.getProductReviews();
    const val = (r: any, key: string) => r[key] == null ? r[key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())] : r[key];
    const csvCol = (v: any) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = [
      'product_name', 'slug', 'live_url', 'brand', 'price', 'original_price', 'currency',
      'rating', 'review_count', 'editor_score', 'stock_status', 'deal_badge', 'coupon_code',
      'best_for', 'category', 'asin', 'affiliate_url', 'status', 'page_views', 'click_count',
      'created_at', 'updated_at',
    ];
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';
    const rows = items.map((r: any) => {
      const slug = val(r, 'slug') || '';
      const specs = (r && (r.specs || {})) as any;
      const asin = val(r, 'asin') || specs?.asin || '';
      return [
        val(r, 'productName') || r.product_name || '',
        slug,
        `${baseUrl.replace(/\/$/, '')}/product/${encodeURIComponent(slug)}`,
        val(r, 'brand') || '',
        val(r, 'price') ?? '',
        val(r, 'originalPrice') ?? '',
        val(r, 'currency') ?? '',
        val(r, 'rating') ?? '',
        val(r, 'reviewCount') ?? '',
        val(r, 'editorScore') != null ? val(r, 'editorScore') : '',
        val(r, 'stockStatus') ?? '',
        val(r, 'dealBadge') ?? '',
        val(r, 'couponCode') ?? '',
        val(r, 'bestFor') ?? '',
        val(r, 'categoryName') ?? '',
        asin,
        val(r, 'affiliateUrl') || val(r, 'amazon_url') || '',
        val(r, 'status') ?? '',
        val(r, 'pageViews') ?? '',
        val(r, 'clickCount') ?? '',
        val(r, 'createdAt') ?? '',
        val(r, 'updatedAt') ?? '',
      ];
    });
    const csv = [header, ...rows].map(line => line.map(csvCol).join(',')).join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dawnwire-catalogue-${timestamp}.csv"`);
    return res.send('\uFEFF' + csv);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
router.post('/product-reviews', authenticate, async (req, res) => res.json(await seo.createProductReview(req.body)));
router.post('/product-reviews/import', authenticate, async (req, res) => {
  try {
    const result = await Promise.race([
      seo.importProductReview(req.body),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Import timed out after 60s')), 60000))
    ]);
    res.json(result);
    // Instant-index the new product page (fire-and-forget)
    const slug = (result as any)?.slug || (result as any)?.review?.slug;
    if (slug) import('../../server/indexnow').then((m) => m.pingIndexNow(`https://www.dawnwire.com/products/${slug}`)).catch(() => {});
    // Auto-regenerate catalog in background (fire-and-forget)
    const { regenerateCatalog } = await import('../../server/api-cache');
    regenerateCatalog().catch(() => {});
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Auto-process a single product: brand + category detection + AI SEO generation
router.post('/product-reviews/auto-process/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { autoProcessProduct } = await import('../../server/auto-import');
    const result = await autoProcessProduct(req.params.id);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk auto-process: backfill products missing brand/category/SEO
router.post('/product-reviews/bulk-auto-process', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { autoProcessAllProducts } = await import('../../server/auto-import');
    const limit = Math.min(Number(req.body?.limit) || 20, 100);
    const onlyMissing = req.body?.onlyMissing !== false;
    const result = await autoProcessAllProducts(limit, onlyMissing);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/product-reviews/check-duplicate', authenticate, async (req, res) => {
  try {
    const asin = (req.query.asin as string) || '';
    const name = (req.query.name as string) || '';
    const url = (req.query.url as string) || '';
    if (!asin && !name && !url) return res.json({ duplicate: false });

    const isMysql = !!process.env.MYSQL_URL;
    if (isMysql) {
      // MySQL backend: query the real `asin` column (older rows may only have
      // asin nested inside the specs JSON, so fall back to a LIKE).
      const { pool } = await import('../../server/db/mysql-adapter');
      if (asin) {
        const [byAsin] = await pool.query('SELECT id FROM product_reviews WHERE asin = ? LIMIT 1', [asin]);
        if ((byAsin as any[]).length) return res.json({ duplicate: true, id: (byAsin as any[])[0].id });
        const [bySpecs] = await pool.query('SELECT id FROM product_reviews WHERE specs LIKE ? LIMIT 1', [`%"asin":"${asin}"%`]);
        if ((bySpecs as any[]).length) return res.json({ duplicate: true, id: (bySpecs as any[])[0].id });
      }
      if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (slug) {
          const [bySlug] = await pool.query('SELECT id FROM product_reviews WHERE slug = ? LIMIT 1', [slug]);
          if ((bySlug as any[]).length) return res.json({ duplicate: true, id: (bySlug as any[])[0].id });
        }
      }
      if (url) {
        const [byUrl] = await pool.query('SELECT id FROM product_reviews WHERE amazon_url = ? OR affiliate_url = ? OR affiliate_url LIKE ? LIMIT 1', [url, url, `%${url}%`]);
        if ((byUrl as any[]).length) return res.json({ duplicate: true, id: (byUrl as any[])[0].id });
      }
      return res.json({ duplicate: false });
    }

    const sb = await (await import('../../server/lib/supabase')).getSupabaseAdmin();
    if (asin) {
      const { data } = await sb.from('product_reviews').select('id').filter('specs->>asin', 'eq', asin).maybeSingle();
      if (data) return res.json({ duplicate: true, id: data.id });
    }
    if (url) {
      const { data } = await sb.from('product_reviews').select('id').or(`amazon_url.eq.${url},affiliate_url.eq.${url},affiliate_url.ilike.%${url}%`).maybeSingle();
      if (data) return res.json({ duplicate: true, id: data.id });
    }
    if (name) {
      const slug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const { data } = await sb.from('product_reviews').select('id').or(`slug.eq.${name},product_name.ilike.${name}`).maybeSingle();
      if (data) return res.json({ duplicate: true, id: data.id });
      if (slug && slug !== name) {
        const { data: bySlug } = await sb.from('product_reviews').select('id').eq('slug', slug).maybeSingle();
        if (bySlug) return res.json({ duplicate: true, id: bySlug.id });
      }
    }
    res.json({ duplicate: false });
  } catch { res.json({ duplicate: false }); }
});
router.put('/product-reviews/:id', authenticate, async (req, res) => {
  try {
    res.json(await seo.updateProductReview(req.params.id, req.body));
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update product review' });
  }
});
router.delete('/product-reviews/:id', authenticate, async (req, res) => {
  try {
    res.json({ success: await seo.deleteProductReview(req.params.id) });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to delete product review' });
  }
});

// Fetch video URL from Amazon for a product review
router.post('/product-reviews/fetch-video/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const product = await seo.getProductReviewById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const specs = product.specs || {};
    let asin = specs.asin || '';
    if (!asin) {
      asin = product.amazon_url?.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';
    }
    if (!asin) {
      asin = product.affiliate_url?.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';
    }
    if (!asin) {
      const summary = product.review_summary || '';
      const summaryAsin = summary.match(/asin\s*=\s*['"]([A-Z0-9]{10})['"]/i)?.[1] ||
                          summary.match(/ASIN["']?\s*:\s*["']([A-Z0-9]{10})/i)?.[1] ||
                          summary.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';
      if (summaryAsin) asin = summaryAsin;
    }
    if (!asin) return res.json({ videoUrl: '', message: 'No ASIN found' });
    const pageRes = await fetch(`https://www.amazon.com/dp/${asin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (pageRes.ok) {
      let cleanHtml = await pageRes.text();
      cleanHtml = cleanHtml.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      const ytMatch = cleanHtml.match(/src=["'](https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)[^"']*)["']/i);
      if (ytMatch) {
        const ytUrl = ytMatch[1].split('?')[0];
        const updatedSpecs = { ...specs, video_url: ytUrl, asin };
        await seo.updateProductReview(req.params.id, { specs: updatedSpecs });
        return res.json({ videoUrl: ytUrl, message: 'YouTube video found' });
      }
      const cdnMatch = cleanHtml.match(/https:\/\/m\.media-amazon\.com\/[^"'\s]+\.(mp4|webm|mov)[^"'\s]*/i);
      if (cdnMatch && cdnMatch[0].length < 300) {
        const updatedSpecs = { ...specs, video_url: cdnMatch[0], asin };
        await seo.updateProductReview(req.params.id, { specs: updatedSpecs });
        return res.json({ videoUrl: cdnMatch[0], message: 'CDN video URL found' });
      }
      const jsonMatches = cleanHtml.matchAll(/"videoUrl"\s*:\s*"(https?:[^"]+)"/gi);
      for (const m of jsonMatches) {
        const url = m[1];
        if (url && !url.startsWith('blob:') && !url.startsWith('data:')) {
          const updatedSpecs = { ...specs, video_url: url, asin };
          await seo.updateProductReview(req.params.id, { specs: updatedSpecs });
          return res.json({ videoUrl: url, message: 'Video URL from page data' });
        }
      }
    }
    if (!specs.asin) {
      await seo.updateProductReview(req.params.id, { specs: { ...specs, asin } });
    }
    res.json({ videoUrl: '', message: 'No video URL found on Amazon for this product' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Clean up blob video URLs
router.post('/product-reviews/cleanup-blob-videos', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const reviews = await seo.getProductReviews();
    let cleaned = 0;
    for (const r of reviews) {
      const specs = r.specs || {};
      const vu = specs.video_url || '';
      const isBad = !vu || vu.startsWith('blob:') || vu.startsWith('data:') || vu.length > 300 || vu.includes('&quot;') || vu.includes('"video');
      if (isBad) {
        if (vu) {
          const { video_url, ...rest } = specs;
          await seo.updateProductReview(r.id, { specs: rest });
          cleaned++;
        }
      }
    }
    res.json({ cleaned, message: `Cleaned ${cleaned} products with bad video URLs` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Re-fetch real Amazon product photos for products whose stored image is dead
// (Amazon 404s the CDN URL). Uses the improved scrapeAmazonHtml which prefers
// the page's "hiRes"/landing image. Chunked (limit, default 20) to stay inside
// the 60s function timeout — run it again to keep repairing.
router.post('/product-reviews/repair-images', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { scrapeAmazonHtml, verifyImageUrl } = await import('../../server/amazon-extractor');
    const reviews = await seo.getProductReviews();
    const limit = Math.min(parseInt(req.body?.limit, 10) || 20, 40);
    const results: any[] = [];
    let repaired = 0, failed = 0, scanned = 0;

    const mapConcurrent = async <T, R>(items: T[], worker: (item: T) => Promise<R>, concurrency: number): Promise<R[]> => {
      const out: R[] = new Array(items.length);
      let i = 0;
      const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (i < items.length) {
          const idx = i++;
          try { out[idx] = await worker(items[idx]); } catch (e: any) { out[idx] = e; }
        }
      });
      await Promise.all(runners);
      return out;
    };

    const asinOf = (r: any): string => {
      const specAsin = r.specs?.asin || '';
      if (specAsin && /^[A-Z0-9]{10}$/.test(specAsin)) return specAsin;
      return (r.affiliate_url || r.amazon_url || '').match(/\/dp\/([A-Z0-9]{10})/i)?.[1] || '';
    };

    // Phase 1 — HEAD-check current main image, find dead ones
    const suspects = (await mapConcurrent(reviews.slice(0, limit), async (r) => {
      const current = r.product_image || r.specs?.gallery?.[0] || '';
      if (!current || !/^https:\/\/(m\.)?media-amazon\.com\//.test(current)) return null;
      scanned++;
      if (await verifyImageUrl(current, 8000)) return null;
      return r;
    }, 6)).filter(Boolean);

    // Phase 2 — scrape real page + verify candidates + update
    await mapConcurrent(suspects, async (r: any) => {
      const asin = asinOf(r);
      if (!asin) { failed++; results.push({ name: r.product_name, error: 'no ASIN' }); return; }
      const scraped = await scrapeAmazonHtml(asin);
      const candidates: string[] = [scraped?.mainImage || '', ...(scraped?.images || [])]
        .filter((u): u is string => typeof u === 'string' && /^https:\/\/(m\.)?media-amazon\.com\//.test(u));
      const unique = [...new Set(candidates)];
      const valid: string[] = [];
      for (const c of unique.slice(0, 6)) {
        if (await verifyImageUrl(c, 8000)) valid.push(c);
        if (valid.length >= 6) break;
      }
      if (!valid.length) {
        failed++;
        results.push({ name: r.product_name, asin, error: 'scrape failed or no valid images' });
        return;
      }
      await seo.updateProductReview(r.id, { gallery: valid });
      repaired++;
      results.push({ name: r.product_name, asin, images: valid.length, main: valid[0] });
    }, 3);

    res.json({ scanned, repaired, failed, processed: results.length, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Sanitize review_summary fields (strip injected CSS/JS from Amazon imports)
router.post('/product-reviews/sanitize-summaries', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const reviews = await seo.getProductReviews();
    let sanitized = 0;
    for (const r of reviews) {
      if (!r.review_summary) continue;
      const clean = seo.sanitizeReviewSummary(r.review_summary);
      if (clean !== r.review_summary) {
        await seo.updateProductReview(r.id, { review_summary: clean });
        sanitized++;
      }
    }
    res.json({ sanitized, message: `Sanitized ${sanitized} product review summaries` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Generate a typed article from one or more selected products (multi-product aware).
// Supports all 7 article types. Always creates a DRAFT post — publishing is manual.
router.post('/product-reviews/generate-article', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { productIds, articleType = 'review' } = req.body || {};
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one product.' });
    }

    const { ARTICLE_TYPES, ARTICLE_TYPE_LABELS, ARTICLE_TYPE_MIN_PRODUCTS, generateArticleForType } = await import('../../server/ai');
    const type: 'review' | 'guide' | 'comparison' | 'best-list' | 'how-to' | 'benefits' | 'faq' =
      ARTICLE_TYPES.includes(articleType) ? articleType : 'review';
    const min = ARTICLE_TYPE_MIN_PRODUCTS[type] || 1;
    if (productIds.length < min) {
      return res.status(400).json({ error: `"${ARTICLE_TYPE_LABELS[type]}" articles require at least ${min} product${min > 1 ? 's' : ''}. Select ${min} or more.` });
    }

    const products: any[] = [];
    for (const id of productIds) {
      const p = await seo.getProductReviewById(id);
      if (!p) return res.status(404).json({ error: 'One or more selected products were not found.' });
      if (p.status !== 'published') {
        // Allow drafts so editors can generate before publishing, but flag it.
        (p as any)._draft = true;
      }
      products.push(p);
    }

    // Dedup: block regeneration for products that already have an article so the
    // same product can't be featured in multiple posts.
    const allPosts = await Promise.resolve(dbInstance.getPosts());
    const linked = allPosts.filter((p: any) => products.some((prod: any) => p.productId === prod.id));
    if (linked.length > 0) {
      const used = products
        .filter((prod: any) => linked.some((p: any) => p.productId === prod.id))
        .map((prod: any) => prod.product_name);
      return res.status(400).json({
        error: `Already has an article: ${used.join(', ')}. Open it from "Existing Articles" to edit instead of generating a duplicate.`,
        usedPosts: linked,
      });
    }

    const generated = await generateArticleForType(products, type);

    let slug = generated.title.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').substring(0, 70);
    if (!slug) slug = (products[0].slug || products[0].id);
    const existingPost = await dbInstance.getPostBySlug(slug);
    if (existingPost) slug = slug + '-' + Date.now().toString(36);

    const u = (req as any).user;
    const post = await dbInstance.createPost({
      title: generated.title,
      slug,
      excerpt: generated.excerpt.substring(0, 300),
      content: generated.content,
      featuredImage: products[0].product_image || '',
      featuredImageAlt: generated.imageAlt,
      categoryId: products[0].category_id || '',
      productId: products[0].id,
      tags: generated.tags,
      status: 'draft',
      visibility: 'public',
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
      seoKeywords: generated.seoKeywords,
      publishedAt: undefined,
    }, u.id);

    dbInstance.log('Article Generated', `AI "${ARTICLE_TYPE_LABELS[type]}" from ${products.length} product(s) -> "${generated.title}"`, u.id, u.name);
    res.json({
      post,
      productCount: products.length,
      articleType: type,
      imagePrompt: generated.imagePrompt,
      imageAlt: generated.imageAlt,
      seo: { seoTitle: generated.seoTitle, seoDescription: generated.seoDescription, seoKeywords: generated.seoKeywords, tags: generated.tags },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Manually (re)generate the featured-image prompt + auto alt text for selected products.
router.post('/article/image-prompt', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { productIds, articleType = 'review', title = '' } = req.body || {};
    const ids = Array.isArray(productIds) && productIds.length ? productIds : [];
    const { ARTICLE_TYPES, generateFeaturedImagePrompt, generateImageAltText } = await import('../../server/ai');
    const type: any = ARTICLE_TYPES.includes(articleType) ? articleType : 'review';

    if (ids.length === 0) {
      return res.json({ prompt: '', alt: '' });
    }
    const products: any[] = [];
    for (const id of ids) {
      const p = await seo.getProductReviewById(id);
      if (p) products.push(p);
    }
    res.json({
      prompt: generateFeaturedImagePrompt(products, type),
      alt: generateImageAltText(products, title),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Generate full article from product review
router.post('/product-reviews/generate-article/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const product = await seo.getProductReviewById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const allReviews = await seo.getProductReviews();
    const similar = allReviews.filter((r: any) => {
      if (r.id === product.id) return false;
      if (product.best_for && r.best_for && r.best_for.toLowerCase() === product.best_for.toLowerCase()) return true;
      const words = (product.product_name || '').toLowerCase().split(/\s+/);
      const rWords = (r.product_name || '').toLowerCase().split(/\s+/);
      const common = words.filter((w: string) => w.length > 3 && rWords.includes(w));
      return common.length >= 2;
    }).slice(0, 5);

    const { generateArticleFromProductWithFallback } = await import('../../server/ai');

    // Dedup: if this product already has an article, return it instead of duplicating.
    const existingForProduct = await dbInstance.getPostsByProductId(product.id);
    const liveExisting = existingForProduct.find((p: any) => p.status !== 'deleted');
    if (liveExisting) {
      return res.json({ post: liveExisting, product, similarCount: similar.length, alreadyExists: true });
    }

    const { title, content, excerpt } = await generateArticleFromProductWithFallback(product, similar);

    const imageMd = product.product_image ? `![${product.product_name}](${product.product_image})\n\n` : '';
    const fullContent = imageMd + content;

    let slug = (product.slug || product.id) + '-' + product.product_name.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').substring(0, 40) + '-guide';
    const existingPost = await dbInstance.getPostBySlug(slug);
    if (existingPost) slug = slug + '-' + Date.now().toString(36);
    const u = (req as any).user;
    const post = await dbInstance.createPost({
      title,
      slug,
      excerpt: excerpt.substring(0, 300),
      content: fullContent,
      featuredImage: product.product_image || '',
      categoryId: product.category_id || '',
      productId: product.id,
      tags: [product.product_name, product.brand || '', 'review', 'buying guide'].filter(Boolean),
      status: 'draft',
      visibility: 'public',
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: title,
      seoDescription: excerpt.substring(0, 160),
      seoKeywords: [product.product_name, product.brand || '', 'review', 'buying guide', 'best ' + (product.best_for || '')].filter(Boolean).join(', '),
      publishedAt: undefined,
    }, u.id);

    dbInstance.log('Article Generated', `AI article from "${product.product_name}" -> "${title}"`, u.id, u.name);
    res.json({ post, product, similarCount: similar.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Generate a category-level buying guide article (How to Choose Best X)
router.post('/buying-guides/generate/:categoryId', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { generateBuyingGuideFromCategory } = await import('../../server/ai');
    const categories = await dbInstance.getCategories();
    const category = categories.find((c: any) => c.id === req.params.categoryId);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const allReviews = await seo.getProductReviews();
    const published = allReviews.filter((r: any) => r.status === 'published');
    const catProducts = published
      .filter((r: any) => r.category_id === category.id)
      .sort((a: any, b: any) => (Number(b.editor_score) || 0) - (Number(a.editor_score) || 0))
      .slice(0, 6);

    if (catProducts.length === 0) {
      return res.status(400).json({ error: `No published products found in category "${category.name}". Add products to this category first.` });
    }

    const { title, content, excerpt } = await generateBuyingGuideFromCategory(category, catProducts);

    const slug = 'best-' + (category.slug || String(category.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '-buying-guide';
    const u = (req as any).user;

    // Dedup: if this category already has a (non-draft) buying guide, return it instead
    // of creating a duplicate. Drafts are reused so a half-finished one can be edited.
    const allPosts = await Promise.resolve(dbInstance.getPosts());
    const existingGuide = allPosts.find((p: any) =>
      p.categoryId === category.id &&
      (p.tags || []).includes('buying guide') &&
      p.status !== 'deleted'
    );
    if (existingGuide) {
      dbInstance.log('Buying Guide Skipped', `Existing guide found for "${category.name}" (no duplicate created)`, u.id, u.name);
      return res.json({ post: existingGuide, category, productCount: catProducts.length, alreadyExists: true });
    }

    const existingPost = await dbInstance.getPostBySlug(slug);
    const post = await dbInstance.createPost({
      title,
      slug,
      excerpt: excerpt.substring(0, 300),
      content,
      featuredImage: '',
      categoryId: category.id,
      productId: undefined,
      tags: [category.name, 'buying guide', 'best ' + category.name.toLowerCase()].filter(Boolean),
      status: 'draft',
      visibility: 'public',
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: title,
      seoDescription: excerpt.substring(0, 160),
      seoKeywords: ['buying guide', 'how to choose', 'best ' + category.name.toLowerCase(), category.name].filter(Boolean).join(', '),
      publishedAt: undefined,
    }, u.id);

    dbInstance.log('Buying Guide Generated', `AI buying guide for "${category.name}" -> "${title}"`, u.id, u.name);
    res.json({ post, category, productCount: catProducts.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// AI Verdict Generation
router.post('/product-reviews/:id/generate-ai-verdict', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const product = await seo.getProductReviewById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const productInfo = [
      `Product: ${product.product_name}`,
      product.brand ? `Brand: ${product.brand}` : '',
      product.price ? `Price: ${product.price}` : '',
      product.rating ? `Rating: ${product.rating}/5` : '',
      product.best_for ? `Best For: ${product.best_for}` : '',
      product.review_summary ? `Summary: ${product.review_summary}` : '',
      product.pros?.length ? `Pros: ${product.pros.join(', ')}` : '',
      product.cons?.length ? `Cons: ${product.cons.join(', ')}` : '',
      product.key_features?.length ? `Features: ${product.key_features.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    const { generateProductVerdict } = await import('../../server/ai');
    const aiVerdict = await generateProductVerdict(productInfo);
    
    // Update the product review with the new verdict
    await seo.updateProductReview(product.id, { ai_verdict: aiVerdict });
    
    res.json({ success: true, aiVerdict });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Portfolio
router.get('/portfolio', authenticate, async (req, res) => {
    let items = await seo.getPortfolioProjects();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/portfolio', authenticate, async (req, res) => res.json(await seo.createPortfolioProject(req.body)));
router.put('/portfolio/:id', authenticate, async (req, res) => res.json(await seo.updatePortfolioProject(req.params.id, req.body)));
router.delete('/portfolio/:id', authenticate, async (req, res) => res.json({ success: await seo.deletePortfolioProject(req.params.id) }));

// Services
router.get('/services', authenticate, async (req, res) => {
    let items = await seo.getServices();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/services', authenticate, async (req, res) => res.json(await seo.createService(req.body)));
router.put('/services/:id', authenticate, async (req, res) => res.json(await seo.updateService(req.params.id, req.body)));
router.delete('/services/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteService(req.params.id) }));

// Comparison tables
router.get('/comparison-tables', authenticate, async (req, res) => {
    let items = await seo.getComparisonTables();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/comparison-tables', authenticate, async (req, res) => res.json(await seo.createComparisonTable(req.body)));
router.put('/comparison-tables/:id', authenticate, async (req, res) => res.json(await seo.updateComparisonTable(req.params.id, req.body)));
router.delete('/comparison-tables/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteComparisonTable(req.params.id) }));

// Content upgrades
router.get('/content-upgrades', authenticate, async (req, res) => {
    let items = await seo.getContentUpgrades();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.post('/content-upgrades', authenticate, async (req, res) => res.json(await seo.createContentUpgrade(req.body)));
router.put('/content-upgrades/:id', authenticate, async (req, res) => res.json(await seo.updateContentUpgrade(req.params.id, req.body)));
router.delete('/content-upgrades/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteContentUpgrade(req.params.id) }));

// Internal links
router.get('/internal-links', authenticate, async (req, res) => {
    let items = await seo.getInternalLinks();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.get('/internal-links/:sourceType/:sourceId', authenticate, async (req, res) => res.json(await seo.getInternalLinksForSource(req.params.sourceId, req.params.sourceType)));
router.post('/internal-links', authenticate, async (req, res) => res.json(await seo.createInternalLink(req.body)));
router.delete('/internal-links/:id', authenticate, async (req, res) => res.json({ success: await seo.deleteInternalLink(req.params.id) }));

// ====== Auto Article Factory ======
router.post('/auto-articles/generate/:productId', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { autoGenerateArticleForProduct } = await import('../../server/auto-articles');
    const product = await seo.getProductReviewById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const result = await autoGenerateArticleForProduct(product, {
      status: req.body?.status,
      withImage: req.body?.withImage,
    });
    if (result.error) return res.status(500).json({ error: result.error });
    if (result.skipped) return res.json({ ...result, skipped: true });
    dbInstance.log('Auto Article Generated', `Auto article for "${result.productName}" -> "${result.title}"`, (req as any).user?.id, (req as any).user?.name);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auto-articles/run', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { autoGenerateArticles } = await import('../../server/auto-articles');
    const limit = parseInt(req.body?.limit, 10) || undefined;
    const minScore = req.body?.minScore !== undefined ? Number(req.body.minScore) : undefined;
    // Cap the synchronous run at ~45s so the response returns before Vercel's
    // 60s function limit; the UI re-invokes to process the rest of the batch.
    const timeBudgetMs = req.body?.timeBudgetMs !== undefined ? Number(req.body.timeBudgetMs) : 45000;
    const result = await autoGenerateArticles({
      limit,
      onlyMissing: req.body?.onlyMissing !== false,
      status: req.body?.status,
      withImage: req.body?.withImage,
      minScore,
      timeBudgetMs,
      excludeIds: Array.isArray(req.body?.excludeIds) ? req.body.excludeIds : undefined,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/auto-articles/stats', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try {
    const { getAutoArticleStats } = await import('../../server/auto-articles');
    const stats = await getAutoArticleStats();
    stats.config = { ...stats.config, imageApiKey: '', imageApiKeySet: !!stats.config.imageApiKey } as any;
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/auto-articles/config', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try {
    const { getConfig } = await import('../../server/auto-articles');
    const cfg = await getConfig();
    res.json({ ...cfg, imageApiKey: '', imageApiKeySet: !!cfg.imageApiKey });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auto-articles/config', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { getConfig, saveConfig } = await import('../../server/auto-articles');
    const current = await getConfig();
    let imageApiKey = req.body?.imageApiKey;
    if (imageApiKey === undefined || imageApiKey === '') {
      imageApiKey = current.imageApiKey;
    }
    const cfg = await saveConfig({
      enabled: req.body?.enabled,
      intervalMinutes: req.body?.intervalMinutes !== undefined ? Number(req.body.intervalMinutes) : undefined,
      batchSize: req.body?.batchSize !== undefined ? Number(req.body.batchSize) : undefined,
      dailyLimit: req.body?.dailyLimit !== undefined ? Number(req.body.dailyLimit) : undefined,
      status: req.body?.status,
      withImage: req.body?.withImage,
      minScore: req.body?.minScore !== undefined ? Number(req.body.minScore) : undefined,
      imageModel: req.body?.imageModel,
      imageApiKey,
      imageProvider: req.body?.imageProvider,
      imageAccountId: req.body?.imageAccountId,
    });
    res.json({ ...cfg, imageApiKey: '', imageApiKeySet: !!cfg.imageApiKey });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auto-articles/test-image-key', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { getConfig } = await import('../../server/auto-articles');
    const cfg = await getConfig();
    const key = req.body?.apiKey || cfg.imageApiKey;
    const provider = req.body?.provider || cfg.imageProvider || 'auto';
    const accountId = req.body?.accountId || cfg.imageAccountId;
    if (provider === 'cloudflare' || (provider === 'auto' && String(key).startsWith('cfut_'))) {
      const { testCloudflareImageKey } = await import('../../server/image-gen');
      const result = await testCloudflareImageKey(key, accountId);
      return res.json(result);
    }
    const { testImageApiKey } = await import('../../server/image-gen');
    const result = await testImageApiKey(key);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/auto-articles/reset-daily', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { resetDailyCounter } = await import('../../server/auto-articles');
    await resetDailyCounter();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
