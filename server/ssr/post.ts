import { dbInstance } from '../db';
import { esc, mdToSimpleHtml, ssrFooter } from './common';

// Server-side renderer for /post/:slug (editorial article pages).
// Returns null when the slug does not resolve to a published public post so the
// caller falls back to the SPA shell (which then shows its 404 state).

export async function renderPostPageHtml(slug: string): Promise<string | null> {
  let post: any = null;
  try {
    post = await dbInstance.getPostBySlug(slug);
  } catch (e) {
    console.error('[SSR post] getPostBySlug:', e);
  }
  if (!post) return null;
  if (post.status !== 'published') return null;
  if (post.visibility != null && post.visibility !== 'public') return null;

  const title = String(post.title || '');
  if (!title) return null;

  const excerpt = post.excerpt || '';
  const content = post.content || '';
  const publishedAt = post.publishedAt || post.published_at || post.createdAt || post.created_at;
  const tags = Array.isArray(post.tags) ? post.tags : [];

  let categoryName = '';
  let categorySlug = '';
  if (post.categoryId || post.category_id) {
    try {
      const cats = await dbInstance.getCategories();
      const cat = (cats || []).find((c: any) => c.id === (post.categoryId || post.category_id));
      if (cat) {
        categoryName = cat.name || '';
        categorySlug = cat.slug || '';
      }
    } catch (e) {
      console.error('[SSR post] categories:', e);
    }
  }

  const meta = [
    publishedAt ? `<span>Published: ${new Date(publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>` : '',
    categorySlug && categoryName ? `<span><a href="/categories/${esc(categorySlug)}">${esc(categoryName)}</a></span>` : '',
    tags.length ? `<span>Tags: ${tags.map((t: any) => esc(t)).join(', ')}</span>` : '',
  ].filter(Boolean).join(' · ');

  return `<article class="ssr-content" id="post-seo-content">
<h1>${esc(title)}</h1>
${meta ? `<div class="meta">${meta}</div>` : ''}
${excerpt ? `<p><strong>${esc(excerpt)}</strong></p>` : ''}
${content ? mdToSimpleHtml(content) : ''}
${ssrFooter()}
</article>`;
}
