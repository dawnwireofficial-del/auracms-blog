import express from 'express';
import { dbInstance } from '../../server/db';
import * as seo from '../../server/seo-engine';
import { sendNewsletterBroadcast } from '../../server/email';
import { sendDripEmail, getDripCampaignConfig, getNextDripStep } from '../../server/drip-campaign';
import { getSupabaseAdmin } from '../../server/lib/supabase';
import { authenticate, requireRole } from './middleware';
import { startBulkImport, processBulkImport, getBulkImportJob, cancelBulkImport } from '../../server/bulk-importer';
import { searchAmazon } from '../../server/amazon-search-scraper';

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
  const { title, slug, excerpt, content, featuredImage, categoryId, tags, status, visibility, isFeatured, isTrending, isEditorsPick, allowComments, seoTitle, seoDescription, seoKeywords } = req.body;
  if (!title || !slug || !content) return res.status(400).json({ error: 'Title, slug, content required' });
  if (await dbInstance.getPostBySlug(slug)) return res.status(400).json({ error: 'Slug already exists' });
  const p = await dbInstance.createPost({ title, slug, excerpt: excerpt || '', content, featuredImage: featuredImage || '', categoryId: categoryId || '', tags: tags || [], status: status || 'draft', visibility: visibility || 'public', isFeatured: !!isFeatured, isTrending: !!isTrending, isEditorsPick: !!isEditorsPick, allowComments: allowComments !== false, seoTitle: seoTitle || '', seoDescription: seoDescription || '', seoKeywords: seoKeywords || '', publishedAt: status === 'published' ? new Date().toISOString() : undefined }, u.id);
  dbInstance.log('Post Created', `Created: "${p.title}"`, u.id, u.name);
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
    title: b.title || post.title, slug: b.slug || post.slug, excerpt: b.excerpt !== undefined ? b.excerpt : post.excerpt, content: b.content || post.content, featuredImage: b.featuredImage !== undefined ? b.featuredImage : post.featuredImage, categoryId: b.categoryId !== undefined ? b.categoryId : post.categoryId, tags: b.tags || post.tags, status: b.status || post.status, visibility: b.visibility || post.visibility, isFeatured: b.isFeatured !== undefined ? !!b.isFeatured : post.isFeatured, isTrending: b.isTrending !== undefined ? !!b.isTrending : post.isTrending, isEditorsPick: b.isEditorsPick !== undefined ? !!b.isEditorsPick : post.isEditorsPick, allowComments: b.allowComments !== undefined ? !!b.allowComments : post.allowComments, seoTitle: b.seoTitle || post.seoTitle, seoDescription: b.seoDescription || post.seoDescription, seoKeywords: b.seoKeywords || post.seoKeywords, publishedAt: (b.status === 'published' && post.status !== 'published') ? new Date().toISOString() : post.publishedAt
  });
  dbInstance.log('Post Updated', `Updated: "${upd?.title}"`, u.id, u.name);
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
  const l = await dbInstance.createAffiliateLink({ title, destinationUrl, affiliateUrl, shortSlug, categoryId: categoryId || undefined, postId: postId || undefined, buttonText: buttonText || 'Buy Now', disclosureText: disclosureText || '', noFollow: noFollow !== false, sponsored: sponsored !== false, openInNewTab: openInNewTab !== false, status: status || 'active' });
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

const IMGBB_KEY = '467debc656646bc3b9b530339ca31161';
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

// Product Reviews — list all (including drafts)
router.get('/product-reviews', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const all = await seo.getProductReviews();
    const limit = Math.min(parseInt(req.query.limit as string) || 500, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const total = all.length;
    const items = all.slice(offset, offset + limit);
    res.json({ data: items, total, limit, offset });
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
      affiliate_url: body.affiliate_url || body.amazonOriginalUrl || body.amazon_url || '',
      price: String(body.currentPrice || body.price || ''),
      listPrice: String(body.referencePrice || body.listPrice || ''),
      rating: Number(body.rating) || 0,
      reviewCount: Number(body.review_count || body.reviewCount) || 0,
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

    const productData = {
      product_name: amazonData.title || `Amazon Product (${cleanAsin})`,
      slug: finalSlug,
      brand: amazonData.brand || '',
      price: amazonData.price ? String(amazonData.price) : undefined,
      listPrice: amazonData.referencePrice ? String(amazonData.referencePrice) : undefined,
      rating: undefined,
      review_count: undefined,
      affiliate_url: amazonData.affiliateUrl || `https://www.amazon.com/dp/${cleanAsin}?tag=${config.credentials.partnerTag}`,
      amazon_url: amazonData.productUrl || `https://www.amazon.com/dp/${cleanAsin}`,
      product_image: amazonData.mainImage || '',
      gallery: amazonData.additionalImages || [],
      review_summary: '',
      pros: [],
      cons: [],
      key_features: amazonData.features || [],
      best_for: amazonData.category || '',
      final_verdict: '',
      specs: {
        asin: cleanAsin,
        source: 'amazon-pa-api',
        marketplace: 'US',
        availability: amazonData.availability || '',
        isPrime: String(amazonData.isPrimeDeal || amazonData.isPrimeExclusive || false)
      },
      stock_status: amazonData.isAvailable ? 'in_stock' : 'out_of_stock',
      deal_badge: amazonData.isDeal ? 'Amazon Deal' : null,
      is_featured: false,
      is_deal: amazonData.isDeal || false,
      status: 'published'
    };

    const created = await seo.importProductReview(productData);
    const u = (req as any).user;
    dbInstance.log('Product Imported', `Imported: "${created.product_name}" (ASIN: ${cleanAsin})`, u.id, u.name);

    return res.json({ success: true, product: created });
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

// ====== Bulk Amazon Product Import ======
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

export default router;
