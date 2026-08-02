import { generateText } from 'ai';
import { createCohere } from '@ai-sdk/cohere';
import { deepseekText, isDeepSeekConfigured } from './deepseek-pool';
import { geminiText, isGeminiConfigured } from './gemini';

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || process.env.COHERE_API_KEY || '';
const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL || 'https://api.cohere.ai/v2';
const AI_GATEWAY_MODEL = process.env.AI_GATEWAY_MODEL || 'command-r-plus-08-2024';

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
  if (isGeminiConfigured()) {
    try {
      return await geminiText(promptText, system, timeoutMs, maxTokens);
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('AI Gateway request timed out. Try again or check your API key.', { cause: e });
      console.error('[ai.ts] Gemini failed, falling back to DeepSeek/Cohere:', e.message);
    }
  }

  if (isDeepSeekConfigured()) {
    try {
      return await deepseekText({ prompt: promptText, system, timeoutMs, maxOutputTokens: maxTokens });
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('AI Gateway request timed out. Try again or check your API key.', { cause: e });
      console.error('[ai.ts] DeepSeek failed, falling back to Cohere:', e.message);
    }
  }

  if (!AI_GATEWAY_API_KEY) throw new Error('AI_GATEWAY_API_KEY not configured. To use this feature, set the AI_GATEWAY_API_KEY environment variable.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 20000);
  try {
    const result = await generateText({
      model: getModel(),
      prompt: promptText,
      system,
      maxOutputTokens: maxTokens || 1200,
      temperature: 0.7,
      abortSignal: controller.signal,
    });
    clearTimeout(timeoutId);
    return result.text?.trim() || '';
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('AI Gateway request timed out. Try again or check your API key.', { cause: e });
    throw new Error('AI Gateway request failed: ' + (e.message || 'Unknown error'), { cause: e });
  }
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

  const raw = await cohereChat(prompt, systemPrompt, 42000, 2200);
  const cleaned = raw.replace(/```markdown|```/gi, '').trim();
  const lines = cleaned.split('\n');
  const firstH1 = lines.find(l => l.startsWith('# ') && !l.startsWith('## '));
  const title = firstH1
    ? firstH1.replace(/^#\s+/, '').trim()
    : `Complete ${product.product_name} Review & Buying Guide`;
  const content = cleaned;
  const excerpt = product.review_summary || `An in-depth review and buying guide for ${product.product_name}.`;

  return { title, content, excerpt };
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
