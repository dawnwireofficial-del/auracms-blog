import express from 'express';
import { getSupabaseAdmin } from '../../server/lib/supabase';
import { authenticate, requireRole } from './middleware';

const router = express.Router();

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialCredentials {
  id?: string;
  platform: 'facebook' | 'instagram' | 'pinterest';
  access_token: string;
  page_id?: string;        // Facebook Page ID / Instagram Business Account ID
  board_id?: string;       // Pinterest Board ID
  profile_name?: string;
  is_active: boolean;
  created_at?: string;
}

interface SocialPost {
  id?: string;
  product_id: string;
  platform: 'facebook' | 'instagram' | 'pinterest';
  caption: string;
  image_url: string;
  link?: string;
  status: 'draft' | 'published' | 'failed';
  platform_post_id?: string;
  error_message?: string;
  published_at?: string;
  created_at?: string;
}

// ─── Helper: Ensure tables exist ───────────────────────────────────────────────

async function ensureTables() {    const supabase = await getSupabaseAdmin();
    // Check if social_media_credentials table exists
    const { error } = await supabase.from('social_media_credentials').select('id').limit(1);
  if (error && error.message?.includes('does not exist')) {
    // Tables don't exist yet — they'll be created via management API
    console.warn('[social-media] Tables not found. Run migration 009_social_media.sql');
  }
}

// ─── Credentials CRUD ─────────────────────────────────────────────────────────

// GET all credentials (masked tokens)
router.get('/credentials', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('social_media_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table doesn't exist yet — return empty
      return res.json([]);
    }

    // Mask access tokens for display
    const masked = (data || []).map((c: any) => ({
      ...c,
      access_token: c.access_token ? `${c.access_token.substring(0, 8)}...${c.access_token.substring(c.access_token.length - 4)}` : '',
      has_token: !!c.access_token,
    }));

    res.json(masked);
  } catch (e: any) {
    res.json([]);
  }
});

// POST save credentials
router.post('/credentials', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { platform, access_token, page_id, board_id, profile_name } = req.body;

    if (!platform || !access_token) {
      return res.status(400).json({ error: 'Platform and access_token are required' });
    }

    // Check for existing credential for this platform
    const { data: existing } = await supabase
      .from('social_media_credentials')
      .select('id')
      .eq('platform', platform)
      .single();

    const payload: any = {
      platform,
      access_token,
      page_id: page_id || null,
      board_id: board_id || null,
      profile_name: profile_name || null,
      is_active: true,
    };

    let result;
    if (existing?.id) {
      result = await supabase
        .from('social_media_credentials')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      payload.id = crypto.randomUUID();
      result = await supabase
        .from('social_media_credentials')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    res.json({ success: true, credential: { ...result.data, access_token: '***' } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE credentials
router.delete('/credentials/:id', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('social_media_credentials')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AI Caption Generation ────────────────────────────────────────────────────

router.post('/generate-caption', authenticate, requireRole(['super_admin', 'admin', 'editor']), async (req, res) => {
  try {
    const { product, platform, tone, customInstructions } = req.body;

    if (!product || !platform) {
      return res.status(400).json({ error: 'Product data and platform are required' });
    }

    const platformSpecs: Record<string, string> = {
      facebook: `Facebook post (max 63,206 chars, but optimal is 40-80 chars for engagement). Include emojis, hashtags at end. conversational tone.`,
      instagram: `Instagram caption (max 2,200 chars). Lead with a hook in first line. Use line breaks. 5-10 relevant hashtags. Mix of popular and niche. Include call-to-action.`,
      pinterest: `Pinterest pin description (max 500 chars). SEO-focused with keywords. Include product benefits. Use natural language. Add relevant hashtags sparingly.`,
    };

    const systemPrompt = `You are a viral social media copywriter for DawnWire.com, an affiliate product review website. 
You create engaging, scroll-stopping posts that drive clicks and sales.

Platform rules: ${platformSpecs[platform] || platformSpecs.facebook}

Tone: ${tone || 'engaging, helpful, slightly urgent'}
Style: Write like a trusted friend recommending an amazing find. Not salesy, but enthusiastic.

Rules:
- NEVER use fake discount percentages or fake prices
- If there's a real discount, highlight it honestly
- Always include the product name and brand naturally
- End with a clear call-to-action
- Use relevant emojis (2-5 per post, not excessive)
- For Pinterest: focus on search keywords and benefits
- For Instagram: storytelling hook + value + CTA
- For Facebook: conversational, shareable, question-driven`;

    const prompt = `Create a ${platform} post for this product:

Product: ${product.title}
Brand: ${product.brand}
Category: ${product.mainCategory}
Price: $${product.currentPrice}
${product.referencePrice ? `Original Price: $${product.referencePrice}` : ''}
${product.discountPercentage ? `Discount: ${product.discountPercentage}% off` : ''}
Rating: ${product.rating}/5 (${product.reviewCount} reviews)
Best For: ${product.bestFor}
Key Features: ${(product.mainFeatures || []).slice(0, 3).join(', ')}
Pros: ${(product.pros || []).slice(0, 3).join(', ')}
Verdict: ${product.editorVerdict || product.shortDescription || ''}
Editor Score: ${product.editorScore}/10

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Return ONLY the post caption text, nothing else. No labels, no formatting markers.`;

    // Use Cohere for generation
    let caption = '';
    try {
      const cohereKey = process.env.COHERE_API_KEY || process.env.AI_GATEWAY_API_KEY;
      if (cohereKey) {
        const response = await fetch('https://api.cohere.ai/v2/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cohereKey}`,
          },
          body: JSON.stringify({
            model: 'command-r-plus-08-2024',
            messages: [{ role: 'user', content: prompt }],
            system: systemPrompt,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          caption = data.message?.content?.[0]?.text || '';
        }
      }
    } catch (e) {
      console.error('[social-media] Cohere caption generation failed:', e);
    }

    // Fallback: template-based caption
    if (!caption) {
      const emojis = platform === 'instagram' ? '🔥✨💯' : platform === 'pinterest' ? '⭐🛒✨' : '🔥👍💯';
      caption = `${emojis}\n\n${product.brand ? product.brand + ' ' : ''}${product.title}\n\n`;
      if (product.bestFor) caption += `✅ Perfect for: ${product.bestFor}\n`;
      if (product.rating) caption += `⭐ ${product.rating}/5 stars (${product.reviewCount} reviews)\n`;
      caption += `💰 $${product.currentPrice}`;
      if (product.discountPercentage) caption += ` (${product.discountPercentage}% OFF!)`;
      caption += '\n\n';
      if (product.mainFeatures?.length) {
        product.mainFeatures.slice(0, 3).forEach((f: string) => { caption += `• ${f}\n`; });
      }
      caption += `\n🛒 Shop now on DawnWire 👇\n\n`;
      caption += `#DawnWire #${(product.brand || 'Deals').replace(/\s+/g, '')} #${(product.mainCategory || 'Shopping').replace(/\s+/g, '')} #AffiliateDeals #ProductReview`;
      if (platform === 'instagram') {
        caption += ' #AmazonFinds #MustHave #ShoppingGuide #TopPick #BestDeals';
      }
    }

    res.json({ caption });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Publish to platforms ──────────────────────────────────────────────────────

// POST publish to a single platform
router.post('/publish', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { platform, product_id, caption, image_url, link } = req.body;

    if (!platform || !product_id || !image_url) {
      return res.status(400).json({ error: 'platform, product_id, and image_url are required' });
    }

    const supabase = await getSupabaseAdmin();

    // Get credentials
    const { data: cred, error: credError } = await supabase
      .from('social_media_credentials')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (credError || !cred) {
      return res.status(200).json({ success: false, error: `No active ${platform} credentials configured. Use Copy & Post mode instead.`, post: null });
    }

    const token = cred.access_token;
    let platformPostId = '';
    let publishError = '';

    try {
      if (platform === 'facebook') {
        // Facebook Graph API: POST /{page-id}/photos for image+link post
        const pageId = cred.page_id;
        if (!pageId) throw new Error('Page ID not configured');

        if (link) {
          // Link post with image
          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: caption,
              link: link,
              access_token: token,
            }),
          });
          const fbData = await fbRes.json();
          if (fbData.error) throw new Error(fbData.error.message);
          platformPostId = fbData.id || '';
        } else {
          // Image-only post
          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: image_url,
              caption: caption,
              access_token: token,
            }),
          });
          const fbData = await fbRes.json();
          if (fbData.error) throw new Error(fbData.error.message);
          platformPostId = fbData.id || '';
        }
      } else if (platform === 'instagram') {
        // Instagram Graph API: create media container → publish
        const igUserId = cred.page_id; // Instagram Business Account ID
        if (!igUserId) throw new Error('Instagram Business Account ID not configured');

        // Step 1: Create media container
        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: image_url,
            caption: caption,
            access_token: token,
          }),
        });
        const containerData = await containerRes.json();
        if (containerData.error) throw new Error(containerData.error.message);

        const containerId = containerData.id;
        if (!containerId) throw new Error('Failed to create media container');

        // Step 2: Publish the container
        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: token,
          }),
        });
        const publishData = await publishRes.json();
        if (publishData.error) throw new Error(publishData.error.message);
        platformPostId = publishData.id || '';
      } else if (platform === 'pinterest') {
        // Pinterest API v5: POST /v5/pins
        const boardId = cred.board_id;
        if (!boardId) throw new Error('Board ID not configured');

        const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            board_id: boardId,
            title: caption.split('\n')[0].substring(0, 100),
            description: caption,
            link: link || `https://dawnwire.com/products/${product_id}`,
            image_url: image_url,
          }),
        });
        const pinData = await pinRes.json();
        if (pinData.code && pinData.code !== 200) throw new Error(pinData.message || 'Pinterest API error');
        platformPostId = pinData.id || '';
      }
    } catch (e: any) {
      publishError = e.message;
    }

    // Log the post
    const postLog: any = {
      id: crypto.randomUUID(),
      product_id,
      platform,
      caption: caption.substring(0, 500),
      image_url,
      link: link || null,
      status: publishError ? 'failed' : 'published',
      platform_post_id: platformPostId || null,
      error_message: publishError || null,
      published_at: publishError ? null : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await supabase.from('social_media_posts').insert(postLog);

    if (publishError) {
      return res.status(200).json({ success: false, error: publishError, post: postLog });
    }

    res.json({ success: true, post: postLog });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST publish to all platforms at once
router.post('/publish-all', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { product_id, platforms, captions, image_url, link } = req.body;

    if (!product_id || !platforms || !Array.isArray(platforms) || !captions) {
      return res.status(400).json({ error: 'product_id, platforms array, captions object, and image_url are required' });
    }

    const supabase = await getSupabaseAdmin();
    const results: any[] = [];

    for (const platform of platforms) {
      try {
        // Get credentials
        const { data: cred } = await supabase
          .from('social_media_credentials')
          .select('*')
          .eq('platform', platform)
          .eq('is_active', true)
          .single();

        if (!cred) {
          results.push({ platform, success: false, error: `No active ${platform} credentials`, post: null });
          continue;
        }

        const caption = captions[platform] || '';
        let platformPostId = '';
        let publishError = '';

        try {
          if (platform === 'facebook' && cred.page_id) {
            const fbRes = await fetch(`https://graph.facebook.com/v19.0/${cred.page_id}/feed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: caption, link: link || '', access_token: cred.access_token }),
            });
            const fbData: any = await fbRes.json();
            if (fbData.error) throw new Error(fbData.error.message);
            platformPostId = fbData.id || '';
          } else if (platform === 'instagram' && cred.page_id) {
            const cRes = await fetch(`https://graph.facebook.com/v19.0/${cred.page_id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url, caption, access_token: cred.access_token }),
            });
            const cData: any = await cRes.json();
            if (cData.error) throw new Error(cData.error.message);
            const pRes = await fetch(`https://graph.facebook.com/v19.0/${cred.page_id}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: cData.id, access_token: cred.access_token }),
            });
            const pData: any = await pRes.json();
            if (pData.error) throw new Error(pData.error.message);
            platformPostId = pData.id || '';
          } else if (platform === 'pinterest' && cred.board_id) {
            const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cred.access_token}` },
              body: JSON.stringify({
                board_id: cred.board_id,
                title: caption.split('\n')[0].substring(0, 100),
                description: caption,
                link: link || `https://dawnwire.com/products/${product_id}`,
                image_url,
              }),
            });
            const pinData: any = await pinRes.json();
            if (pinData.code && pinData.code !== 200) throw new Error(pinData.message || 'Pinterest API error');
            platformPostId = pinData.id || '';
          } else {
            publishError = `Missing configuration for ${platform}`;
          }
        } catch (e: any) {
          publishError = e.message;
        }

        // Log the post
        const postLog: any = {
          id: crypto.randomUUID(),
          product_id,
          platform,
          caption: caption.substring(0, 500),
          image_url,
          link: link || null,
          status: publishError ? 'failed' : 'published',
          platform_post_id: platformPostId || null,
          error_message: publishError || null,
          published_at: publishError ? null : new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        await supabase.from('social_media_posts').insert(postLog);

        results.push({ platform, success: !publishError, error: publishError || null, post: postLog });
      } catch (e: any) {
        results.push({ platform, success: false, error: e.message });
      }
    }

    res.json({ results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Post History ──────────────────────────────────────────────────────────────

router.get('/posts', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const supabase = await getSupabaseAdmin();
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error, count } = await supabase
      .from('social_media_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.json({ data: [], total: 0 });

    res.json({ data: data || [], total: count || 0 });
  } catch (e: any) {
    res.json({ data: [], total: 0 });
  }
});

// ─── Test Connection ──────────────────────────────────────────────────────────

router.post('/test-connection', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { platform, access_token, page_id, board_id } = req.body;

    if (platform === 'facebook') {
      const fbRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${access_token}`);
      const fbData = await fbRes.json();
      if (fbData.error) return res.json({ success: false, error: fbData.error.message });

      // If page_id provided, verify page access
      if (page_id) {
        const pageRes = await fetch(`https://graph.facebook.com/v19.0/${page_id}?fields=name,access_token&access_token=${access_token}`);
        const pageData = await pageRes.json();
        return res.json({
          success: true,
          profile: fbData,
          page: pageData.error ? null : pageData,
        });
      }
      return res.json({ success: true, profile: fbData });
    }

    if (platform === 'instagram') {
      const igRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${access_token}`);
      const igData = await igRes.json();
      if (igData.error) return res.json({ success: false, error: igData.error.message });
      return res.json({ success: true, profile: igData });
    }

    if (platform === 'pinterest') {
      const pinRes = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: { 'Authorization': `Bearer ${access_token}` },
      });
      const pinData = await pinRes.json();
      if (pinData.code && pinData.code !== 200) return res.json({ success: false, error: pinData.message });
      return res.json({ success: true, profile: pinData });
    }

    res.status(400).json({ error: 'Unknown platform' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Pinterest Product Catalog CSV Feed ───────────────────────────────────────

router.get('/pinterest-catalog', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';

    // Pinterest CSV header (matches their product catalog spec)
    const columns = [
      'id', 'item_group_id', 'title', 'description', 'link', 'image_link',
      'price', 'availability', 'condition', 'google_product_category',
      'product_type', 'additional_image_link', 'sale_price', 'brand',
      'gender', 'age_group', 'size', 'size_type', 'shipping',
      'custom_label_0', 'adwords_redirect',
    ];

    function escCsv(val: string): string {
      if (!val) return '';
      const s = String(val).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }

    function parsePrice(raw: any): { price: string; salePrice: string } {
      if (!raw) return { price: '', salePrice: '' };
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
      if (isNaN(num) || num <= 0) return { price: '', salePrice: '' };
      return { price: `${num} USD`, salePrice: '' };
    }

    const rows = reviews
      .filter((r: any) => r.product_name && r.status === 'published')
      .map((r: any) => {
        const name = r.product_name || '';
        const brand = r.brand || '';
        const slug = r.slug || r.id;
        const productUrl = `${baseUrl}/products/${slug}`;
        const image = r.product_image || '';
        const additionalImages = (r.specs?.gallery || []).slice(0, 10).join('|');
        const { price, salePrice } = parsePrice(r.price);
        const originalPrice = parsePrice(r.original_price).price;
        const bestFor = r.best_for || '';
        const category = r.specs?.details?.department || r.specs?.category || '';
        const reviewSummary = (r.review_summary || '').substring(0, 500);
        const finalVerdict = (r.final_verdict || '').substring(0, 300);
        const pros = Array.isArray(r.pros) ? r.pros.join(', ') : (r.pros || '');
        const cons = Array.isArray(r.cons) ? r.cons.join(', ') : (r.cons || '');
        const features = Array.isArray(r.key_features) ? r.key_features.join(', ') : (r.key_features || '');
        const editorScore = r.editor_score || 0;
        const rating = r.rating || 0;
        const reviewCount = r.review_count || 0;
        const asin = r.specs?.asin || '';

        // Build rich description for Pinterest
        const descParts = [
          reviewSummary,
          finalVerdict ? `Verdict: ${finalVerdict}` : '',
          pros ? `Pros: ${pros}` : '',
          bestFor ? `Best for: ${bestFor}` : '',
          editorScore ? `Editor Score: ${editorScore}/10` : '',
          rating ? `Rating: ${rating}/5 (${reviewCount} reviews)` : '',
          asin ? `ASIN: ${asin}` : '',
        ].filter(Boolean).join(' | ');

        // Map category to Google product category
        const catLower = category.toLowerCase() || (bestFor || '').toLowerCase();
        let googleCategory = 'Media > Books > Nonfiction';
        if (catLower.includes('beauty') || catLower.includes('personal') || catLower.includes('skin') || catLower.includes('hair')) {
          googleCategory = 'Beauty & Personal Care';
        } else if (catLower.includes('kitchen') || catLower.includes('cooking') || catLower.includes('food')) {
          googleCategory = 'Home & Garden > Kitchen & Dining';
        } else if (catLower.includes('tech') || catLower.includes('electronic') || catLower.includes('gadget') || catLower.includes('computer')) {
          googleCategory = 'Electronics > Computers';
        } else if (catLower.includes('home') || catLower.includes('furniture') || catLower.includes('decor')) {
          googleCategory = 'Home & Garden';
        } else if (catLower.includes('fitness') || catLower.includes('health') || catLower.includes('sport')) {
          googleCategory = 'Health & Fitness';
        } else if (catLower.includes('fashion') || catLower.includes('clothing') || catLower.includes('wear')) {
          googleCategory = 'Apparel & Accessories > Clothing';
        } else if (catLower.includes('toy') || catLower.includes('game') || catLower.includes('kid')) {
          googleCategory = 'Toys & Games';
        }

        // Build product_type from best_for + brand
        const productType = [brand, bestFor, category].filter(Boolean).join(' > ');

        // Custom labels for Pinterest ads
        const customLabels = [
          editorScore >= 8 ? 'Top Rated' : editorScore >= 6 ? 'Recommended' : '',
          salePrice ? 'On Sale' : '',
          r.is_deal || r.deal_badge ? 'Deal' : '',
          brand,
        ].filter(Boolean).join(', ');

        return columns.map((col) => {
          switch (col) {
            case 'id': return escCsv(slug.substring(0, 100));
            case 'item_group_id': return escCsv(brand ? brand.toLowerCase().replace(/\s+/g, '-') : slug.substring(0, 50));
            case 'title': return escCsv(`${brand ? brand + ' ' : ''}${name}`.substring(0, 150));
            case 'description': return escCsv(descParts.substring(0, 500));
            case 'link': return escCsv(productUrl);
            case 'image_link': return escCsv(image);
            case 'price': return escCsv(price);
            case 'availability': return escCsv(r.stock_status === 'out_of_stock' ? 'out of stock' : 'in stock');
            case 'condition': return escCsv('new');
            case 'google_product_category': return escCsv(googleCategory);
            case 'product_type': return escCsv(productType);
            case 'additional_image_link': return escCsv(additionalImages);
            case 'sale_price': return escCsv(salePrice);
            case 'brand': return escCsv(brand);
            case 'gender': return escCsv('unisex');
            case 'age_group': return escCsv('adult');
            case 'size': return escCsv('');
            case 'size_type': return escCsv('');
            case 'shipping': return escCsv('US:Standard:0 USD');
            case 'custom_label_0': return escCsv(customLabels);
            case 'adwords_redirect': return escCsv(`${productUrl}?utm_source=pinterest&utm_campaign=shopping`);
            default: return '';
          }
        }).join(',');
      });

    const csv = [columns.join(','), ...rows].join('\n');

    // Also generate a metadata summary
    const totalProducts = rows.length;
    const withImages = reviews.filter((r: any) => r.product_image).length;
    const withPrices = reviews.filter((r: any) => r.price).length;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dawnwire-pinterest-catalog-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Pinterest catalog metadata endpoint (for UI)
router.get('/pinterest-catalog/stats', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const published = reviews.filter((r: any) => r.product_name && r.status === 'published');
    const withImages = published.filter((r: any) => r.product_image).length;
    const withPrices = published.filter((r: any) => r.price).length;
    const withAsin = published.filter((r: any) => r.specs?.asin).length;
    const withDeals = published.filter((r: any) => r.is_deal || r.deal_badge).length;
    const categories = [...new Set(published.map((r: any) => r.best_for || r.specs?.details?.department || 'Uncategorized'))];
    const brands = [...new Set(published.map((r: any) => r.brand).filter(Boolean))];

    res.json({
      totalProducts: published.length,
      withImages,
      withPrices,
      withAsin,
      withDeals,
      categoryCount: categories.length,
      brandCount: brands.length,
      categories: categories.slice(0, 20),
      brands: brands.slice(0, 20),
      estimatedFileSize: `~${Math.round(published.length * 0.8)} KB`,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
