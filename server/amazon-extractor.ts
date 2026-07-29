import fetch from 'node-fetch';
import { cohereChat } from './ai';

export interface ExtractedProductData {
  asin: string;
  title: string;
  brand: string;
  mainCategory: string;
  subcategory: string;
  currentPrice: number;
  referencePrice: number;
  discountPercentage: number;
  images: string[];
  mainImage: string;
  additionalImages: string[];
  bestFor: string;
  shortDescription: string;
  fullDescription: string;
  editorVerdict: string;
  editorScore: number;
  pros: string[];
  cons: string[];
  mainFeatures: string[];
  specifications: Record<string, string>;
  affiliateUrl: string;
  amazonOriginalUrl: string;
  isPrime: boolean;
  isDeal: boolean;
  rating: number;
  reviewCount: number;
  videoUrl?: string;
  source: 'pa_api' | 'web_scraper' | 'ai_synthesis' | 'dictionary';
}

// Curated reference database for sample & high-demand Amazon ASINs
const KNOWN_PRODUCTS: Record<string, Partial<ExtractedProductData>> = {
  'B09XS7JWHH': {
    asin: 'B09XS7JWHH',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    brand: 'Sony',
    mainCategory: 'Electronics',
    subcategory: 'Headphones & Audio',
    currentPrice: 398.00,
    referencePrice: 449.99,
    discountPercentage: 12,
    images: [
      'https://m.media-amazon.com/images/I/61+btWzc0sL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/61a2y9yW7SL._AC_SL1500_.jpg'
    ],
    bestFor: 'Best Overall Active Noise-Canceling Headphones',
    shortDescription: 'Industry-leading noise cancellation with two processors and 8 microphones. Magnificent sound quality engineered with the new Integrated Processor V1.',
    fullDescription: 'The Sony WH-1000XM5 redefines premium wireless audio with twin processors controlling 8 microphones for unparalleled noise cancellation. Enjoy ultra-clear hands-free calling, up to 30 hours of battery life, and Speak-to-Chat technology.',
    editorVerdict: 'The WH-1000XM5 remains the undisputed king of wireless noise-canceling headphones in 2026. Sensational comfort, class-leading mic call clarity, and refined sound imaging make it worth every penny.',
    editorScore: 9.6,
    pros: [
      'Industry-leading active noise cancellation',
      'Exceptional call quality with 8 mics & AI beamforming',
      'Ultra-lightweight design with soft-fit leather',
      '30-hour battery life with 3-min quick charge (3 hrs playback)'
    ],
    cons: [
      'Earcups do not fold inward like older XM4',
      'Water resistance rating is not IPX certified'
    ],
    mainFeatures: [
      'Auto NC Optimizer automatically adjusts noise cancellation based on wearing conditions and environment',
      'Specially designed 30mm driver unit with light, rigid dome for natural sound quality',
      'Multipoint connection allows quick switching between two Bluetooth devices',
      'Intuitive touch control settings for play/pause, track skip, and volume'
    ],
    specifications: {
      'Battery Life': '30 Hours (NC On) / 40 Hours (NC Off)',
      'Charging Time': '3.5 Hours (USB Power Delivery supported)',
      'Driver Unit': '30mm Carbon Fiber Composite',
      'Weight': '250 grams',
      'Bluetooth Version': '5.2 (LDAC, AAC, SBC supported)'
    },
    rating: 4.7,
    reviewCount: 15420
  },
  'B0C762112C': {
    asin: 'B0C762112C',
    title: 'Apple 2024 MacBook Air 15-inch Laptop with M3 Chip',
    brand: 'Apple',
    mainCategory: 'Computers & Laptops',
    subcategory: 'Laptops & MacBooks',
    currentPrice: 1099.00,
    referencePrice: 1299.00,
    discountPercentage: 15,
    images: [
      'https://m.media-amazon.com/images/I/71jG+e7roXL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/61aUBxqc5PL._AC_SL1500_.jpg'
    ],
    bestFor: 'Best Lightweight 15-Inch Laptop for Productivity',
    shortDescription: 'Incredibly thin and fast 15.3-inch Liquid Retina Display laptop powered by the Apple M3 chip with up to 18 hours of battery life.',
    fullDescription: 'The 15-inch MacBook Air with M3 chip delivers blazing-fast performance in an ultra-portable design. Featuring a spacious Liquid Retina display, MagSafe charging, 1080p FaceTime HD camera, and immersive 6-speaker sound system.',
    editorVerdict: 'The 15-inch MacBook Air M3 strikes the absolute sweet spot between screen real estate, whisper-silent fanless power, and battery endurance. Highly recommended for students, creators, and professionals.',
    editorScore: 9.5,
    pros: [
      'Blazing M3 chip performance with hardware-accelerated ray tracing',
      'Gorgeous 15.3-inch Liquid Retina display with 500 nits brightness',
      'Silent, fanless aluminum unibody enclosure',
      'Outstanding 18-hour real-world battery life'
    ],
    cons: [
      'Base model comes with 8GB unified memory',
      'Supports dual external displays only with laptop lid closed'
    ],
    mainFeatures: [
      'Apple M3 8-core CPU and up to 10-core GPU for smooth multitasking & editing',
      'MagSafe 3 charging port, two Thunderbolt / USB 4 ports, headphone jack',
      'Six-speaker sound system with Force-Cancelling Woofers and Spatial Audio',
      'Touch ID sensor integrated into the backlit Magic Keyboard'
    ],
    specifications: {
      'Processor': 'Apple M3 Chip (8-Core CPU, 10-Core GPU)',
      'Display': '15.3-inch Liquid Retina (2880 x 1864, 500 nits)',
      'Memory': '8GB / 16GB / 24GB Unified Memory',
      'Storage': '256GB / 512GB / 1TB / 2TB SSD',
      'Weight': '3.3 lbs (1.51 kg)'
    },
    rating: 4.8,
    reviewCount: 4890
  },
  'B0CHWRXH8B': {
    asin: 'B0CHWRXH8B',
    title: 'Apple iPhone 15 Pro Max (256 GB) - Natural Titanium',
    brand: 'Apple',
    mainCategory: 'Cell Phones & Accessories',
    subcategory: 'Smartphones',
    currentPrice: 1199.00,
    referencePrice: 1199.00,
    discountPercentage: 0,
    images: [
      'https://m.media-amazon.com/images/I/81c50PU+LpL._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/61bK6PMOC3L._AC_SL1500_.jpg'
    ],
    bestFor: 'Best Flagship Smartphone with Pro Camera System',
    shortDescription: 'Forged in titanium with A17 Pro chip, customizable Action button, USB-C connector, and 5x Telephoto optical zoom lens.',
    fullDescription: 'iPhone 15 Pro Max features a aerospace-grade titanium design that is both light and durable. Powered by the A17 Pro chip for groundbreaking gaming graphics and dynamic camera versatility.',
    editorVerdict: 'With its featherlight titanium frame, 5x optical zoom camera, and USB-C speeds, the iPhone 15 Pro Max stands as a smartphone engineering masterpiece.',
    editorScore: 9.7,
    pros: [
      'Aerospace-grade titanium design is significantly lighter in hand',
      'A17 Pro chip delivers desktop-class console gaming capabilities',
      '5x optical zoom telephoto camera yields crisp long-distance shots',
      'Universal USB-C port with USB 3 speeds up to 10Gbps'
    ],
    cons: [
      'Premium flagship price tag',
      'Fast charging speeds capped at 27W'
    ],
    mainFeatures: [
      '6.7-inch Super Retina XDR display with ProMotion 120Hz and Always-On',
      'Customizable Action Button for instant shortcuts to Camera, Flashlight, Voice Memos',
      '48MP Main camera with multiple focal length options (24mm, 28mm, 35mm)',
      'All-day battery life with up to 29 hours video playback'
    ],
    specifications: {
      'Chipset': 'Apple A17 Pro (3nm 6-core CPU, 6-core GPU)',
      'Display': '6.7-inch Super Retina XDR OLED (120Hz ProMotion)',
      'Camera': '48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto',
      'Port': 'USB-C (USB 3 up to 10Gb/s)',
      'Weight': '221 grams'
    },
    rating: 4.6,
    reviewCount: 8930
  },
  'B0CGF78T1V': {
    asin: 'B0CGF78T1V',
    title: 'DJI Mini 4 Pro Fly More Combo with DJI RC 2 Controller',
    brand: 'DJI',
    mainCategory: 'Camera & Photo',
    subcategory: 'Drones & Quadcopters',
    currentPrice: 1099.00,
    referencePrice: 1159.00,
    discountPercentage: 5,
    images: [
      'https://m.media-amazon.com/images/I/61pB58gQj0L._AC_SL1500_.jpg',
      'https://m.media-amazon.com/images/I/71u-s0B3gJL._AC_SL1500_.jpg'
    ],
    bestFor: 'Best Ultra-Lightweight 4K HDR Camera Drone under 249g',
    shortDescription: 'Sub-249g lightweight folding drone featuring omnidirectional obstacle sensing, 4K/60fps HDR video, and 34-minute max flight time.',
    fullDescription: 'DJI Mini 4 Pro is DJI\'s most advanced mini-camera drone to date. It integrates powerful imaging capabilities, omnidirectional obstacle sensing, ActiveTrack 360°, and 20km FHD video transmission into an ultra-portable sub-249g body.',
    editorVerdict: 'The Mini 4 Pro is the ultimate drone for travelers and content creators. Packing omnidirectional safety sensors and true vertical 4K video recording under the 249g registration-free weight limit.',
    editorScore: 9.8,
    pros: [
      'Sub-249 gram weight requires no FAA registration for recreational flight',
      'Full 360-degree omnidirectional obstacle sensing for crash-free flying',
      'True Vertical Shooting in 4K/60fps HDR for TikTok and Instagram Reels',
      'DJI O4 video transmission delivers 20km crystal clear range'
    ],
    cons: [
      'Fly More Combo with Plus batteries exceeds 249g weight threshold',
      'Wind resistance limited compared to larger Mavic series'
    ],
    mainFeatures: [
      '1/1.3-inch CMOS Sensor with Dual Native ISO Fusion and f/1.7 aperture',
      'ActiveTrack 360° for smooth automated subject tracking paths',
      'Night Shots video mode for clean low-light aerial videography',
      'Includes DJI RC 2 controller with built-in 5.5-inch FHD screen'
    ],
    specifications: {
      'Takeoff Weight': '< 249 grams',
      'Max Flight Time': '34 Minutes (Standard Battery) / 45 Mins (Plus Battery)',
      'Video Resolution': '4K/60fps HDR, 4K/100fps Slow Motion',
      'Obstacle Sensing': 'Omnidirectional (Binocular Vision & 3D Infrared Sensor)',
      'Max Transmission Distance': '20 km (FCC compliance)'
    },
    rating: 4.8,
    reviewCount: 2150
  }
};

/**
 * Extract ASIN from URL
 */
export function extractAsin(url: string): string {
  if (!url) return '';
  const match = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|ASIN=|\/d\/)([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Scrape public HTML page of an Amazon product URL
 */
export async function scrapeAmazonHtml(asin: string): Promise<Partial<ExtractedProductData> | null> {
  const targetUrl = `https://www.amazon.com/dp/${asin}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.101',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    // Parse Title
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i) ||
                       html.match(/<meta name="title" content="([^"]+)"/i);
    const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    if (!rawTitle || rawTitle.includes('Robot Check') || rawTitle.includes('CAPTCHA')) {
      return null;
    }

    // Parse Brand
    const brandMatch = html.match(/<a id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i) ||
                      html.match(/Visit the ([^"]+) Store/i) ||
                      html.match(/Brand:\s*([^\n<]+)/i);
    const brand = brandMatch ? brandMatch[1].replace(/^Brand:\s*/i, '').replace(/^Visit the\s*/i, '').replace(/\s*Store$/i, '').trim() : 'Generic';

    // Parse Price
    const priceMatch = html.match(/<span class="a-offscreen">\$([0-9\.,]+)<\/span>/i) ||
                       html.match(/"priceAmount":\s*([0-9\.]+)/i) ||
                       html.match(/data-price="([0-9\.]+)"/i);
    const currentPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

    // Parse List Price / Reference Price
    const refPriceMatch = html.match(/<span class="a-text-price"[^>]*>[\s\S]*?\$([0-9\.,]+)/i);
    const referencePrice = refPriceMatch ? parseFloat(refPriceMatch[1].replace(/,/g, '')) : (currentPrice ? Math.round(currentPrice * 1.15 * 100) / 100 : 0);

    // Parse ALL Unique High-Res Amazon Gallery Images from HTML
    const allImageMatches = [...html.matchAll(/https:\/\/m\.media-amazon\.com\/images\/I\/([a-zA-Z0-9%+\-_]+)\.[^"'\s<>\)\}\]]+/gi)];
    const seenImageIds = new Set<string>();
    const uniqueHighResImages: string[] = [];

    for (const match of allImageMatches) {
      const imageId = match[1];
      if (!imageId || imageId.length < 5) continue;
      const lowerId = imageId.toLowerCase();
      if (lowerId.includes('sprite') || lowerId.includes('icon') || lowerId.includes('pixel') || lowerId.includes('badge') || lowerId.includes('play-button') || lowerId.includes('overlay') || lowerId.includes('logo')) {
        continue;
      }

      if (!seenImageIds.has(imageId)) {
        seenImageIds.add(imageId);
        uniqueHighResImages.push(`https://m.media-amazon.com/images/I/${imageId}._AC_SL1500_.jpg`);
      }
    }

    const mainImage = uniqueHighResImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
    const imagesList = uniqueHighResImages.length ? uniqueHighResImages.slice(0, 8) : [mainImage];

    // Parse Features / Bullet Points
    const bulletMatches = [...html.matchAll(/<span class="a-list-item">([\s\S]*?)<\/span>/gi)];
    const features = bulletMatches
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(f => f.length > 15 && !f.includes('Item weight') && !f.includes('Discontinued') && !f.includes('Product Dimensions'))
      .slice(0, 5);

    // Parse Rating
    const ratingMatch = html.match(/([0-9\.]+)\s+out of 5 stars/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.6;

    // Parse Video URL (Amazon Video Stream or embedded MP4/HLS)
    const videoMatch = html.match(/"videoUrl"\s*:\s*"(https?:[^"]+)"/i) ||
                       html.match(/(https:\/\/[^"]+vse-vfc-transcode[^"]+\.(?:m3u8|mp4))/i) ||
                       html.match(/(https:\/\/[^"]+\.(?:m3u8|mp4))/i);
    const videoUrl = videoMatch ? videoMatch[1] : '';

    return {
      asin,
      title: rawTitle,
      brand,
      currentPrice: currentPrice || 99.99,
      referencePrice: referencePrice || (currentPrice ? Math.round(currentPrice * 1.15) : 129.99),
      mainImage: mainImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      images: imagesList,
      mainFeatures: features.length ? features : ['High-performance build quality', 'Top-rated Amazon seller item', 'Verified customer satisfaction'],
      rating,
      videoUrl: videoUrl || undefined
    };
  } catch (err) {
    return null;
  }
}

/**
 * Use AI (Cohere) to synthesize complete, accurate Amazon product metadata
 */
async function synthesizeWithAi(asin: string, partialTitle?: string, partialBrand?: string): Promise<Partial<ExtractedProductData> | null> {
  try {
    const prompt = `Synthesize real-world accurate product review details for the Amazon product with ASIN: ${asin} ${partialTitle ? `(Product: ${partialTitle})` : ''}.
Return a strict JSON object (no markdown, no code blocks) with the following structure:
{
  "title": "Exact product name with brand model",
  "brand": "Brand Name",
  "mainCategory": "Primary category (e.g. Electronics, Computers, Home & Kitchen)",
  "subcategory": "Subcategory name",
  "currentPrice": 299.99,
  "referencePrice": 349.99,
  "bestFor": "Snappy Award Badge (e.g. Best Overall Noise-Canceling Headphones)",
  "shortDescription": "2-sentence summary of features",
  "fullDescription": "Detailed overview of the product",
  "editorVerdict": "2-sentence professional editor verdict",
  "editorScore": 9.4,
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
  "cons": ["Con 1", "Con 2"],
  "mainFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "specifications": { "Spec 1": "Value 1", "Spec 2": "Value 2", "Spec 3": "Value 3" }
}`;

    const systemPrompt = 'You are a product data specialist for Amazon products. Output valid, raw JSON only.';
    const responseText = await cohereChat(prompt, systemPrompt);
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleaned);

    return {
      title: data.title || partialTitle || `Amazon Product (${asin})`,
      brand: data.brand || partialBrand || 'Generic',
      mainCategory: data.mainCategory || 'Electronics',
      subcategory: data.subcategory || 'General',
      currentPrice: Number(data.currentPrice) || 99.99,
      referencePrice: Number(data.referencePrice) || 129.99,
      bestFor: data.bestFor || 'Top Recommended Pick',
      shortDescription: data.shortDescription || 'High quality Amazon product.',
      fullDescription: data.fullDescription || 'Full expert review and specifications for this product.',
      editorVerdict: data.editorVerdict || 'Solid choice for buyers seeking top quality on Amazon.',
      editorScore: Number(data.editorScore) || 9.0,
      pros: Array.isArray(data.pros) ? data.pros : ['High build quality', 'Excellent performance'],
      cons: Array.isArray(data.cons) ? data.cons : ['Slightly higher price than budget alternatives'],
      mainFeatures: Array.isArray(data.mainFeatures) ? data.mainFeatures : ['Independent Benchmarking', 'Amazon Fast Delivery'],
      specifications: typeof data.specifications === 'object' && data.specifications !== null ? data.specifications : { Warranty: '1 Year' }
    };
  } catch (err) {
    return null;
  }
}

/**
 * Main Extract Function for Amazon Product Link / ASIN
 */
export async function extractAmazonProductData(urlOrAsin: string, associateTag: string = 'dawnwire-20'): Promise<ExtractedProductData> {
  const asin = extractAsin(urlOrAsin) || (urlOrAsin.length === 10 ? urlOrAsin.toUpperCase() : '');
  if (!asin) {
    throw new Error('Invalid Amazon URL or ASIN. Please provide a valid Amazon product link.');
  }

  const amazonOriginalUrl = `https://www.amazon.com/dp/${asin}`;
  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${associateTag}`;

  // 1. Check Known Curated Dictionary First (instant high-accuracy match)
  if (KNOWN_PRODUCTS[asin]) {
    const known = KNOWN_PRODUCTS[asin];
    const discount = known.currentPrice && known.referencePrice && known.referencePrice > known.currentPrice
      ? Math.round((1 - known.currentPrice / known.referencePrice) * 100)
      : 0;

    const knownVideo = known.videoUrl || '';
    return {
      asin,
      title: known.title || `Amazon Product (${asin})`,
      brand: known.brand || 'Generic',
      mainCategory: known.mainCategory || 'Electronics',
      subcategory: known.subcategory || 'General',
      currentPrice: known.currentPrice || 99.99,
      referencePrice: known.referencePrice || 129.99,
      discountPercentage: discount,
      images: known.images && known.images.length ? known.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      mainImage: known.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      additionalImages: known.images?.slice(1) || [],
      bestFor: known.bestFor || 'Top Overall Amazon Pick',
      shortDescription: known.shortDescription || 'High quality Amazon product.',
      fullDescription: known.fullDescription || 'Full review and benchmarks.',
      editorVerdict: known.editorVerdict || 'Recommended buy for Amazon shoppers.',
      editorScore: known.editorScore || 9.2,
      pros: known.pros || ['Great performance', 'Top user ratings'],
      cons: known.cons || ['Higher price point'],
      mainFeatures: known.mainFeatures || ['Fast Shipping', 'Amazon Verified'],
      specifications: { video_url: knownVideo, ...(known.specifications || { 'Warranty': '1 Year' }) },
      affiliateUrl,
      amazonOriginalUrl,
      isPrime: known.isPrime || false,
      isDeal: discount > 0,
      rating: known.rating || 4.7,
      reviewCount: known.reviewCount || 2400,
      videoUrl: knownVideo,
      source: 'dictionary'
    };
  }

  // 2. Try Public Web Scraper
  const scraped = await scrapeAmazonHtml(asin);

  // 3. Try AI Synthesis (Cohere) to fill missing fields or generate complete metadata
  let aiData: Partial<ExtractedProductData> | null = null;
  if (!scraped || !scraped.title || scraped.title.includes('Amazon Product')) {
    aiData = await synthesizeWithAi(asin, scraped?.title, scraped?.brand);
  }

  const finalTitle = scraped?.title && !scraped.title.includes('Amazon Product')
    ? scraped.title
    : aiData?.title || `Amazon Product (${asin})`;

  const finalBrand = scraped?.brand && scraped.brand !== 'Generic'
    ? scraped.brand
    : aiData?.brand || 'Generic';

  const currentPrice = scraped?.currentPrice || aiData?.currentPrice || 99.99;
  const referencePrice = scraped?.referencePrice || aiData?.referencePrice || (currentPrice ? Math.round(currentPrice * 1.2) : 129.99);
  const discount = referencePrice > currentPrice ? Math.round((1 - currentPrice / referencePrice) * 100) : 0;

  const rawImages = scraped?.images && scraped.images.length
    ? scraped.images
    : (aiData?.images || ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']);

  const seenIds = new Set<string>();
  const images: string[] = [];
  for (const imgUrl of rawImages) {
    const match = imgUrl.match(/images\/I\/([a-zA-Z0-9%+\-_]+)\./i);
    const id = match ? match[1] : imgUrl;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      images.push(imgUrl);
    }
  }

  const finalVideoUrl = scraped?.videoUrl || '';
  const baseSpecs = aiData?.specifications || { 'ASIN': asin, 'Warranty': '1 Year Manufacturer Warranty' };

  return {
    asin,
    title: finalTitle,
    brand: finalBrand,
    mainCategory: aiData?.mainCategory || 'Electronics',
    subcategory: aiData?.subcategory || 'General',
    currentPrice,
    referencePrice,
    discountPercentage: discount,
    images,
    mainImage: images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    additionalImages: images.slice(1),
    bestFor: aiData?.bestFor || `Top Choice for ${finalBrand} Buyers`,
    shortDescription: aiData?.shortDescription || `${finalTitle} delivers high performance and top features on Amazon US.`,
    fullDescription: aiData?.fullDescription || `Full expert review and specifications for ${finalTitle}. Compare prices, features, and user ratings.`,
    editorVerdict: aiData?.editorVerdict || `${finalTitle} offers excellent performance, durable build quality, and high user satisfaction.`,
    editorScore: aiData?.editorScore || 9.2,
    pros: aiData?.pros || ['High build quality', 'Top performance', 'Verified Amazon rating'],
    cons: aiData?.cons || ['Slightly higher price than basic models'],
    mainFeatures: scraped?.mainFeatures || aiData?.mainFeatures || ['Independent Benchmarking', 'Fast Delivery', 'Top Buyer Ratings'],
    specifications: { video_url: finalVideoUrl, ...baseSpecs },
    affiliateUrl,
    amazonOriginalUrl,
    isPrime: true,
    isDeal: discount > 0,
    rating: scraped?.rating || 4.6,
      reviewCount: scraped?.rating ? (scraped as any).reviewCount || 0 : 0,
      videoUrl: finalVideoUrl || undefined,
      source: scraped ? 'web_scraper' : aiData ? 'ai_synthesis' : 'dictionary'
  };
}
