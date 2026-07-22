import { render, redirect } from 'vike/abort';
import type { PageContextServer } from 'vike/types';
import { dbInstance } from '../server/db';
import { getPublishedProductReviews } from '../server/seo-engine';
import type { Post } from '../src/types';

export { data };
export type Data = Awaited<ReturnType<typeof data>>;

async function data(pageContext: PageContextServer) {
  const urlPath = pageContext.urlPathname || pageContext.urlOriginal || '/';

  if (urlPath === '/review' || urlPath === '/review/' || urlPath === '/reviews' || urlPath === '/reviews/') {
    throw redirect('/products', 301);
  }

  const [allPosts, allCategories, settings, allPages, allAffiliates, rawProducts] = await Promise.all([
    Promise.resolve(dbInstance.getPosts()).catch(() => []),
    Promise.resolve(dbInstance.getCategories()).catch(() => []),
    Promise.resolve(dbInstance.getSettings()).catch(() => null),
    Promise.resolve(dbInstance.getPages()).catch(() => []),
    Promise.resolve(dbInstance.getAffiliateLinks()).catch(() => []),
    getPublishedProductReviews().catch(() => []),
  ]);

  const posts = (allPosts || [])
    .filter((p: Post) => p && p.status === 'published' && p.visibility === 'public')
    .slice(0, 20);
  const categories = (allCategories || []).filter((c: any) => c && c.status === 'active');
  const pages = (allPages || []).filter((p: any) => p && p.status === 'published');
  const affiliateLinks = (allAffiliates || []).filter((l: any) => l && l.status === 'active');
  const productReviews = Array.isArray(rawProducts) ? rawProducts : [];

  if (urlPath.startsWith('/review/')) {
    const slug = urlPath.replace(/^\/review\//, '').split('/')[0]?.split('?')[0];
    if (slug) {
      throw redirect(`/products/${slug}`, 301);
    }
  }

  if (urlPath.startsWith('/product/')) {
    const slug = urlPath.replace(/^\/product\//, '').split('/')[0]?.split('?')[0];
    if (slug) {
      throw redirect(`/products/${slug}`, 301);
    }
  }

  if (urlPath.startsWith('/products/')) {
    const slug = urlPath.replace(/^\/products\//, '').split('/')[0]?.split('?')[0];
    if (slug && slug !== 'category') {
      const exists = productReviews.some((p: any) => p && (p.slug === slug || p.id === slug));
      if (!exists) {
        throw render(404, 'Product review not found');
      }
    }
  }

  if (urlPath.startsWith('/post/')) {
    const slug = urlPath.replace(/^\/post\//, '').split('/')[0]?.split('?')[0];
    if (slug) {
      const exists = posts.some((p: any) => p && (p.slug === slug || p.id === slug));
      if (!exists) {
        throw render(404, 'Post not found');
      }
    }
  }

  return { posts, categories, settings, pages, affiliateLinks, productReviews };
}

