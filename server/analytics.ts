import { dbInstance } from './db';
import { getSupabaseAdmin } from './lib/supabase';

function getClient() {
  return getSupabaseAdmin();
}

export async function trackPageView(path: string, referrer: string, userAgent: string, sessionId: string, ip?: string): Promise<void> {
  try {
    const sb = await getClient();
    await sb.from('page_views').insert({
      path,
      referrer: referrer || null,
      user_agent: userAgent || null,
      session_id: sessionId || null,
      ip: ip || null,
      created_at: new Date().toISOString(),
    });
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
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean));
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
  totalClicks: number;
  topLinks: { title: string; clicks: number; url: string }[];
}> {
  try {
    const links = await dbInstance.getAffiliateLinks() as any[];
    if (!links || links.length === 0) {
      return { dailyClicks: [], totalClicks: 0, topLinks: [] };
    }
    const totalClicks = links.reduce((sum: number, l: any) => sum + (l.clickCount || l.click_count || 0), 0);
    const topLinks = links
      .map((l: any) => ({ title: l.title, clicks: l.clickCount || l.click_count || 0, url: l.shortSlug || '' }))
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 20);

    return { dailyClicks: [], totalClicks, topLinks };
  } catch (e) {
    console.error('[Analytics] Failed to get click data:', e);
    return { dailyClicks: [], totalClicks: 0, topLinks: [] };
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
    const [pageViews, affiliateLinks, reviews] = await Promise.all([
      sb.from('page_views').select('path').gte('created_at', new Date(Date.now() - days * 86400000).toISOString()).limit(5000),
      sb.from('affiliate_links').select('title, click_count, clicks_by_page').limit(1000),
      sb.from('product_reviews').select('id, product_name, slug').eq('status', 'published').limit(500),
    ]);

    const viewCounts = new Map<string, number>();
    for (const row of (pageViews.data || [])) {
      const path = (row as any).path || '';
      viewCounts.set(path, (viewCounts.get(path) || 0) + 1);
    }

    const clickCounts = new Map<string, number>();
    for (const link of (affiliateLinks.data || [])) {
      const clicksByPage = (link as any).clicks_by_page || {};
      for (const [page, count] of Object.entries(clicksByPage)) {
        clickCounts.set(page, (clickCounts.get(page) || 0) + (count as number));
      }
    }

    const products = ((reviews.data || []) as any[]).map(r => {
      const reviewPath = `/review/${r.slug || r.id}`;
      const views = viewCounts.get(reviewPath) || 0;
      const clicks = clickCounts.get(reviewPath) || 0;
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
