import type { PageContextServer } from 'vike/types';
import { dbInstance } from '../../../server/db';
import type { Post, Comment, TopicCluster, ContentUpgrade } from '../../../src/types';

export { data };
export type Data = Awaited<ReturnType<typeof data>>;

async function data(pageContext: PageContextServer) {
  const slug = pageContext.routeParams!.slug;

  const [post, allPosts, allCategories, settings, allPages, affiliateLinks] = await Promise.all([
    dbInstance.getPostBySlug(slug),
    dbInstance.getPosts(),
    dbInstance.getCategories(),
    dbInstance.getSettings(),
    dbInstance.getPages(),
    dbInstance.getAffiliateLinks(),
  ]);

  const validPost = (post && post.status === 'published' && post.visibility === 'public') ? post : null;

  const categories = allCategories.filter((c: any) => c.status === 'active');
  const pages = allPages.filter((p: any) => p.status === 'published');
  const activeAffiliateLinks = affiliateLinks.filter((l: any) => l.status === 'active');

  let comments: Comment[] = [];
  let clusters: TopicCluster[] = [];
  let upgrades: ContentUpgrade[] = [];

  if (validPost) {
    const allComments = await dbInstance.getComments();
    comments = (allComments || []).filter((c: any) => c.postId === validPost.id && c.status === 'approved');

    try {
      clusters = await dbInstance.getTopicClusters();
    } catch { clusters = []; }

    try {
      upgrades = await dbInstance.getContentUpgrades();
    } catch { upgrades = []; }
  }

  const publishedPosts = allPosts
    .filter((p: Post) => p.status === 'published' && p.visibility === 'public')
    .sort((a: any, b: any) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  const postIndex = validPost ? publishedPosts.findIndex((p: Post) => p.slug === slug) : -1;
  const prevArticle = postIndex > 0 ? publishedPosts[postIndex - 1] : null;
  const nextArticle = postIndex < publishedPosts.length - 1 ? publishedPosts[postIndex + 1] : null;

  return {
    post: validPost,
    posts: publishedPosts.slice(0, 50),
    comments,
    categories,
    settings,
    pages,
    affiliateLinks: activeAffiliateLinks,
    clusters,
    upgrades,
    prevArticle,
    nextArticle,
  };
}
