import { dbInstance } from './db';

interface AutoLinkResult {
  original: string;
  modified: string;
  changes: { title: string; slug: string; count: number }[];
}

export async function autoLinkAffiliates(content: string): Promise<AutoLinkResult> {
  if (!content || content.length < 20) {
    return { original: content, modified: content, changes: [] };
  }

  const links = await dbInstance.getAffiliateLinks() as any[];
  const activeLinks = links.filter((l: any) => l.status === 'active');
  if (activeLinks.length === 0) {
    return { original: content, modified: content, changes: [] };
  }

  let modified = content;
  const changes: { title: string; slug: string; count: number }[] = [];

  // Sort by title length desc to match longer names first
  const sorted = [...activeLinks].sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));

  for (const link of sorted) {
    const slug = link.shortSlug || link.id;
    const cardTag = `[affiliate-card:${slug}]`;

    // Skip if already linked
    if (modified.includes(cardTag)) continue;

    const title = link.title?.trim();
    if (!title || title.length < 3) continue;

    // Escape regex special chars in title
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\[affiliate-card:[\\w-]+\\]\\()${escaped}(?!\\w)`, 'gi');

    const matches = modified.match(regex);
    if (!matches) continue;

    // Replace first occurrence (usually most prominent placement)
    modified = modified.replace(regex, cardTag);
    changes.push({ title, slug, count: matches.length });
  }

  return {
    original: content,
    modified,
    changes,
  };
}

export interface BulkAutoLinkResult {
  totalPosts: number;
  postsWithChanges: number;
  totalLinksAdded: number;
  results: { postId: string; postTitle: string; changes: number }[];
}

export async function bulkAutoLinkAffiliates(): Promise<BulkAutoLinkResult> {
  const posts = await dbInstance.getPosts() as any[];
  const published = posts.filter((p: any) => p.status === 'published' && p.content);
  let postsWithChanges = 0;
  let totalLinksAdded = 0;
  const results: { postId: string; postTitle: string; changes: number }[] = [];

  for (const post of published) {
    const result = await autoLinkAffiliates(post.content);
    if (result.changes.length > 0) {
      await dbInstance.updatePost(post.id, { content: result.modified, updatedAt: new Date().toISOString() });
      postsWithChanges++;
      totalLinksAdded += result.changes.reduce((s, c) => s + c.count, 0);
      results.push({ postId: post.id, postTitle: post.title, changes: result.changes.length });
    }
  }

  return { totalPosts: published.length, postsWithChanges, totalLinksAdded, results };
}
