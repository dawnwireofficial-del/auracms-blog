import { describe, it, expect } from 'vitest';
import { findLinkSuggestions, applyLinkSuggestions } from '../server/internal-linking';

function makePost(overrides: Record<string, any> = {}) {
  return {
    id: '1',
    title: 'Test Post',
    slug: 'test-post',
    excerpt: '',
    content: '',
    featuredImage: '',
    authorId: 'user-1',
    categoryId: 'cat-1',
    tags: [],
    status: 'published' as const,
    visibility: 'public' as const,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readingTime: 5,
    isFeatured: false,
    isTrending: false,
    isEditorsPick: false,
    allowComments: true,
    ...overrides,
  };
}

describe('findLinkSuggestions', () => {
  it('returns suggestions when post title appears in content', () => {
    const post = makePost({
      id: 'post-1',
      title: 'My Article',
      content: 'This article discusses React Best Practices and how to implement them in your projects. React Best Practices are important.',
    });
    const otherPosts = [makePost({
      id: 'post-2',
      title: 'React Best Practices',
      slug: 'react-best-practices',
      content: 'Best practices for React development.',
    })];
    const suggestions = findLinkSuggestions(post, otherPosts);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0].targetSlug).toBe('react-best-practices');
    expect(suggestions[0].matchedText.toLowerCase()).toContain('react best practices');
  });

  it('does not suggest linking to self', () => {
    const post = makePost({
      id: 'post-1',
      title: 'React Guide',
      content: 'This React Guide covers everything you need.',
    });
    const samePost = makePost({
      id: 'post-1',
      title: 'React Guide',
      slug: 'react-guide',
    });
    const suggestions = findLinkSuggestions(post, [samePost]);
    expect(suggestions.length).toBe(0);
  });

  it('does not suggest links already in content', () => {
    const post = makePost({
      id: 'post-1',
      title: 'My Article',
      content: 'Check out <a href="/post/other-article">Other Article</a> for more details.',
    });
    const otherPost = makePost({
      id: 'post-2',
      title: 'Other Article',
      slug: 'other-article',
    });
    const suggestions = findLinkSuggestions(post, [otherPost]);
    expect(suggestions.length).toBe(0);
  });

  it('skips matches inside HTML tags', () => {
    const post = makePost({
      id: 'post-1',
      title: 'Test',
      content: '<div title="Related Product">Some content</div>',
    });
    const otherPost = makePost({
      id: 'post-2',
      title: 'Related Product',
      slug: 'related-product',
    });
    const suggestions = findLinkSuggestions(post, [otherPost]);
    expect(suggestions.length).toBe(0);
  });

  it('excludes draft posts from candidates', () => {
    const post = makePost({
      id: 'post-1',
      title: 'Main Article',
      content: 'This mentions Draft Article in the text.',
    });
    const draftPost = makePost({
      id: 'post-2',
      title: 'Draft Article',
      slug: 'draft-article',
      status: 'draft',
    });
    const suggestions = findLinkSuggestions(post, [draftPost]);
    expect(suggestions.length).toBe(0);
  });
});

describe('applyLinkSuggestions', () => {
  it('injects anchor tags at correct positions', () => {
    const content = 'Learn about React Best Practices in this guide. React Best Practices are important.';
    const suggestions = [
      { targetPostId: 'p1', targetTitle: 'React Best Practices', targetSlug: 'react-best-practices', matchedText: 'React Best Practices', position: 12 },
    ];
    const result = applyLinkSuggestions(content, suggestions);
    expect(result).toContain('<a href="/post/react-best-practices"');
    expect(result).toContain('class="internal-link"');
    expect(result).toContain('React Best Practices</a>');
  });

  it('handles empty suggestions', () => {
    expect(applyLinkSuggestions('Some content', [])).toBe('Some content');
  });
});
