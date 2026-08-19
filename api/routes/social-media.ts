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
      return res.status(400).json({ error: `No active ${platform} credentials configured. Go to Settings tab to add them.` });
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
      return res.status(500).json({ error: publishError, post: postLog });
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

    const results: any[] = [];

    for (const platform of platforms) {
      try {
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/admin/social-media/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || '',
          },
          body: JSON.stringify({
            platform,
            product_id,
            caption: captions[platform] || '',
            image_url,
            link,
          }),
        });
        const data = await response.json();
        results.push({ platform, ...data });
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

export default router;
