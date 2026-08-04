import { GoogleGenAI } from '@google/genai';

const ENV_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';
const IMAGEN_MODEL = process.env.GEMINI_IMAGEN_MODEL || 'imagen-3.0-generate-002';
const GEMINI_IMAGE_MODEL_FALLBACKS = ['gemini-2.5-flash-image-preview', 'gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_IMAGE_API_KEY = process.env.CLOUDFLARE_IMAGE_API_KEY || '';
const CLOUDFLARE_IMAGE_MODEL = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';

export type ImageProvider = 'auto' | 'gemini' | 'cloudflare';

export function isImageGenConfigured(apiKey?: string): boolean {
  return (apiKey || ENV_API_KEY || CLOUDFLARE_IMAGE_API_KEY).length > 0;
}

function resolveApiKey(apiKey?: string): string {
  return (apiKey || ENV_API_KEY).trim();
}

export function isCloudflareConfigured(apiKey?: string, accountId?: string): boolean {
  return (apiKey || CLOUDFLARE_IMAGE_API_KEY).trim().length > 0 && (accountId || CLOUDFLARE_ACCOUNT_ID).trim().length > 0;
}

export interface DesignImageResult {
  url: string;
  generated: boolean;
  source: 'gemini-image' | 'imagen' | 'cloudflare' | 'product' | 'none';
  fallback: 'none' | 'product' | 'unavailable';
}

export interface DesignImageOpts {
  apiKey?: string;
  model?: string;
  provider?: ImageProvider;
  accountId?: string;
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

export function buildCloudflarePrompt(product: any): string {
  const name = product.product_name || product.name || product.title || 'this product';
  const brand = product.brand ? ` by ${product.brand}` : '';
  const category = product.best_for || product.category || '';
  const desc = product.review_summary
    ? `Product description: ${String(product.review_summary).replace(/<[^>]*>/g, '').substring(0, 400)}`
    : '';
  return [
    `Premium editorial hero banner image for an affiliate product-review blog post about: ${name}${brand}${category ? ` (category: ${category})` : ''}.`,
    'Showcase THE EXACT product as the single hero subject, centered and prominent. Realistic studio product photography.',
    'Style: professional studio product photography, clean deep navy-blue background (#0A1F44) with soft amber/gold accent lighting, gentle reflections, subtle depth of field, ultra high detail, 16:9 widescreen composition.',
    'NO text, NO words, NO logos, NO watermarks, NO other products, NO people, NO hands, NO labels.',
    'Keep it realistic and sharp.',
    desc,
  ].filter(Boolean).join('\n');
}

function stripDataUriPrefix(base64: string): string {
  return base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

async function generateWithCloudflare(
  product: any,
  opts?: DesignImageOpts,
): Promise<DesignImageResult | null> {
  const apiKey = (opts?.apiKey || CLOUDFLARE_IMAGE_API_KEY).trim();
  const accountId = (opts?.accountId || CLOUDFLARE_ACCOUNT_ID).trim();
  if (!apiKey || !accountId) return null;

  const model = opts?.model || CLOUDFLARE_IMAGE_MODEL;
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 35000);
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: buildCloudflarePrompt(product), steps: 4 }),
      signal: controller.signal,
    });
    clearTimeout(t);

    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      const err = data?.errors?.[0]?.message || `HTTP ${resp.status}`;
      console.warn('[image-gen] Cloudflare image gen failed:', err);
      return null;
    }

    let base64 = data?.result?.image || '';
    if (!base64) {
      console.warn('[image-gen] Cloudflare returned no image payload.');
      return null;
    }
    base64 = stripDataUriPrefix(String(base64));
    const url2 = await uploadBase64ToImgBB(base64);
    if (url2) return { url: url2, generated: true, source: 'cloudflare', fallback: 'none' };
  } catch (e: any) {
    console.warn('[image-gen] Cloudflare image gen error:', e?.message || e);
  }
  return null;
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
 * used as a REFERENCE ONLY (Gemini) so the AI faithfully depicts the actual product.
 * Provider chain:
 *   cloudflare -> Cloudflare Workers AI only (falls back to product photo)
 *   gemini    -> Gemini image model -> Imagen -> product photo
 *   auto      -> Cloudflare (if configured) -> Gemini -> Imagen -> product photo
 */
export async function generateDesignImage(
  product: any,
  opts?: DesignImageOpts,
): Promise<DesignImageResult> {
  const productImage = product.product_image || product.image || '';
  const provider = opts?.provider || 'auto';
  const productFallback = (): DesignImageResult =>
    productImage
      ? { url: productImage, generated: false, source: 'product', fallback: 'product' }
      : { url: '', generated: false, source: 'none', fallback: 'unavailable' };

  // Cloudflare path
  if (provider === 'cloudflare' || (provider === 'auto' && isCloudflareConfigured(opts?.apiKey, opts?.accountId))) {
    const cf = await generateWithCloudflare(product, opts);
    if (cf) return cf;
    if (provider === 'cloudflare') return productFallback();
  }

  // Gemini path
  if (provider === 'gemini' || provider === 'auto') {
    const apiKey = resolveApiKey(provider === 'gemini' ? opts?.apiKey : ENV_API_KEY);
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
        // Try the configured model first, then current fallbacks in case a
        // stale/deprecated model name is stored in the config.
        const modelCandidates = [imageModel, ...GEMINI_IMAGE_MODEL_FALLBACKS].filter((m, i, a) => m && a.indexOf(m) === i);
        let image: { mimeType: string; base64: string } | null = null;
        for (const candidate of modelCandidates) {
          if (controller.signal.aborted) break;
          try {
            const resp = await ai.models.generateContent({
              model: candidate,
              contents: [{ role: 'user', parts }],
              config: { responseModalities: ['IMAGE'] },
            });
            const img = extractImagePart(resp);
            if (img?.base64 && !img.base64.startsWith('http')) { image = img; break; }
          } catch (e: any) {
            console.warn(`[image-gen] Gemini image model ${candidate} failed:`, e?.message);
          }
        }
        clearTimeout(t);
        if (image?.base64) {
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
  }

  return productFallback();
}

export async function testCloudflareImageKey(apiKey?: string, accountId?: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const key = (apiKey || CLOUDFLARE_IMAGE_API_KEY).trim();
  const acct = (accountId || CLOUDFLARE_ACCOUNT_ID).trim();
  if (!key) return { ok: false, error: 'No Cloudflare API key provided. Paste your key or set CLOUDFLARE_IMAGE_API_KEY.' };
  if (!acct) return { ok: false, error: 'No Cloudflare Account ID provided. Paste your Account ID or set CLOUDFLARE_ACCOUNT_ID.' };
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(acct)}/ai/run/${CLOUDFLARE_IMAGE_MODEL}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30000);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'a tiny red circle on a white background', steps: 1 }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      const msg = data?.errors?.[0]?.message || `HTTP ${resp.status}`;
      return { ok: false, error: `Key rejected: ${msg}` };
    }
    if (!data?.result?.image) return { ok: false, error: 'Key accepted but no image returned. Check token permissions (Workers AI: Run).' };
    return { ok: true, message: 'Cloudflare image key is valid. (Workers AI image generation works.)' };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).substring(0, 300) };
  }
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

