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
            link: link || `https://www.dawnwire.com/products/${product_id}`,
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
                link: link || `https://www.dawnwire.com/products/${product_id}`,
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

// ─── Shared: map DawnWire fields → catalog columns ───────────────────────────

function mapGoogleCategory(bestFor: string, category: string, specs: any): string {
  const text = `${bestFor} ${category} ${specs?.details?.department || ''}`.toLowerCase();
  if (text.match(/beauty|skin|hair|makeup|face|lip|eye|moistur|serum|cleanser|body.scrub|lotion|sunscreen|lip.balm/)) return 'Health & Beauty > Personal Care > Skin Care';
  if (text.match(/kitchen|cook|food|coffee|tea|blender|air.fryer|instant.pot|cutting.board|knife|pan|pot|bowl|utensil|spice|grater|opener/)) return 'Home & Garden > Kitchen & Dining > Small Kitchen Appliances';
  if (text.match(/tech|gadget|electronic|computer|laptop|phone|tablet|headphone|speaker|camera|keyboard|mouse|monitor|webcam|rack|shelf|fan|clock|usb/)) return 'Electronics > Computers';
  if (text.match(/home|furniture|decor|lamp|organiz|storage|clean|trash|towel|mat|dispenser|holder|sponge|brush/)) return 'Home & Garden > Home Decor';
  if (text.match(/fitness|health|exercise|yoga|gym|sport|protein|weight|vest|resistance/)) return 'Health & Fitness > Exercise & Fitness';
  if (text.match(/toy|game|kid|baby|child|montessori|puzzle/)) return 'Toys & Games';
  if (text.match(/fashion|cloth|wear|shirt|pant|shoe|jacket|backpack|bag|sleeve|vinyl|record/)) return 'Apparel & Accessories > Clothing';
  if (text.match(/pet|dog|cat|fish/)) return 'Animals & Pet Supplies > Pet Supplies';
  if (text.match(/auto|car|vehicle|seat.cover|floor.mat/)) return 'Automotive > Parts & Accessories';
  if (text.match(/print|toner|ink|cartridge|paper/)) return 'Office Supplies > Printers > Ink & Toner';
  if (text.match(/projector|screen|mount|stand|case/)) return 'Electronics > Audio & Video > Video Equipment';
  if (text.match(/mask|serum|collagen|peptide|ceramide|vitamin|niacinamide|sunscreen|spf/)) return 'Health & Beauty > Personal Care > Skin Care';
  return 'Home & Garden';
}

function buildCatalogRow(r: any, baseUrl: string, columns: string[]): string {
  function esc(val: any): string {
    if (val == null || val === '') return '';
    const s = String(val).replace(/[\r\n\t]+/g, ' ').replace(/"/g, '""');
    // Always quote fields to prevent CSV injection issues
    return `"${s}"`;
  }
  function price(raw: any): string {
    if (!raw) return '';
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return '';
    return `${num.toFixed(2)} USD`;
  }

  const name = r.product_name || '';
  const brand = r.brand || '';
  const slug = r.slug || r.id;
  const productUrl = `${baseUrl}/products/${slug}`;
  const image = r.product_image || '';
  const gallery: string[] = r.gallery || r.specs?.gallery || [];
  const additionalImages = gallery.filter((g: string) => g && g !== image).slice(0, 10).join('|');
  const p = price(r.price);
  const origP = price(r.original_price);
  const saleP = origP && p ? p : '';
  const displayP = origP || p;
  const bestFor = r.best_for || '';
  const category = r.specs?.details?.department || r.category || '';
  const reviewSummary = (r.review_summary || '').substring(0, 500);
  const finalVerdict = (r.final_verdict || '').substring(0, 300);
  const pros = Array.isArray(r.pros) ? r.pros.join(', ') : (r.pros || '');
  const features = Array.isArray(r.key_features) ? r.key_features.join(', ') : (r.key_features || '');
  const editorScore = r.editor_score || 0;
  const rating = r.rating || 0;
  const reviewCount = r.review_count || 0;
  const asin = r.asin || r.specs?.asin || '';
  const dealBadge = r.deal_badge || '';
  const couponCode = r.coupon_code || '';
  const stockStatus = r.stock_status || 'in_stock';
  const seoDesc = (r.seo_description || '').substring(0, 300);
  const googleCat = mapGoogleCategory(bestFor, category, r.specs);
  const productType = [brand, bestFor, category].filter(Boolean).join(' > ');

  // Rich description — truncate to Google's 5000-char limit, strip newlines
  const descRaw = [
    reviewSummary,
    finalVerdict ? `Verdict: ${finalVerdict}` : '',
    pros ? `Pros: ${pros}` : '',
    bestFor ? `Best for: ${bestFor}` : '',
    editorScore ? `Editor Score: ${editorScore}/10` : '',
    rating ? `Rating: ${rating}/5 (${reviewCount} reviews)` : '',
    dealBadge ? `Deal: ${dealBadge}` : '',
    couponCode ? `Coupon: ${couponCode}` : '',
    asin ? `ASIN: ${asin}` : '',
    seoDesc,
  ].filter(Boolean).join(' | ').replace(/[\r\n\t]+/g, ' ').substring(0, 4900);

  // Custom labels
  const labels = [
    editorScore >= 8 ? 'top_rated' : editorScore >= 6 ? 'recommended' : 'standard',
    saleP ? 'on_sale' : 'regular_price',
    r.is_deal || dealBadge ? 'has_deal' : 'no_deal',
    brand.toLowerCase().replace(/\s+/g, '_'),
    bestFor.toLowerCase().replace(/\s+/g, '_').substring(0, 50),
  ];

  return columns.map((col) => {
    // Strip 'g:' prefix for switch matching
    const field = col.replace(/^g:/, '');
    switch (field) {
      case 'id': return esc(slug.substring(0, 100));
      case 'item_group_id': return esc(brand ? brand.toLowerCase().replace(/\s+/g, '-') : slug.substring(0, 50));
      case 'title': return esc(`${brand ? brand + ' ' : ''}${name}`.substring(0, 150));
      case 'description': return esc(descRaw); // already truncated to 4900 chars
      case 'link': return esc(productUrl);
      case 'image_link': return esc(image);
      case 'price': return esc(displayP);
      case 'availability': return esc(stockStatus === 'out_of_stock' ? 'out of stock' : 'in stock');
      case 'condition': return esc('new');
      case 'google_product_category': return esc(googleCat);
      case 'product_type': return esc(productType);
      case 'additional_image_link': return esc(additionalImages);
      case 'sale_price': return esc(saleP);
      case 'brand': return esc(brand);
      case 'gender': return esc('unisex');
      case 'age_group': return esc('adult');
      case 'size': return esc('');
      case 'size_type': return esc('');
      case 'shipping': return esc('US:Standard:0 USD');
      case 'custom_label_0': return esc(labels[0]);
      case 'custom_label_1': return esc(labels[1]);
      case 'custom_label_2': return esc(labels[2]);
      case 'custom_label_3': return esc(labels[3]);
      case 'custom_label_4': return esc(labels[4]);
      default: return esc('');
    }
  }).join(',');
}

// ─── Pinterest Product Catalog CSV ─────────────────────────────────────────────

router.get('/pinterest-catalog', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';

    const columns = [
      'id', 'item_group_id', 'title', 'description', 'link', 'image_link',
      'price', 'availability', 'condition', 'google_product_category',
      'product_type', 'additional_image_link', 'sale_price', 'brand',
      'gender', 'age_group', 'size', 'size_type', 'shipping',
      'custom_label_0', 'custom_label_1', 'custom_label_2', 'custom_label_3', 'custom_label_4',
      'adwords_redirect',
    ];

    const rows = (reviews || [])
      .filter((r: any) => r.product_name && r.status === 'published')
      .map((r: any) => buildCatalogRow(r, baseUrl, columns));

    const csv = [columns.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dawnwire-pinterest-catalog-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/pinterest-catalog/stats', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const p = reviews.filter((r: any) => r.product_name && r.status === 'published');
    res.json({
      totalProducts: p.length,
      withImages: p.filter((r: any) => r.product_image).length,
      withPrices: p.filter((r: any) => r.price).length,
      withAsin: p.filter((r: any) => r.asin || r.specs?.asin).length,
      withDeals: p.filter((r: any) => r.is_deal || r.deal_badge).length,
      withGallery: p.filter((r: any) => (r.gallery || r.specs?.gallery || []).length > 1).length,
      withSeoDesc: p.filter((r: any) => r.seo_description).length,
      categoryCount: [...new Set(p.map((r: any) => r.best_for || r.specs?.details?.department || 'Other'))].length,
      brandCount: [...new Set(p.map((r: any) => r.brand).filter(Boolean))].length,
      estimatedFileSize: `~${Math.round(p.length * 1.2)} KB`,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Pinterest Bulk Pins CSV (for bulk Pin creation, not catalog) ────────────

router.get('/pinterest-pins-csv', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const baseUrl = 'https://www.dawnwire.com';

    const columns = ['Title', 'Description', 'Link', 'Image URL', 'Board Name', 'Keywords'];

    const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;

    const boards: Record<string, string> = {
      'beauty-personal-care': 'Beauty & Personal Care',
      'home-kitchen': 'Home & Kitchen',
      'electronics': 'Electronics',
      'technology': 'Technology',
      'gaming': 'Gaming',
      'sports-outdoors': 'Sports & Outdoors',
      'fitness': 'Fitness',
      'baby-products': 'Baby Products',
      'automotive': 'Automotive',
      'toys-games': 'Toys & Games',
      'office-productivity': 'Office & Productivity',
      'ai-software-tools': 'AI & Software Tools',
    };

    const rows = (reviews || [])
      .filter((r: any) => r.product_name && r.status === 'published' && (r.product_image || (r.specs?.gallery || [])[0]))
      .map((r: any) => {
        const name = String(r.product_name || '');
        const brand = String(r.brand || '');
        const bestFor = String(r.best_for || '');
        const score = Number(r.editor_score || 0);
        const rating = Number(r.rating || 0);
        const verdict = String(r.final_verdict || r.review_summary || '').slice(0, 200);
        const cat = String(r.category || bestFor || 'Shopping').toLowerCase();
        const boardName = boards[cat] || 'DawnWire Picks';

        // Pin title — editorial, not merchant-style
        const title = score >= 8
          ? `Best ${brand} ${name.split(' ').slice(0, 4).join(' ')} — Editor's Pick (${score}/10)`
          : `${brand} ${name.split(' ').slice(0, 5).join(' ')} Review & Buying Guide`;

        // Pin description — human-readable, with disclosure
        const desc = [
          verdict || `Looking for the best ${name.split(' ').slice(0, 3).join(' ')}?`,
          '',
          `DawnWire Score: ${score}/10 | Rating: ${rating}/5`,
          bestFor ? `Best for: ${bestFor}` : '',
          '',
          `Read the full review →`,
          '',
          'DawnWire may earn a commission from qualifying purchases.',
        ].filter(Boolean).join('\n');

        const image = r.product_image || (r.specs?.gallery || [])[0] || '';
        const link = `${baseUrl}/products/${r.slug || r.id}?utm_source=pinterest&utm_medium=organic&utm_campaign=pin`;

        const keywords = [brand, bestFor, cat, 'review', 'buying guide', 'best', score >= 8 ? 'top rated' : ''].filter(Boolean).join(', ');

        return [esc(title), esc(desc), esc(link), esc(image), esc(boardName), esc(keywords)].join(',');
      });

    const csv = [columns.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dawnwire-pinterest-pins-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/pinterest-pins-csv/stats', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const p = reviews.filter((r: any) => r.product_name && r.status === 'published');
    res.json({
      totalPins: p.length,
      withImages: p.filter((r: any) => r.product_image || (r.specs?.gallery || [])[0]).length,
      withVerdict: p.filter((r: any) => r.final_verdict || r.review_summary).length,
      withScore: p.filter((r: any) => Number(r.editor_score) > 0).length,
      boardCount: [...new Set(p.map((r: any) => r.best_for || r.category || 'Shopping'))].length,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Google Merchant Center Product Feed ──────────────────────────────────────

router.get('/google-shopping-feed', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';

    // Google Merchant Center requires 'g:' prefix for all field names in CSV format
    const columns = [
      'g:id', 'g:title', 'g:description', 'g:link', 'g:image_link', 'g:additional_image_link',
      'g:price', 'g:sale_price', 'g:availability', 'g:condition', 'g:brand',
      'g:google_product_category', 'g:product_type', 'g:custom_label_0',
      'g:custom_label_1', 'g:custom_label_2', 'g:custom_label_3', 'g:custom_label_4',
    ];

    const rows = (reviews || [])
      .filter((r: any) => r.product_name && r.status === 'published')
      .map((r: any) => buildCatalogRow(r, baseUrl, columns));

    const csv = [columns.join(','), ...rows].join('\n');
    const date = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dawnwire-google-shopping-feed-${date}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Google Shopping feed stats
router.get('/google-shopping-feed/stats', authenticate, requireRole(['super_admin', 'admin']), async (_req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const p = reviews.filter((r: any) => r.product_name && r.status === 'published');
    res.json({
      totalProducts: p.length,
      withImages: p.filter((r: any) => r.product_image).length,
      withPrices: p.filter((r: any) => r.price).length,
      withBrand: p.filter((r: any) => r.brand).length,
      withBestFor: p.filter((r: any) => r.best_for).length,
      withEditorScore: p.filter((r: any) => r.editor_score).length,
      withGallery: p.filter((r: any) => (r.gallery || r.specs?.gallery || []).length > 1).length,
      withAsin: p.filter((r: any) => r.asin || r.specs?.asin).length,
      withSeoDesc: p.filter((r: any) => r.seo_description).length,
      brandCount: [...new Set(p.map((r: any) => r.brand).filter(Boolean))].length,
      categoryCount: [...new Set(p.map((r: any) => r.best_for || r.specs?.details?.department || 'Other'))].length,
      estimatedFileSize: `~${Math.round(p.length * 1.2)} KB`,
      missingData: {
        noImage: p.length - p.filter((r: any) => r.product_image).length,
        noPrice: p.length - p.filter((r: any) => r.price).length,
        noBrand: p.length - p.filter((r: any) => r.brand).length,
        noBestFor: p.length - p.filter((r: any) => r.best_for).length,
        noScore: p.length - p.filter((r: any) => r.editor_score).length,
        noAsin: p.length - p.filter((r: any) => r.asin || r.specs?.asin).length,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Bulk Auto-Process Products (SEO enrichment) ──────────────────────────────

router.post('/bulk-auto-process', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { getPublishedProductReviews } = await import('../../server/seo-engine');
    const { autoProcessProduct } = await import('../../server/auto-import');
    const reviews = await getPublishedProductReviews().catch(() => []) as any[];
    const limit = Math.min(parseInt(req.body.limit) || 50, 100);
    const onlyMissing = req.body.onlyMissing !== false;

    const candidates = (reviews || [])
      .filter((r: any) => r.product_name && r.status === 'published')
      .filter((r: any) => {
        if (!onlyMissing) return true;
        return !r.editor_score || !r.final_verdict || !r.best_for || !r.category_id;
      })
      .slice(0, limit);

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const product of candidates) {
      try {
        const result = await autoProcessProduct(product.id);
        results.push({ id: product.id, name: product.product_name, success: true, changes: result?.changes || [] });
        successCount++;
      } catch (e: any) {
        results.push({ id: product.id, name: product.product_name, success: false, error: e.message });
        failCount++;
      }
    }

    res.json({
      total: candidates.length,
      processed: successCount,
      failed: failCount,
      results,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
// cache bust 1787228595
