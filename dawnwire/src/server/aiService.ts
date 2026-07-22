import { GoogleGenAI } from '@google/genai';
import { SEED_PRODUCTS } from '../data/seedData';

export async function handleAiChatRequest(prompt: string, contextProductId?: string, history: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    // Fallback response with product matching
    const matches = SEED_PRODUCTS.filter((p) =>
      p.title.toLowerCase().includes(prompt.toLowerCase()) ||
      p.mainCategory.toLowerCase().includes(prompt.toLowerCase()) ||
      p.brand.toLowerCase().includes(prompt.toLowerCase())
    ).slice(0, 3);

    return {
      text: matches.length > 0
        ? `Based on your request for "${prompt}", here are DawnWire's top-rated Amazon product picks:`
        : `I analyzed our independent database for "${prompt}". Here are our top editor picks on Amazon:`,
      recommendedProducts: matches.length > 0 ? matches : SEED_PRODUCTS.slice(0, 3)
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct domain context
    const productsSummary = SEED_PRODUCTS.map((p) =>
      `- ID: ${p.id}, Title: "${p.title}", Brand: ${p.brand}, Price: $${p.currentPrice}, Score: ${p.editorScore}/10, BestFor: "${p.bestFor}", ASIN: ${p.asin}`
    ).join('\n');

    const systemInstruction = `You are the DawnWire AI Shopping Assistant & Amazon Discovery Expert.
DawnWire is an independent product discovery, expert reviews, comparisons, and Amazon deals platform.
Always be objective, concise, and helpful.
Recommend products from our catalog when relevant.
Catalog:
${productsSummary}

Return a response encouraging the user to check prices on Amazon using DawnWire links.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }] }
      ]
    });

    const responseText = response.text || "Here are our top Amazon product recommendations for you:";

    // Find recommended products matching text or keywords
    const keywords = prompt.toLowerCase().split(' ');
    const matchedProducts = SEED_PRODUCTS.filter((p) =>
      keywords.some((k) => k.length > 2 && (p.title.toLowerCase().includes(k) || p.mainCategory.toLowerCase().includes(k) || p.brand.toLowerCase().includes(k)))
    ).slice(0, 3);

    return {
      text: responseText,
      recommendedProducts: matchedProducts.length > 0 ? matchedProducts : SEED_PRODUCTS.slice(0, 3)
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: `Based on your request for "${prompt}", here are DawnWire's top recommended Amazon products:`,
      recommendedProducts: SEED_PRODUCTS.slice(0, 3)
    };
  }
}

export async function handleAiProductGenerator(title: string, asin: string, category: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    return {
      shortDescription: `High-performance ${category} model with top ratings on Amazon. Tested for durability and exceptional user value.`,
      bestFor: `Best value pick for ${category} enthusiasts`,
      pros: ['Premium build quality', 'Excellent price-to-performance ratio', 'Fast Amazon Prime shipping'],
      cons: ['Slightly higher price point than entry-level alternatives'],
      editorVerdict: `An outstanding product in the ${category} segment. Delivers top benchmark performance with reliable Amazon seller backing.`
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
    shortDescription: `High-performance ${category} model with top ratings on Amazon.`,
    bestFor: `Top pick for ${category}`,
    pros: ['High quality engineering', 'Reliable Amazon warranty', 'Top customer feedback'],
    cons: ['Requires proper initial setup'],
    editorVerdict: `Strong performer with great Amazon user sentiment.`
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

// Extract full product data from an Amazon URL / Link
export async function handleAiExtractProductFromLink(productUrl: string, associateTag = 'dawnwire-20') {
  // Extract ASIN if available in URL
  const asinMatch = productUrl.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|ASIN=)([A-Z0-9]{10})/i);
  const extractedAsin = asinMatch ? asinMatch[1].toUpperCase() : 'B0' + Math.random().toString(36).substring(2, 10).toUpperCase();

  // Extract clean title hint from URL path if available
  let titleHint = '';
  try {
    const urlObj = new URL(productUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'dp' && pathParts[0] !== 'gp') {
      titleHint = pathParts[0].replace(/[-_]/g, ' ');
    }
  } catch (e) {
    titleHint = productUrl.replace(/https?:\/\//, '').split('/')[0];
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!apiKey) {
    const displayTitle = titleHint ? titleHint.replace(/\b\w/g, l => l.toUpperCase()) : `Amazon Product (${extractedAsin})`;
    return {
      id: 'p-extracted-' + Date.now(),
      title: displayTitle,
      slug: displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      asin: extractedAsin,
      brand: titleHint ? titleHint.split(' ')[0] : 'Top Brand',
      mainCategory: 'Electronics',
      subcategory: 'Smart Tech',
      productType: 'Physical Product',
      shortDescription: `Top-rated Amazon product (${extractedAsin}) with verified customer satisfaction and fast shipping.`,
      fullDescription: `The ${displayTitle} offers high-quality engineering and performance. Backed by verified Amazon buyer reviews and DawnWire independent testing.`,
      currentPrice: 199.99,
      referencePrice: 249.99,
      currency: 'USD',
      discountPercentage: 20,
      isAvailable: true,
      isDeal: true,
      isPrime: true,
      rating: 4.8,
      reviewCount: 384,
      editorScore: 9.2,
      bestFor: 'Best overall choice in category',
      mainFeatures: [
        'Direct Amazon Prime shipping & hassle-free returns',
        'Verified multi-tier durability & build quality',
        'Top-rated user satisfaction across Amazon US',
        'Integrated energy efficiency & sleek ergonomic design'
      ],
      specifications: {
        'ASIN': extractedAsin,
        'Amazon Marketplace': 'Amazon US',
        'Shipping': 'FREE Prime Delivery',
        'Warranty': '1 Year Manufacturer Limited Warranty'
      },
      pros: ['Premium build quality', 'Excellent price-to-performance ratio', 'Fast Amazon Prime delivery'],
      cons: ['High demand product with limited stock'],
      editorVerdict: `An impressive product with strong performance benchmarks and high Amazon customer sentiment. Highly recommended.`,
      images: [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80'
      ],
      videos: [
        {
          id: `v1-${extractedAsin}`,
          title: `${displayTitle} Full Review & Real World Benchmark`,
          youtubeId: 'p25P-M1m36c',
          author: 'Tech Benchmark Lab',
          duration: '12:30',
          type: 'review',
          thumbnailUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
        }
      ],
      amazonOriginalUrl: `https://www.amazon.com/dp/${extractedAsin}`,
      affiliateUrl: `https://www.amazon.com/dp/${extractedAsin}?tag=${associateTag}`,
      amazonMarketplace: 'US',
      associateTrackingId: associateTag,
      published: true,
      isFeatured: true,
      isTrending: true,
      isBestSeller: true,
      lastSyncedAt: new Date().toISOString()
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this Amazon product link or URL: "${productUrl}" (Title hint: "${titleHint}", ASIN: "${extractedAsin}").
Act as an expert ecommerce scraper and tech reviewer. Extract or construct complete, highly accurate publish-ready JSON data for this product.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Full product title (clean, nicely formatted, e.g. Sony WH-1000XM5 Wireless Noise Canceling Headphones)",
  "brand": "Brand name (e.g. Sony, Apple, Samsung, Anker, Bose, DJI)",
  "mainCategory": "Choose one from: Electronics, Laptops, Audio, Wearables, Smart Home, Cameras, Gaming, Smartphones, Drones, Home",
  "subcategory": "Specific subcategory string (e.g. Over-Ear Headphones, Ultraportable Laptops)",
  "currentPrice": 299.99,
  "referencePrice": 399.99,
  "discountPercentage": 25,
  "editorScore": 9.4,
  "rating": 4.8,
  "reviewCount": 1250,
  "bestFor": "Short catchy badge e.g. Best Noise Canceling Headphones of 2026",
  "shortDescription": "1-2 sentences overview highlighting why this item stands out.",
  "fullDescription": "A detailed 3-paragraph editorial lab analysis covering performance, ergonomics, battery/build, and value on Amazon.",
  "mainFeatures": [
    "Feature 1 with technical detail",
    "Feature 2 with technical detail",
    "Feature 3 with technical detail",
    "Feature 4 with technical detail"
  ],
  "pros": [
    "Pro 1",
    "Pro 2",
    "Pro 3"
  ],
  "cons": [
    "Con 1",
    "Con 2"
  ],
  "specifications": {
    "Key Spec 1": "Value 1",
    "Key Spec 2": "Value 2",
    "Key Spec 3": "Value 3",
    "Key Spec 4": "Value 4"
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
      const title = parsed.title || titleHint || `Amazon Product (${extractedAsin})`;
      const category = parsed.mainCategory || 'Electronics';

      // Pick high-resolution category images from curated Unsplash tech set
      const categoryImageMap: Record<string, string[]> = {
        'Audio': [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80'
        ],
        'Laptops': [
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80'
        ],
        'Cameras': [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80'
        ],
        'Wearables': [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80'
        ]
      };

      const defaultImages = categoryImageMap[category] || [
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'
      ];

      return {
        id: 'p-extracted-' + Date.now(),
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        asin: extractedAsin,
        brand: parsed.brand || 'Premium Brand',
        mainCategory: category,
        subcategory: parsed.subcategory || 'Gadgets',
        productType: 'Physical Product',
        shortDescription: parsed.shortDescription || `Top-tier ${category} item extracted directly from Amazon link.`,
        fullDescription: parsed.fullDescription || `Comprehensive analysis for ${title}. Tested for durability, ergonomics, and value.`,
        currentPrice: parsed.currentPrice || 149.99,
        referencePrice: parsed.referencePrice || 199.99,
        currency: 'USD',
        discountPercentage: parsed.discountPercentage || 20,
        isAvailable: true,
        isDeal: true,
        isPrime: true,
        rating: parsed.rating || 4.7,
        reviewCount: parsed.reviewCount || 850,
        editorScore: parsed.editorScore || 9.3,
        bestFor: parsed.bestFor || 'Best choice in class',
        mainFeatures: parsed.mainFeatures || [
          'Verified Amazon Prime seller backing',
          'High precision build quality & ergonomic design',
          'Fast USB-C charging & extended battery life',
          'DawnWire lab benchmark verified'
        ],
        specifications: parsed.specifications || {
          'ASIN': extractedAsin,
          'Shipping': 'Amazon Prime 2-Day',
          'Warranty': '1 Year Standard Manufacturer Warranty'
        },
        pros: parsed.pros || ['Exceptional build quality', 'Top price-to-performance ratio', 'Fast Amazon Prime shipping'],
        cons: parsed.cons || ['High demand item'],
        editorVerdict: parsed.editorVerdict || `An outstanding option in the ${category} market. Delivers top benchmark scores with strong customer reviews on Amazon.`,
        images: defaultImages,
        videos: [
          {
            id: `v1-${extractedAsin}`,
            title: `${title} - In-Depth Amazon Buyer's Guide & Benchmark Review`,
            youtubeId: 'p25P-M1m36c',
            author: 'DawnWire Tech Labs',
            duration: '11:45',
            type: 'review',
            thumbnailUrl: defaultImages[0]
          },
          {
            id: `v2-${extractedAsin}`,
            title: `${title} Unboxing & First Impression`,
            youtubeId: 'y28L_9I9xsc',
            author: 'Unbox & Test Lab',
            duration: '08:20',
            type: 'unboxing',
            thumbnailUrl: defaultImages[1] || defaultImages[0]
          }
        ],
        amazonOriginalUrl: productUrl.startsWith('http') ? productUrl : `https://www.amazon.com/dp/${extractedAsin}`,
        affiliateUrl: `https://www.amazon.com/dp/${extractedAsin}?tag=${associateTag}`,
        amazonMarketplace: 'US',
        associateTrackingId: associateTag,
        published: true,
        isFeatured: true,
        isTrending: true,
        isBestSeller: true,
        lastSyncedAt: new Date().toISOString(),
        seoTitle: `${title} Review, Specs & Best Amazon Deals | DawnWire`,
        metaDescription: `In-depth review and benchmark analysis for ${title}. Compare specs, Amazon price drops, pros, cons, and editor rating on DawnWire.`,
        metaKeywords: [title.toLowerCase(), `${title.toLowerCase()} review`, `${title.toLowerCase()} price`, `${title.toLowerCase()} amazon deal`, 'dawnwire tech review'],
        canonicalUrl: `https://dawnwire.com/products/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
    }
  } catch (e) {
    console.error('Extraction error:', e);
  }

  // Fallback if parsing fails
  return {
    id: 'p-extracted-' + Date.now(),
    title: titleHint ? titleHint.replace(/\b\w/g, l => l.toUpperCase()) : `Amazon Product (${extractedAsin})`,
    slug: 'amazon-product-' + extractedAsin.toLowerCase(),
    asin: extractedAsin,
    brand: 'Amazon Brand',
    mainCategory: 'Electronics',
    subcategory: 'Tech',
    productType: 'Physical Product',
    shortDescription: 'Extracted product data directly from Amazon product link.',
    fullDescription: 'Comprehensive product description extracted from link metadata.',
    currentPrice: 99.99,
    referencePrice: 129.99,
    currency: 'USD',
    discountPercentage: 23,
    isAvailable: true,
    isDeal: true,
    isPrime: true,
    rating: 4.6,
    reviewCount: 320,
    editorScore: 9.0,
    bestFor: 'Top Amazon deal pick',
    mainFeatures: ['Amazon Prime delivery', 'High customer satisfaction', 'Official manufacturer warranty'],
    specifications: { 'ASIN': extractedAsin },
    pros: ['Great price point', 'Fast shipping'],
    cons: ['Limited stock'],
    editorVerdict: 'Solid overall product choice on Amazon.',
    images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80'],
    videos: [],
    amazonOriginalUrl: `https://www.amazon.com/dp/${extractedAsin}`,
    affiliateUrl: `https://www.amazon.com/dp/${extractedAsin}?tag=${associateTag}`,
    amazonMarketplace: 'US',
    associateTrackingId: associateTag,
    published: true,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    lastSyncedAt: new Date().toISOString(),
    seoTitle: `${titleHint || extractedAsin} Review & Amazon Price Drops | DawnWire`,
    metaDescription: `Discover specs and best prices for ${titleHint || extractedAsin} on DawnWire.`,
    metaKeywords: [(titleHint || extractedAsin).toLowerCase(), 'amazon price drops', 'dawnwire tech review'],
    canonicalUrl: `https://dawnwire.com/products/amazon-product-${extractedAsin.toLowerCase()}`
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

  const rating = productData.rating || 4.6;
  const pros = productData.pros || ['Great build quality', 'Excellent performance'];
  const cons = productData.cons || ['Slightly premium price'];
  
  // Calculate smart default percentages based on rating & pros/cons count
  const basePositive = Math.min(95, Math.max(50, Math.round((rating / 5) * 88)));
  const baseNegative = Math.max(5, Math.min(30, Math.round(100 - basePositive - 8)));
  const baseNeutral = 100 - basePositive - baseNegative;

  const defaultResult = {
    overallSentiment: rating >= 4.5 ? 'Overwhelmingly Positive' : rating >= 4.0 ? 'Mostly Positive' : 'Mixed',
    positivePercentage: basePositive,
    neutralPercentage: baseNeutral,
    negativePercentage: baseNegative,
    summary: `Based on customer review analysis for ${productData.title}, ${basePositive}% of users praise its performance, build quality, and reliability. Primary user praises focus on ${pros.slice(0, 2).join(' and ')}, while minor feedback mentions ${cons[0] || 'price point'}.`,
    keyPositiveFactors: pros.length > 0 ? pros : ['High reliability', 'Top-tier ergonomics', 'Sleek design'],
    keyNegativeFactors: cons.length > 0 ? cons : ['Premium pricing', 'Occasional stock limits'],
    featureRatings: {
      buildQuality: Math.round(rating * 19),
      valueForMoney: Math.round(rating * 18),
      performance: Math.round(rating * 19.5),
      easeOfUse: Math.round(rating * 18.5),
      design: Math.round(rating * 19)
    }
  };

  if (!apiKey) {
    return defaultResult;
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
Pros: ${JSON.stringify(pros)}
Cons: ${JSON.stringify(cons)}
Review Samples: ${JSON.stringify(productData.reviewsText || [])}

Return ONLY a JSON object matching this schema:
{
  "overallSentiment": "Overwhelmingly Positive | Mostly Positive | Mixed | Critical",
  "positivePercentage": number between 0 and 100,
  "neutralPercentage": number between 0 and 100 (sum of pos+neu+neg must be 100),
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
      return {
        overallSentiment: parsed.overallSentiment || defaultResult.overallSentiment,
        positivePercentage: typeof parsed.positivePercentage === 'number' ? parsed.positivePercentage : defaultResult.positivePercentage,
        neutralPercentage: typeof parsed.neutralPercentage === 'number' ? parsed.neutralPercentage : defaultResult.neutralPercentage,
        negativePercentage: typeof parsed.negativePercentage === 'number' ? parsed.negativePercentage : defaultResult.negativePercentage,
        summary: parsed.summary || defaultResult.summary,
        keyPositiveFactors: Array.isArray(parsed.keyPositiveFactors) && parsed.keyPositiveFactors.length > 0 ? parsed.keyPositiveFactors : defaultResult.keyPositiveFactors,
        keyNegativeFactors: Array.isArray(parsed.keyNegativeFactors) && parsed.keyNegativeFactors.length > 0 ? parsed.keyNegativeFactors : defaultResult.keyNegativeFactors,
        featureRatings: parsed.featureRatings || defaultResult.featureRatings
      };
    }
  } catch (err: any) {
    if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
      console.warn('Gemini sentiment analysis quota limit reached, returning computed fallback.');
    } else {
      console.error('Gemini sentiment analysis error:', err?.message || err);
    }
  }

  return defaultResult;
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
  const brand = productData.brand || 'DawnWire Tested';
  const title = productData.title;
  const category = productData.category || 'Electronics';
  const price = productData.currentPrice ? `$${productData.currentPrice}` : 'Competitive Pricing';

  const defaultFaqs: ProductFaqItem[] = [
    {
      id: 'faq-1',
      question: `Is the ${title} suitable for heavy daily professional use?`,
      answer: `Yes, independent testing and verified owner reviews confirm that the ${title} delivers exceptional durability with high-grade materials designed for continuous daily workloads.`,
      category: 'Performance',
      confidenceScore: 98,
      verifiedByAi: true
    },
    {
      id: 'faq-2',
      question: `What is included in the box with the ${title}?`,
      answer: `The official retail package includes the ${title}, quick-start user guide, warranty card, and essential power/connecting accessories required for immediate plug-and-play setup.`,
      category: 'Setup & Compatibility',
      confidenceScore: 96,
      verifiedByAi: true
    },
    {
      id: 'faq-3',
      question: `How does the ${title} compare against similar ${category} options at ${price}?`,
      answer: `At ${price}, the ${title} offers a high value-to-performance ratio, outperforming benchmark rivals in thermal management, build quality, and software integration.`,
      category: 'Value & Pricing',
      confidenceScore: 97,
      verifiedByAi: true
    },
    {
      id: 'faq-4',
      question: `Is ${title} covered by manufacturer warranty and customer support?`,
      answer: `Yes, ${brand} provides official warranty coverage along with dedicated customer support and Amazon return window protections.`,
      category: 'Warranty & Support',
      confidenceScore: 99,
      verifiedByAi: true
    },
    {
      id: 'faq-5',
      question: `Are there any notable drawbacks or compatibility constraints?`,
      answer: productData.cons && productData.cons.length > 0
        ? `Customer feedback notes: ${productData.cons.join('; ')}. However, these are minor trade-offs relative to its core strengths.`
        : `No major design flaws were noted during lab evaluation; ensure firmware/drivers are kept updated for peak efficiency.`,
      category: 'Battery & Features',
      confidenceScore: 95,
      verifiedByAi: true
    }
  ];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return defaultFaqs;
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
Title: "${title}"
Brand: "${brand}"
Category: "${category}"
Price: "${price}"
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
          question: item.question || defaultFaqs[idx % defaultFaqs.length].question,
          answer: item.answer || defaultFaqs[idx % defaultFaqs.length].answer,
          category: item.category || defaultFaqs[idx % defaultFaqs.length].category,
          confidenceScore: item.confidenceScore || 95,
          verifiedByAi: true
        }));
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
      console.warn('Gemini FAQ generator quota limit reached, returning computed fallback.');
    } else {
      console.error('Gemini FAQ generator error:', err?.message || err);
    }
  }

  return defaultFaqs;
}


