import { generateText, tool, isStepCount } from 'ai';
import { createCohere } from '@ai-sdk/cohere';
import { z } from 'zod';
import crypto from 'crypto';
import { dbInstance } from './db';
import * as seo from './seo-engine';
import { deepseekChat, isDeepSeekConfigured } from './deepseek-pool';

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || '';
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

const sessionStore = new Map<string, {
  messages: { role: string; content: string }[];
  context?: Record<string, any>;
  createdAt: number;
}>();
const sessionTimestamps = new Map<string, number>();

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const DAILY_BUDGET_LIMIT = 1000;
let dailyUsageCount = 0;
let dailyUsageReset = Date.now();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  if (now - dailyUsageReset > 86400000) {
    dailyUsageCount = 0;
    dailyUsageReset = now;
  }
  if (dailyUsageCount >= DAILY_BUDGET_LIMIT) return false;

  const entry = rateLimitStore.get(sessionId);
  if (!entry || now - entry.reset > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(sessionId, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    dailyUsageCount++;
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  dailyUsageCount++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of sessionTimestamps) {
    if (now - ts > 3600000) {
      sessionStore.delete(id);
      sessionTimestamps.delete(id);
    }
  }
}, 1800000);

async function getPublishedProducts(): Promise<any[]> {
  const reviews = await seo.getPublishedProductReviews();
  return Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];
}

function formatProductShort(p: any): any {
  return {
    id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand,
    price: p.price, original_price: p.original_price, rating: p.rating,
    best_for: p.best_for, product_image: p.product_image,
    key_features: (p.key_features || []).slice(0, 3), affiliate_url: p.affiliate_url,
    pros: (p.pros || []).slice(0, 3), cons: (p.cons || []).slice(0, 3),
    stock_status: p.stock_status, deal_badge: p.deal_badge,
    discount_percentage: p.discount_percentage, category_id: p.category_id,
    review_summary: p.review_summary ? p.review_summary.substring(0, 200) : undefined,
  };
}

function formatProductFull(p: any): any {
  return {
    id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand,
    price: p.price, original_price: p.original_price, rating: p.rating,
    best_for: p.best_for, product_image: p.product_image, affiliate_url: p.affiliate_url,
    pros: p.pros || [], cons: p.cons || [],
    key_features: p.key_features || [],
    specs: p.specs || {},
    review_summary: p.review_summary, final_verdict: p.final_verdict,
    stock_status: p.stock_status, deal_badge: p.deal_badge,
    discount_percentage: p.discount_percentage,
  };
}

async function findProductBySlug(slug: string): Promise<any | null> {
  const all = await getPublishedProducts();
  return all.find((r: any) => r.slug === slug || r.id === slug) || null;
}

const gatewayTools = {
  search_products: tool({
    description: 'Search for products in the DawnWire database by keyword, category, price range, brand, or rating. Use this to find products matching user needs.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search keywords (product name, type, or use case)'),
      category: z.string().optional().describe('Category slug or name to filter by (e.g. "electronics", "home-kitchen")'),
      max_price: z.number().optional().describe('Maximum price filter'),
      min_price: z.number().optional().describe('Minimum price filter'),
      min_rating: z.number().optional().describe('Minimum rating (0-5)'),
      brand: z.string().optional().describe('Brand name to filter by'),
      sort_by: z.enum(['rating', 'price_asc', 'price_desc', 'newest', 'popularity']).optional().describe('Sort order'),
      limit: z.number().optional().describe('Maximum number of results (1-8, default 5)'),
    }),
    execute: async (params: any): Promise<any> => {
      let all = await getPublishedProducts();

      if (params.query) {
        const q = params.query.toLowerCase();
        all = all.filter((r: any) =>
          (r.product_name || '').toLowerCase().includes(q) ||
          (r.brand || '').toLowerCase().includes(q) ||
          (r.review_summary || '').toLowerCase().includes(q) ||
          (r.best_for || '').toLowerCase().includes(q)
        );
      }
      if (params.category) {
        const cat = params.category.toLowerCase();
        all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));
      }
      if (params.max_price) all = all.filter((r: any) => parseFloat(r.price || '0') <= params.max_price!);
      if (params.min_price) all = all.filter((r: any) => parseFloat(r.price || '0') >= params.min_price!);
      if (params.min_rating) all = all.filter((r: any) => (r.rating || 0) >= params.min_rating!);
      if (params.brand) {
        const brand = params.brand.toLowerCase();
        all = all.filter((r: any) => (r.brand || '').toLowerCase().includes(brand));
      }

      const sortBy = params.sort_by || 'rating';
      if (sortBy === 'rating') all.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      else if (sortBy === 'price_asc') all.sort((a: any, b: any) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
      else if (sortBy === 'price_desc') all.sort((a: any, b: any) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
      else if (sortBy === 'newest') all.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const limit = Math.min(params.limit || 5, 8);
      return { products: all.slice(0, limit).map(formatProductShort), total: Math.min(all.length, limit) };
    },
  }),

  get_product_details: tool({
    description: 'Get detailed information about a specific product by its slug or id.',
    inputSchema: z.object({
      slug: z.string().describe('The product slug (URL identifier)'),
    }),
    execute: async ({ slug }: { slug: string }): Promise<any> => {
      const product = await findProductBySlug(slug);
      if (!product) return { error: 'Product not found', slug };
      return { product: formatProductFull(product) };
    },
  }),

  get_category_products: tool({
    description: 'Get products in a specific category for browsing.',
    inputSchema: z.object({
      category_slug: z.string().describe('Category slug'),
      sort_by: z.enum(['rating', 'price_asc', 'price_desc', 'newest']).optional().describe('Sort order'),
      max_price: z.number().optional().describe('Maximum price filter'),
      min_rating: z.number().optional().describe('Minimum rating filter'),
      limit: z.number().optional().describe('Maximum results (1-8)'),
    }),
    execute: async (params: any): Promise<any> => {
      let all = await getPublishedProducts();
      const cat = (params.category_slug || '').toLowerCase();
      all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));

      if (params.max_price) all = all.filter((r: any) => parseFloat(r.price || '0') <= params.max_price);
      if (params.min_rating) all = all.filter((r: any) => (r.rating || 0) >= params.min_rating);

      const sortBy = params.sort_by || 'rating';
      if (sortBy === 'rating') all.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      else if (sortBy === 'price_asc') all.sort((a: any, b: any) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
      else if (sortBy === 'price_desc') all.sort((a: any, b: any) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));

      const limit = Math.min(params.limit || 5, 8);
      return { products: all.slice(0, limit).map(formatProductShort), total: Math.min(all.length, limit) };
    },
  }),

  get_current_deals: tool({
    description: 'Get current deals, sales, and discounted products.',
    inputSchema: z.object({
      limit: z.number().optional().describe('Maximum number of deals to return (1-10, default 5)'),
      category: z.string().optional().describe('Filter deals by category slug'),
    }),
    execute: async (params: any): Promise<any> => {
      let all = await getPublishedProducts();
      all = all.filter((r: any) => r.is_deal === true || r.deal_badge);

      if (params.category) {
        const cat = params.category.toLowerCase();
        all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));
      }

      const limit = Math.min(params.limit || 5, 10);
      return { deals: all.slice(0, limit).map(p => formatProductShort(p)), total: Math.min(all.length, limit) };
    },
  }),

  compare_products: tool({
    description: 'Compare two or more products side by side. Provide their slugs.',
    inputSchema: z.object({
      product_slugs: z.array(z.string()).describe('Array of product slugs to compare (2-4 products)'),
    }),
    execute: async ({ product_slugs }: { product_slugs: string[] }): Promise<any> => {
      if (!product_slugs || product_slugs.length < 2 || product_slugs.length > 4) {
        return { error: 'Please provide 2-4 product slugs to compare.' };
      }
      const all = await getPublishedProducts();
      const products = product_slugs.map((s: string) => all.find((r: any) => r.slug === s || r.id === s)).filter(Boolean);
      if (products.length < 2) return { error: 'Could not find enough products to compare.' };

      return {
        comparison: products.map((p: any) => ({
          ...formatProductFull(p),
          review_summary: p.review_summary ? p.review_summary.substring(0, 200) : undefined,
          final_verdict: p.final_verdict ? p.final_verdict.substring(0, 200) : undefined,
        })),
        total: products.length,
      };
    },
  }),

  get_buying_guides: tool({
    description: 'Find buying guide articles related to a product category or query.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search query for buying guides'),
      category: z.string().optional().describe('Category slug to find guides for'),
      limit: z.number().optional().describe('Maximum results (1-3)'),
    }),
    execute: async (params: any): Promise<any> => {
      const query = params.query || '';
      const category = params.category || '';
      const limit = Math.min(params.limit || 3, 3);

      const posts = await dbInstance.getPosts();
      const guides = (posts || [])
        .filter((p: any) => {
          if (p.status !== 'published') return false;
          const title = (p.title || '').toLowerCase();
          const content = (p.content || '').toLowerCase();
          const matchesQuery = !query || title.includes(query.toLowerCase()) || content.includes(query.toLowerCase());
          const matchesCategory = !category || title.includes(category.toLowerCase()) || (p.category || '').toLowerCase().includes(category.toLowerCase());
          return (matchesQuery || matchesCategory) && (title.includes('buying guide') || title.includes('review') || title.includes('best '));
        })
        .slice(0, limit)
        .map((p: any) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt?.substring(0, 200) || '' }));

      return { guides, total: guides.length };
    },
  }),

  get_similar_products: tool({
    description: 'Find alternative or similar products to a given product slug.',
    inputSchema: z.object({
      slug: z.string().describe('Product slug to find alternatives for'),
      limit: z.number().optional().describe('Maximum alternatives (1-4, default 3)'),
    }),
    execute: async ({ slug, limit: maxLimit }: { slug: string; limit?: number }): Promise<any> => {
      const product = await findProductBySlug(slug);
      if (!product) return { error: 'Product not found' };

      const limit = Math.min(maxLimit || 3, 4);
      let all = await getPublishedProducts();
      const catId = product.category_id || product.best_for || '';
      all = all.filter((r: any) =>
        r.slug !== slug &&
        ((r.category_id || '') === catId || (r.best_for || '') === catId ||
         (r.best_for || '').includes(catId) || (r.brand || '') === product.brand)
      );

      return {
        alternatives: all.slice(0, limit).map(p => ({
          slug: p.slug, product_name: p.product_name, brand: p.brand,
          price: p.price, rating: p.rating, product_image: p.product_image,
          best_for: p.best_for, affiliate_url: p.affiliate_url,
        })),
        total: Math.min(all.length, limit),
        source_product: slug,
      };
    },
  }),
};

export async function chat(
  sessionId: string,
  userMessage: string,
  context?: { pageType?: string; pageSlug?: string; category?: string; productSlug?: string }
): Promise<{ response: string; tool_calls?: string[]; products?: any[]; productCards?: any[]; comparisonData?: any }> {
  if (!AI_GATEWAY_API_KEY) throw new Error('AI_GATEWAY_API_KEY not configured');

  if (!checkRateLimit(sessionId)) {
    return { response: 'I apologize, but the daily chat limit has been reached. Please try again tomorrow. For immediate assistance, feel free to browse our products directly.' };
  }

  let session = sessionStore.get(sessionId);
  if (!session) {
    session = { messages: [], createdAt: Date.now(), context };
    sessionStore.set(sessionId, session);
  }
  session.context = { ...session.context, ...context };
  sessionTimestamps.set(sessionId, Date.now());

  let contextPrefix = '';
  if (session.context?.productSlug) {
    contextPrefix = `The user is viewing a specific product page. Answer product-specific questions.`;
  } else if (session.context?.category) {
    contextPrefix = `The user is browsing the "${session.context.category}" category. Focus recommendations on this category unless they ask otherwise.`;
  } else if (session.context?.pageType) {
    contextPrefix = `The user is on the ${session.context.pageType} page.`;
  }

  const preamble = `You are a helpful AI shopping assistant for DawnWire.com, a product review and comparison website.

${contextPrefix}

RULES:
- ONLY recommend products that exist in the DawnWire database. Use search_products to find them.
- NEVER invent prices, ratings, discounts, or availability. Call tools to get real data.
- For specific products, use get_product_details.
- For comparisons, use compare_products.
- For deals, use get_current_deals.
- For alternatives, use get_similar_products.
- Keep responses concise and conversational. Use emojis sparingly.
- Always include: "Prices and availability may change on Amazon. Please check Amazon for the latest information."
- DawnWire may earn commissions from purchases made through affiliate links.
- Available categories: electronics, home-kitchen, sports, gaming, beauty, books, automotive, tools, office, clothing, toys, health, music, software, pet-supplies, baby, grocery, industrial, luggage, garden, arts-crafts.
- If you can't find matching products, suggest broadening their search criteria.`;

  try {
    const chatHistory = session.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const messages = [
      ...chatHistory,
      { role: 'user', content: userMessage },
    ] as any;

    let result: Awaited<ReturnType<typeof generateText<typeof gatewayTools>>>;

    if (isDeepSeekConfigured()) {
      try {
        result = await deepseekChat({
          messages,
          system: preamble,
          tools: gatewayTools,
          maxOutputTokens: 2000,
          temperature: 0.3,
          timeoutMs: 30000,
        });
      } catch (e: any) {
        console.error('[ai-shopping-assistant.ts] DeepSeek failed, falling back to Cohere:', e.message);
        const result2 = await generateText({
          model: getModel(),
          messages,
          system: preamble,
          tools: gatewayTools,
          stopWhen: isStepCount(5),
          temperature: 0.3,
          maxOutputTokens: 2000,
          abortSignal: controller.signal,
        });
        clearTimeout(timeoutId);
        result = result2;
      }
    } else {
      result = await generateText({
        model: getModel(),
        messages,
        system: preamble,
        tools: gatewayTools,
        stopWhen: isStepCount(5),
        temperature: 0.3,
        maxOutputTokens: 2000,
        abortSignal: controller.signal,
      });
      clearTimeout(timeoutId);
    }

    const responseText = result.text || '';

    session.messages.push({ role: 'user', content: userMessage });
    session.messages.push({ role: 'assistant', content: responseText });

    let products: any[] = [];
    let productCards: any[] = [];
    let comparisonData: any = null;
    const toolNames: string[] = [];

    if (result.toolCalls) {
      for (const tc of result.toolCalls) {
        toolNames.push(tc.toolName);
      }
    }

    if (result.toolResults) {
      for (const tr of result.toolResults) {
        const r = tr.output as any;
        if (r) {
          if (r.products) { products = r.products; productCards = r.products.map((p: any) => ({ ...p, reason: '' })); }
          if (r.deals) { products = r.deals; productCards = r.deals.map((d: any) => ({ ...d, reason: 'Current deal' })); }
          if (r.comparison) { comparisonData = { products: r.comparison, total: r.total }; }
          if (r.product) { products = [r.product]; productCards = [r.product]; }
          if (r.alternatives) { products = r.alternatives; productCards = r.alternatives; }
        }
      }
    }

    return {
      response: responseText,
      tool_calls: toolNames,
      products: products.length > 0 ? products : undefined,
      productCards: productCards.length > 0 ? productCards : undefined,
      comparisonData,
    };
  } catch (e: any) {
    console.error('Chat error:', e);
    if (e.name === 'AbortError' || e.message?.includes('timed out')) {
      return { response: 'I took too long to respond. Could you please rephrase your question?' };
    }
    return { response: 'I encountered an error processing your request. Please try again or contact support.' };
  }
}

export async function refreshArticleContent(post: any): Promise<{ title: string; content: string; excerpt: string } | null> {
  if (!post || !post.content) return null;
  const currentYear = new Date().getFullYear();
  const systemPrompt = `You are a content refresh specialist for DawnWire (dawnwire.com). Your task is to refresh and update an existing article. Keep the same topic and structure but: 1) Update any outdated information 2) Refresh statistics and dates to ${currentYear} 3) Improve SEO optimization 4) Add fresh insights 5) Fix any broken references. Output ONLY the updated markdown content with no extra commentary.`;

  const prompt = `REFRESH the following article for ${currentYear}:\n\nTITLE: ${post.title}\nEXISTING CONTENT:\n${(post.content || '').substring(0, 5000)}\n\nREQUIREMENTS:\n- Keep the same # H1 title and overall structure\n- Update all year references, prices, statistics for ${currentYear}\n- Add fresh insights and current market data\n- Refresh Quick Summary and Key Takeaways\n- Verify FAQ answers are current\n- Improve SEO with updated keywords naturally\n- Output ONLY markdown content, no code fences`;

  try {
    const result = await generateText({
      model: getModel(),
      prompt,
      system: systemPrompt,
      maxOutputTokens: 4000,
      temperature: 0.3,
    });
    const raw = (result.text || '').replace(/```markdown|```/gi, '').trim();
    const lines = raw.split('\n');
    const firstH1 = lines.find((l: string) => l.startsWith('# ') && !l.startsWith('## '));
    const title = firstH1 ? firstH1.replace(/^#\s+/, '').trim() : post.title;
    const summaryMatch = raw.match(/> \*\*Quick Summary\*\*[\s\S]*?(?=\n##|$)/);
    const excerpt = summaryMatch ? summaryMatch[0].replace(/> \*\*Quick Summary\*\*/, '').trim().substring(0, 300) : post.excerpt || `Updated guide for ${post.title} (${currentYear}).`;
    return { title, content: raw, excerpt };
  } catch { return null; }
}

export function clearSession(sessionId: string): void {
  sessionStore.delete(sessionId);
  sessionTimestamps.delete(sessionId);
}

export function getSessionHistory(sessionId: string): any[] {
  const session = sessionStore.get(sessionId);
  if (!session) return [];
  return session.messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
    timestamp: Date.now(),
  }));
}
