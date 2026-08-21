import { generateText } from 'ai';
import { createCohere } from '@ai-sdk/cohere';
import { deepseekText, isDeepSeekConfigured } from './deepseek-pool';
import { geminiText, isGeminiConfigured } from './gemini';

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.COHERE_API_KEY || '';
const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || 'https://api.cohere.ai/v2';
const AI_GATEWAY_MODEL = process.env.AI_GATEWAY_MODEL || 'command-r-plus-08-2024';

// Cloudflare Workers AI — fast text LLMs (seconds, not minutes). Used as the
// primary provider so synchronous article generation fits Vercel's 60s cap.
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_IMAGE_API_KEY || process.env.CLOUDFLARE_API_TOKEN || '';
const CLOUDFLARE_TEXT_MODEL = process.env.CLOUDFLARE_TEXT_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export function isCloudflareTextConfigured(): boolean {
  return CLOUDFLARE_ACCOUNT_ID.trim().length > 0 && CLOUDFLARE_API_TOKEN.trim().length > 0;
}

async function cloudflareText(promptText: string, system?: string, timeoutMs?: number, maxTokens?: number): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/ai/run/${CLOUDFLARE_TEXT_MODEL}`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs || 30000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: promptText },
        ],
        max_tokens: maxTokens || 1200,
      }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      const msg = data?.errors?.[0]?.message || `HTTP ${res.status}`;
      throw new Error('Cloudflare: ' + msg);
    }
    const out = data?.result?.response || '';
    if (!out.trim()) throw new Error('Cloudflare returned an empty response');
    return out.trim();
  } catch (e: any) {
    clearTimeout(tid);
    if (e.name === 'AbortError') throw new Error('Cloudflare request timed out', { cause: e });
    throw e;
  }
}

function normalizeCohereResponse(body: string): string {
  try {
    const parsed = JSON.parse(body);
    const citations = parsed?.message?.citations;
    if (Array.isArray(citations)) {
      for (const citation of citations) {
        if (!Array.isArray(citation?.sources)) continue;
        for (const source of citation.sources) {
          if (source && typeof source === 'object' && !source.document) {
            source.document = {
              text: JSON.stringify(source.tool_output ?? source.text ?? ''),
              title: source.type === 'tool' ? 'Tool' : 'Document',
            };
          }
        }
      }
      return JSON.stringify(parsed);
    }
  } catch {
    // not JSON or unexpected shape — return as-is
  }
  return body;
}

function getClient() {
  if (!AI_GATEWAY_API_KEY) throw new Error('AI_GATEWAY_API_KEY not configured. Set it in Vercel environment variables.');
  const opts: Record<string, any> = {
    apiKey: AI_GATEWAY_API_KEY,
    fetch: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const res = await fetch(input, init);
      if (!res.ok) return res;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return res;
      const text = await res.text();
      const normalized = normalizeCohereResponse(text);
      if (normalized === text) return new Response(text, { status: res.status, headers: res.headers });
      return new Response(normalized, { status: res.status, headers: res.headers });
    },
  };
  if (AI_GATEWAY_BASE_URL) opts.baseURL = AI_GATEWAY_BASE_URL;
  return createCohere(opts);
}

function getModel() {
  return getClient()(AI_GATEWAY_MODEL);
}

export async function cohereChat(promptText: string, system?: string, timeoutMs?: number, maxTokens?: number): Promise<string> {
  // Shared budget. Each provider gets a slice so a slow/broken provider can't
  // eat the whole budget and block the others (Vercel caps synchronous work at 60s).
  const budget = Math.max(9000, timeoutMs || 20000);
  // DeepSeek is the primary provider — it gets the full budget.
  // Fallbacks get a slice so a broken provider can't blow the whole budget.
  const fallbackSlice = Math.max(6500, Math.floor(budget / 3));
  const errors: string[] = [];

  // 1. DeepSeek — primary provider (multi-key rotation + auto-failover).
  if (isDeepSeekConfigured()) {
    try {
      const r = await deepseekText({ prompt: promptText, system, timeoutMs: budget, maxOutputTokens: maxTokens });
      if (r) return r;
      errors.push('deepseek: empty response');
    } catch (e: any) {
      errors.push(`deepseek: ${e.name === 'AbortError' ? 'timed out' : e.message}`);
    }
  }

  // 2. Cloudflare Workers AI — fast text LLM. Completes in seconds so it fits
  //    Vercel's 60s cap; used as first fallback for synchronous article generation.
  if (isCloudflareTextConfigured()) {
    try {
      const r = await cloudflareText(promptText, system, Math.min(fallbackSlice, 25000), maxTokens);
      if (r) return r;
      errors.push('cloudflare: empty response');
    } catch (e: any) {
      errors.push(`cloudflare: ${e.name === 'AbortError' ? 'timed out' : e.message}`);
    }
  }

  // 3. Cohere / AI Gateway — secondary fallback.
  if (AI_GATEWAY_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), fallbackSlice);
      let result;
      try {
        result = await generateText({
          model: getModel(),
          prompt: promptText,
          system,
          maxOutputTokens: maxTokens || 1200,
          temperature: 0.7,
          abortSignal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (e: any) {
        clearTimeout(timeoutId);
        throw e;
      }
      const text = result.text?.trim() || '';
      if (text) return text;
      errors.push('gateway: empty response');
    } catch (e: any) {
      errors.push(`gateway: ${e.name === 'AbortError' ? 'timed out' : e.message}`);
    }
  }

  // 4. Gemini — last resort fallback.
  if (isGeminiConfigured()) {
    try {
      const r = await geminiText(promptText, system, fallbackSlice, maxTokens);
      if (r) return r;
      errors.push('gemini: empty response');
    } catch (e: any) {
      errors.push(`gemini: ${e.name === 'AbortError' ? 'timed out' : e.message}`);
    }
  }

  throw new Error('AI request failed: ' + (errors.join(' | ') || 'no providers configured') + (errors.length ? ' (try again or check the configured API keys)' : ''));
}

export async function generateProductVerdict(productInfo: string): Promise<string> {
  const systemPrompt = `You are a professional product reviewer for DawnWire. 
Write a highly opinionated, snappy, 2-3 sentence "AI Verdict" for the following product. 
It must be brutally honest but helpful, highlighting who should buy it and who should avoid it. 
No markdown formatting, just plain text.`;
  
  const prompt = `Product Info:\n${productInfo}\n\nWrite the 2-3 sentence verdict now:`;
  return await cohereChat(prompt, systemPrompt);
}

export async function generateArticleFromProduct(
  product: any,
  similarProducts: any[],
): Promise<{ title: string; content: string; excerpt: string }> {
  const productInfo = [
    `Product: ${product.product_name}`,
    product.brand ? `Brand: ${product.brand}` : '',
    product.price ? `Price: ${product.price}` : '',
    product.rating ? `Rating: ${product.rating}/5` : '',
    product.best_for ? `Best For: ${product.best_for}` : '',
    product.review_summary ? `Summary: ${product.review_summary}` : '',
    product.final_verdict ? `Verdict: ${product.final_verdict}` : '',
    product.pros?.length ? `Pros: ${product.pros.join(', ')}` : '',
    product.cons?.length ? `Cons: ${product.cons.join(', ')}` : '',
    product.key_features?.length ? `Features: ${product.key_features.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const similarInfo = similarProducts.map((p, i) =>
    `\n${i + 1}. ${p.product_name}${p.brand ? ` by ${p.brand}` : ''}${p.price ? ` - ${p.price}` : ''}${p.rating ? ` (${p.rating}/5)` : ''}`
  ).join('');

  const systemPrompt = `You are a professional product review writer and affiliate content strategist for DawnWire (dawnwire.com). Write a comprehensive, SEO-optimized buying guide/article in Markdown format (not HTML). Your articles are optimized for both human readers AND AI/LLM extractors (Google AI, ChatGPT, Perplexity, Gemini).

STRUCTURE REQUIREMENTS:
- # H1 main title
- > **Quick Summary** blockquote as first paragraph (2-3 concise sentences) — this will be extracted by AI assistants as a featured snippet
- ## Key Takeaways section with 3-5 bullet points
- Introduction / body sections with ## H2 and ### H3
- **Use data tables** (| Header | Header |) for product comparisons, specs, or feature breakdowns — LLMs parse tables extremely well
- Define key terms/features on first mention (definition-first structure helps AI understanding)
- Include authoritative references: when mentioning well-known brands (Apple, Google, Microsoft, Sony, etc.), technologies (AI, SEO, WordPress, etc.), or people, add a Wikipedia-style citation in parentheses, e.g. "WordPress (open-source CMS)" or "Sony (Japanese electronics conglomerate)"
- ## Frequently Asked Questions section with at least 3 Q&A pairs (formatted as **Q:** and **A:** on separate lines)
- ## Verdict or ## Final Verdict with clear recommendation

FORMAT: Use | pipe | tables for comparison data. Use **bold** for emphasis. Use - for bullet lists. Use [affiliate-card:product-slug] for affiliate links. Output ONLY Markdown with no extra commentary. Do NOT wrap in code fences.`;

  const prompt = `Write a comprehensive buying guide article comparing the following main product with similar alternatives.

MAIN PRODUCT:
${productInfo}

SIMILAR PRODUCTS TO COMPARE:
${similarInfo || 'None provided - write a detailed single product review article instead.'}

STRUCTURE (MUST follow exactly):
1. **# SEO title** — compelling H1
2. **> Quick Summary** — blockquote with 2-3 concise sentences summarizing the verdict (AI extractors will surface this)
3. **## Key Takeaways** — 3-5 bullet points of the most important facts
4. **## Introduction** — engaging opener explaining why this category matters
5. **## Product Overview** — deep analysis of the main product. Include authoritative references: when mentioning well-known brands (Apple, Sony, Bose) or technologies (AI, ANC, Bluetooth), add a brief definition or context in parentheses.
6. **## Comparison** — ONLY if alternatives exist. Use a | Markdown table | with columns: Feature, Main Product, Alternative 1, Alternative 2. Include rows for Price, Rating, Best For, Key Specs.
7. **## Pros & Cons** — bullet lists for each product
8. **## Buying Guide** — key features to consider. Define each term on first mention (definition-first style). Include relevant Wikipedia-style citations for technical terms.
9. **## Frequently Asked Questions** — 3+ Q&A pairs. Format: **Q:** question **A:** answer
10. **## Verdict** — clear recommendation and why

Use DawnWire's brand voice: professional, authoritative, helpful, and data-driven. Keep paragraphs concise.`;

  const raw = await cohereChat(prompt, systemPrompt, 40000, 1500);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  if (!cleaned) throw new Error('AI returned an empty article');
  const lines = cleaned.split('\n');
  const firstH1 = lines.find(l => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1
    ? firstH1.replace(/^#\s+/, '').trim()
    : `Complete ${product.product_name} Review & Buying Guide`;
  const content = cleaned;
  const excerpt = product.review_summary || `An in-depth review and buying guide for ${product.product_name}.`;

  return { title, content, excerpt };
}

// Compact fallback — used when the full article generation times out or the AI
// provider is too slow. Produces a shorter but complete article so a slow model
// can never block the product from getting its post within Vercel's 60s cap.
async function generateCompactArticle(
  product: any,
): Promise<{ title: string; content: string; excerpt: string }> {
  const productInfo = [
    `Product: ${product.product_name}`,
    product.brand ? `Brand: ${product.brand}` : '',
    product.price ? `Price: ${product.price}` : '',
    product.rating ? `Rating: ${product.rating}/5` : '',
    product.best_for ? `Best For: ${product.best_for}` : '',
    product.review_summary ? `Summary: ${product.review_summary}` : '',
    product.final_verdict ? `Verdict: ${product.final_verdict}` : '',
    product.pros?.length ? `Pros: ${product.pros.join(', ')}` : '',
    product.cons?.length ? `Cons: ${product.cons.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a professional product review writer for DawnWire (dawnwire.com). Write a concise but complete buying guide in Markdown. Output ONLY Markdown, no code fences, no extra commentary.`;
  const prompt = `Write a compact product review article (roughly 600-800 words) for the following product.
Structure (MUST follow):
1. # SEO title (H1)
2. > **Quick Summary** blockquote — 2-3 concise sentences
3. ## Key Takeaways — 3 bullet points
4. ## Overview — a few paragraphs analyzing the product
5. ## Pros & Cons — short bullet lists
6. ## Frequently Asked Questions — 3 Q&A pairs formatted as **Q:** and **A:**
7. ## Verdict — clear recommendation

PRODUCT:
${productInfo}`;

  const raw = await cohereChat(prompt, systemPrompt, 14000, 800);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  if (!cleaned) throw new Error('AI returned an empty article');
  const firstH1 = cleaned.split('\n').find(l => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1
    ? firstH1.replace(/^#\s+/, '').trim()
    : `Complete ${product.product_name} Review & Buying Guide`;
  const excerpt = product.review_summary || `An in-depth review and buying guide for ${product.product_name}.`;
  return { title, content: cleaned, excerpt };
}

export async function generateArticleFromProductWithFallback(
  product: any,
  similarProducts: any[],
): Promise<{ title: string; content: string; excerpt: string }> {
  try {
    return await generateArticleFromProduct(product, similarProducts);
  } catch (e: any) {
    console.warn('[ai.ts] Full article generation failed, falling back to compact article:', e.message);
    try {
      return await generateCompactArticle(product);
    } catch (e2: any) {
      throw new Error('AI article generation failed: ' + (e2.message || 'Unknown error'));
    }
  }
}

export async function refreshArticleContent(post: any): Promise<{ title: string; content: string; excerpt: string } | null> {
  if (!post || !post.content) return null;
  const currentYear = new Date().getFullYear();
  const systemPrompt = `You are a content refresh specialist for DawnWire (dawnwire.com). Your task is to refresh and update an existing article. Keep the same topic and structure but: 1) Update any outdated information 2) Refresh statistics and dates to ${currentYear} 3) Improve SEO optimization 4) Add fresh insights 5) Fix any broken references. Output ONLY the updated markdown content with no extra commentary.`;

  const prompt = `REFRESH the following article for ${currentYear}:

TITLE: ${post.title}
EXISTING CONTENT:
${(post.content || '').substring(0, 5000)}

REQUIREMENTS:
- Keep the same # H1 title and overall structure
- Update all year references, prices, statistics for ${currentYear}
- Add fresh insights and current market data
- Refresh Quick Summary and Key Takeaways
- Verify FAQ answers are current
- Improve SEO with updated keywords naturally
- Output ONLY markdown content, no code fences`;

  const raw = await cohereChat(prompt, systemPrompt);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  const lines = cleaned.split('\n');
  const firstH1 = lines.find(l => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1 ? firstH1.replace(/^#\s+/, '').trim() : post.title;
  const excerpt = (() => {
    const summaryMatch = cleaned.match(/> \*\*Quick Summary\*\*[\s\S]*?(?=\n##|$)/);
    if (summaryMatch) return summaryMatch[0].replace(/> \*\*Quick Summary\*\*/, '').trim();
    const pMatch = cleaned.match(/^(?!>|#|\||-|\*|\d+\.)(.+)$/m);
    return pMatch ? pMatch[1].trim().substring(0, 300) : post.excerpt || `Updated guide for post.title (${currentYear}).`;
  })();

  return { title, content: cleaned, excerpt };
}

export async function generateBuyingGuideFromCategory(
  category: any,
  topProducts: any[],
): Promise<{ title: string; content: string; excerpt: string }> {
  const categoryName = category.name || category.category || 'Products';
  const categorySlug = category.slug || String(categoryName).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const productLines = topProducts.map((p, i) => {
    const slug = p.slug || '';
    const entry = [
      `${i + 1}. ${p.product_name || p.title || 'Product'}`,
      p.brand ? `   Brand: ${p.brand}` : '',
      p.price ? `   Price: ${p.price}` : '',
      p.rating ? `   Rating: ${p.rating}/5` : '',
      p.editor_score ? `   Editor Score: ${p.editor_score}/10` : '',
      p.best_for ? `   Best For: ${p.best_for}` : '',
      p.review_summary ? `   Summary: ${String(p.review_summary).substring(0, 200)}` : '',
      p.final_verdict ? `   Verdict: ${String(p.final_verdict).substring(0, 200)}` : '',
      slug ? `   Affiliate card: [affiliate-card:${slug}]` : '',
    ].filter(Boolean).join('\n');
    return entry;
  }).join('\n\n');

  const systemPrompt = `You are a senior affiliate content strategist and buyer's-guide writer for DawnWire (dawnwire.com). Write a comprehensive, SEO-optimized buying guide in Markdown format (not HTML). Your articles are optimized for both human readers AND AI/LLM extractors (Google AI, ChatGPT, Perplexity, Gemini).

STRUCTURE REQUIREMENTS:
- # H1 main title starting with "Best ${categoryName}" or "How to Choose ${categoryName}"
- > **Quick Summary** blockquote as first paragraph (2-3 concise sentences) — extracted by AI assistants as a featured snippet
- ## Key Takeaways section with 4-6 bullet points
- ## Introduction explaining why choosing the right ${categoryName.toLowerCase()} matters
- ## What to Look For / Buying Criteria section with 3-5 key criteria (define each term on first mention, add Wikipedia-style citations for technical terms)
- ## Our Top Picks or ## Best ${categoryName} section — for EACH product, an H3 with the product name, then 2-3 short paragraphs covering who it's best for, key differentiators, pros and cons (2-3 each), price, and a "Check Price on Amazon" line. Include the affiliate-card shortcode [affiliate-card:slug] for each product so the card renders inline.
- ## Comparison table using | pipe | columns: Product, Best For, Price, Rating, Editor Score
- ## Budget Tiers section (best budget / mid-range / premium) referencing products
- ## Frequently Asked Questions with at least 4 Q&A pairs (**Q:** and **A:**)
- ## Verdict / Final Thoughts with clear guidance

FORMAT: Use | pipe | tables for comparison data. Use **bold** for emphasis. Use - for bullet lists. Use [affiliate-card:slug] for affiliate links. Output ONLY Markdown with no extra commentary. Do NOT wrap in code fences.`;

  const prompt = `Write a comprehensive buying guide for the "${categoryName}" category based on the real products listed below. These are actual products available on Amazon that we already have detailed data for.

CATEGORY: ${categoryName}

TOP PRODUCTS:
${productLines || 'No specific products provided - write a general educational buying guide covering what to look for.'}

STRUCTURE (MUST follow exactly):
1. **# SEO title** — compelling H1 like "Best ${categoryName} in ${new Date().getFullYear()} — Expert Picks & Buying Guide"
2. **> Quick Summary** — blockquote with 2-3 concise sentences
3. **## Key Takeaways** — 4-6 bullet points
4. **## Introduction** — why choosing the right ${categoryName.toLowerCase()} matters
5. **## What to Look For** — 3-5 buying criteria, definition-first with context
6. **## Our Top Picks** — an H3 per product with mini-review (best for, differentiators, pros, cons, price, check-price line + [affiliate-card:slug])
7. **## Comparison Table** — pipe table: Product | Best For | Price | Rating | Editor Score
8. **## Budget Tiers** — best budget / mid-range / premium picks
9. **## Frequently Asked Questions** — 4+ Q&A pairs (**Q:** / **A:**)
10. **## Verdict** — final guidance

Use DawnWire's brand voice: professional, authoritative, helpful, and data-driven. Only recommend products from the provided list. Keep paragraphs concise.`;

  const raw = await cohereChat(prompt, systemPrompt, 42000, 2200);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  const lines = cleaned.split('\n');
  const firstH1 = lines.find(l => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1
    ? firstH1.replace(/^#\s+/, '').trim()
    : `Best ${categoryName} — Expert Buying Guide (${new Date().getFullYear()})`;
  const content = cleaned;
  const excerpt = topProducts[0]?.review_summary
    ? String(topProducts[0].review_summary).substring(0, 280)
    : `An expert buying guide to help you choose the best ${categoryName.toLowerCase()} products on the market.`;

  return { title, content, excerpt };
}

// ===== Article Generator (product-based, manual image workflow) =====

export const ARTICLE_TYPES = [
  'review',
  'guide',
  'comparison',
  'best-list',
  'how-to',
  'benefits',
  'faq',
] as const;

export type ArticleType = typeof ARTICLE_TYPES[number];

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  review: 'Product Review',
  guide: 'Product Guide',
  comparison: 'Product Comparison',
  'best-list': 'Best Products List',
  'how-to': 'How-To-Use Article',
  benefits: 'Benefits & Features',
  faq: 'Frequently Asked Questions',
};

export const ARTICLE_TYPE_MIN_PRODUCTS: Record<ArticleType, number> = {
  review: 1,
  guide: 1,
  comparison: 2,
  'best-list': 3,
  'how-to': 1,
  benefits: 1,
  faq: 1,
};

function buildArticleProductInfo(products: any[]): string {
  return products.map((p, i) => {
    const slug = p.slug || p.productSlug || '';
    return [
      `${i + 1}. ${p.product_name || p.title || 'Product'}${p.brand ? ' by ' + p.brand : ''}`,
      p.price ? `   Price: ${p.price}` : '',
      p.rating ? `   Rating: ${p.rating}/5` : '',
      p.editor_score ? `   Editor Score: ${p.editor_score}/10` : '',
      p.best_for ? `   Best For: ${p.best_for}` : '',
      p.category ? `   Category: ${p.category}` : '',
      p.review_summary ? `   Summary: ${String(p.review_summary).substring(0, 300)}` : '',
      p.final_verdict ? `   Verdict: ${String(p.final_verdict).substring(0, 300)}` : '',
      Array.isArray(p.key_features) && p.key_features.length ? `   Key Features: ${p.key_features.join('; ')}` : '',
      Array.isArray(p.pros) && p.pros.length ? `   Pros: ${p.pros.join(', ')}` : '',
      Array.isArray(p.cons) && p.cons.length ? `   Cons: ${p.cons.join(', ')}` : '',
      slug ? `   Affiliate card: [affiliate-card:${slug}]` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

function buildImagePrompt(products: any[], articleType: ArticleType): string {
  const primary = products[0] || {};
  const name = primary.product_name || primary.title || 'Product';
  const names = products.map((p) => p.product_name || p.title || 'Product').join(', ');
  const bestFor = primary.best_for ? ` intended for ${primary.best_for.toLowerCase()}` : '';
  const useCase =
    articleType === 'comparison' || articleType === 'best-list'
      ? `featuring the products ${names} arranged in a clean editorial layout`
      : `featuring ${name} in a clean lifestyle setting relevant to its intended use`;
  return (
    `Create a premium editorial product image ${articleType === 'review' || articleType === 'guide' || articleType === 'how-to' || articleType === 'benefits' || articleType === 'faq' ? 'featuring ' + name : useCase}. ` +
    `Show the product${bestFor} with a modern, minimal background. ` +
    `Use professional lighting, realistic details, balanced composition, subtle supporting props, no text, no logos added, and a 16:9 aspect ratio.`
  );
}

function buildImageAlt(products: any[], title: string): string {
  const names = products.map((p) => p.product_name || p.title || '').filter(Boolean).join(', ');
  const fallback = title ? title.replace(/[#*`]/g, '').trim() : names || 'Featured product';
  return `${names ? names + ' — ' : ''}${fallback}`.substring(0, 200);
}

function slugifyTitle(title: string, fallback: string): string {
  const base = (title || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 70);
  return base || fallback.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 70);
}

export function generateFeaturedImagePrompt(products: any[], articleType: ArticleType = 'review'): string {
  return buildImagePrompt(products, articleType);
}

export function generateImageAltText(products: any[], title: string): string {
  return buildImageAlt(products, title);
}

const ARTICLE_STRUCTURE: Record<ArticleType, string> = {
  review: `Write a comprehensive product review article for the main product.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — compelling, keyword-rich, e.g. "[Product] Review — Worth It in {YEAR}?"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Product Overview — what it is, who it's for, key specs
5. ## Features & Performance — in-depth analysis of the main features (definition-first, add brief context for technical terms)
6. ## Pros & Cons — bullet lists
7. ## Who Should Buy It / Who Shouldn't — short sections
8. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
9. ## Verdict — clear recommendation and why`,
  guide: `Write a comprehensive product guide article centered on the main product.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — keyword-rich, e.g. "The Complete Guide to {Product}"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — why this product matters
5. ## What to Look For — buying criteria (definition-first)
6. ## How to Choose — selection guidance referencing the product
7. ## Specifications — a | pipe | table of specs
8. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
9. ## Final Thoughts — clear guidance`,
  comparison: `Write a detailed product comparison article comparing the products listed. Treat all listed products equally as alternatives.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — e.g. "{Product A} vs {Product B} — Which Should You Buy?"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — why this comparison matters
5. ## Comparison Table — | pipe | table with columns: Feature, Product A, Product B (include rows for Price, Rating, Best For, Key Specs)
6. ## Product Breakdown — an H3 per product with 2-3 short paragraphs (best for, differentiators, pros, cons) + [affiliate-card:slug]
7. ## Pros & Cons Summary — bullet lists per product
8. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
9. ## Verdict — clear winner and why (or "depends on use case")`,
  'best-list': `Write a "best of" roundup article ranking the products listed.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — e.g. "Best {Category} in {YEAR} — Top {N} Picks"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — why choosing the right one matters
5. ## The Best {Category} Picks — an H3 per product with mini-review (best for, differentiators, pros, cons, price) + [affiliate-card:slug]
6. ## Comparison Table — | pipe | table: Product | Best For | Price | Rating | Editor Score
7. ## Budget Tiers — best budget / mid-range / premium references
8. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
9. ## Verdict — final guidance`,
  'how-to': `Write a step-by-step how-to-use article focused on the main product.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — e.g. "How to Use {Product}: A Step-by-Step Guide"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — what the guide covers
5. ## What You'll Need — checklist
6. ## Step-by-Step Instructions — numbered steps (### Step 1, ### Step 2, etc.) with clear explanations
7. ## Tips & Tricks — best practices
8. ## Common Mistakes to Avoid — bullet list
9. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
10. ## Final Verdict — recap and recommendation`,
  benefits: `Write a benefits-and-features article focused on the main product.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — e.g. "Top Benefits of {Product}: Why It's Worth It"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — why the product's benefits matter
5. ## Key Features — feature-by-feature breakdown (definition-first)
6. ## Top Benefits — an H3 or bullet list per benefit with real-world value
7. ## Who Benefits Most — audience fit
8. ## Frequently Asked Questions — 3+ Q&A pairs (**Q:** / **A:**)
9. ## Verdict — clear recommendation`,
  faq: `Write a comprehensive frequently-asked-questions article centered on the main product.
STRUCTURE (MUST follow exactly):
1. # SEO title (H1) — e.g. "{Product}: 15 Frequently Asked Questions"
2. > **Quick Summary** — blockquote with 2-3 concise sentences
3. ## Key Takeaways — 3-5 bullet points
4. ## Introduction — what the FAQ covers
5. ## Frequently Asked Questions — 6+ Q&A pairs (**Q:** / **A:**) covering usage, maintenance, value, compatibility, and common concerns
6. ## Buying Guidance — quick tips to decide
7. ## Verdict — clear recommendation`,
};

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  tags: string[];
  imagePrompt: string;
  imageAlt: string;
}

export async function generateArticleForType(
  products: any[],
  articleType: ArticleType = 'review',
): Promise<GeneratedArticle> {
  const selected = Array.isArray(products) ? products.filter(Boolean) : [];
  const min = ARTICLE_TYPE_MIN_PRODUCTS[articleType] || 1;
  if (selected.length < min) {
    throw new Error(`"${ARTICLE_TYPE_LABELS[articleType]}" articles require at least ${min} product${min > 1 ? 's' : ''}.`);
  }

  const primary = selected[0] || {};
  const categoryName = (primary.best_for || primary.category || 'Products').toString();
  const productInfo = buildArticleProductInfo(selected);

  const systemPrompt = `You are a senior affiliate content writer for DawnWire (dawnwire.com). Write a comprehensive, SEO-optimized article in Markdown format (not HTML). Your articles are optimized for both human readers AND AI/LLM extractors (Google AI, ChatGPT, Perplexity, Gemini).

GLOBAL REQUIREMENTS:
- > **Quick Summary** blockquote as the first paragraph after the H1 (2-3 concise sentences) — extracted by AI assistants as a featured snippet
- ## Key Takeaways section with 3-5 bullet points
- ## Frequently Asked Questions section with at least 3 Q&A pairs (**Q:** and **A:** on separate lines)
- Use | pipe | tables for comparison/spec data — LLMs parse tables extremely well
- Define technical terms on first mention (definition-first style); add brief Wikipedia-style context for well-known brands/technologies, e.g. "WordPress (open-source CMS)"
- Use [affiliate-card:product-slug] shortcodes exactly as provided for product links
- **Bold** for emphasis, - for bullets
- Output ONLY Markdown. Do NOT wrap in code fences. No extra commentary.`;

  const prompt = `Write a ${ARTICLE_TYPE_LABELS[articleType].toLowerCase()} article for DawnWire based on the real products below. Only recommend products from this list. Use {YEAR} = ${new Date().getFullYear()}.

PRODUCTS:
${productInfo}

ARTICLE TYPE: ${ARTICLE_TYPE_LABELS[articleType]}

STRUCTURE (MUST follow exactly):
${ARTICLE_STRUCTURE[articleType]}

Use DawnWire's brand voice: professional, authoritative, helpful, and data-driven. Keep paragraphs concise. End the article with a ## Frequently Asked Questions section if not already required.`;

  const raw = await cohereChat(prompt, systemPrompt, 42000, 2200);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  if (!cleaned) throw new Error('AI returned an empty article');

  const lines = cleaned.split('\n');
  const firstH1 = lines.find((l) => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1 ? firstH1.replace(/^#\s+/, '').trim() : `${primary.product_name || 'Product'} ${ARTICLE_TYPE_LABELS[articleType]}`;
  const excerptMatch = cleaned.match(/> \*\*Quick Summary\*\*[\s\S]*?(?=\n##|$)/);
  const excerpt = excerptMatch
    ? excerptMatch[0].replace(/> \*\*Quick Summary\*\*/, '').replace(/\*\*/g, '').trim()
    : primary.review_summary
      ? String(primary.review_summary).substring(0, 280)
      : `A comprehensive ${ARTICLE_TYPE_LABELS[articleType].toLowerCase()} for ${primary.product_name || 'this product'}.`;

  const keywords = [
    primary.product_name || '',
    primary.brand || '',
    ARTICLE_TYPE_LABELS[articleType].toLowerCase(),
    categoryName.toLowerCase(),
    'best ' + categoryName.toLowerCase(),
    'review',
    'buying guide',
  ].filter(Boolean).join(', ');

  const tags = [
    primary.product_name || '',
    primary.brand || '',
    ARTICLE_TYPE_LABELS[articleType].toLowerCase(),
    articleType === 'best-list' ? 'best of' : '',
    categoryName,
    'buying guide',
  ].filter(Boolean);

  return {
    title,
    excerpt,
    content: cleaned,
    seoTitle: title,
    seoDescription: excerpt.substring(0, 160),
    seoKeywords: keywords,
    tags,
    imagePrompt: generateFeaturedImagePrompt(selected, articleType),
    imageAlt: generateImageAltText(selected, title),
  };
}
