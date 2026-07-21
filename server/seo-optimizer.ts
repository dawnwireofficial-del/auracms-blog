import { cohereChat } from './ai';
import { analyzeSeo } from './seo-engine';
import { dbInstance } from './db';
import {
  PROMPT_ARTICLE_OPTIMIZE,
  PROMPT_PRODUCT_OPTIMIZE,
  PROMPT_META_OPTIMIZE,
  PROMPT_FAQ_GENERATE,
  PROMPT_READABILITY_IMPROVE,
  PROMPT_META_SUGGEST,
} from './optimization-prompts';

export interface OptimizationCandidate {
  id: string;
  type: 'post' | 'product';
  title: string;
  slug: string;
  currentScore: number;
  issues: string[];
  wordCount: number;
  focusKeyword: string;
  updatedAt: string;
  estImprovement: number;
}

export interface OptimizedResult {
  success: boolean;
  improvements: string[];
  newScore: number;
  oldScore: number;
  changes?: Record<string, { before: string; after: string }>;
  error?: string;
}

export interface BulkResult {
  total: number;
  optimized: number;
  failed: number;
  results: { id: string; title: string; success: boolean; error?: string; improvements?: string[] }[];
}

const CONCURRENCY_LIMIT = 3;
const OPTIMIZATION_THRESHOLD = 70;

function extractHeadings(content: string): string[] {
  const matches = content.match(/#{1,6}\s.+?(?:\n|$)/g) || [];
  return matches.map(h => h.trim());
}

function extractImages(content: string): string[] {
  const matches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
  return matches.map(m => {
    const srcMatch = m.match(/\((.*?)\)/);
    return srcMatch ? srcMatch[1] : '';
  }).filter(Boolean);
}

function countInternalLinks(content: string): number {
  const matches = content.match(/\[affiliate-card:([^\]]+)\]/g) || [];
  return matches.length;
}

function countExternalLinks(content: string): number {
  const matches = content.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g) || [];
  return matches.length;
}

function hasFaqSection(content: string): boolean {
  return content.includes('## Frequently Asked Questions') || content.includes('**Q:**');
}

function hasSchemaMarkup(content: string): boolean {
  return content.includes('```json') || content.includes('"@context"') || content.includes('application/ld+json');
}

export function estimateAICost(textLength: number): { tokens: number; costUsd: number } {
  const inputTokens = Math.ceil(textLength / 4);
  const outputTokens = Math.ceil(inputTokens * 0.6);
  const totalTokens = inputTokens + outputTokens;
  const costPer1KTokens = 0.003;
  return {
    tokens: totalTokens,
    costUsd: parseFloat(((totalTokens / 1000) * costPer1KTokens).toFixed(5)),
  };
}

export async function analyzeContent(
  content: string,
  focusKeyword: string,
  title?: string,
  seoTitle?: string,
  metaDescription?: string,
  slug?: string,
): Promise<{ score: number; checks: Record<string, boolean>; good: string[]; warnings: string[]; critical: string[] }> {
  const headings = extractHeadings(content);
  const images = extractImages(content);
  const internalLinks = countInternalLinks(content);
  const externalLinks = countExternalLinks(content);
  const hasFaq = hasFaqSection(content);
  const hasSchema = hasSchemaMarkup(content);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return analyzeSeo({
    title,
    seoTitle,
    metaDescription,
    content,
    slug,
    focusKeyword,
    headings,
    images,
    internalLinks,
    externalLinks,
    hasFaq,
    hasSchema,
    wordCount,
  });
}

async function runCohere(system: string, user: string, maxTokens = 2000): Promise<string> {
  const result = await cohereChat(user, system);
  return result;
}

function parseJsonResponse<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function computeIssueLabels(checks: Record<string, boolean>): string[] {
  const labels: string[] = [];
  if (!checks.titleHasKeyword) labels.push('Title');
  if (!checks.descriptionHasKeyword) labels.push('Desc');
  if (!checks.h1HasKeyword) labels.push('H1');
  if (!checks.firstParagraphHasKeyword) labels.push('1stP');
  if (!checks.slugHasKeyword) labels.push('Slug');
  if (!checks.h2HasKeyword) labels.push('H2');
  if (!checks.properHeadings) labels.push('Hdrs');
  if (!checks.minWordCount) labels.push('Words');
  if (!checks.hasInternalLinks) labels.push('IntL');
  if (!checks.hasExternalLinks) labels.push('ExtL');
  if (!checks.hasFaq) labels.push('FAQ');
  if (!checks.hasSchema) labels.push('Schema');
  if (!checks.titleLengthOk) labels.push('TLen');
  if (!checks.descriptionLengthOk) labels.push('DLen');
  if (!checks.readabilityOk) labels.push('Read');
  return labels;
}

export async function getOptimizationCandidates(): Promise<OptimizationCandidate[]> {
  const [posts, products] = await Promise.all([
    dbInstance.getPosts() as Promise<any[]>,
    (await import('./seo-engine')).getProductReviews() as Promise<any[]>,
  ]);

  const candidates: OptimizationCandidate[] = [];

  for (const post of (posts as any[]).filter(p => p.status === 'published')) {
    const focusKeyword = post.seoKeywords || post.title || '';
    const result = await analyzeContent(
      post.content || '',
      focusKeyword,
      post.title,
      post.seoTitle,
      post.seoDescription,
      post.slug,
    );
    candidates.push({
      id: post.id,
      type: 'post',
      title: post.title,
      slug: post.slug,
      currentScore: result.score,
      issues: computeIssueLabels(result.checks),
      wordCount: (post.content || '').split(/\s+/).filter(Boolean).length,
      focusKeyword,
      updatedAt: post.updatedAt || post.publishedAt || post.createdAt,
      estImprovement: Math.min(100, result.score + 30),
    });
  }

  for (const product of (products as any[]).filter(p => p.status === 'published')) {
    const productText = [
      product.review_summary || '',
      product.final_verdict || '',
      ...(product.pros || []),
      ...(product.cons || []),
      ...(product.key_features || []),
    ].join(' ');
    const focusKeyword = product.product_name || '';
    const result = await analyzeContent(
      productText,
      focusKeyword,
      product.product_name,
      product.product_name,
      product.review_summary,
      product.slug,
    );
    candidates.push({
      id: product.id,
      type: 'product',
      title: product.product_name,
      slug: product.slug || product.id,
      currentScore: result.score,
      issues: computeIssueLabels(result.checks),
      wordCount: productText.split(/\s+/).filter(Boolean).length,
      focusKeyword,
      updatedAt: product.updatedAt || product.createdAt,
      estImprovement: Math.min(100, result.score + 35),
    });
  }

  return candidates.sort((a, b) => a.currentScore - b.currentScore);
}

export async function optimizePost(postId: string): Promise<OptimizedResult> {
  try {
    const posts = await dbInstance.getPosts() as any[];
    const post = posts.find(p => p.id === postId);
    if (!post) return { success: false, improvements: [], newScore: 0, oldScore: 0, error: 'Post not found' };

    const focusKeyword = post.seoKeywords || post.title || '';
    const oldAnalysis = await analyzeContent(
      post.content || '', focusKeyword,
      post.title, post.seoTitle, post.seoDescription, post.slug,
    );
    const oldScore = oldAnalysis.score;
    const improvements: string[] = [];

    let optimizedContent = post.content || '';
    let optimizedSeoTitle = post.seoTitle || '';
    let optimizedSeoDescription = post.seoDescription || '';
    let optimizedSeoKeywords = post.seoKeywords || '';

    const needsFullRewrite = oldScore < 50;
    const needsMetaFix = !oldAnalysis.checks.titleHasKeyword || !oldAnalysis.checks.descriptionLengthOk || !oldAnalysis.checks.titleLengthOk;
    const needsFaq = !oldAnalysis.checks.hasFaq;
    const needsReadability = !oldAnalysis.checks.readabilityOk;

    if (needsFullRewrite) {
      try {
        const prompt = PROMPT_ARTICLE_OPTIMIZE(post.title, post.content, focusKeyword);
        const rewritten = await runCohere(prompt.system, prompt.user, 3000);
        if (rewritten && rewritten.length > 100) {
          optimizedContent = rewritten;
          improvements.push('Full content rewrite for SEO optimization');
        }
      } catch (e: any) {
        improvements.push(`Full rewrite skipped: ${e.message}`);
      }
    }

    if (needsFaq && !hasFaqSection(optimizedContent)) {
      try {
        const prompt = PROMPT_FAQ_GENERATE(post.title, optimizedContent);
        const faqSection = await runCohere(prompt.system, prompt.user, 1000);
        if (faqSection && faqSection.includes('**Q:**')) {
          optimizedContent = optimizedContent.trim() + '\n\n' + faqSection;
          improvements.push('FAQ section generated');
        }
      } catch (e) { console.error(e) }
    }

    if (needsReadability && !needsFullRewrite) {
      try {
        const prompt = PROMPT_READABILITY_IMPROVE(post.title, optimizedContent);
        const improved = await runCohere(prompt.system, prompt.user, 3000);
        if (improved && improved.length > 100) {
          optimizedContent = improved;
          improvements.push('Readability improved');
        }
      } catch (e) { console.error(e) }
    }

    if (needsMetaFix) {
      try {
        const prompt = PROMPT_META_OPTIMIZE(post.title, optimizedContent, {
          seoTitle: optimizedSeoTitle,
          seoDescription: optimizedSeoDescription,
          seoKeywords: optimizedSeoKeywords,
        });
        const metaRaw = await runCohere(prompt.system, prompt.user, 500);
        const meta = parseJsonResponse<{ seoTitle: string; seoDescription: string; seoKeywords: string }>(metaRaw);
        if (meta) {
          if (meta.seoTitle && meta.seoTitle.length >= 10) optimizedSeoTitle = meta.seoTitle;
          if (meta.seoDescription && meta.seoDescription.length >= 50) optimizedSeoDescription = meta.seoDescription;
          if (meta.seoKeywords) optimizedSeoKeywords = meta.seoKeywords;
          improvements.push('SEO metadata regenerated');
        }
      } catch (e) { console.error(e) }
    }

    const newAnalysis = await analyzeContent(
      optimizedContent, focusKeyword,
      post.title, optimizedSeoTitle, optimizedSeoDescription, post.slug,
    );
    const newScore = newAnalysis.score;

    const changes: Record<string, { before: string; after: string }> = {};
    if (optimizedContent !== post.content) {
      changes.content = {
        before: post.content.substring(0, 200) + '...',
        after: optimizedContent.substring(0, 200) + '...',
      };
    }
    if (optimizedSeoTitle !== post.seoTitle) {
      changes.seoTitle = { before: post.seoTitle || '', after: optimizedSeoTitle };
    }
    if (optimizedSeoDescription !== post.seoDescription) {
      changes.seoDescription = { before: post.seoDescription || '', after: optimizedSeoDescription };
    }

    const updates: Record<string, any> = {
      content: optimizedContent,
      updatedAt: new Date().toISOString(),
    };
    if (optimizedSeoTitle) updates.seoTitle = optimizedSeoTitle;
    if (optimizedSeoDescription) updates.seoDescription = optimizedSeoDescription;
    if (optimizedSeoKeywords) updates.seoKeywords = optimizedSeoKeywords;

    await dbInstance.updatePost(postId, updates as any);

    return { success: true, improvements, newScore, oldScore, changes };
  } catch (e: any) {
    return { success: false, improvements: [], newScore: 0, oldScore: 0, error: e.message };
  }
}

export async function optimizeProduct(productId: string): Promise<OptimizedResult> {
  try {
    const seo = await import('./seo-engine');
    const all = await seo.getProductReviews() as any[];
    const product = all.find(p => p.id === productId);
    if (!product) return { success: false, improvements: [], newScore: 0, oldScore: 0, error: 'Product not found' };

    const productText = [
      product.review_summary || '',
      product.final_verdict || '',
      ...(product.pros || []),
      ...(product.cons || []),
      ...(product.key_features || []),
    ].join(' ');
    const focusKeyword = product.product_name || '';

    const oldAnalysis = await analyzeContent(
      productText, focusKeyword,
      product.product_name, product.product_name, product.review_summary, product.slug,
    );
    const oldScore = oldAnalysis.score;
    const improvements: string[] = [];

    let optimizedFields: any = {};

    try {
      const prompt = PROMPT_PRODUCT_OPTIMIZE(product);
      const raw = await runCohere(prompt.system, prompt.user, 1500);
      const parsed = parseJsonResponse<{
        review_summary: string;
        final_verdict: string;
        pros: string[];
        cons: string[];
        key_features: string[];
      }>(raw);
      if (parsed) {
        optimizedFields = parsed;
        improvements.push('Product review fields rewritten for SEO');
      }
    } catch (e: any) {
      improvements.push(`Product optimization skipped: ${e.message}`);
    }

    if (!hasFaqSection(productText) && product.review_summary) {
      try {
        const prompt = PROMPT_FAQ_GENERATE(product.product_name, productText);
        const faqRaw = await runCohere(prompt.system, prompt.user, 1000);
        if (faqRaw && faqRaw.includes('**Q:**')) {
          optimizedFields.faqs = faqRaw;
          improvements.push('FAQ generated for product');
        }
      } catch (e) { console.error(e) }
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (optimizedFields.review_summary) updates.review_summary = optimizedFields.review_summary;
    if (optimizedFields.final_verdict) updates.final_verdict = optimizedFields.final_verdict;
    if (optimizedFields.pros) updates.pros = optimizedFields.pros;
    if (optimizedFields.cons) updates.cons = optimizedFields.cons;
    if (optimizedFields.key_features) updates.key_features = optimizedFields.key_features;
    if (optimizedFields.faqs) updates.faqs = optimizedFields.faqs;

    await seo.updateProductReview(productId, updates);

    const newProductText = [
      optimizedFields.review_summary || product.review_summary || '',
      optimizedFields.final_verdict || product.final_verdict || '',
      ...(optimizedFields.pros || product.pros || []),
      ...(optimizedFields.cons || product.cons || []),
      ...(optimizedFields.key_features || product.key_features || []),
    ].join(' ');

    const newAnalysis = await analyzeContent(
      newProductText, focusKeyword,
      product.product_name, product.product_name,
      optimizedFields.review_summary || product.review_summary, product.slug,
    );
    const newScore = newAnalysis.score;

    return { success: true, improvements, newScore, oldScore };
  } catch (e: any) {
    return { success: false, improvements: [], newScore: 0, oldScore: 0, error: e.message };
  }
}

export async function previewOptimization(type: 'post' | 'product', id: string): Promise<{
  original: any;
  optimized: { content?: string; seoTitle?: string; seoDescription?: string; improvements: string[]; estimatedNewScore: number };
}> {
  if (type === 'post') {
    const posts = await dbInstance.getPosts() as any[];
    const post = posts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');

    const focusKeyword = post.seoKeywords || post.title || '';
    const oldAnalysis = await analyzeContent(
      post.content || '', focusKeyword,
      post.title, post.seoTitle, post.seoDescription, post.slug,
    );

    let optimizedContent = post.content || '';
    let optimizedSeoTitle = post.seoTitle || '';
    let optimizedSeoDescription = post.seoDescription || '';

    const improvements: string[] = [];
    const needsRewrite = oldAnalysis.score < 50;

    if (needsRewrite) {
      try {
        const prompt = PROMPT_ARTICLE_OPTIMIZE(post.title, post.content, focusKeyword);
        const rewritten = await runCohere(prompt.system, prompt.user, 3000);
        if (rewritten && rewritten.length > 100) {
          optimizedContent = rewritten;
          improvements.push('Full content rewrite');
        }
      } catch (e) { console.error(e) }
    } else {
      if (!oldAnalysis.checks.hasFaq) {
        try {
          const prompt = PROMPT_FAQ_GENERATE(post.title, optimizedContent);
          const faqSection = await runCohere(prompt.system, prompt.user, 1000);
          if (faqSection && faqSection.includes('**Q:**')) {
            improvements.push('FAQ section generation');
          }
        } catch (e) { console.error(e) }
      }
      if (!oldAnalysis.checks.readabilityOk) {
        improvements.push('Readability improvement');
      }
    }

    if (!oldAnalysis.checks.titleHasKeyword || !oldAnalysis.checks.descriptionLengthOk) {
      improvements.push('SEO metadata optimization');
      try {
        const prompt = PROMPT_META_OPTIMIZE(post.title, optimizedContent, {
          seoTitle: optimizedSeoTitle,
          seoDescription: optimizedSeoDescription,
          seoKeywords: post.seoKeywords,
        });
        const metaRaw = await runCohere(prompt.system, prompt.user, 500);
        const meta = parseJsonResponse<{ seoTitle: string; seoDescription: string; seoKeywords: string }>(metaRaw);
        if (meta) {
          if (meta.seoTitle) optimizedSeoTitle = meta.seoTitle;
          if (meta.seoDescription) optimizedSeoDescription = meta.seoDescription;
        }
      } catch (e) { console.error(e) }
    }

    const newAnalysis = await analyzeContent(
      optimizedContent || post.content, focusKeyword,
      post.title, optimizedSeoTitle, optimizedSeoDescription, post.slug,
    );

    return {
      original: { title: post.title, content: post.content, seoTitle: post.seoTitle, seoDescription: post.seoDescription, score: oldAnalysis.score },
      optimized: { content: optimizedContent, seoTitle: optimizedSeoTitle, seoDescription: optimizedSeoDescription, improvements, estimatedNewScore: newAnalysis.score },
    };
  }

  throw new Error('Preview for products not yet implemented');
}

export async function bulkOptimize(
  threshold: number = OPTIMIZATION_THRESHOLD,
  types: ('post' | 'product')[] = ['post', 'product'],
  maxItems: number = 50,
): Promise<BulkResult> {
  const candidates = await getOptimizationCandidates();
  const filtered = candidates.filter(c =>
    c.currentScore < threshold && types.includes(c.type)
  ).slice(0, maxItems);

  const results: BulkResult['results'] = [];
  let optimized = 0;
  let failed = 0;

  const queue = [...filtered];
  const running: Promise<void>[] = [];

  async function processItem(candidate: OptimizationCandidate) {
    try {
      let result: OptimizedResult;
      if (candidate.type === 'post') {
        result = await optimizePost(candidate.id);
      } else {
        result = await optimizeProduct(candidate.id);
      }
      if (result.success) {
        optimized++;
        results.push({ id: candidate.id, title: candidate.title, success: true, improvements: result.improvements });
      } else {
        failed++;
        results.push({ id: candidate.id, title: candidate.title, success: false, error: result.error });
      }
    } catch (e: any) {
      failed++;
      results.push({ id: candidate.id, title: candidate.title, success: false, error: e.message });
    }
  }

  while (queue.length > 0 || running.length > 0) {
    while (running.length < CONCURRENCY_LIMIT && queue.length > 0) {
      const item = queue.shift()!;
      running.push(processItem(item).finally(() => {
        const idx = running.indexOf(promise);
        if (idx >= 0) running.splice(idx, 1);
      }));
    }
    const promise = running[running.length - 1];
    if (promise) await promise;
  }

  return { total: filtered.length, optimized, failed, results };
}

export async function getOptimizationStats(): Promise<{
  totalItems: number;
  averageScore: number;
  belowThreshold: number;
  threshold: number;
  estimatedCostUsd: number;
}> {
  const candidates = await getOptimizationCandidates();
  const totalItems = candidates.length;
  const averageScore = totalItems > 0
    ? Math.round(candidates.reduce((s, c) => s + c.currentScore, 0) / totalItems)
    : 0;
  const belowThreshold = candidates.filter(c => c.currentScore < OPTIMIZATION_THRESHOLD).length;

  const estimatedCost = candidates
    .filter(c => c.currentScore < OPTIMIZATION_THRESHOLD)
    .reduce((sum, c) => sum + estimateAICost(c.wordCount).costUsd, 0);

  return {
    totalItems,
    averageScore,
    belowThreshold,
    threshold: OPTIMIZATION_THRESHOLD,
    estimatedCostUsd: parseFloat(estimatedCost.toFixed(4)),
  };
}

export interface MetaSuggestion {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  tags: string[];
  reasoning: string;
}

export async function suggestPostMeta(title: string, content: string, currentFocus?: string): Promise<MetaSuggestion | null> {
  try {
    const prompt = PROMPT_META_SUGGEST(title, content, currentFocus);
    const raw = await runCohere(prompt.system, prompt.user, 1000);
    if (!raw) return null;
    return parseJsonResponse<MetaSuggestion>(raw);
  } catch {
    return null;
  }
}
