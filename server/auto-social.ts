import { getSupabaseAdmin } from './lib/supabase';

// ─── UTM Helper ──────────────────────────────────────────────────────────────
// Appends UTM tracking params so analytics can attribute traffic source.
function withUTM(url: string, platform: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', platform);
    u.searchParams.set('utm_medium', 'social');
    u.searchParams.set('utm_campaign', 'auto_social');
    return u.toString();
  } catch { return url; }
}

// ─── Auto-Post Scheduler ─────────────────────────────────────────────────────
// Automatically posts new products/articles to social media platforms.
// Runs on a configurable interval (default: every 2 hours).
// Free methods used:
//   1. Pinterest API v5 (free, 1000 calls/day)
//   2. Facebook Graph API (free for pages)
//   3. Instagram Graph API (free for business accounts)
//   4. RSS feed auto-generation (already exists)

interface AutoPostConfig {
  enabled: boolean;
  intervalMinutes: number;
  platforms: string[];
  maxPostsPerRun: number;
  onlyNewProducts: boolean;
  minEditorScore: number;
}

const DEFAULT_CONFIG: AutoPostConfig = {
  enabled: process.env.AUTO_SOCIAL_ENABLED !== 'false',
  intervalMinutes: parseInt(process.env.AUTO_SOCIAL_INTERVAL_MIN || '120', 10) || 120,
  platforms: (process.env.AUTO_SOCIAL_PLATFORMS || 'pinterest').split(',').map(s => s.trim()),
  maxPostsPerRun: parseInt(process.env.AUTO_SOCIAL_MAX_POSTS || '5', 10) || 5,
  onlyNewProducts: true,
  minEditorScore: parseInt(process.env.AUTO_SOCIAL_MIN_SCORE || '6', 10) || 6,
};

let lastRunTime = 0;
let processedToday = 0;
let processedDate = new Date().toISOString().slice(0, 10);

// ─── Pinterest Auto-Pin ──────────────────────────────────────────────────────
// Pinterest is FREE and the #1 free traffic source for product reviews.
// API: https://developers.pinterest.com/docs/api/v5/
// Free tier: 1000 calls/day, perfect for auto-pinning.

async function autoPinProduct(product: any, boardId: string, accessToken: string): Promise<{ success: boolean; pinId?: string; error?: string }> {
  try {
    // Build SEO-optimized pin
    const title = product.product_name
      ? `${product.product_name} Review — DawnWire Score ${product.editor_score || '?'}/10`
      : product.title || 'Product Review';

    const dawnwireUrl = `https://www.dawnwire.com/products/${product.slug || product.id}`;
    const link = withUTM(dawnwireUrl, 'pinterest');

    const description = [
      product.review_summary || product.short_description || '',
      product.final_verdict || '',
      product.best_for ? `Best for: ${product.best_for}` : '',
      product.price ? `Price: $${product.price}` : '',
      product.editor_score ? `DawnWire Editor Score: ${product.editor_score}/10` : '',
      '',
      `🔗 Full review: ${link}`,
      '#ProductReview #BestDeals #AmazonFinds #DawnWire',
    ].filter(Boolean).join('\n').substring(0, 500);

    const imageUrl = product.product_image || product.image || '';
    if (!imageUrl) return { success: false, error: 'No product image' };

    const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        board_id: boardId,
        title: title.substring(0, 100),
        description,
        link,
        image_url: imageUrl,
      }),
    });

    const data: any = await pinRes.json();
    if (data.code && data.code !== 200) {
      return { success: false, error: data.message || `Pinterest API ${data.code}` };
    }

    return { success: true, pinId: data.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Facebook Auto-Post ──────────────────────────────────────────────────────
// Facebook Graph API is free for pages.
// API: https://developers.facebook.com/docs/graph-api

async function autoPostFacebook(product: any, pageId: string, accessToken: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const message = [
      `🔍 New Review: ${product.product_name || product.title}`,
      product.editor_score ? `⭐ DawnWire Score: ${product.editor_score}/10` : '',
      product.best_for ? `🎯 Best for: ${product.best_for}` : '',
      product.price ? `💰 Price: $${product.price}` : '',
      product.review_summary ? `\n${product.review_summary.substring(0, 200)}` : '',
      '',
      'Read the full review 👇',
    ].filter(Boolean).join('\n');

    const imageUrl = product.product_image || product.image || '';
    const dawnwireUrl = `https://www.dawnwire.com/products/${product.slug || product.id}`;
    const link = withUTM(dawnwireUrl, 'facebook');

    let res;
    if (imageUrl) {
      // Post with image
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, caption: message, link, access_token: accessToken }),
      });
      const containerData: any = await containerRes.json();
      if (containerData.error) throw new Error(containerData.error.message);

      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link, access_token: accessToken }),
      });
      res = await publishRes.json();
    } else {
      res = await (await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, link, access_token: accessToken }),
      })).json();
    }

    if (res.error) throw new Error(res.error.message);
    return { success: true, postId: res.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Instagram Auto-Post ─────────────────────────────────────────────────────
// Instagram Graph API is free for business accounts.
// API: https://developers.facebook.com/docs/instagram-api

async function autoPostInstagram(product: any, igUserId: string, accessToken: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const imageUrl = product.product_image || product.image || '';
    if (!imageUrl) return { success: false, error: 'No product image' };

    const caption = [
      `🔍 ${product.product_name || product.title}`,
      product.editor_score ? `⭐ Score: ${product.editor_score}/10` : '',
      product.best_for ? `🎯 Best for: ${product.best_for}` : '',
      product.price ? `💰 $${product.price}` : '',
      '',
      product.review_summary ? product.review_summary.substring(0, 200) : '',
      '',
      '🔗 Full review in bio',
      '#ProductReview #BestDeals #AmazonFinds #DawnWire #TechReview',
    ].filter(Boolean).join('\n').substring(0, 2200);

    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
    });
    const containerData: any = await containerRes.json();
    if (containerData.error) throw new Error(containerData.error.message);

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
    });
    const publishData: any = await publishRes.json();
    if (publishData.error) throw new Error(publishData.error.message);

    return { success: true, postId: publishData.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── Main Auto-Post Runner ───────────────────────────────────────────────────

export async function runAutoSocialPost(): Promise<{
  processed: number;
  results: { product: string; platform: string; success: boolean; error?: string }[];
  limited: boolean;
}> {
  const config = DEFAULT_CONFIG;
  if (!config.enabled) return { processed: 0, results: [], limited: false };

  const now = Date.now();
  if (now - lastRunTime < config.intervalMinutes * 60000) {
    return { processed: 0, results: [], limited: false };
  }

  // Reset daily counter
  const today = new Date().toISOString().slice(0, 10);
  if (processedDate !== today) {
    processedToday = 0;
    processedDate = today;
  }

  lastRunTime = now;
  const supabase = await getSupabaseAdmin();
  const results: any[] = [];

  // Get active credentials for configured platforms
  const { data: credentials } = await supabase
    .from('social_media_credentials')
    .select('*')
    .eq('is_active', true)
    .in('platform', config.platforms);

  if (!credentials || credentials.length === 0) {
    return { processed: 0, results: [], limited: false };
  }

  // Get published products that haven't been posted yet
  const { data: products } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('status', 'published')
    .gte('editor_score', config.minEditorScore)
    .order('editor_score', { ascending: false })
    .limit(config.maxPostsPerRun * 2);

  if (!products || products.length === 0) {
    return { processed: 0, results: [], limited: false };
  }

  // Filter out already-posted products
  const { data: posted } = await supabase
    .from('social_media_posts')
    .select('product_id')
    .eq('status', 'published');

  const postedIds = new Set((posted || []).map((p: any) => p.product_id));
  const toPost = products.filter((p: any) => !postedIds.has(p.id)).slice(0, config.maxPostsPerRun);

  for (const product of toPost) {
    if (processedToday >= config.maxPostsPerRun) break;

    for (const cred of credentials) {
      let result: { success: boolean; pinId?: string; postId?: string; error?: string };

      if (cred.platform === 'pinterest' && cred.board_id) {
        result = await autoPinProduct(product, cred.board_id, cred.access_token);
      } else if (cred.platform === 'facebook' && cred.page_id) {
        result = await autoPostFacebook(product, cred.page_id, cred.access_token);
      } else if (cred.platform === 'instagram' && cred.page_id) {
        result = await autoPostInstagram(product, cred.page_id, cred.access_token);
      } else {
        continue;
      }

      // Log the post
      await supabase.from('social_media_posts').insert({
        id: crypto.randomUUID(),
        product_id: product.id,
        platform: cred.platform,
        caption: `${product.product_name} - DawnWire Score ${product.editor_score}/10`,
        image_url: product.product_image || '',
        link: withUTM(`https://www.dawnwire.com/products/${product.slug || product.id}`, cred.platform),
        status: result.success ? 'published' : 'failed',
        platform_post_id: result.pinId || result.postId || null,
        error_message: result.error || null,
        published_at: result.success ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      });

      results.push({
        product: product.product_name || product.title,
        platform: cred.platform,
        success: result.success,
        error: result.error,
      });

      processedToday++;

      // Rate limit: 1 request per platform per second
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  return { processed: processedToday, results, limited: false };
}

// ─── Scheduler (runs in middleware) ──────────────────────────────────────────

export function startAutoSocialScheduler() {
  const config = DEFAULT_CONFIG;
  if (!config.enabled) {
    console.log('[auto-social] Disabled (set AUTO_SOCIAL_ENABLED=true to enable)');
    return;
  }

  console.log(`[auto-social] Scheduler started — posting to ${config.platforms.join(', ')} every ${config.intervalMinutes} minutes`);

  setInterval(async () => {
    try {
      const result = await runAutoSocialPost();
      if (result.processed > 0) {
        console.log(`[auto-social] Posted ${result.processed} products to social media`);
      }
    } catch (e: any) {
      console.error('[auto-social] Scheduler error:', e.message);
    }
  }, config.intervalMinutes * 60 * 1000);
}

// ─── Free Traffic Sources Config ─────────────────────────────────────────────

export const FREE_TRAFFIC_SOURCES = {
  pinterest: {
    name: 'Pinterest',
    free: true,
    dailyLimit: '1000 API calls/day',
    setup: 'Create Pinterest Business account → Developer portal → Create app → Get Access Token + Board ID',
    url: 'https://developers.pinterest.com/',
    tips: [
      'Create boards for each product category',
      'Use SEO-optimized pin titles with keywords',
      'Add product prices to pins (shows in search)',
      'Pin consistently (5-15 pins/day optimal)',
      'Join group boards for more reach',
    ],
  },
  facebook: {
    name: 'Facebook Pages',
    free: true,
    dailyLimit: 'Unlimited posts',
    setup: 'Create Facebook Page → Settings → Developer Portal → Create App → Get Page Access Token',
    url: 'https://developers.facebook.com/',
    tips: [
      'Post during peak hours (9am, 12pm, 7pm)',
      'Use images with text overlay',
      'Engage with comments quickly',
      'Share to relevant Facebook Groups',
    ],
  },
  instagram: {
    name: 'Instagram Business',
    free: true,
    dailyLimit: '25 posts/day (API limit)',
    setup: 'Switch to Business account → Facebook Developer Portal → Instagram Graph API',
    url: 'https://developers.facebook.com/docs/instagram-api',
    tips: [
      'Use 5-10 relevant hashtags',
      'Post Reels for 2-3x more reach',
      'Use carousel posts for multiple products',
      'Add product tags (requires Facebook Commerce)',
    ],
  },
  google: {
    name: 'Google Merchant Center',
    free: true,
    dailyLimit: 'Unlimited',
    setup: 'Create Merchant Center account → Upload product feed (already built in your project!)',
    url: 'https://merchants.google.com/',
    tips: [
      'Upload the CSV from Admin → Social Media → Google Shopping Feed',
      'Set up automatic feed updates',
      'Enable Free Listings (no ad spend needed)',
      'Optimize product titles with keywords',
    ],
  },
  reddit: {
    name: 'Reddit',
    free: true,
    dailyLimit: 'Manual posting',
    setup: 'Create Reddit account → Join relevant subreddits → Post reviews',
    tips: [
      'Post in r/productreviews, r/BuyItForLife, r/deals',
      'Be helpful, not spammy',
      'Comment on existing threads with your reviews',
      'Build karma first before posting links',
    ],
  },
  twitter: {
    name: 'Twitter/X',
    free: true,
    dailyLimit: '1500 tweets/day (free tier)',
    setup: 'Developer Portal → Create App → Bearer Token',
    url: 'https://developer.twitter.com/',
    tips: [
      'Thread your reviews (1/5, 2/5, etc.)',
      'Use product images in tweets',
      'Reply to trending product discussions',
      'Use relevant hashtags',
    ],
  },
  youtube: {
    name: 'YouTube Shorts',
    free: true,
    dailyLimit: 'Unlimited',
    setup: 'YouTube channel → Upload Shorts with product images + text',
    tips: [
      'Create 15-60 second product review Shorts',
      'Use trending sounds',
      'Add product link in description',
      'Cross-post to YouTube Community tab',
    ],
  },
};
