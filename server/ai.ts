const COHERE_API_KEY = process.env.COHERE_API_KEY || '';
const COHERE_API = 'https://api.cohere.com/v1/chat';
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-r-plus-08-2024';

interface CohereV1Response {
  text?: string;
  error?: string;
  message?: string;
}

export async function cohereChat(promptText: string, system?: string): Promise<string> {
  if (!COHERE_API_KEY) throw new Error('COHERE_API_KEY not configured. To use this feature, set the COHERE_API_KEY environment variable.');
  const chatHistory: { role: string; message: string }[] = [];
  if (system) chatHistory.push({ role: 'SYSTEM', message: system });
  chatHistory.push({ role: 'USER', message: promptText });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(COHERE_API, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${COHERE_API_KEY}` },
      body: JSON.stringify({
        model: COHERE_MODEL,
        message: promptText,
        chat_history: chatHistory.slice(0, -1),
        preamble: system ? system : undefined,
        stream: false,
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Cohere API request timed out. Try again or check your API key.', { cause: e });
    throw new Error('Cohere API request failed', { cause: e });
  }
  clearTimeout(timeoutId);
  const data: CohereV1Response = await res.json();
  if (!res.ok) {
    const errMsg = data.error || data.message || `Cohere HTTP ${res.status}`;
    throw new Error(errMsg);
  }
  const content = data.text || '';
  if (!content) throw new Error('Cohere returned an empty response');
  return content.trim();
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

  const raw = await cohereChat(prompt, systemPrompt);
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
    return pMatch ? pMatch[1].trim().substring(0, 300) : post.excerpt || `Updated guide for ${post.title} (${currentYear}).`;
  })();

  return { title, content: cleaned, excerpt };
}
