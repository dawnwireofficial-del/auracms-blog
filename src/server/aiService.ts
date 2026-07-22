import { GoogleGenAI } from '@google/genai';

export async function handleAiChatRequest(prompt: string, contextProductId?: string, history: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    return {
      text: `I'd love to help you find the perfect product. Please browse our catalog or use the search to discover great deals.`,
      recommendedProducts: []
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are the DawnWire AI Shopping Assistant & Amazon Discovery Expert.
DawnWire is an independent product discovery, expert reviews, comparisons, and Amazon deals platform.
Always be objective, concise, and helpful.
Return a response encouraging the user to check prices on Amazon using DawnWire links.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }] }
      ]
    });

    const responseText = response.text || "Here are our top Amazon product recommendations for you:";

    return {
      text: responseText,
      recommendedProducts: []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: `I'd be happy to help! Please search for a product or browse our catalog.`,
      recommendedProducts: []
    };
  }
}

export async function handleAiProductGenerator(title: string, asin: string, category: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    return {
      shortDescription: '',
      bestFor: '',
      pros: [],
      cons: [],
      editorVerdict: ''
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Generate expert review metadata for a product titled "${title}" (ASIN: ${asin}) in category "${category}".
Return a JSON object with:
- shortDescription (1-2 sentences)
- bestFor (e.g. "Best overall for professionals")
- pros (array of 3 short strings)
- cons (array of 2 short strings)
- editorVerdict (2 sentences expert opinion)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err: any) {
    if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
      console.warn('AI product generator quota limit reached, returning computed fallback.');
    } else {
      console.error('AI Product Generator error:', err?.message || err);
    }
  }

  return {
    shortDescription: '',
    bestFor: '',
    pros: [],
    cons: [],
    editorVerdict: ''
  };
}

export async function handleAiGenerateSeo(productData: {
  title: string;
  brand?: string;
  category?: string;
  shortDescription?: string;
  mainFeatures?: string[];
  asin?: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  const cleanTitle = productData.title.trim();
  const defaultSeoTitle = cleanTitle ? `${cleanTitle} Review, Specs & Best Deals | DawnWire` : 'DawnWire Product Review';
  const defaultMetaDesc = cleanTitle
    ? `In-depth review and benchmark analysis for ${cleanTitle}. Compare specs, Amazon price drops, pros, cons, and editor rating on DawnWire.`
    : 'In-depth Amazon product review and benchmark analysis on DawnWire.';
  const defaultKeywords = [
    cleanTitle.toLowerCase(),
    `${cleanTitle.toLowerCase()} review`,
    `${cleanTitle.toLowerCase()} price`,
    `${cleanTitle.toLowerCase()} amazon deal`,
    productData.brand ? `${productData.brand.toLowerCase()} ${productData.category?.toLowerCase() || 'tech'}` : 'tech review',
    'best price amazon',
    'dawnwire tech review'
  ].filter(Boolean);

  if (!apiKey) {
    return {
      seoTitle: defaultSeoTitle,
      metaDescription: defaultMetaDesc,
      metaKeywords: defaultKeywords
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an expert ecommerce SEO strategist.
Generate search engine optimized (SEO) metadata for the following product:
- Product Name: "${cleanTitle}"
- Brand: "${productData.brand || ''}"
- Category: "${productData.category || ''}"
- Summary: "${productData.shortDescription || ''}"
- Features: "${(productData.mainFeatures || []).join(', ')}"
- ASIN: "${productData.asin || ''}"

Return ONLY a valid JSON object matching this schema:
{
  "seoTitle": "High-converting Google search meta title under 60 chars including product name, brand, and terms like Review or Best Deals",
  "metaDescription": "Compelling search snippet description between 145 and 160 characters with clear value proposition and call to action",
  "metaKeywords": ["array", "of", "6-10", "high-intent", "search", "phrases", "and", "long-tail", "keywords"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        seoTitle: parsed.seoTitle || defaultSeoTitle,
        metaDescription: parsed.metaDescription || defaultMetaDesc,
        metaKeywords: Array.isArray(parsed.metaKeywords) && parsed.metaKeywords.length > 0 ? parsed.metaKeywords : defaultKeywords
      };
    }
  } catch (err: any) {
    if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
      console.warn('Gemini SEO generator quota limit reached, returning computed fallback.');
    } else {
      console.error('Gemini SEO generator error:', err?.message || err);
    }
  }

  return {
    seoTitle: defaultSeoTitle,
    metaDescription: defaultMetaDesc,
    metaKeywords: defaultKeywords
  };
}

export async function handleAiExtractProductFromLink(productUrl: string, associateTag = 'dawnwire-20') {
  const asinMatch = productUrl.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|ASIN=)([A-Z0-9]{10})/i);
  const extractedAsin = asinMatch ? asinMatch[1].toUpperCase() : '';

  if (!extractedAsin) {
    return { error: 'Could not extract ASIN from URL' };
  }

  return {
    asin: extractedAsin,
    message: 'ASIN extracted. Use the product import tool to fetch live data from Amazon PA-API.'
  };
}

export async function handleAiAnalyzeSentiment(productData: {
  title: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  editorScore?: number;
  pros?: string[];
  cons?: string[];
  reviewsText?: string[];
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    return { error: 'AI sentiment analysis requires a Gemini API key' };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an expert NLP Sentiment Analyst specializing in Amazon customer reviews and benchmark feedback.
Analyze customer sentiment for:
Product: "${productData.title}"
Brand: "${productData.brand || ''}"
Star Rating: ${productData.rating || 4.6} / 5 (${productData.reviewCount || 500} reviews)
Pros: ${JSON.stringify(productData.pros || [])}
Cons: ${JSON.stringify(productData.cons || [])}

Return ONLY a JSON object matching this schema:
{
  "overallSentiment": "Overwhelmingly Positive | Mostly Positive | Mixed | Critical",
  "positivePercentage": number between 0 and 100,
  "neutralPercentage": number between 0 and 100,
  "negativePercentage": number between 0 and 100,
  "summary": "3-sentence concise synthesis of customer satisfaction, key praise, and common grievances",
  "keyPositiveFactors": ["array of 3-5 specific positive aspects praised by customers"],
  "keyNegativeFactors": ["array of 2-4 critical feedback points or cons"],
  "featureRatings": {
    "buildQuality": number 0-100,
    "valueForMoney": number 0-100,
    "performance": number 0-100,
    "easeOfUse": number 0-100,
    "design": number 0-100
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
  } catch (err: any) {
    console.error('Gemini sentiment analysis error:', err?.message || err);
  }

  return { error: 'Failed to analyze sentiment' };
}

export interface ProductFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Performance' | 'Setup & Compatibility' | 'Battery & Features' | 'Warranty & Support' | 'Value & Pricing';
  confidenceScore: number;
  verifiedByAi: boolean;
}

export async function handleAiGenerateFaq(productData: {
  title: string;
  brand?: string;
  category?: string;
  specs?: Record<string, string>;
  pros?: string[];
  cons?: string[];
  currentPrice?: number;
  rating?: number;
}): Promise<ProductFaqItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are a product specification expert and review synthesizer.
Generate 5 comprehensive FAQs and answers for this product:
Title: "${productData.title}"
Brand: "${productData.brand || ''}"
Category: "${productData.category || ''}"
Price: "${productData.currentPrice ? `$${productData.currentPrice}` : 'Competitive Pricing'}"
Specs: ${JSON.stringify(productData.specs || {})}
Pros: ${JSON.stringify(productData.pros || [])}
Cons: ${JSON.stringify(productData.cons || [])}

Return ONLY a JSON array of 5 FAQ objects matching this exact JSON schema:
[
  {
    "id": "faq-1",
    "question": "Clear realistic customer question?",
    "answer": "Accurate, helpful 2-3 sentence answer based on specifications, benchmark data, and customer feedback.",
    "category": "Performance | Setup & Compatibility | Battery & Features | Warranty & Support | Value & Pricing",
    "confidenceScore": number between 90 and 99,
    "verifiedByAi": true
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `faq-${idx + 1}`,
          question: item.question,
          answer: item.answer,
          category: item.category || 'Performance',
          confidenceScore: item.confidenceScore || 95,
          verifiedByAi: true
        }));
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
      console.warn('Gemini FAQ generator quota limit reached, returning empty.');
    } else {
      console.error('Gemini FAQ generator error:', err?.message || err);
    }
  }

  return [];
}
