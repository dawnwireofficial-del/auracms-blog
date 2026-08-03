import { GoogleGenAI } from '@google/genai';

const ENV_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
const IMAGEN_MODEL = process.env.GEMINI_IMAGEN_MODEL || 'imagen-3.0-generate-002';

export function isImageGenConfigured(apiKey?: string): boolean {
  return (apiKey || ENV_API_KEY).length > 0;
}

function resolveApiKey(apiKey?: string): string {
  return (apiKey || ENV_API_KEY).trim();
}

export interface DesignImageResult {
  url: string;
  generated: boolean;
  source: 'gemini-image' | 'imagen' | 'product' | 'none';
  fallback: 'none' | 'product' | 'unavailable';
}

async function downloadAsBase64(imageUrl: string, timeoutMs = 12000): Promise<{ mimeType: string; base64: string } | null> {
  try {
    const resp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)',
        'Referer': 'https://www.amazon.com/',
      },
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    const mimeType = (resp.headers.get('content-type') || '').split(';')[0] || 'image/jpeg';
    return { mimeType, base64: buf.toString('base64') };
  } catch {
    return null;
  }
}

async function uploadBase64ToImgBB(base64: string): Promise<string | null> {
  try {
    const key = process.env.IMGBB_API_KEY;
    if (!key) return null;
    const body = new URLSearchParams({ image: base64 });
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await imgbb.json();
    if (!data?.success) return null;
    return data.data.url;
  } catch {
    return null;
  }
}

export function buildDesignPrompt(product: any): string {
  const name = product.product_name || product.name || product.title || 'this product';
  const brand = product.brand ? ` by ${product.brand}` : '';
  const category = product.best_for || product.category || '';
  const desc = product.review_summary
    ? `Product description: ${String(product.review_summary).replace(/<[^>]*>/g, '').substring(0, 400)}`
    : '';
  return [
    `Create a premium editorial hero banner image for an affiliate product-review blog post about: ${name}${brand}${category ? ` (category: ${category})` : ''}.`,
    `Showcase THE EXACT product from the reference image — same design, color, materials and shape — as the single hero subject, centered and prominent.`,
    'Style: professional studio product photography, clean deep navy-blue background (#0A1F44) with soft amber/gold accent lighting, gentle reflections, subtle depth of field, ultra high detail, 16:9 widescreen composition.',
    'NO text, NO words, NO logos, NO watermarks, NO other products, NO people, NO hands, NO labels.',
    'The product must look identical to the reference photo. Keep it realistic and sharp.',
    desc,
  ].filter(Boolean).join('\n');
}

function extractImagePart(response: any): { mimeType: string; base64: string } | null {
  const candidates = response?.candidates;
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const inline = part?.inlineData;
      if (inline && typeof inline.data === 'string' && String(inline.mimeType || '').startsWith('image/')) {
        return { mimeType: inline.mimeType, base64: inline.data };
      }
    }
  }
  return null;
}

/**
 * Generates an editorial hero image for an article. The product's real photo is
 * used as a REFERENCE ONLY so the AI faithfully depicts the actual product.
 * Falls back: Gemini image model -> Imagen -> the product's own photo.
 */
export async function generateDesignImage(
  product: any,
  opts?: { apiKey?: string; model?: string },
): Promise<DesignImageResult> {
  const productImage = product.product_image || product.image || '';
  const apiKey = resolveApiKey(opts?.apiKey);
  const imageModel = opts?.model || GEMINI_IMAGE_MODEL;

  if (apiKey) {
    let ref: { mimeType: string; base64: string } | null = null;
    if (productImage) {
      ref = await downloadAsBase64(productImage);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 35000);
      const parts: any[] = [{ text: buildDesignPrompt(product) }];
      if (ref) {
        parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } });
      }
      const resp = await ai.models.generateContent({
        model: imageModel,
        contents: [{ role: 'user', parts }],
        config: { responseModalities: ['IMAGE'] },
      });
      clearTimeout(t);
      const image = extractImagePart(resp);
      if (image?.base64 && !image.base64.startsWith('http')) {
        const url = await uploadBase64ToImgBB(image.base64);
        if (url) return { url, generated: true, source: 'gemini-image', fallback: 'none' };
      }
    } catch (e: any) {
      console.warn('[image-gen] Gemini image model failed:', e.message);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 35000);
      const resp = await ai.models.generateImages({
        model: IMAGEN_MODEL,
        prompt: buildDesignPrompt(product),
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });
      clearTimeout(t);
      const bytes = resp?.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) {
        const url = await uploadBase64ToImgBB(bytes);
        if (url) return { url, generated: true, source: 'imagen', fallback: 'none' };
      }
    } catch (e: any) {
      console.warn('[image-gen] Imagen failed:', e.message);
    }
  }

  if (productImage) {
    return { url: productImage, generated: false, source: 'product', fallback: 'product' };
  }
  return { url: '', generated: false, source: 'none', fallback: 'unavailable' };
}

export async function testImageApiKey(apiKey?: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const key = resolveApiKey(apiKey);
  if (!key) return { ok: false, error: 'No API key provided. Paste your key or set GEMINI_API_KEY.' };
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    const resp = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }],
      config: { maxOutputTokens: 5 },
    });
    clearTimeout(t);
    if (!resp?.text) {
      return { ok: false, error: 'Key accepted but no text returned. It may not have image-generation access.' };
    }
    return { ok: true, message: 'API key is valid.' };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/apiKey|API key|apikey|INVALID_ARGUMENT|PERMISSION_DENIED|UNAUTHENTICATED|403/.test(msg)) {
      return { ok: false, error: `Key rejected: ${msg.substring(0, 300)}` };
    }
    return { ok: false, error: msg.substring(0, 300) };
  }
}

