import { dbInstance } from '../server/db';
import { getPublishedProductReviews } from '../server/seo-engine';
import type { Post, Category, Page, AffiliateLink, SiteSettings } from '../src/types';

export { data };
export type Data = Awaited<ReturnType<typeof data>>;

async function data() {
  const [allPosts, allCategories, settings, allPages, allAffiliates, rawProducts] = await Promise.all([
    dbInstance.getPosts(),
    dbInstance.getCategories(),
    dbInstance.getSettings(),
    dbInstance.getPages(),
    dbInstance.getAffiliateLinks(),
    getPublishedProductReviews().catch(() => []),
  ]);

  const posts = allPosts
    .filter((p: Post) => p.status === 'published' && p.visibility === 'public')
    .slice(0, 20);
  const categories = allCategories.filter((c: any) => c.status === 'active');
  const pages = allPages.filter((p: any) => p.status === 'published');
  const affiliateLinks = allAffiliates.filter((l: any) => l.status === 'active');
  const productReviews = Array.isArray(rawProducts) ? rawProducts : [];

  return { posts, categories, settings, pages, affiliateLinks, productReviews };
}

