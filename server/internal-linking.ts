import { Post } from '../src/types';

interface AutoLinkSuggestion {
  targetPostId: string;
  targetTitle: string;
  targetSlug: string;
  matchedText: string;
  position: number;
}

interface AutoLinkResult {
  postId: string;
  postTitle: string;
  injectedLinks: number;
  links: AutoLinkSuggestion[];
}

const MIN_MATCH_LENGTH = 4;
const MAX_LINKS_PER_POST = 3;
const MAX_LINKS_PER_MATCH = 1;

function extractExistingUrls(html: string): Set<string> {
  const urls = new Set<string>();
  const anchorRegex = /<a\s[^>]*href="([^"]+)"/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    if (match[1]) urls.add(match[1].toLowerCase().replace(/\/+$/, ''));
  }
  return urls;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function isInsideTag(html: string, index: number): boolean {
  const before = html.substring(0, index);
  const lastOpen = before.lastIndexOf('<');
  const lastClose = before.lastIndexOf('>');
  if (lastOpen === -1 && lastClose === -1) return false;
  if (lastClose > lastOpen) return false;
  const tagContent = before.substring(lastOpen);
  if (!tagContent.startsWith('</')) return true;
  return false;
}

export function findLinkSuggestions(post: Post, allPosts: Post[]): AutoLinkSuggestion[] {
  const content = post.content || '';
  if (!content.trim()) return [];

  const existingUrls = extractExistingUrls(content);
  const existingSlugs = new Set<string>();
  existingUrls.forEach(url => {
    const slug = url.split('/').pop() || '';
    if (slug) existingSlugs.add(slug);
  });

  const candidates = allPosts.filter(p =>
    p.id !== post.id &&
    p.status === 'published' &&
    p.title &&
    p.slug &&
    !existingSlugs.has(p.slug)
  );

  const textContent = content;
  const suggestions: AutoLinkSuggestion[] = [];

  const usedPositions = new Set<number>();

  const sorted = [...candidates].sort((a, b) => b.title.length - a.title.length);

  for (const candidate of sorted) {
    if (suggestions.length >= MAX_LINKS_PER_POST) break;

    const title = candidate.title.trim();
    if (title.length < MIN_MATCH_LENGTH) continue;

    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    let match: RegExpExecArray | null;
    let localCount = 0;

    while ((match = regex.exec(textContent)) !== null && localCount < MAX_LINKS_PER_MATCH) {
      const pos = match.index;

      if (usedPositions.has(pos)) {
        continue;
      }

      const overlap = Array.from(usedPositions).some(existingPos => {
        const end1 = existingPos + suggestions.find(s => s.position === existingPos)!.matchedText.length;
        const start2 = pos;
        const end2 = pos + match![0].length;
        return start2 < end1 && end2 > existingPos;
      });
      if (overlap) continue;

      if (isInsideTag(textContent, pos)) continue;

      usedPositions.add(pos);
      suggestions.push({
        targetPostId: candidate.id,
        targetTitle: candidate.title,
        targetSlug: candidate.slug,
        matchedText: match[0],
        position: pos,
      });
      localCount++;
    }
  }

  return suggestions.sort((a, b) => a.position - b.position);
}

export function applyLinkSuggestions(content: string, suggestions: AutoLinkSuggestion[]): string {
  if (!suggestions.length) return content;

  const sorted = [...suggestions].sort((a, b) => b.position - a.position);

  let result = content;
  for (const s of sorted) {
    const before = result.substring(0, s.position);
    const after = result.substring(s.position + s.matchedText.length);
    result = `${before}<a href="/post/${s.targetSlug}" class="internal-link" target="_blank" rel="noopener noreferrer">${s.matchedText}</a>${after}`;
  }

  return result;
}

export function autoLinkPost(post: Post, allPosts: Post[]): AutoLinkResult {
  const suggestions = findLinkSuggestions(post, allPosts);
  return {
    postId: post.id,
    postTitle: post.title,
    injectedLinks: suggestions.length,
    links: suggestions,
  };
}

export function autoLinkPosts(posts: Post[]): AutoLinkResult[] {
  const published = posts.filter(p => p.status === 'published' && p.content);
  return published.map(post => autoLinkPost(post, posts));
}
