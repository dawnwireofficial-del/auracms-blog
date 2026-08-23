import express from 'express';
import { dbInstance } from '../../server/db';
import * as seo from '../../server/seo-engine';
import { sendNewsletterBroadcast } from '../../server/email';
import { sendDripEmail, getDripCampaignConfig, getNextDripStep } from '../../server/drip-campaign';
import { getSupabaseAdmin } from '../../server/lib/supabase';
import { authenticate, requireRole } from './middleware';
import { startBulkImport, processBulkImport, getBulkImportJob, cancelBulkImport } from '../../server/bulk-importer';
import { searchAmazon, scrapeAmazonSearch } from '../../server/amazon-search-scraper';
import { importProductReview, getProductReviews, updateProductReview } from '../../server/seo-engine';

const router = express.Router();

// ====== Scheduler ======
router.post('/scheduler/process', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  const { processScheduledPosts } = await import('../../server/scheduler');
  const result = await processScheduledPosts();
  res.json(result);
});

router.get('/scheduled-posts', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  let posts = (await dbInstance.getPosts() as any[]).filter((p: any) => p.status === 'scheduled').sort((a: any, b: any) => (a.scheduledAt || '').localeCompare(b.scheduledAt || ''));
  const limit = parseInt(req.query.limit as string) || 0;
  const offset = parseInt(req.query.offset as string) || 0;
  const total = posts.length;
  if (limit > 0) posts = posts.slice(offset, offset + limit);
  res.json({ data: posts, total, limit, offset });
});

// ====== Posts ======
router.get('/posts', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  const u = (req as any).user;
  let posts = await dbInstance.getPosts();
  if (u.role === 'author') posts = posts.filter(p => p.authorId === u.id);
  const limit = parseInt(req.query.limit as string) || 0;
  const offset = parseInt(req.query.offset as string) || 0;
  const total = posts.length;
  if (limit > 0) posts = posts.slice(offset, offset + limit);
  res.json({ data: posts, total, limit, offset });
});

router.post('/posts', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  const u = (req as any).user;
  const { title, slug, excerpt, content, featuredImage, featuredImageAlt, categoryId, tags, status, visibility, isFeatured, isTrending, isEditorsPick, allowComments, seoTitle, seoDescription, seoKeywords } = req.body;
  if (!title || !slug || !content) return res.status(400).json({ error: 'Title, slug, content required' });
  if (await dbInstance.getPostBySlug(slug)) return res.status(400).json({ error: 'Slug already exists' });
  const p = await dbInstance.createPost({ title, slug, excerpt: excerpt || '', content, featuredImage: featuredImage || '', featuredImageAlt: featuredImageAlt || '', categoryId: categoryId || '', tags: tags || [], status: status || 'draft', visibility: visibility || 'public', isFeatured: !!isFeatured, isTrending: !!isTrending, isEditorsPick: !!isEditorsPick, allowComments: allowComments !== false, seoTitle: seoTitle || '', seoDescription: seoDescription || '', seoKeywords: seoKeywords || '', publishedAt: status === 'published' ? new Date().toISOString() : undefined }, u.id);
  dbInstance.log('Post Created', `Created: "${p.title}"`, u.id, u.name);
  if ((p as any).status === 'published') import('../../server/indexnow').then((m) => m.pingIndexNow(`https://www.dawnwire.com/post/${p.slug}`)).catch(() => {});
  res.json(p);
});

router.put('/posts/:id', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  const u = (req as any).user;
  const post = await dbInstance.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (u.role === 'author' && post.authorId !== u.id) return res.status(403).json({ error: 'Forbidden' });
  const b = req.body;
  if (b.slug && b.slug !== post.slug && await dbInstance.getPostBySlug(b.slug)) return res.status(400).json({ error: 'Slug exists' });
  const upd = await dbInstance.updatePost(req.params.id, {
    title: b.title || post.title, slug: b.slug || post.slug, excerpt: b.excerpt !== undefined ? b.excerpt : post.excerpt, content: b.content || post.content, featuredImage: b.featuredImage !== undefined ? b.featuredImage : post.featuredImage, featuredImageAlt: b.featuredImageAlt !== undefined ? b.featuredImageAlt : post.featuredImageAlt, categoryId: b.categoryId !== undefined ? b.categoryId : post.categoryId, tags: b.tags || post.tags, status: b.status || post.status, visibility: b.visibility || post.visibility, isFeatured: b.isFeatured !== undefined ? !!b.isFeatured : post.isFeatured, isTrending: b.isTrending !== undefined ? !!b.isTrending : post.isTrending, isEditorsPick: b.isEditorsPick !== undefined ? !!b.isEditorsPick : post.isEditorsPick, allowComments: b.allowComments !== undefined ? !!b.allowComments : post.allowComments, seoTitle: b.seoTitle || post.seoTitle, seoDescription: b.seoDescription || post.seoDescription, seoKeywords: b.seoKeywords || post.seoKeywords, publishedAt: (b.status === 'published' && post.status !== 'published') ? new Date().toISOString() : post.publishedAt
  });
  dbInstance.log('Post Updated', `Updated: "${upd?.title}"`, u.id, u.name);
  if (upd && (upd as any).status === 'published') import('../../server/indexnow').then((m) => m.pingIndexNow(`https://www.dawnwire.com/post/${upd.slug}`)).catch(() => {});
  res.json(upd);
});

router.delete('/posts/:id', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  const u = (req as any).user;
  const post = await dbInstance.getPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (u.role === 'author' && post.authorId !== u.id) return res.status(403).json({ error: 'Forbidden' });
  await dbInstance.deletePost(req.params.id);
  dbInstance.log('Post Deleted', `Deleted: ${req.params.id}`, u.id, u.name);
  res.json({ success: true });
});

// ====== Categories ======
router.post('/categories', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const { name, slug, description, image, parentId, status } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  const c = await dbInstance.createCategory({ name, slug, description: description || '', image: image || '', parentId: parentId || undefined, status: status || 'active' } as any);
  dbInstance.log('Category Created', `Created: "${c.name}"`, u.id, u.name);
  res.json(c);
});

router.put('/categories/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const upd = await dbInstance.updateCategory(req.params.id, req.body);
  if (!upd) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Category Updated', `Updated: "${upd.name}"`, u.id, u.name);
  res.json(upd);
});

router.delete('/categories/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  if (!await dbInstance.deleteCategory(req.params.id)) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Category Deleted', `Deleted: ${req.params.id}`, u.id, u.name);
  res.json({ success: true });
});

// ====== Affiliate Links ======
router.get('/affiliate', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  let links = await dbInstance.getAffiliateLinks();
  const limit = parseInt(req.query.limit as string) || 0;
  const offset = parseInt(req.query.offset as string) || 0;
  const total = links.length;
  if (limit > 0) links = links.slice(offset, offset + limit);
  res.json({ data: links, total, limit, offset });
});

router.post('/affiliate', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const { title, destinationUrl, affiliateUrl, shortSlug, categoryId, postId, buttonText, disclosureText, noFollow, sponsored, openInNewTab, status } = req.body;
  if (!title || !destinationUrl || !affiliateUrl || !shortSlug) return res.status(400).json({ error: 'Missing required fields' });
  if (await dbInstance.getAffiliateBySlug(shortSlug)) return res.status(400).json({ error: 'Slug exists' });
  const l = await dbInstance.createAffiliateLink({ title, destinationUrl, affiliateUrl, shortSlug, categoryId: categoryId || undefined, postId: postId || undefined, buttonText: buttonText || 'Check Price', disclosureText: disclosureText || '', noFollow: noFollow !== false, sponsored: sponsored !== false, openInNewTab: openInNewTab !== false, status: status || 'active' });
  dbInstance.log('Affiliate Added', `Added: "${l.title}"`, u.id, u.name);
  res.json(l);
});

router.put('/affiliate/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const upd = await dbInstance.updateAffiliateLink(req.params.id, req.body);
  if (!upd) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Affiliate Updated', `Updated: "${upd.title}"`, u.id, u.name);
  res.json(upd);
});

router.delete('/affiliate/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  if (!await dbInstance.deleteAffiliateLink(req.params.id)) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Affiliate Deleted', `Deleted: ${req.params.id}`, u.id, u.name);
  res.json({ success: true });
});

// ====== Comments ======
router.get('/comments', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
    let items = await dbInstance.getComments();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

router.put('/comments/:id/status', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const { status } = req.body;
  if (!['approved', 'pending', 'spam'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!await dbInstance.updateCommentStatus(req.params.id, status)) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Comment Moderated', `Set status to "${status}" for ${req.params.id}`, u.id, u.name);
  res.json({ success: true });
});

router.delete('/comments/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  if (!await dbInstance.deleteComment(req.params.id)) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Comment Deleted', `Deleted: ${req.params.id}`, u.id, u.name);
  res.json({ success: true });
});

// ====== Pages ======
router.get('/pages', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
    let items = await dbInstance.getPages();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

router.post('/pages', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const { title, slug, content, featuredImage, status, seoTitle, seoDescription } = req.body;
  if (!title || !slug || !content) return res.status(400).json({ error: 'Title, slug, content required' });
  if (await dbInstance.getPageBySlug(slug)) return res.status(400).json({ error: 'Slug exists' });
  const p = await dbInstance.createPage({ title, slug, content, featuredImage: featuredImage || '', status: status || 'draft', createdAt: new Date().toISOString(), seoTitle: seoTitle || '', seoDescription: seoDescription || '' });
  dbInstance.log('Page Created', `Created: "${p.title}"`, u.id, u.name);
  res.json(p);
});

router.put('/pages/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const upd = await dbInstance.updatePage(req.params.id, req.body);
  if (!upd) return res.status(404).json({ error: 'Not found' });
  dbInstance.log('Page Updated', `Updated: "${upd.title}"`, u.id, u.name);
  res.json(upd);
});

router.delete('/pages/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const u = (req as any).user;
  const pages = await dbInstance.getPages();
  const page = pages.find(p => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: 'Not found' });
  await dbInstance.deletePage(req.params.id);
  dbInstance.log('Page Deleted', `Deleted: "${page.title}"`, u.id, u.name);
  res.json({ success: true });
});

// ====== Settings ======
router.put('/settings', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  const u = (req as any).user;
  const upd = await dbInstance.updateSettings(req.body);
  dbInstance.log('Settings Edited', 'Configuration adjusted.', u.id, u.name);
  res.json(upd);
});

// ====== Subscribers ======
router.get('/subscribers', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
    let items = await dbInstance.getNewsletterSubscribers();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.delete('/subscribers/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  if (!await dbInstance.deleteSubscriber(req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ====== Newsletter ======
router.post('/newsletter/send', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const { subject, html } = req.body;
  if (!subject || !html) return res.status(400).json({ error: 'Subject and HTML required' });
  const subs = await dbInstance.getNewsletterSubscribers();
  if (subs.length === 0) return res.status(400).json({ error: 'No subscribers' });
  const result = await sendNewsletterBroadcast(subs, subject, html);
  res.json({ sent: result.sent, failed: result.failed, total: subs.length });
});

// ====== Drip Campaigns ======
router.get('/drip/config', authenticate, requireRole(['super_admin', 'admin', 'editor']), (_req, res) => {
  res.json({ emails: getDripCampaignConfig() });
});

router.post('/drip/process', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const subs = await dbInstance.getSubscribersDueForDrip();
    let sent = 0;
    let failed = 0;
    for (const sub of subs) {
      const nextStep = getNextDripStep(sub);
      if (!nextStep) continue;
      const ok = await sendDripEmail(sub, nextStep);
      if (ok) {
        sent++;
        await dbInstance.updateSubscriberDripProgress(sub.id, nextStep, new Date().toISOString());
      } else {
        failed++;
      }
    }
    res.json({ processed: subs.length, sent, failed });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ====== Messages ======
router.get('/messages', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
    let items = await dbInstance.getMessages();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });
router.put('/messages/:id/read', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  if (!await dbInstance.markMessageRead(req.params.id, req.body.status)) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ====== Media ======
router.get('/media', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
    let items = await dbInstance.getMedia();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

router.post('/media', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  const { fileName, url, mimeType, size, altText } = req.body;
  if (!fileName || !url) return res.status(400).json({ error: 'File name and URL required' });
  res.json(await dbInstance.uploadMedia({ fileName, url, mimeType: mimeType || 'image/png', size: size || 1024, altText: altText || '' }));
});

const IMGBB_KEY = process.env.IMGBB_API_KEY || '';
router.post('/upload-image', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  try {
    const { base64, fileName } = req.body;
    if (!base64) return res.status(400).json({ error: 'base64 image data required' });
    const raw = base64.includes(',') ? base64.split(',')[1] : base64;
    const body = new URLSearchParams({ image: raw, name: fileName || 'upload' });
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    });
    const data: any = await imgbb.json();
    if (!data.success) return res.status(500).json({ error: data.error?.message || 'ImageBB upload failed' });
    const url = data.data.url;
    const item = await dbInstance.uploadMedia({
      fileName: fileName || data.data.image?.filename || 'Image',
      url, mimeType: 'image/*', size: data.data.size || 0,
      altText: fileName || '',
    });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/media/:id', authenticate, requireRole(['super_admin', 'admin', 'editor', 'author']), async (req, res) => {
  if (!await dbInstance.deleteMedia(req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ====== Users ======
router.get('/users', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    let items = await dbInstance.getUsers();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

router.post('/users', authenticate, requireRole(['super_admin']), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  if (await dbInstance.getUserByEmail(email)) return res.status(400).json({ error: 'Email exists' });
  res.json(await dbInstance.createUser({ name, email, role, status: 'active' }, password));
});

router.put('/users/:id', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  const au = (req as any).user;
  const u = await dbInstance.getUserById(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  if (au.role !== 'super_admin' && u.role === 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  const b = req.body;
  res.json(await dbInstance.updateUser(req.params.id, { name: b.name || u.name, role: b.role || u.role, status: b.status || u.status, bio: b.bio !== undefined ? b.bio : u.bio, avatar: b.avatar !== undefined ? b.avatar : u.avatar }, b.password || undefined));
});

// ====== Logs ======
router.get('/logs', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    let items = await dbInstance.getLogs();
    const limit = parseInt(req.query.limit as string) || 0;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = items.length;
    if (limit > 0) items = items.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
  });

// ====== Testimonials ======
router.get('/testimonials', authenticate, async (_req, res) => { try { res.json(await seo.getTestimonials()); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/testimonials', authenticate, async (req, res) => { try { res.json(await seo.createTestimonial(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/testimonials/:id', authenticate, async (req, res) => { try { res.json(await seo.updateTestimonial(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/testimonials/:id', authenticate, async (req, res) => { try { res.json({ success: await seo.deleteTestimonial(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ====== Topic Clusters ======
router.get('/topic-clusters', authenticate, async (_req, res) => res.json(await dbInstance.getTopicClusters()));
router.post('/topic-clusters', authenticate, async (req, res) => res.json(await dbInstance.createTopicCluster(req.body)));
router.put('/topic-clusters/:id', authenticate, async (req, res) => res.json(await dbInstance.updateTopicCluster(req.params.id, req.body)));
router.delete('/topic-clusters/:id', authenticate, async (req, res) => res.json({ success: await dbInstance.deleteTopicCluster(req.params.id) }));

// ====== Affiliate Platform Routes ======

// Brands
router.get('/brands', authenticate, async (_req, res) => { try { res.json(await dbInstance.getBrands()); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/brands', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createBrand(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/brands/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateBrand(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/brands/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteBrand(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Category Banners
router.get('/category-banners/:categoryId', authenticate, async (req, res) => { try { res.json(await dbInstance.getCategoryBanners(req.params.categoryId)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/category-banners', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createCategoryBanner(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/category-banners/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateCategoryBanner(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/category-banners/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteCategoryBanner(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Category Sections
router.get('/category-sections/:categoryId', authenticate, async (req, res) => { try { res.json(await dbInstance.getCategorySections(req.params.categoryId)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/category-sections', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createCategorySection(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/category-sections/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateCategorySection(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/category-sections/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteCategorySection(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Deals
router.get('/deals', authenticate, async (req, res) => { try { const { categoryId, status } = req.query; res.json(await dbInstance.getDeals(categoryId as string, status as string)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/deals', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createDeal(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/deals/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateDeal(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/deals/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteDeal(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Homepage Sections
router.get('/homepage-sections', authenticate, async (_req, res) => { try { res.json(await dbInstance.getHomepageSections()); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/homepage-sections', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createHomepageSection(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/homepage-sections/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateHomepageSection(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/homepage-sections/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteHomepageSection(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Homepage Hero Slides
router.get('/homepage-hero', authenticate, async (_req, res) => { try { res.json(await dbInstance.getHomepageHeroSlides()); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ====== Shopping Events admin (CRUD + toggle + curation) ======
router.get('/events', authenticate, async (_req, res) => { try { const { listEvents } = await import('../../server/events-db'); res.json(await listEvents(false)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.post('/events', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { const m = await import('../../server/events-db'); res.json(await m.createEvent(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/events/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { const m = await import('../../server/events-db'); res.json(await m.updateEvent(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/events/:id', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => { try { const m = await import('../../server/events-db'); res.json({ success: await m.deleteEvent(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/events/:id/products', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const ids: string[] = Array.isArray(req.body?.productIds) ? req.body.productIds.filter((x: any) => typeof x === 'string') : [];
    if (ids.length > 100) return res.status(400).json({ error: 'Max 100 products per event' });
    const { setEventProducts } = await import('../../server/events-db');
    res.json({ count: await setEventProducts(req.params.id, ids) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.get('/events/:id/products', authenticate, async (req, res) => {
  try {
    const { getEventProductIds } = await import('../../server/events-db');
    res.json({ productIds: await getEventProductIds(req.params.id) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.post('/homepage-hero', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.createHomepageHeroSlide(req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.put('/homepage-hero/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json(await dbInstance.updateHomepageHeroSlide(req.params.id, req.body)); } catch (e: any) { res.status(500).json({ error: e.message }); } });
router.delete('/homepage-hero/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { res.json({ success: await dbInstance.deleteHomepageHeroSlide(req.params.id) }); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Click Analytics
router.get('/click-analytics', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { const days = parseInt(req.query.days as string) || 30; res.json(await dbInstance.getClickAnalytics(days, (req.query.groupBy as any) || 'product')); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// Search Analytics
router.get('/search-analytics', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => { try { const days = parseInt(req.query.days as string) || 30; res.json(await dbInstance.getSearchAnalytics(days)); } catch (e: any) { res.status(500).json({ error: e.message }); } });

// ====== Amazon Product Sync ======
const sync = () => import('../../server/amazon-sync-engine');

// Dashboard stats
router.get('/amazon-sync/stats', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { const m = await sync(); res.json(await m.getSyncDashboardStats()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// List sync statuses
router.get('/amazon-sync/products', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const filter: any = {};
    if (req.query.sync_status) filter.sync_status = req.query.sync_status;
    if (req.query.asin) filter.asin = req.query.asin;
    if (req.query.marketplace) filter.marketplace_code = req.query.marketplace;
    if (req.query.is_available) filter.is_available = req.query.is_available === 'true';
    if (req.query.is_deal) filter.is_deal = req.query.is_deal === 'true';
    if (req.query.search) filter.search = req.query.search;
    res.json(await dbInstance.listAmazonSyncStatus(limit, offset, filter));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Get product sync details
router.get('/amazon-sync/products/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { const m = await sync(); res.json(await m.getProductSyncDetails(req.params.id)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync single product
router.post('/amazon-sync/sync-one', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { const m = await sync(); const result = await m.syncProductById(req.body.productId); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync selected products
router.post('/amazon-sync/sync-selected', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { const m = await sync(); const result = await m.syncSelectedProducts(req.body.productIds || []); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync category
router.post('/amazon-sync/sync-category', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { const m = await sync(); const result = await m.syncCategory(req.body.categoryId); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync featured products
router.post('/amazon-sync/sync-featured', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { const m = await sync(); const result = await m.syncFeaturedProducts(); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync all products
router.post('/amazon-sync/sync-all', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try { const m = await sync(); const result = await m.syncAllProducts(); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Pause sync
router.post('/amazon-sync/pause', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { const m = await sync(); m.pauseSync(); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Resume sync
router.post('/amazon-sync/resume', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { const m = await sync(); m.resumeSync(); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Initialize existing products
router.post('/amazon-sync/initialize', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try { const m = await sync(); const result = await m.initializeExistingProducts(); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Settings
router.get('/amazon-sync/settings', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { res.json(await dbInstance.getAmazonSyncSettings()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.put('/amazon-sync/settings', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try { res.json({ success: await dbInstance.updateAmazonSyncSettings(req.body) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Price history
router.get('/amazon-sync/price-history/:productId', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { res.json(await dbInstance.getAmazonPriceHistory(req.params.productId)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Sync logs
router.get('/amazon-sync/logs', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { res.json(await dbInstance.getAmazonSyncLogs(req.query.productId as string, req.query.batchId as string)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Marketplaces
router.get('/amazon-sync/marketplaces', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (_req, res) => {
  try { res.json(await dbInstance.getAmazonMarketplaces()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// API credentials
router.get('/amazon-sync/credentials', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try { res.json(await dbInstance.getAmazonApiCredentials()); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
router.put('/amazon-sync/credentials', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try { res.json({ success: await dbInstance.upsertAmazonApiCredential(req.body) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// API usage
router.get('/amazon-sync/api-usage', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try { const days = parseInt(req.query.days as string) || 7; res.json(await dbInstance.getAmazonApiUsage(days)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Queue trigger
router.post('/amazon-sync/trigger-cycle', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try { const m = await sync(); const result = await m.processSyncCycle(); res.json(result); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ====== Affiliate Link Health & Manual Updates ======
const affiliateHealth = () => import('../../server/affiliate-health');

// Current tag (for extension + UI)
router.get('/affiliate/config', authenticate, async (_req, res) => {
  try {
    const m = await affiliateHealth();
    res.json({ affiliateTag: m.getAffiliateTag(), amazonDomains: m.AMAZON_DOMAINS });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// KPI + filterable list
router.get('/affiliate/health', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const m = await affiliateHealth();
    const sb = await getSupabaseAdmin();
    const all = await seo.getProductReviews();
    const cats = await dbInstance.getCategories();
    const catNameById = new Map(cats.map((c: any) => [c.id, c.name]));
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const filter = (req.query.filter as string) || '';
    const search = (req.query.search as string || '').toLowerCase();

    const evaluated = all.map((p: any) => {
      const r = m.evaluateLink(p);
      return {
        id: p.id,
        product_name: p.product_name,
        slug: p.slug,
        status: p.status,
        category_id: p.category_id,
        category_name: catNameById.get(p.category_id) || '',
        asin: r.asin || p.asin || (p.specs && p.specs.asin) || null,
        affiliate_url: p.affiliate_url || null,
        amazon_url: p.amazon_url || null,
        public_url: m.cleanPublicUrl(p.affiliate_url || p.amazon_url),
        generated_url: r.asin ? m.generateAffiliateUrl(r.asin) : null,
        validation_status: r.status,
        note: r.note || '',
        product_image: p.product_image || null,
        rating: p.rating,
        editor_score: p.editor_score,
        brand: p.brand,
        created_at: p.created_at,
        updated_at: p.updated_at,
        click_count: p.click_count || 0,
      };
    });

    // Merge health flags from affiliate_health
    const { data: healthRows } = await sb.from('affiliate_health').select('product_id, marked_for_update, manual_note, marked_by, marked_at, last_checked_at, checked_by');
    const healthMap = new Map<string, any>((healthRows || []).map((h: any) => [h.product_id, h] as [string, any]));
    evaluated.forEach((row: any) => {
      const h = healthMap.get(row.id);
      row.marked_for_update = !!(h && h.marked_for_update);
      row.manual_note = (h && h.manual_note) || '';
      row.marked_by = (h && h.marked_by) || null;
      row.marked_at = (h && h.marked_at) || null;
      row.last_checked_at = (h && h.last_checked_at) || null;
      row.checked_by = (h && h.checked_by) || null;
    });

    let filtered = evaluated;
    if (filter === 'needs-update') filtered = filtered.filter((r: any) => r.validation_status === 'fixable' || r.validation_status === 'system_generated' || r.validation_status === 'broken');
    else if (filter === 'fixable') filtered = filtered.filter((r: any) => r.validation_status === 'fixable');
    else if (filter === 'system-generated') filtered = filtered.filter((r: any) => r.validation_status === 'system_generated');
    else if (filter === 'broken') filtered = filtered.filter((r: any) => r.validation_status === 'broken');
    else if (filter === 'healthy') filtered = filtered.filter((r: any) => r.validation_status === 'healthy');
    else if (filter === 'no-asin') filtered = filtered.filter((r: any) => !r.asin);
    else if (filter === 'marked') filtered = filtered.filter((r: any) => r.marked_for_update);
    else if (filter === 'draft') filtered = filtered.filter((r: any) => r.status === 'draft');
    else if (filter === 'recent') filtered = filtered.filter((r: any) => r.created_at && Date.now() - new Date(r.created_at).getTime() < 7 * 86400000);
    else if (filter === 'not-checked') filtered = filtered.filter((r: any) => !r.last_checked_at);
    if (search) filtered = filtered.filter((r: any) => (r.product_name || '').toLowerCase().includes(search) || (r.asin || '').toLowerCase().includes(search) || (r.brand || '').toLowerCase().includes(search));

    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit);
    const counts: any = {};
    evaluated.forEach((r: any) => { counts[r.validation_status] = (counts[r.validation_status] || 0) + 1; });
    counts.total = evaluated.length;
    counts.healthy_pct = evaluated.length ? Math.round(((counts.healthy || 0) / evaluated.length) * 100) : 0;
    counts.missing_links = (counts.fixable || 0) + (counts.system_generated || 0) + (counts.broken || 0);
    counts.missing_asins = evaluated.filter((r: any) => !r.asin).length;
    counts.marked = evaluated.filter((r: any) => r.marked_for_update).length;
    counts.draft = evaluated.filter((r: any) => r.status === 'draft').length;
    counts.published = evaluated.filter((r: any) => r.status === 'published').length;
    const lastAudit = healthRows && healthRows.length ? Math.max(...healthRows.map((h: any) => new Date(h.last_checked_at || 0).getTime())) : 0;
    counts.last_audit = lastAudit ? new Date(lastAudit).toISOString() : null;
    counts.affiliate_tag = m.getAffiliateTag();

    res.json({ data, total, limit, offset, counts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Run a full audit now (report-only) + optional auto-draft
router.post('/affiliate/audit', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const u = (req as any).user;
    const m = await affiliateHealth();
    const result = await m.runAudit({ checkedBy: `admin:${u.name || u.id}` });
    const draft = req.body?.applyDraft === true;
    let draftResult = null;
    if (draft) draftResult = await m.markDraftUntilLinked();
    res.json({ ...result, draftApplied: draft, draftResult });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Manual affiliate-link save (paste box). Writes ONLY affiliate_url + status flip.
router.put('/affiliate/link/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const u = (req as any).user;
    const { affiliateUrl } = req.body;
    if (!affiliateUrl || typeof affiliateUrl !== 'string') return res.status(400).json({ error: 'affiliateUrl required' });
    const m = await affiliateHealth();
    if (!m.isAmazonDomain(affiliateUrl)) return res.status(400).json({ error: 'Only Amazon affiliate links are allowed' });

    const existing = await seo.getProductReviewById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const oldUrl = existing.affiliate_url || null;
    const updated = await seo.updateProductReview(req.params.id, { affiliate_url: affiliateUrl.trim() });

    const sb = await getSupabaseAdmin();
    await sb.from('affiliate_link_log').insert({
      id: crypto.randomUUID(),
      product_id: req.params.id,
      old_url: oldUrl,
      new_url: affiliateUrl.trim(),
      updated_by: u.name || u.id,
      source: 'admin',
    });
    // Clear marked-for-update + refresh health for this product
    const evalResult = m.evaluateLink({ ...existing, affiliate_url: affiliateUrl.trim() });
    await sb.from('affiliate_health').upsert({
      product_id: req.params.id,
      asin: evalResult.asin,
      affiliate_tag: m.getAffiliateTag(),
      validation_status: evalResult.status,
      marked_for_update: false,
      last_checked_at: new Date().toISOString(),
      checked_by: `admin:${u.name || u.id}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_id' });
    // Publish the product now that it has an authorized link
    if (existing.status === 'draft' || existing.status == null) {
      await seo.updateProductReview(req.params.id, { status: 'published' });
    }
    res.json({ success: true, product: updated, oldUrl });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Mark / unmark for manual update
router.post('/affiliate/mark/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const u = (req as any).user;
    const sb = await getSupabaseAdmin();
    const existing = await seo.getProductReviewById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await sb.from('affiliate_health').upsert({
      product_id: req.params.id,
      asin: existing.asin || (existing.specs && existing.specs.asin) || null,
      affiliate_tag: (await affiliateHealth()).getAffiliateTag(),
      validation_status: (await affiliateHealth()).evaluateLink(existing).status,
      marked_for_update: req.body.mark !== false,
      manual_note: req.body.note || null,
      marked_by: u.name || u.id,
      marked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_id' });
    res.json({ success: true, marked: req.body.mark !== false });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Link change history for a product
router.get('/affiliate/history/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const sb = await getSupabaseAdmin();
    const { data } = await sb.from('affiliate_link_log').select('*').eq('product_id', req.params.id).order('updated_at', { ascending: false }).limit(20);
    res.json(data || []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Single-product health (used by the browser extension recheck banner)
router.get('/affiliate/product/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const m = await affiliateHealth();
    const p = await seo.getProductReviewById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    const sb = await getSupabaseAdmin();
    const { data: h } = await sb.from('affiliate_health').select('*').eq('product_id', req.params.id).maybeSingle();
    const r = m.evaluateLink(p);
    res.json({
      id: p.id,
      product_name: p.product_name,
      slug: p.slug,
      status: p.status,
      asin: r.asin || p.asin || (p.specs && p.specs.asin) || null,
      affiliate_url: p.affiliate_url || null,
      public_url: m.cleanPublicUrl(p.affiliate_url || p.amazon_url),
      generated_url: r.asin ? m.generateAffiliateUrl(r.asin) : null,
      validation_status: r.status,
      note: r.note || '',
      affiliate_tag: m.getAffiliateTag(),
      marked_for_update: !!(h && h.marked_for_update),
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Product Reviews — list all (including drafts)
router.get('/product-reviews', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const all = await seo.getProductReviews();
    const cats = await dbInstance.getCategories();
    const catNameById = new Map(cats.map((c: any) => [c.id, c.name]));
    const limit = Math.min(parseInt(req.query.limit as string) || 500, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const total = all.length;
    const light = req.query.light === '1' || req.query.light === 'true';
    const LIGHT = ['review_article', 'final_verdict', 'pros', 'cons', 'faq', 'seo_description', 'seo_keywords', 'seo_title', 'specs', 'affiliate_disclosure'];
    let items = all.slice(offset, offset + limit).map((r: any) => ({
      ...r,
      category: r.category_id ? catNameById.get(r.category_id) || '' : ''
    }));
    if (light) {
      items = items.map((r: any) => {
        const slim: Record<string, any> = {};
        Object.keys(r).forEach((k) => { if (!LIGHT.includes(k)) slim[k] = r[k]; });
        if (typeof slim.review_summary === 'string' && slim.review_summary.length > 280) slim.review_summary = slim.review_summary.slice(0, 280) + '…';
        if (Array.isArray(slim.key_features)) slim.key_features = slim.key_features.slice(0, 6);
        return slim;
      });
    }
    res.json({ data: items, total, limit, offset });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ====== Product Articles ======
// List all products joined with any linked generated blog post (for edit/publish)
router.get('/product-articles', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const [products, posts] = await Promise.all([seo.getProductReviews(), dbInstance.getPosts()]);
    const postByProduct = new Map<string, any>();
    for (const p of posts) {
      if (!p.productId) continue;
      const arr = postByProduct.get(p.productId) || [];
      arr.push(p);
      postByProduct.set(p.productId, arr);
    }
    const items = products.map((r: any) => ({
      ...r,
      articles: postByProduct.get(r.id) || [],
      hasArticle: (r.review_article || '').length > 0,
      articlePreview: (r.review_article || '').substring(0, 160),
    }));
    res.json({ data: items, total: items.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update a product's review_article body (product-as-article)
router.put('/product-articles/:id', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { review_article, faq, affiliate_disclosure } = req.body;
    const payload: Record<string, any> = {};
    if (typeof review_article === 'string') payload.review_article = review_article;
    if (faq !== undefined) payload.faq = Array.isArray(faq) ? faq : [];
    if (typeof affiliate_disclosure === 'string') payload.affiliate_disclosure = affiliate_disclosure;
    const updated = await updateProductReview(req.params.id, payload);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Product Reviews — create
router.post('/products', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const body = req.body;
    const mapped = {
      product_name: body.title || body.product_name || 'Product',
      brand: body.brand || '',
      product_image: Array.isArray(body.images) ? body.images[0] : (body.product_image || ''),
      gallery: Array.isArray(body.images) ? body.images.filter(Boolean) : undefined,
      mainCategory: body.mainCategory || body.category || '',
      affiliate_url: body.affiliate_url || body.amazonOriginalUrl || body.amazon_url || '',
      price: String(body.currentPrice || body.price || ''),
      original_price: String(body.referencePrice || body.original_price || body.listPrice || ''),
      rating: Number(body.rating) || 0,
      review_count: Number(body.review_count || body.reviewCount) || 0,
      pros: Array.isArray(body.pros) ? body.pros : [],
      cons: Array.isArray(body.cons) ? body.cons : [],
      key_features: Array.isArray(body.mainFeatures) ? body.mainFeatures : (Array.isArray(body.key_features) ? body.key_features : []),
      review_summary: body.shortDescription || body.review_summary || '',
      asin: body.asin || '',
      specs: body.specifications || body.specs || {},
      status: body.status || 'published',
    };
    const created = await seo.createProductReview(mapped);
    res.json(created);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Import product from ASIN via Amazon PA-API
router.post('/products/import-from-asin', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { asin } = req.body;
    if (!asin || !/^[A-Z0-9]{10}$/.test(asin.toUpperCase())) {
      return res.status(400).json({ error: 'Valid ASIN required (10 alphanumeric characters)' });
    }
    const cleanAsin = asin.toUpperCase();

    const { extractAsinFromUrl, getItemsByAsin, getMarketplaceDomain } = await import('../../server/amazon-api-client');
    const { scrapeAmazonHtml } = await import('../../server/amazon-extractor');
    const { dbInstance } = await import('../../server/db');

    const credentials = await dbInstance.getAmazonApiCredentials().catch(() => []);
    let config: any = null;
    if (Array.isArray(credentials) && credentials.length > 0) {
      const cred = credentials[0];
      config = {
        credentials: {
          accessKey: cred.access_key || process.env.AMAZON_ACCESS_KEY,
          secretKey: cred.secret_key || process.env.AMAZON_SECRET_KEY,
          partnerTag: cred.partner_tag || process.env.AMAZON_PARTNER_TAG || 'dawnwire-20',
          marketplace: cred.marketplace || 'US'
        },
        region: 'us-east-1',
        endpoint: 'webservices.amazon.com'
      };
    } else if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY) {
      config = {
        credentials: {
          accessKey: process.env.AMAZON_ACCESS_KEY,
          secretKey: process.env.AMAZON_SECRET_KEY,
          partnerTag: process.env.AMAZON_PARTNER_TAG || 'dawnwire-20',
          marketplace: 'US'
        },
        region: 'us-east-1',
        endpoint: 'webservices.amazon.com'
      };
    }

    if (!config) {
      return res.status(400).json({ error: 'Amazon PA-API credentials not configured. Set AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY env vars or configure via Admin > Amazon Sync > Credentials.' });
    }

    const results = await getItemsByAsin(config, [cleanAsin]);
    if (!results || results.length === 0) {
      return res.status(404).json({ error: `No product found for ASIN ${cleanAsin}` });
    }

    const amazonData = results[0];
    const slug = (amazonData.title || `product-${cleanAsin}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const allReviews = await seo.getProductReviews();
    const existingSlug = allReviews.find((r: any) => r.slug === slug);
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Chain web scrape to supplement PA-API data (rating, video, description — fields PA-API doesn't provide)
    let scraped: any = null;
    try {
      const scrapePromise = scrapeAmazonHtml(cleanAsin);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Scrape timeout')), 15000));
      scraped = await Promise.race([scrapePromise, timeoutPromise]);
    } catch {
      // Scrape is best-effort; proceed with PA-API data alone
    }

    // Map PA-API variations to importProductReview format
    const variations = (amazonData.variations || []).map((v: any) => ({
      name: 'Size',
      selectedValue: v.asin === cleanAsin ? (amazonData.title || '') : (v.title || ''),
      options: [
        { value: v.asin, price: v.price ? String(v.price) : undefined, image: v.mainImage }
      ],
      priceRange: amazonData.variationSummary
        ? { low: String(amazonData.variationSummary.lowestPrice || ''), high: String(amazonData.variationSummary.highestPrice || '') }
        : undefined
    }));

    // Compute savings and discount from PA-API data
    const savings = amazonData.savingAmount ? String(amazonData.savingAmount) : undefined;
    const price = amazonData.price ? String(amazonData.price) : undefined;
    const listPrice = amazonData.referencePrice ? String(amazonData.referencePrice) : undefined;

    const productData: Record<string, any> = {
      product_name: amazonData.title || `Amazon Product (${cleanAsin})`,
      brand: amazonData.brand || '',
      price,
      listPrice,
      rating: scraped?.rating || undefined,
      reviewCount: scraped && scraped.rating ? (scraped.reviewCount || 1250) : undefined,
      affiliate_url: amazonData.affiliateUrl || `https://www.amazon.com/dp/${cleanAsin}?tag=${config.credentials.partnerTag}`,
      amazon_url: amazonData.productUrl || `https://www.amazon.com/dp/${cleanAsin}`,
      product_image: amazonData.mainImage || scraped?.mainImage || '',
      gallery: amazonData.additionalImages?.length ? amazonData.additionalImages : (scraped?.images?.slice(1) || []),
      review_summary: scraped?.mainFeatures?.length ? scraped.mainFeatures.join('\n') : (amazonData.features?.length ? amazonData.features.join('\n') : ''),
      videoUrl: scraped?.videoUrl || undefined,
      pros: [],
      cons: [],
      key_features: amazonData.features?.length ? amazonData.features : (scraped?.mainFeatures || []),
      best_for: amazonData.category || scraped?.bestFor || '',
      final_verdict: '',
      asin: cleanAsin,
      source: 'amazon-pa-api',
      variations: variations.length > 0 ? variations : undefined,
      savings,
      stockStatus: amazonData.isAvailable ? 'in_stock' : 'out_of_stock',
      dealBadge: amazonData.isDeal ? 'Amazon Deal' : null,
      specs: {
        asin: cleanAsin,
        source: 'amazon-pa-api',
        marketplace: 'US',
        availability: amazonData.availability || '',
        isPrime: String(amazonData.isPrimeDeal || amazonData.isPrimeExclusive || false),
        currency: amazonData.currency || '',
        savingAmount: savings || '',
        discountPercent: amazonData.discountPercent !== undefined ? String(amazonData.discountPercent) : '',
        dealPrice: amazonData.dealPrice !== undefined ? String(amazonData.dealPrice) : '',
        dealEndTime: amazonData.dealEndTime || '',
        isPrimeDeal: String(amazonData.isPrimeDeal || false),
        isPrimeExclusive: String(amazonData.isPrimeExclusive || false)
      },
      status: 'published'
    };

    const created = await Promise.race([
      seo.importProductReview(productData as any),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Import timed out after 60s')), 60000))
    ]);
    const u = (req as any).user;
    dbInstance.log('Product Imported', `Imported: "${created.product_name}" (ASIN: ${cleanAsin})`, u.id, u.name);

    return res.json({ success: true, product: created });
    // Auto-regenerate catalog in background
    const { regenerateCatalog } = await import('../../server/api-cache');
    regenerateCatalog().catch(() => {});
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Import failed' });
  }
});

// Seed default product categories (run once)
router.post('/setup/product-categories', async (_req, res) => {
  try {
    const existing = await dbInstance.getCategories();
    const slugs = new Set(existing.map((c: any) => c.slug?.toLowerCase()));

    const { randomUUID } = await import('crypto');
    const defaultCats = [
      { id: randomUUID(), name: 'Electronics', slug: 'electronics', description: 'TVs, headphones, laptops, smartphones, and gadgets' },
      { id: randomUUID(), name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home improvement, kitchen gadgets, furniture, and decor' },
      { id: randomUUID(), name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Skincare, makeup, hair care, and personal grooming' },
      { id: randomUUID(), name: 'Fitness', slug: 'fitness', description: 'Fitness apparel, equipment, and accessories' },
      { id: randomUUID(), name: 'Baby Products', slug: 'baby-products', description: 'Baby gear, nursery essentials, and childcare products' },
      { id: randomUUID(), name: 'Automotive', slug: 'automotive', description: 'Car parts, accessories, and automotive tools' },
      { id: randomUUID(), name: 'Office & Productivity', slug: 'office-productivity', description: 'Office supplies, computer accessories, and productivity tools' },
      { id: randomUUID(), name: 'Gaming', slug: 'gaming', description: 'Gaming chairs, headsets, mice, keyboards, and accessories' },
      { id: randomUUID(), name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports equipment, outdoor gear, and recreation' },
      { id: randomUUID(), name: 'Toys & Games', slug: 'toys-games', description: 'Toys, board games, and educational play' },
      { id: randomUUID(), name: 'AI & Software Tools', slug: 'ai-software-tools', description: 'AI hardware accessories, developer desk gadgets, smart ambient monitors, and cloud tools' },
    ];

    const created: string[] = [];
    let sb;
    try {
      sb = await getSupabaseAdmin();
    } catch {
      sb = null;
    }

    for (const cat of defaultCats) {
      if (!slugs.has(cat.slug)) {
        if (sb) {
          // Use admin client directly to avoid schema cache issues
          const slugExists = await sb.from('categories').select('id').eq('slug', cat.slug).maybeSingle();
          if (!slugExists.data) {
            const { error } = await sb.from('categories').insert([
              { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, status: 'active' }
            ]);
            if (error) throw error;
          }
        } else {
          await dbInstance.createCategory({ ...cat, icon: 'tag', status: 'active' as const });
        }
        created.push(cat.name);
      }
    }

    res.json({ success: true, created, message: created.length ? `Added: ${created.join(', ')}` : 'All categories already exist' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Setup failed' });
  }
});

// Fix missing columns in product_reviews table
router.post('/products/repair-schema', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const supabaseRef = process.env.SUPABASE_PROJECT_REF || '';
    const supabaseToken = process.env.SUPABASE_ACCESS_TOKEN || '';
    const sql = `
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS editor_score INTEGER DEFAULT 0;
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS final_verdict TEXT;
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS best_for TEXT;
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Buy on Amazon';
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]';
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS pros JSONB DEFAULT '[]';
      ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS cons JSONB DEFAULT '[]';
    `;
    if (supabaseRef && supabaseToken) {
      const r = await fetch(`https://api.supabase.com/v1/projects/${supabaseRef}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql })
      });
      if (!r.ok) throw new Error((await r.text()).substring(0, 200));
      // Notify PostgREST to reload schema cache
      await fetch(`https://api.supabase.com/v1/projects/${supabaseRef}/database/query`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'NOTIFY pgrst, $$reload schema$$' })
      });
      res.json({ success: true, message: 'Schema repair completed. Columns added if missing.' });
    } else {
      res.status(400).json({ error: 'SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF env vars required. Set them in Vercel or run supabase/migrations/012_add_editor_score.sql in Supabase SQL Editor manually.' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Schema repair failed' });
  }
});

router.post('/products/bulk-import', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timeout' });
  }, 15000);
  try {
    const { source, asins, queries, marketplace, maxProducts, updateExisting } = req.body;
    if (!source || !['csv', 'search', 'category'].includes(source)) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'Invalid source. Use csv, search, or category.' });
    }
    if (source === 'csv' && (!asins || !Array.isArray(asins) || asins.length === 0)) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'asins array required for csv source' });
    }
    if ((source === 'search' || source === 'category') && (!queries || !Array.isArray(queries) || queries.length === 0)) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'queries array required for search/category source' });
    }

    const u = (req as any).user;
    const token = req.headers.authorization?.replace('Bearer ', '') || '';

    const job = await startBulkImport({
      source,
      asins,
      queries,
      marketplace: marketplace || 'US',
      maxProducts: maxProducts || 1000,
      updateExisting: updateExisting !== false,
      adminToken: token,
    });

    clearTimeout(timeout);
    dbInstance.log('Bulk Import Started', `Source: ${source}, Total: ${job.totalItems}`, u.id, u.name);
    res.json({ success: true, job });
  } catch (e: any) {
    clearTimeout(timeout);
    res.status(500).json({ error: e.message || 'Failed to start bulk import' });
  }
});

router.get('/products/bulk-import/:jobId', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timeout' });
  }, 4000);
  try {
    const job = await getBulkImportJob(req.params.jobId);
    clearTimeout(timeout);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e: any) {
    clearTimeout(timeout);
    if (!res.headersSent) res.status(500).json({ error: e.message || 'Failed to fetch job' });
  }
});

router.post('/products/bulk-import/:jobId/cancel', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timeout' });
  }, 4000);
  try {
    const ok = await cancelBulkImport(req.params.jobId);
    clearTimeout(timeout);
    if (!ok) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true });
  } catch (e: any) {
    clearTimeout(timeout);
    if (!res.headersSent) res.status(500).json({ error: e.message || 'Failed to cancel job' });
  }
});

// Auto-import products from Amazon for all product categories
let autoImportJob: any = null;
router.post('/products/auto-import-all-categories', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timeout' });
  }, 300000);
  try {
    if (autoImportJob && autoImportJob.status === 'running') {
      clearTimeout(timeout);
      return res.status(409).json({ error: 'Auto-import already running', job: autoImportJob });
    }

    const { marketplace = 'US', maxPerCategory = 100 } = req.body;
    const categories = await dbInstance.getCategories();
    const productCats = categories.filter((c: any) =>
      c.status === 'active' &&
      !['business', 'lifestyle', 'seo-marketing', 'technology'].includes(c.slug?.toLowerCase())
    );

    autoImportJob = {
      status: 'running',
      startedAt: new Date().toISOString(),
      totalCategories: productCats.length,
      results: [] as any[],
    };

    const totalImported: string[] = [];
    for (const cat of productCats) {
      const catResult: any = { name: cat.name, slug: cat.slug, searched: 0, found: 0, imported: 0, failed: 0, skipped: 0, error: null };
      try {
        const results = await scrapeAmazonSearch(cat.name, marketplace, maxPerCategory);
        catResult.searched = 1;
        catResult.found = results.length;
        const allExisting = await getProductReviews();
        for (const r of results) {
          try {
            const exists = allExisting.find((x: any) =>
              x.specs?.asin === r.asin || x.amazon_url?.includes(r.asin) || x.slug?.includes(r.asin)
            );
            if (exists) {
              catResult.skipped++;
              continue;
            }
            const imported = await importProductReview({
              product_name: r.title.substring(0, 200),
              product_image: r.image,
              price: r.price ? String(r.price) : undefined,
              asin: r.asin,
              amazon_url: r.url,
              source: 'amazon',
              best_for: cat.slug,
              category_id: cat.id,
              specs: { asin: r.asin, source: 'amazon' },
            });
            if (imported) {
              catResult.imported++;
              totalImported.push(r.title);
            } else {
              catResult.failed++;
            }
          } catch (e: any) {
            catResult.failed++;
          }
        }
      } catch (e: any) {
        catResult.error = e.message;
      }
      autoImportJob.results.push(catResult);
    }

    autoImportJob.status = 'completed';
    autoImportJob.completedAt = new Date().toISOString();
    autoImportJob.totalImported = totalImported.length;

    const u = (req as any).user;
    dbInstance.log('Auto-Import Completed', `Categories: ${productCats.length}, Imported: ${totalImported.length}`, u.id, u.name);

    clearTimeout(timeout);
    res.json({ success: true, job: autoImportJob });
  } catch (e: any) {
    clearTimeout(timeout);
    if (autoImportJob) autoImportJob.status = 'failed';
    res.status(500).json({ error: e.message || 'Auto-import failed' });
  }
});

router.get('/products/auto-import-all-categories/status', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  res.json({ job: autoImportJob || { status: 'idle', lastRun: null } });
});

router.post('/products/search-amazon', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timeout' });
  }, 20000);
  try {
    const { query, marketplace = 'US', maxResults = 50 } = req.body;
    if (!query) {
      clearTimeout(timeout);
      return res.status(400).json({ error: 'query required' });
    }
    const results = await searchAmazon(query, marketplace, maxResults);
    clearTimeout(timeout);
    if (results === null) {
      return res.status(429).json({ error: 'Amazon returned a CAPTCHA or blocked the request. Try again later.' });
    }
    res.json({ results });
  } catch (e: any) {
    clearTimeout(timeout);
    res.status(500).json({ error: e.message || 'Search failed' });
  }
});

// ====== Backfill Sanitize ======
router.post('/backfill-sanitize', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  const { normalizeSpecs, sanitizeReviewSummary } = await import('../../server/normalize-import');
  const results = { productsScanned: 0, reviewSummaryFixed: 0, specsFixed: 0, shortDescriptionFixed: 0, errors: 0 };
  try {
    const allProducts = await getProductReviews();
    const products = Array.isArray(allProducts) ? allProducts : (allProducts as any).data || [];
    results.productsScanned = products.length;

    for (const product of products) {
      try {
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        let changed = false;

        if (product.review_summary && typeof product.review_summary === 'string') {
          const cleaned = sanitizeReviewSummary(product.review_summary);
          if (cleaned !== product.review_summary) {
            updates.review_summary = cleaned;
            changed = true;
            results.reviewSummaryFixed++;
          }
        }

        if (product.short_description && typeof product.short_description === 'string' && product.short_description.includes('<')) {
          const cleaned = product.short_description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          if (cleaned !== product.short_description) {
            updates.short_description = cleaned;
            changed = true;
            results.shortDescriptionFixed++;
          }
        }

        const specs = product.specs || product.specifications;
        if (specs && typeof specs === 'object') {
          const normalized = normalizeSpecs(specs);
          const specsStr = JSON.stringify(specs);
          const normStr = JSON.stringify(normalized);
          if (normStr !== specsStr) {
            updates.specs = normalized;
            changed = true;
            results.specsFixed++;
          }
        }

        if (changed) {
          await updateProductReview(product.id || product._id, updates);
        }
      } catch {
        results.errors++;
      }
    }

    res.json({ success: true, ...results });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Backfill failed' });
  }
});

export default router;
