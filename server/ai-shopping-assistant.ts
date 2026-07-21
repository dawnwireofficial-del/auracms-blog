const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const COHERE_API = 'https://api.cohere.com/v1/chat';
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-r-plus-08-2024';

import { dbInstance } from './db';
import * as seo from './seo-engine';

interface ToolDef {
  name: string;
  description: string;
  parameter_definitions: Record<string, { description: string; type: string; required?: boolean }>;
}

interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

interface CohereResponse {
  text?: string;
  tool_calls?: { name: string; parameters: Record<string, any> }[];
  generation_id?: string;
  finish_reason?: string;
  message?: string;
  error?: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

const sessionStore = new Map<string, {
  messages: { role: string; message: string }[];
  context?: Record<string, any>;
  toolHistory: { call: ToolCall; result: string }[];
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

// Clean up old sessions every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [id, ts] of sessionTimestamps) {
    if (now - ts > 3600000) {
      sessionStore.delete(id);
      sessionTimestamps.delete(id);
    }
  }
}, 1800000);

// Tool Definitions
const TOOLS: ToolDef[] = [
  {
    name: 'search_products',
    description: 'Search for products in the DawnWire database by keyword, category, price range, brand, or rating. Use this to find products matching user needs.',
    parameter_definitions: {
      query: { description: 'Search keywords (product name, type, or use case)', type: 'str', required: false },
      category: { description: 'Category slug or name to filter by (e.g. "electronics", "home-kitchen")', type: 'str', required: false },
      max_price: { description: 'Maximum price filter', type: 'float', required: false },
      min_price: { description: 'Minimum price filter', type: 'float', required: false },
      min_rating: { description: 'Minimum rating (0-5)', type: 'float', required: false },
      brand: { description: 'Brand name to filter by', type: 'str', required: false },
      sort_by: { description: 'Sort order: "rating", "price_asc", "price_desc", "newest", "popularity"', type: 'str', required: false },
      limit: { description: 'Maximum number of results (1-8, default 5)', type: 'int', required: false },
    },
  },
  {
    name: 'get_product_details',
    description: 'Get detailed information about a specific product by its slug or id.',
    parameter_definitions: {
      slug: { description: 'The product slug (URL identifier)', type: 'str', required: true },
    },
  },
  {
    name: 'get_category_products',
    description: 'Get products in a specific category for browsing.',
    parameter_definitions: {
      category_slug: { description: 'Category slug', type: 'str', required: true },
      sort_by: { description: 'Sort order: "rating", "price_asc", "price_desc", "newest"', type: 'str', required: false },
      max_price: { description: 'Maximum price filter', type: 'float', required: false },
      min_rating: { description: 'Minimum rating filter', type: 'float', required: false },
      limit: { description: 'Maximum results (1-8)', type: 'int', required: false },
    },
  },
  {
    name: 'get_current_deals',
    description: 'Get current deals, sales, and discounted products.',
    parameter_definitions: {
      limit: { description: 'Maximum number of deals to return (1-10, default 5)', type: 'int', required: false },
      category: { description: 'Filter deals by category slug', type: 'str', required: false },
    },
  },
  {
    name: 'compare_products',
    description: 'Compare two or more products side by side. Provide their slugs.',
    parameter_definitions: {
      product_slugs: { description: 'Array of product slugs to compare (2-4 products)', type: 'str', required: true },
    },
  },
  {
    name: 'get_buying_guides',
    description: 'Find buying guide articles related to a product category or query.',
    parameter_definitions: {
      query: { description: 'Search query for buying guides', type: 'str', required: false },
      category: { description: 'Category slug to find guides for', type: 'str', required: false },
      limit: { description: 'Maximum results (1-3)', type: 'int', required: false },
    },
  },
  {
    name: 'get_similar_products',
    description: 'Find alternative or similar products to a given product slug.',
    parameter_definitions: {
      slug: { description: 'Product slug to find alternatives for', type: 'str', required: true },
      limit: { description: 'Maximum alternatives (1-4, default 3)', type: 'int', required: false },
    },
  },
];

async function findProductBySlug(slug: string): Promise<any | null> {
  const reviews = await seo.getPublishedProductReviews();
  const all = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];
  return all.find((r: any) => r.slug === slug || r.id === slug) || null;
}

async function searchProducts(params: Record<string, any>): Promise<string> {
  try {
    const reviews = await seo.getPublishedProductReviews();
    let all = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];

    if (params.query) {
      const q = (params.query as string).toLowerCase();
      all = all.filter((r: any) =>
        (r.product_name || '').toLowerCase().includes(q) ||
        (r.brand || '').toLowerCase().includes(q) ||
        (r.review_summary || '').toLowerCase().includes(q) ||
        (r.best_for || '').toLowerCase().includes(q)
      );
    }
    if (params.category) {
      const cat = (params.category as string).toLowerCase();
      all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));
    }
    if (params.max_price) {
      const max = parseFloat(params.max_price as string);
      all = all.filter((r: any) => parseFloat(r.price || '0') <= max);
    }
    if (params.min_price) {
      const min = parseFloat(params.min_price as string);
      all = all.filter((r: any) => parseFloat(r.price || '0') >= min);
    }
    if (params.min_rating) {
      const minR = parseFloat(params.min_rating as string);
      all = all.filter((r: any) => (r.rating || 0) >= minR);
    }
    if (params.brand) {
      const brand = (params.brand as string).toLowerCase();
      all = all.filter((r: any) => (r.brand || '').toLowerCase().includes(brand));
    }

    const sortBy = (params.sort_by as string) || 'rating';
    if (sortBy === 'rating') all.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'price_asc') all.sort((a: any, b: any) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
    else if (sortBy === 'price_desc') all.sort((a: any, b: any) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
    else if (sortBy === 'newest') all.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const limit = Math.min(params.limit || 5, 8);
    const products = all.slice(0, limit);

    const formatted = products.map((p: any) => ({
      id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand,
      price: p.price, original_price: p.original_price, rating: p.rating,
      best_for: p.best_for, product_image: p.product_image,
      key_features: (p.key_features || []).slice(0, 3), affiliate_url: p.affiliate_url,
      pros: (p.pros || []).slice(0, 3), cons: (p.cons || []).slice(0, 3),
      stock_status: p.stock_status, deal_badge: p.deal_badge,
      discount_percentage: p.discount_percentage, category_id: p.category_id,
      review_summary: p.review_summary ? p.review_summary.substring(0, 200) : undefined,
    }));

    return JSON.stringify({ products: formatted, total: formatted.length });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function getProductDetails(params: Record<string, any>): Promise<string> {
  try {
    const slug = params.slug;
    const product = await findProductBySlug(slug);
    if (!product) return JSON.stringify({ error: 'Product not found', slug });

    const detail = {
      id: product.id, slug: product.slug, product_name: product.product_name,
      brand: product.brand, price: product.price, original_price: product.original_price,
      rating: product.rating, best_for: product.best_for,
      product_image: product.product_image, affiliate_url: product.affiliate_url,
      pros: product.pros || [],
      cons: product.cons || [],
      key_features: product.key_features || [],
      specs: product.specs || {},
      review_summary: product.review_summary,
      final_verdict: product.final_verdict,
      stock_status: product.stock_status, deal_badge: product.deal_badge,
      discount_percentage: product.discount_percentage,
    };

    return JSON.stringify({ product: detail });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function getCategoryProducts(params: Record<string, any>): Promise<string> {
  try {
    const reviews = await seo.getPublishedProductReviews();
    let all = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];
    const cat = (params.category_slug as string || '').toLowerCase();
    all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));

    if (params.max_price) {
      const max = parseFloat(params.max_price as string);
      all = all.filter((r: any) => parseFloat(r.price || '0') <= max);
    }
    if (params.min_rating) {
      const minR = parseFloat(params.min_rating as string);
      all = all.filter((r: any) => (r.rating || 0) >= minR);
    }

    const sortBy = (params.sort_by as string) || 'rating';
    if (sortBy === 'rating') all.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'price_asc') all.sort((a: any, b: any) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
    else if (sortBy === 'price_desc') all.sort((a: any, b: any) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));

    const limit = Math.min(params.limit || 5, 8);
    const products = all.slice(0, limit);

    const formatted = products.map((p: any) => ({
      id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand,
      price: p.price, rating: p.rating, best_for: p.best_for,
      product_image: p.product_image, key_features: (p.key_features || []).slice(0, 3),
      affiliate_url: p.affiliate_url, deal_badge: p.deal_badge,
    }));

    return JSON.stringify({ products: formatted, total: formatted.length });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function getCurrentDeals(params: Record<string, any>): Promise<string> {
  try {
    const reviews = await seo.getPublishedProductReviews();
    let all = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];
    all = all.filter((r: any) => r.is_deal === true || r.deal_badge);

    if (params.category) {
      const cat = (params.category as string).toLowerCase();
      all = all.filter((r: any) => (r.category_id || '').toLowerCase() === cat || (r.best_for || '').toLowerCase().includes(cat));
    }

    const limit = Math.min(params.limit || 5, 10);
    const deals = all.slice(0, limit).map((p: any) => ({
      id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand,
      price: p.price, original_price: p.original_price, rating: p.rating,
      deal_badge: p.deal_badge, discount_percentage: p.discount_percentage,
      product_image: p.product_image, affiliate_url: p.affiliate_url,
      best_for: p.best_for,
    }));

    return JSON.stringify({ deals, total: deals.length });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function compareProducts(params: Record<string, any>): Promise<string> {
  try {
    const slugs: string[] = params.product_slugs || params.product_slugs?.split(',') || [];
    if (slugs.length < 2 || slugs.length > 4) {
      return JSON.stringify({ error: 'Please provide 2-4 product slugs to compare.' });
    }
    const allReviews = await seo.getPublishedProductReviews();
    const all = Array.isArray(allReviews) ? allReviews : (allReviews as any)?.data || [];
    const products = slugs.map((s: string) => all.find((r: any) => r.slug === s.trim() || r.id === s.trim())).filter(Boolean);
    if (products.length < 2) return JSON.stringify({ error: 'Could not find enough products to compare.' });

    const valid = products.map((p: any) => ({
      slug: p.slug, product_name: p.product_name, brand: p.brand,
      price: p.price, original_price: p.original_price, rating: p.rating,
      best_for: p.best_for, product_image: p.product_image,
      pros: (p.pros || []).slice(0, 4), cons: (p.cons || []).slice(0, 4),
      key_features: (p.key_features || []).slice(0, 5), specs: p.specs || {},
      review_summary: p.review_summary ? p.review_summary.substring(0, 200) : undefined,
      final_verdict: p.final_verdict ? p.final_verdict.substring(0, 200) : undefined,
      affiliate_url: p.affiliate_url, stock_status: p.stock_status,
      discount_percentage: p.discount_percentage,
    }));

    return JSON.stringify({ comparison: valid, total: valid.length });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function getBuyingGuides(params: Record<string, any>): Promise<string> {
  try {
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

    return JSON.stringify({ guides, total: guides.length });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

async function getSimilarProducts(params: Record<string, any>): Promise<string> {
  try {
    const slug = params.slug;
    const limit = Math.min(params.limit || 3, 4);
    const product = await findProductBySlug(slug);
    if (!product) return JSON.stringify({ error: 'Product not found' });

    const reviews = await seo.getPublishedProductReviews();
    let all = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];
    const catId = product.category_id || product.best_for || '';
    all = all.filter((r: any) => r.slug !== slug && ((r.category_id || '') === catId || (r.best_for || '') === catId || (r.best_for || '').includes(catId) || (r.brand || '') === product.brand));

    const alternatives = all.slice(0, limit).map((p: any) => ({
      slug: p.slug, product_name: p.product_name, brand: p.brand,
      price: p.price, rating: p.rating, product_image: p.product_image,
      best_for: p.best_for, affiliate_url: p.affiliate_url,
    }));

    return JSON.stringify({ alternatives, total: alternatives.length, source_product: slug });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

const TOOL_HANDLERS: Record<string, (params: Record<string, any>) => Promise<string>> = {
  search_products: searchProducts,
  get_product_details: getProductDetails,
  get_category_products: getCategoryProducts,
  get_current_deals: getCurrentDeals,
  compare_products: compareProducts,
  get_buying_guides: getBuyingGuides,
  get_similar_products: getSimilarProducts,
};

export async function chat(
  sessionId: string,
  userMessage: string,
  context?: { pageType?: string; pageSlug?: string; category?: string; productSlug?: string }
): Promise<{ response: string; tool_calls?: string[]; products?: any[]; productCards?: any[]; comparisonData?: any }> {
  if (!COHERE_API_KEY) throw new Error('COHERE_API_KEY not configured');

  if (!checkRateLimit(sessionId)) {
    return { response: 'I apologize, but the daily chat limit has been reached. Please try again tomorrow. For immediate assistance, feel free to browse our products directly.' };
  }

  let session = sessionStore.get(sessionId);
  if (!session) {
    session = { messages: [], toolHistory: [], createdAt: Date.now(), context };
    sessionStore.set(sessionId, session);
  }
  session.context = { ...session.context, ...context };

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
      role: m.role as 'USER' | 'CHATBOT',
      message: m.message,
    }));

    const requestBody: any = {
      message: userMessage,
      chat_history: chatHistory,
      preamble,
      tools: TOOLS,
      stream: false,
      max_tokens: 2000,
      temperature: 0.3,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(COHERE_API, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COHERE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Cohere API error:', res.status, errText);
      throw new Error(`Cohere API ${res.status}: ${errText}`);
    }

    const data: CohereResponse = await res.json();
    const toolCalls = data.tool_calls || [];
    let responseText = data.text || '';

    // Store assistant response
    session.messages.push({ role: 'USER', message: userMessage });

    let products: any[] = [];
    let productCards: any[] = [];
    let comparisonData: any = null;
    const toolNames: string[] = [];

    if (toolCalls.length > 0) {
      const toolResults: { call: any; outputs: any[] }[] = [];

      for (const tc of toolCalls) {
        const handler = TOOL_HANDLERS[tc.name];
        if (handler) {
          try {
            const result = await handler(tc.parameters);
            let parsedOutput: any;
            try { parsedOutput = JSON.parse(result); } catch { parsedOutput = { text: result }; }
            toolResults.push({ call: { name: tc.name, parameters: tc.parameters }, outputs: [parsedOutput] });
            toolNames.push(tc.name);

            if (tc.name === 'search_products' && parsedOutput.products) {
              products = parsedOutput.products;
              productCards = parsedOutput.products.map((p: any) => ({ ...p, reason: '' }));
            } else if (tc.name === 'get_current_deals' && parsedOutput.deals) {
              products = parsedOutput.deals;
              productCards = parsedOutput.deals.map((d: any) => ({ ...d, reason: 'Current deal' }));
            } else if (tc.name === 'compare_products' && parsedOutput.comparison) {
              comparisonData = { products: parsedOutput.comparison, total: parsedOutput.total };
            } else if (tc.name === 'get_product_details' && parsedOutput.product) {
              products = [parsedOutput.product];
              productCards = [parsedOutput.product];
            } else if (tc.name === 'get_category_products' && parsedOutput.products) {
              products = parsedOutput.products;
              productCards = parsedOutput.products;
            } else if (tc.name === 'get_similar_products' && parsedOutput.alternatives) {
              products = parsedOutput.alternatives;
              productCards = parsedOutput.alternatives;
            }
          } catch (e) {
            console.error(`Tool ${tc.name} failed:`, e);
            toolResults.push({
              call: { name: tc.name, parameters: tc.parameters },
              outputs: [{ error: `Failed to execute ${tc.name}` }]
            });
          }
        }
      }

      // Send tool_results back to Cohere (v1: don't include assistant tool-calling msg in chat_history)
      const followUpBody: any = {
        message: userMessage,
        chat_history: [
          ...chatHistory,
          { role: 'USER', message: userMessage },
        ],
        preamble,
        tools: TOOLS,
        tool_results: toolResults,
        stream: false,
        max_tokens: 2000,
        temperature: 0.3,
      };

      const followUpRes = await fetch(COHERE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COHERE_API_KEY}`,
        },
        body: JSON.stringify(followUpBody),
      });

      if (followUpRes.ok) {
        const followUpData: CohereResponse = await followUpRes.json();
        if (followUpData.text) {
          responseText = followUpData.text;
        }
      } else {
        const errText = await followUpRes.text().catch(() => '');
        console.error('Cohere follow-up error:', followUpRes.status, errText);
      }
    }

    session.messages.push({ role: 'CHATBOT', message: responseText });

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
    const requestBody = {
      message: prompt,
      preamble: systemPrompt,
      stream: false,
      max_tokens: 4000,
      temperature: 0.3,
    };

    const res = await fetch(COHERE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${COHERE_API_KEY}` },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) return null;
    const data: CohereResponse = await res.json();
    const raw = (data.text || '').replace(/```markdown|```/gi, '').trim();
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
  return session.messages.filter(m => m.role !== 'SYSTEM').map(m => ({
    role: m.role === 'CHATBOT' ? 'assistant' : m.role === 'USER' ? 'user' : 'assistant',
    content: m.message,
    timestamp: Date.now(),
  }));
}

import crypto from 'crypto';
