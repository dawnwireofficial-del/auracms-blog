import { cohereChat } from './ai';

export interface AiReviewMetadata {
  shortDescription: string;
  bestFor: string;
  editorVerdict: string;
  editorScore: number;
  pros: string[];
  cons: string[];
}

export interface AiSeoMetadata {
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string[];
}

/**
 * Generate AI Verdict & Pros/Cons for a product
 */
export async function generateProductAiReview(product: {
  title: string;
  asin?: string;
  category?: string;
  brand?: string;
  shortDescription?: string;
}): Promise<AiReviewMetadata> {
  const { title, brand = '', category = 'Electronics', asin = '' } = product;

  // Try Cohere AI first
  try {
    const systemPrompt = 'You are a professional hardware reviewer for DawnWire. Return strict, raw JSON only.';
    const prompt = `Generate an in-depth AI review synthesis for: "${title}" (Brand: ${brand}, Category: ${category}, ASIN: ${asin}).
Return JSON matching:
{
  "shortDescription": "2-sentence summary of overall features and value",
  "bestFor": "Snappy Award Badge (e.g. Best Overall Wireless Headphones)",
  "editorVerdict": "2-3 sentence honest, expert review verdict",
  "editorScore": 9.4,
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
  "cons": ["Con 1", "Con 2"]
}`;

    const raw = await cohereChat(prompt, systemPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    if (data && data.editorVerdict) {
      return {
        shortDescription: data.shortDescription || `${title} offers high build quality and top performance in the ${category} segment.`,
        bestFor: data.bestFor || `Best Pick in ${category}`,
        editorVerdict: data.editorVerdict,
        editorScore: Number(data.editorScore) || 9.2,
        pros: Array.isArray(data.pros) ? data.pros : ['High build quality', 'Top performance', 'Great value'],
        cons: Array.isArray(data.cons) ? data.cons : ['Slightly higher price than basic models']
      };
    }
  } catch (err) {
    // Fall back to intelligent synthesis
  }

  // AI generation failed or unavailable — return empty defaults
  const cat = category || 'General';

  return {
    shortDescription: '',
    bestFor: `Top ${cat} Pick`,
    editorVerdict: '',
    editorScore: 0,
    pros: [],
    cons: []
  };
}

/**
 * Generate AI SEO Titles, Meta Descriptions & Keywords for a product
 */
export async function generateProductAiSeo(product: {
  title: string;
  brand?: string;
  category?: string;
  shortDescription?: string;
  mainFeatures?: string[];
  asin?: string;
}): Promise<AiSeoMetadata> {
  const { title, brand = '', category = 'Electronics', shortDescription = '', asin = '' } = product;

  // Try Cohere AI first
  try {
    const systemPrompt = 'You are a high-CTR SEO strategist for DawnWire. Return strict, raw JSON only.';
    const prompt = `Generate Google-optimized SEO metadata for: "${title}" (Brand: ${brand}, Category: ${category}, Summary: ${shortDescription}).
Return JSON matching:
{
  "seoTitle": "High CTR title under 60 chars (e.g. Sony WH-1000XM5 Review: Best Noise Canceling Headphones)",
  "metaDescription": "Compelling search description under 155 chars with price & review call to action",
  "metaKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}`;

    const raw = await cohereChat(prompt, systemPrompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    if (data && data.seoTitle) {
      return {
        seoTitle: data.seoTitle.substring(0, 65),
        metaDescription: data.metaDescription.substring(0, 160),
        metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords : [title.toLowerCase(), `${title.toLowerCase()} review`, 'dawnwire review']
      };
    }
  } catch (err) {
    // Fall back to intelligent synthesis
  }

  // AI SEO generation failed — return basic metadata
  return {
    seoTitle: title.substring(0, 65),
    metaDescription: `Shop ${title} on DawnWire. Read the full review, compare prices, and check the latest deals.`,
    metaKeywords: [title.toLowerCase(), 'dawnwire review']
  };
}
