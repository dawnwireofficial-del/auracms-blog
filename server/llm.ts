import { findEntities, getEntitySchema } from './entities';

const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'Google-Extended', 'Google-CloudVertexBot',
  'CCBot', 'Claude-Web', 'ClaudeBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Cohere-ai', 'cohere-ai',
  'Amazon-Route53', 'Amazon-Route53-Testing',
  'Applebot-Extended', 'Applebot',
  'Bytespider', 'BingBot',
  'facebookexternalhit', 'LinkedInBot',
  'Slurp', 'YandexBot',
  'OAI-SearchBot', 'AI2Bot', 'Diffbot',
  'Timpibot', 'DotBot',
];

const CRAWLER_PATTERNS = AI_CRAWLERS.map(c => c.toLowerCase());

export function isAiCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => lower.includes(pattern));
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToHtml(md: string): string {
  const html = md
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
      const isHeader = /^[-:\s]+$/.test(cells.join(''));
      if (isHeader) return '';
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/<blockquote>\n?/g, '<blockquote>')
    .replace(/\n?<\/blockquote>/g, '</blockquote>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inTable = false;
  let inList = false;
  const inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    if (!line) {
      if (inTable) { result.push('</table>'); inTable = false; }
      if (inList) { result.push('</ul>'); inList = false; }
      if (inBlockquote) { /* keep open for now */ }
      continue;
    }

    if (line.startsWith('<h') || line.startsWith('<table') || line.startsWith('<pre') || line.startsWith('<hr') || line.startsWith('<blockquote') || line.startsWith('</blockquote')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(line);
      continue;
    }

    if (line.startsWith('<tr>')) {
      if (!inTable) { inTable = true; result.push('<table>'); }
      result.push(line);
      continue;
    }

    if (line.startsWith('<li>')) {
      if (!inList) { inList = true; result.push('<ul>'); }
      result.push(line);
      if (!nextLine.startsWith('<li>') && !nextLine.startsWith('<ul')) {
        result.push('</ul>'); inList = false;
      }
      continue;
    }

    if (line.startsWith('</')) {
      result.push(line);
      continue;
    }

    if (['<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>'].some(t => line.startsWith(t))) {
      result.push(line);
      continue;
    }

    if (line.startsWith('<pre') || line.startsWith('<code>') || line.startsWith('</code>') || line.startsWith('</pre>')) {
      result.push(line);
      continue;
    }

    if (!line.startsWith('<')) {
      result.push(`<p>${line}</p>`);
    } else {
      result.push(line);
    }
  }

  if (inTable) result.push('</table>');
  if (inList) result.push('</ul>');

  return result.join('\n');
}

function renderHead(title: string, description: string, canonical: string, baseUrl: string, schema?: Record<string, any>): string {
  const schemas = schema ? [{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DawnWire',
    url: baseUrl,
  }, schema] : [{
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DawnWire',
    url: baseUrl,
  }];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="llms.txt" href="${baseUrl}/llms.txt" type="text/plain">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; -webkit-text-size-adjust: 100%; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color: #1a1a2e; background: #fafafa; line-height: 1.7; }
  .wrapper { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
  header { border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
  header a { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; text-decoration: none; }
  header .tagline { color: #6b7280; font-size: 0.875rem; }
  header nav { margin-left: auto; display: flex; gap: 1rem; }
  header nav a { font-size: 0.875rem; font-weight: 500; color: #4f46e5; text-decoration: none; }
  header nav a:hover { text-decoration: underline; }
  h1 { font-size: 2rem; font-weight: 800; line-height: 1.3; margin-bottom: 0.75rem; color: #111827; }
  h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
  h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #374151; }
  p { margin-bottom: 1rem; }
  a { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; }
  a:hover { color: #4338ca; }
  ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
  li { margin-bottom: 0.25rem; }
  blockquote { border-left: 4px solid #4f46e5; padding: 0.75rem 1rem; margin: 1rem 0; background: #f3f4f6; border-radius: 0 0.5rem 0.5rem 0; font-style: italic; color: #374151; }
  blockquote p { margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  tr:nth-child(even) { background: #f9fafb; }
  pre { background: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
  code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.875rem; }
  pre code { background: transparent; padding: 0; }
  p > code, li > code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; color: #dc2626; font-size: 0.875rem; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
  img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
  strong { font-weight: 700; }
  .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }
  .meta span { display: inline-flex; align-items: center; gap: 0.25rem; }
  .summary { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 0.5rem; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
  .summary p { margin-bottom: 0; }
  .summary strong:first-child { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; margin-bottom: 0.25rem; }
  .key-takeaways { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
  .key-takeaways strong:first-child { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #16a34a; margin-bottom: 0.25rem; }
  .key-takeaways ul { margin-bottom: 0; }
  footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 0.8rem; }
  .article-list { list-style: none; padding: 0; }
  .article-list li { padding: 1rem 0; border-bottom: 1px solid #e5e7eb; }
  .article-list li:last-child { border-bottom: none; }
  .article-list a { font-size: 1.125rem; font-weight: 600; text-decoration: none; }
  .article-list a:hover { text-decoration: underline; }
  .article-list .excerpt { color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem; }
  .article-list .date { color: #9ca3af; font-size: 0.8rem; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #e2e8f0; }
    header a { color: #f1f5f9; }
    h1 { color: #f8fafc; }
    h2 { color: #e2e8f0; border-bottom-color: #334155; }
    h3 { color: #cbd5e1; }
    blockquote { background: #1e293b; border-left-color: #6366f1; color: #cbd5e1; }
    table { color: #e2e8f0; }
    th, td { border-color: #334155; }
    th { background: #1e293b; }
    tr:nth-child(even) { background: #1a2332; }
    p > code, li > code { background: #1e293b; color: #f87171; }
    .summary { background: #1e1b4b; border-color: #3730a3; }
    .key-takeaways { background: #052e16; border-color: #166534; }
    .meta { color: #94a3b8; }
    footer { border-top-color: #334155; }
    .article-list li { border-bottom-color: #334155; }
    .article-list .excerpt { color: #94a3b8; }
  }
</style>
</head>
<body>
<div class="wrapper">
<header>
  <a href="/">DawnWire</a>
  <span class="tagline">Product Reviews & Buying Guides</span>
  <nav>
    <a href="/">Home</a>
    <a href="/llms.txt">llms.txt</a>
  </nav>
</header>
<main>`;
}

function renderFoot(): string {
  return `</main>
<footer>
  <p>&copy; ${new Date().getFullYear()} DawnWire. All rights reserved.</p>
  <p>This is a simplified version for AI crawlers. <a href="/">View the full site</a>.</p>
</footer>
</div>
</body>
</html>`;
}

export function renderArticlePage(post: {
  title: string; content: string; excerpt: string; slug: string;
  publishedAt?: string; categoryId?: string; tags?: string[];
  featuredImage?: string; authorName?: string;
  seoTitle?: string; seoDescription?: string;
}, baseUrl: string): string {
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${baseUrl}/post/${post.slug}`;
  const category = post.categoryId || '';
  const tags = post.tags || [];

  const contentText = `${post.title} ${post.excerpt} ${post.content}`.substring(0, 5000);
  const entities = findEntities(contentText);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    url,
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    publisher: { '@type': 'Organization', name: 'DawnWire', url: baseUrl },
    ...(entities.length > 0 ? { mentions: entities.map((e: any) => ({ '@type': 'Thing', name: e.name, sameAs: e.sameAs })) } : {}),
  };

  const html = mdToHtml(post.content);
  const blocks = html.match(/<blockquote>[\s\S]*?<\/blockquote>/);
  const takeaways = html.match(/<h2>Key Takeaways<\/h2>[\s\S]*?(?=<h2>|$)/);

  let structured = html;
  if (blocks) {
    structured = html.replace(
      blocks[0],
      `<div class="summary"><strong>Quick Summary</strong>${blocks[0].replace(/<\/?blockquote>/g, '').trim()}</div>`
    );
  }
  if (takeaways) {
    structured = structured.replace(
      takeaways[0],
      `<div class="key-takeaways"><strong>Key Takeaways</strong>${takeaways[0].replace(/<h2>Key Takeaways<\/h2>/, '')}</div>`
    );
  }

  const metaParts = [
    post.publishedAt ? `<span>Published: ${new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>` : '',
    category ? `<span>Category: ${escapeHtml(category)}</span>` : '',
    tags.length ? `<span>Tags: ${tags.map(t => escapeHtml(t)).join(', ')}</span>` : '',
  ].filter(Boolean).join('');

  return `${renderHead(title, description, url, baseUrl, schema)}
<article>
<h1>${escapeHtml(post.title)}</h1>
<div class="meta">${metaParts}</div>
${structured}
</article>
${renderFoot()}`;
}

export function renderHomePage(posts: Array<{
  title: string; slug: string; excerpt: string;
  publishedAt?: string; categoryId?: string;
}>, baseUrl: string): string {
  const title = 'DawnWire — Product Reviews & Buying Guides';
  const description = 'In-depth product reviews, buying guides, and expert recommendations across tech, home, lifestyle, and digital tools.';
  const url = baseUrl;

  const list = posts.map(p => {
    const date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    return `<li>
      <a href="${baseUrl}/post/${p.slug}">${escapeHtml(p.title)}</a>
      ${p.excerpt ? `<div class="excerpt">${escapeHtml(p.excerpt.substring(0, 200))}</div>` : ''}
      <div class="date">${date}${p.categoryId ? ` &middot; ${escapeHtml(p.categoryId)}` : ''}</div>
    </li>`;
  }).join('\n');

  return `${renderHead(title, description, url, baseUrl)}
<h1>DawnWire — Product Reviews & Buying Guides</h1>
<div class="summary"><strong>About</strong> Expert buying guides, product comparisons, and in-depth reviews to help you make informed purchase decisions.</div>
<ul class="article-list">
${list}
</ul>
${renderFoot()}`;
}

export function renderProductReviewPage(review: {
  product_name: string; brand?: string; price?: string; rating?: number;
  best_for?: string; review_summary?: string; final_verdict?: string;
  pros?: string[]; cons?: string[]; key_features?: string[];
  product_image?: string; slug?: string;
  faqs?: { q: string; a: string }[];
}, baseUrl: string): string {
  const title = `${review.product_name} Review & Buying Guide | DawnWire`;
  const description = review.review_summary || `In-depth review of ${review.product_name}.`;
  const url = `${baseUrl}/product/${review.slug || review.product_name.toLowerCase().replace(/\s+/g, '-')}`;

  const reviewEntityText = [review.product_name, review.brand, review.review_summary, review.final_verdict, ...(review.pros || []), ...(review.cons || [])].filter(Boolean).join(' ');
  const reviewEntities = findEntities(reviewEntityText);
  const productEntity = reviewEntities.find(e => e.name.toLowerCase() === (review.product_name || '').toLowerCase());
  const brandEntity = reviewEntities.find(e => e.name.toLowerCase() === (review.brand || '').toLowerCase());

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: review.product_name,
    ...(productEntity?.sameAs ? { sameAs: productEntity.sameAs } : {}),
    brand: review.brand ? {
      '@type': 'Brand',
      name: review.brand,
      ...(brandEntity?.sameAs ? { sameAs: brandEntity.sameAs } : {}),
    } : undefined,
    ...(review.price ? { offers: { '@type': 'Offer', price: review.price.replace(/[^0-9.]/g, ''), priceCurrency: 'USD' } } : {}),
    ...(review.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: review.rating, bestRating: 5 } } : {}),
    ...(reviewEntities.length > 0 ? { mentions: reviewEntities.map((e: any) => ({ '@type': 'Thing', name: e.name, sameAs: e.sameAs })) } : {}),
  };

  let html = '';

  if (review.review_summary) {
    html += `<div class="summary"><strong>Quick Summary</strong> ${escapeHtml(review.review_summary)}</div>`;
  }

  if (review.pros?.length || review.cons?.length) {
    html += '<h2>Pros & Cons</h2>';
    if (review.pros?.length) {
      html += '<h3>Pros</h3><ul>';
      review.pros.forEach(p => { html += `<li>${escapeHtml(p)}</li>`; });
      html += '</ul>';
    }
    if (review.cons?.length) {
      html += '<h3>Cons</h3><ul>';
      review.cons.forEach(c => { html += `<li>${escapeHtml(c)}</li>`; });
      html += '</ul>';
    }
  }

  if (review.key_features?.length) {
    html += '<h2>Key Features</h2><ul>';
    review.key_features.forEach(f => { html += `<li>${escapeHtml(f)}</li>`; });
    html += '</ul>';
  }

  if (review.final_verdict) {
    html += '<h2>Verdict</h2>';
    html += `<p>${escapeHtml(review.final_verdict)}</p>`;
  }

  if (review.faqs?.length) {
    html += '<h2>Frequently Asked Questions</h2>';
    review.faqs.forEach(faq => {
      html += `<h3>Q: ${escapeHtml(faq.q)}</h3>`;
      html += `<p>A: ${escapeHtml(faq.a)}</p>`;
    });
  }

  const meta = [
    review.brand ? `<span>Brand: ${escapeHtml(review.brand)}</span>` : '',
    review.price ? `<span>Price: ${escapeHtml(review.price)}</span>` : '',
    review.rating ? `<span>Rating: ${review.rating}/5</span>` : '',
    review.best_for ? `<span>Best For: ${escapeHtml(review.best_for)}</span>` : '',
  ].filter(Boolean).join('');

  return `${renderHead(title, description, url, baseUrl, schema)}
<article>
<h1>${escapeHtml(review.product_name)} Review</h1>
<div class="meta">${meta}</div>
${review.product_image ? `<img src="${escapeHtml(review.product_image)}" alt="${escapeHtml(review.product_name)}" width="800" height="450" loading="eager" decoding="async">` : ''}
${html}
</article>
${renderFoot()}`;
}
