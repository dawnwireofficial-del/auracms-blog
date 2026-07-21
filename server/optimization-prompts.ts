export const PROMPT_ARTICLE_OPTIMIZE = (title: string, content: string, focusKeyword: string) => ({
  system: `You are an SEO optimization specialist for DawnWire (dawnwire.com). Your task is to rewrite the given article to rank higher on Google while keeping ALL factual information intact. Do NOT invent or change data, prices, statistics, or claims.`,
  user: `Rewrite the following article for better Google SEO ranking.

CURRENT TITLE: ${title}
FOCUS KEYWORD: "${focusKeyword}"

EXISTING CONTENT:
${content.substring(0, 6000)}

REQUIREMENTS (follow strictly):
1. Keep the # H1 title similar but consider adding the focus keyword naturally
2. Add a > **Quick Summary** blockquote after the H1 (2-3 concise sentences)
3. If no ## Key Takeaways section exists, add one with 3-5 bullet points
4. Ensure focus keyword "${focusKeyword}" appears in:
   - The H1 title
   - The first 100 words of content
   - At least one ## H2 subheading
   - The meta description (which I'll extract from the first 160 chars)
5. Maintain natural keyword density of 1-3% (no keyword stuffing)
6. Use ## H2 and ### H3 subheadings throughout for structure
7. If no FAQ section exists, add ## Frequently Asked Questions with 3 Q&A pairs at the end
8. Improve readability: average sentence length under 20 words
9. Keep the same overall length (+/- 20% of original)
10. Output ONLY the full updated markdown content with no extra commentary`
});

export const PROMPT_PRODUCT_OPTIMIZE = (product: any) => ({
  system: `You are an SEO product review optimization specialist for DawnWire. Your task is to rewrite product review fields to rank higher on Google. Keep ALL factual information intact. Do NOT invent specs, prices, or features.`,
  user: `Optimize the following product review for better SEO ranking.

PRODUCT NAME: ${product.product_name}
BRAND: ${product.brand || 'N/A'}
PRICE: ${product.price || 'N/A'}
RATING: ${product.rating || 'N/A'}/5
BEST FOR: ${product.best_for || 'N/A'}

CURRENT FIELDS TO OPTIMIZE:
Review Summary: ${product.review_summary || '(empty)'}
Final Verdict: ${product.final_verdict || '(empty)'}
Pros: ${(product.pros || []).join(', ')}
Cons: ${(product.cons || []).join(', ')}
Key Features: ${(product.key_features || []).join(', ')}

REQUIREMENTS:
1. Rewrite reviewSummary (2-3 sentences) — SEO-friendly, includes product name and key differentiator
2. Rewrite finalVerdict (3-4 sentences) — clear recommendation, includes keyword-rich closing
3. Reframe pros — each as a benefit-driven phrase (e.g., "Excellent battery life lasts 30 hours" not just "Good battery")
4. Reframe cons — each as constructive feedback, include workaround context where possible
5. Enhance keyFeatures — make each descriptive and benefit-oriented (5-8 items)
6. Natural keyword integration — include "${product.product_name}" and relevant category terms naturally

OUTPUT FORMAT (JSON only, no extra text):
{
  "review_summary": "...",
  "final_verdict": "...",
  "pros": ["...", "..."],
  "cons": ["...", "..."],
  "key_features": ["...", "..."]
}`
});

export const PROMPT_META_OPTIMIZE = (title: string, content: string, existingMeta: { seoTitle?: string; seoDescription?: string; seoKeywords?: string }) => ({
  system: `You are an SEO metadata specialist. Generate high-CTR meta titles and descriptions for Google search results.`,
  user: `Generate optimized SEO metadata for the following content.

ARTICLE TITLE: ${title}
CONTENT EXCERPT: ${content.substring(0, 1000)}
CURRENT SEO TITLE: ${existingMeta.seoTitle || '(none)'}
CURRENT META DESCRIPTION: ${existingMeta.seoDescription || '(none)'}
CURRENT KEYWORDS: ${existingMeta.seoKeywords || '(none)'}

REQUIREMENTS:
- SEO Title: 30-60 characters, include primary keyword, compelling for CTR
- Meta Description: 120-160 characters, include keyword, call to action, value prop
- Keywords: 3-5 comma-separated keywords, relevant to content and searchable

OUTPUT FORMAT (JSON only):
{
  "seoTitle": "...",
  "seoDescription": "...",
  "seoKeywords": "..."
}`
});

export const PROMPT_FAQ_GENERATE = (title: string, content: string) => ({
  system: `You are an FAQ content specialist. Generate FAQ sections that target "People Also Ask" Google snippets.`,
  user: `Generate FAQ questions and answers from the following article content.

TITLE: ${title}
CONTENT:
${content.substring(0, 4000)}

REQUIREMENTS:
- Generate 4-6 FAQ pairs
- Each Q should be a real question users search for (check content for answer)
- Each A should be 2-4 sentences, informative and directly answering
- Format: **Q:** question **A:** answer
- Target long-tail keywords naturally in questions
- Base ALL answers solely on the content provided — do not make up information

OUTPUT: ONLY the FAQ section in this exact format:

## Frequently Asked Questions

**Q:** [question 1]
**A:** [answer 1]

**Q:** [question 2]
**A:** [answer 2]`
});

export const PROMPT_READABILITY_IMPROVE = (title: string, content: string) => ({
  system: `You are a readability specialist. Improve content clarity and readability while keeping all information intact. Simplify complex sentences, break up long paragraphs, and improve flow.`,
  user: `Improve the readability of this article while keeping all facts and information intact.

TITLE: ${title}
CONTENT:
${content.substring(0, 6000)}

REQUIREMENTS:
1. Break sentences longer than 25 words into shorter sentences
2. Break paragraphs longer than 5 sentences into smaller paragraphs
3. Use transition words between paragraphs
4. Keep ALL original information — do not remove any facts, data, or claims
5. Keep the same markdown structure (headings, lists, bold, etc.)
6. Output ONLY the full updated markdown with no extra commentary`
});

export const PROMPT_META_SUGGEST = (title: string, content: string, currentFocus?: string) => ({
  system: `You are an SEO metadata specialist. Given an article, suggest optimized SEO metadata. Respond ONLY with a JSON object, no other text.`,
  user: `Analyze this article and suggest SEO metadata. Keep suggestions concise and effective.

CURRENT TITLE: ${title}
CURRENT FOCUS KEYWORD: ${currentFocus || title}
CONTENT EXCERPT: ${content.substring(0, 3000)}

Respond with JSON only:
{
  "title": "An optimized SEO title (under 60 chars, includes primary keyword)",
  "metaDescription": "A compelling meta description (120-160 chars, includes keyword, call to action)",
  "focusKeyword": "The single best focus keyword (1-4 words, high search intent)",
  "slug": "A clean URL slug (lowercase, hyphens, 3-6 words, keyword-rich)",
  "tags": ["3-5 relevant tags"],
  "reasoning": "Brief explanation of choices"
}`
});
