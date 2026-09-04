import { dbInstance } from './db';
import { getSupabaseAdmin } from './lib/supabase';

function getClient() {
  return getSupabaseAdmin();
}

export async function trackPageView(path: string, referrer: string, userAgent: string, sessionId: string, ip?: string, productSlug?: string): Promise<void> {
  try {
    // Ignore crawlers/bots so the dashboard reflects human traffic.
    const ua = String(userAgent || '').toLowerCase();
    if (/bot|crawl|spider|slurp|bingpreview|headless|phantom|facebookexternalhit|whatsapp|telegrambot|curl|wget/i.test(ua)) return;
    const sb = await getClient();
    await sb.from('page_views').insert({
      id: crypto.randomUUID(),
      path: String(path || '/').slice(0, 1000),
      referrer: referrer ? String(referrer).slice(0, 1000) : null,
      user_agent: ua ? String(userAgent).slice(0, 500) : null,
      session_id: sessionId ? String(sessionId).slice(0, 200) : null,
      ip: ip ? String(ip).slice(0, 64) : null,
      created_at: new Date().toISOString(),
    });
    // Keep per-product page_views in sync so the Product Performance table
    // shows real view counts (this is the client-side view signal).
    if (productSlug) {
      try {
        const { data: prod } = await sb.from('product_reviews').select('id,page_views').eq('slug', productSlug).limit(1).maybeSingle();
        if (prod && prod.id) {
          await sb.from('product_reviews').update({ page_views: Number(prod.page_views || 0) + 1 }).eq('id', prod.id);
        }
      } catch (e) { console.error('[Analytics] product page_views increment:', (e as Error).message); }
    }
  } catch (e) {
    console.error('[Analytics] Failed to track page view:', e);
  }
}

export async function getTrafficData(days: number = 30): Promise<{
  dailyViews: { date: string; views: number; visitors: number }[];
  totalViews: number;
  totalVisitors: number;
  topPages: { path: string; views: number; visitors: number }[];
  topReferrers: { referrer: string; count: number }[];
  avgTimeOnPage: number;
}> {
  try {
    const sb = await getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: views } = await sb
      .from('page_views')
      .select('created_at,session_id,path,referrer')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (!views || views.length === 0) {
      return { dailyViews: [], totalViews: 0, totalVisitors: 0, topPages: [], topReferrers: [], avgTimeOnPage: 0 };
    }

    const totalViews = views.length;
    const uniqueSessions = new Set(views.map((v: any) => v.session_id).filter(Boolean));
    const totalVisitors = uniqueSessions.size;

    const dailyMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const v of views) {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) dailyMap.set(date, { views: 0, sessions: new Set() });
      const day = dailyMap.get(date)!;
      day.views++;
      if (v.session_id) day.sessions.add(v.session_id);
    }
    const dailyViews = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, views: data.views, visitors: data.sessions.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const pageMap = new Map<string, { views: number; sessions: Set<string> }>();
    for (const v of views) {
      if (!pageMap.has(v.path)) pageMap.set(v.path, { views: 0, sessions: new Set() });
      const page = pageMap.get(v.path)!;
      page.views++;
      if (v.session_id) page.sessions.add(v.session_id);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, data]) => ({ path, views: data.views, visitors: data.sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const refMap = new Map<string, number>();
    for (const v of views) {
      if (v.referrer) {
        const host = extractReferrerHost(v.referrer);
        refMap.set(host, (refMap.get(host) || 0) + 1);
      }
    }
    const topReferrers = Array.from(refMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return { dailyViews, totalViews, totalVisitors, topPages, topReferrers, avgTimeOnPage: 0 };
  } catch (e) {
    console.error('[Analytics] Failed to get traffic data:', e);
    return { dailyViews: [], totalViews: 0, totalVisitors: 0, topPages: [], topReferrers: [], avgTimeOnPage: 0 };
  }
}

export async function getClickData(days: number = 30): Promise<{
  dailyClicks: { date: string; clicks: number }[];
  todayClicks: number;
  byPlacement: { placement: string; clicks: number }[];
  totalClicks: number;
  topLinks: { title: string; clicks: number; url: string }[];
}> {
  const empty = { dailyClicks: [], todayClicks: 0, byPlacement: [], totalClicks: 0, topLinks: [] };
  try {
    // Blog short-link (/go/:slug) clicks — stored as counters on affiliate_links.
    const links = (await dbInstance.getAffiliateLinks()) as any[];
    const linkClicks = links && links.length
      ? links.reduce((sum: number, l: any) => sum + (l.clickCount || l.click_count || 0), 0)
      : 0;
    const topLinks = (links || [])
      .map((l: any) => ({ title: l.title || l.shortSlug || 'Link', clicks: l.clickCount || l.click_count || 0, url: l.shortSlug || '' }))
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 20);

    // Product CTA clicks — every /api/public/go/product/:slug redirect logs a
    // row in affiliate_clicks. Aggregate for today / per-day / per-placement.
    let productRows: any[] = [];
    try {
      const sb = await getClient();
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await sb.from('affiliate_clicks')
        .select('created_at,cta_position,page_url,product_id')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20000);
      if (!error && data) productRows = data as any[];
    } catch (e) { console.error('[Analytics] product clicks query:', e); }

    const dateKey = (iso: string) => String(iso || '').slice(0, 10); // YYYY-MM-DD (UTC)
    const today = new Date().toISOString().slice(0, 10);
    const byDayMap = new Map<string, number>();
    const byPlacementMap = new Map<string, number>();
    let todayClicks = 0;
    for (const r of productRows) {
      const dk = dateKey(r.created_at);
      byDayMap.set(dk, (byDayMap.get(dk) || 0) + 1);
      if (dk === today) todayClicks++;
      const placement = String(r.cta_position || 'other').slice(0, 60);
      byPlacementMap.set(placement, (byPlacementMap.get(placement) || 0) + 1);
    }
    const dailyClicks = [...byDayMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, clicks]) => ({ date, clicks }));
    const byPlacement = [...byPlacementMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([placement, clicks]) => ({ placement, clicks }))
      .slice(0, 15);

    return {
      dailyClicks,
      todayClicks,
      byPlacement,
      totalClicks: linkClicks + productRows.length,
      topLinks,
    };
  } catch (e) {
    console.error('[Analytics] Failed to get click data:', e);
    return empty;
  }
}

export async function getEngagementData(days: number = 30): Promise<{
  totalComments: number;
  totalSubscribers: number;
  totalPosts: number;
  postsWithNoViews: number;
}> {
  try {
    const sb = await getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [comments, subs, posts, views] = await Promise.all([
      sb.from('comments').select('id').gte('created_at', since.toISOString()),
      sb.from('newsletter_subscribers').select('id').gte('created_at', since.toISOString()),
      sb.from('posts').select('id,status').limit(1000),
      sb.from('page_views').select('path').gte('created_at', since.toISOString()).limit(5000),
    ]);

    const publishedPosts = (posts.data || []).filter((p: any) => p.status === 'published').length;
    const viewedPaths = new Set((views.data || []).map((v: any) => v.path));
    const postsWithNoViews = publishedPosts > 0
      ? publishedPosts - viewedPaths.size
      : 0;

    return {
      totalComments: comments.data?.length || 0,
      totalSubscribers: subs.data?.length || 0,
      totalPosts: publishedPosts,
      postsWithNoViews,
    };
  } catch {
    return { totalComments: 0, totalSubscribers: 0, totalPosts: 0, postsWithNoViews: 0 };
  }
}

export async function getContentPerformance(days: number = 30): Promise<{
  posts: { title: string; slug: string; views: number; visitors: number; lastViewed: string | null }[];
  totalPosts: number;
}> {
  try {
    const sb = await getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [postsRes, viewsRes] = await Promise.all([
      sb.from('posts').select('id,title,slug,status').eq('status', 'published').limit(1000),
      sb.from('page_views').select('path,created_at,session_id').gte('created_at', since.toISOString()).limit(10000),
    ]);

    const published = (postsRes.data || []) as any[];
    const views = (viewsRes.data || []) as any[];

    const postViewMap = new Map<string, { views: number; sessions: Set<string>; lastViewed: string }>();
    for (const v of views) {
      const key = v.path;
      if (!postViewMap.has(key)) postViewMap.set(key, { views: 0, sessions: new Set(), lastViewed: v.created_at });
      const entry = postViewMap.get(key)!;
      entry.views++;
      if (v.session_id) entry.sessions.add(v.session_id);
      if (v.created_at > entry.lastViewed) entry.lastViewed = v.created_at;
    }

    const posts = published.map(p => {
      const key = '/post/' + p.slug;
      const stats = postViewMap.get(key);
      return {
        title: p.title,
        slug: p.slug,
        views: stats?.views || 0,
        visitors: stats?.sessions.size || 0,
        lastViewed: stats?.lastViewed || null,
      };
    }).sort((a, b) => b.views - a.views);

    return { posts, totalPosts: published.length };
  } catch {
    return { posts: [], totalPosts: 0 };
  }
}

export async function getRecentActivity(days: number = 7): Promise<{
  pageViews: { path: string; time: string; sessionId: string }[];
  comments: { text: string; author: string; time: string }[];
  subscriptions: { email: string; time: string }[];
  messages: { name: string; subject: string; time: string }[];
}> {
  try {
    const sb = await getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [views, comments, subs, msgs] = await Promise.all([
      sb.from('page_views').select('path,created_at,session_id').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(50),
      sb.from('comments').select('content,author,created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(20),
      sb.from('newsletter_subscribers').select('email,created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(20),
      sb.from('messages').select('name,subject,created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(20),
    ]);

    return {
      pageViews: (views.data || []).map((v: any) => ({ path: v.path, time: v.created_at, sessionId: v.session_id })),
      comments: (comments.data || []).map((c: any) => ({ text: c.content, author: c.author, time: c.created_at })),
      subscriptions: (subs.data || []).map((s: any) => ({ email: s.email, time: s.created_at })),
      messages: (msgs.data || []).map((m: any) => ({ name: m.name || 'Anonymous', subject: m.subject, time: m.created_at })),
    };
  } catch {
    return { pageViews: [], comments: [], subscriptions: [], messages: [] };
  }
}

export async function getNewsletterAnalytics(days: number = 30): Promise<{
  totalSubscribers: number;
  newSubscribers: number;
  subscriberGrowth: { date: string; count: number }[];
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
}> {
  try {
    const sb = await getClient();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [allSubs, recentSubs] = await Promise.all([
      sb.from('newsletter_subscribers').select('id'),
      sb.from('newsletter_subscribers').select('created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
    ]);

    const totalSubscribers = allSubs.data?.length || 0;
    const newSubscribers = recentSubs.data?.length || 0;

    // Growth by day
    const growthMap = new Map<string, number>();
    for (const sub of (recentSubs.data || [])) {
      const date = new Date(sub.created_at).toISOString().split('T')[0];
      growthMap.set(date, (growthMap.get(date) || 0) + 1);
    }
    const subscriberGrowth = Array.from(growthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalSubscribers, newSubscribers, subscriberGrowth, totalSent: 0, totalOpens: 0, totalClicks: 0 };
  } catch {
    return { totalSubscribers: 0, newSubscribers: 0, subscriberGrowth: [], totalSent: 0, totalOpens: 0, totalClicks: 0 };
  }
}

export async function getProductAnalytics(days: number = 30): Promise<{
  products: { id: string; product_name: string; slug: string; page_views: number; click_count: number; conversion_rate: number; estimated_earnings: number }[];
  totalViews: number;
  totalClicks: number;
  totalEarnings: number;
}> {
  try {
    const sb = await getClient();
    const [pageViews, affiliateLinks, reviews, rawClicks] = await Promise.all([
      sb.from('page_views').select('path').gte('created_at', new Date(Date.now() - days * 86400000).toISOString()).limit(5000),
      sb.from('affiliate_links').select('title, click_count, clicks_by_page').limit(1000),
      sb.from('product_reviews').select('id, product_name, slug').eq('status', 'published').limit(500),
      sb.from('affiliate_clicks').select('product_id').gte('created_at', new Date(Date.now() - days * 86400000).toISOString()).limit(5000),
    ]);

    const viewCounts = new Map<string, number>();
    for (const row of (pageViews.data || [])) {
      const path = (row as any).path || '';
      viewCounts.set(path, (viewCounts.get(path) || 0) + 1);
    }

    // Real tracked clicks from affiliate_clicks, grouped by product_id
    const trackedClickCounts = new Map<string, number>();
    for (const row of (rawClicks.data || [])) {
      const pid = (row as any).product_id;
      if (!pid) continue;
      trackedClickCounts.set(pid, (trackedClickCounts.get(pid) || 0) + 1);
    }

    const clickCounts = new Map<string, number>();
    for (const link of (affiliateLinks.data || [])) {
      const clicksByPage = (link as any).clicks_by_page || {};
      for (const [page, count] of Object.entries(clicksByPage)) {
        clickCounts.set(page, (clickCounts.get(page) || 0) + (count as number));
      }
    }

    const products = ((reviews.data || []) as any[]).map(r => {
      const slug = r.slug || r.id;
      const reviewPath = `/review/${slug}`;
      const productsPath = `/products/${slug}`;
      const views = (viewCounts.get(reviewPath) || 0) + (viewCounts.get(productsPath) || 0);
      const tracked = trackedClickCounts.get(r.id) || 0;
      const clicks = (clickCounts.get(reviewPath) || 0) + (clickCounts.get(productsPath) || 0) + tracked;
      return {
        id: r.id,
        product_name: r.product_name,
        slug: r.slug || r.id,
        page_views: views,
        click_count: clicks,
        conversion_rate: views > 0 ? Math.round((clicks / views) * 10000) / 100 : 0,
        estimated_earnings: Math.round(clicks * 0.35 * 100) / 100,
      };
    }).sort((a, b) => b.estimated_earnings - a.estimated_earnings);

    const totalViews = products.reduce((s, p) => s + p.page_views, 0);
    const totalClicks = products.reduce((s, p) => s + p.click_count, 0);
    const totalEarnings = products.reduce((s, p) => s + p.estimated_earnings, 0);

    return { products, totalViews, totalClicks, totalEarnings: Math.round(totalEarnings * 100) / 100 };
  } catch {
    return { products: [], totalViews: 0, totalClicks: 0, totalEarnings: 0 };
  }
}

function extractReferrerHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
