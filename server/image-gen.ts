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

// ===== Cloudflare R2 upload (article hero images only, ~50MB total) =====
// Uses S3-compatible API. Only stores generated article images, NOT product
// images (those stay on Amazon CDN via proxy). Free tier: 10GB + 10M ops.
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT || '';
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET || 'dawnwire-images';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''; // optional custom domain

function isR2Configured(): boolean {
  return !!(R2_ACCESS_KEY && R2_SECRET_KEY && R2_ENDPOINT);
}

// AWS SigV4 signing for R2 (S3-compatible)
async function signR2Request(method: string, path: string, body: ArrayBuffer, contentType: string): Promise<Record<string, string>> {
  const crypto = await import('crypto');
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const host = new URL(R2_ENDPOINT).host;

  const payloadHash = crypto.createHash('sha256').update(Buffer.from(body)).digest('hex');

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

  function hmac(key: string | Buffer, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }
  const kDate = hmac(`AWS4${R2_SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return {
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function uploadToR2(base64: string, key: string): Promise<string | null> {
  if (!isR2Configured()) return null;
  try {
    const body = Buffer.from(base64, 'base64');
    const contentType = base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    const path = `/${R2_BUCKET}/${key}`;
    const headers = await signR2Request('PUT', path, body.buffer as ArrayBuffer, contentType);
    headers['Content-Type'] = contentType;

    const resp = await fetch(`${R2_ENDPOINT}${path}`, {
      method: 'PUT',
      headers,
      body,
      signal: AbortSignal.timeout(20000),
    });

    if (!resp.ok) {
      console.warn('[image-gen] R2 upload failed:', resp.status, await resp.text().catch(() => ''));
      return null;
    }

    // Return public URL — either custom domain or R2.dev subdomain
    if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL}/${key}`;
    return `${R2_ENDPOINT.replace('https://', `https://${R2_BUCKET}.`)}\/${key}`;
  } catch (e: any) {
    console.warn('[image-gen] R2 upload error:', e?.message);
    return null;
  }
}

// Unified upload: tries R2 first (article images), then imgbb (banners), then data URI
async function uploadGeneratedImage(base64: string, purpose: 'article' | 'banner' = 'article'): Promise<string> {
  const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

  // R2 for article hero images (small volume, ~50MB total)
  if (purpose === 'article' && isR2Configured()) {
    const key = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const url = await uploadToR2(cleanBase64, key);
    if (url) return url;
  }

  // imgbb for banners and general uploads
  const imgbbUrl = await uploadBase64ToImgBB(cleanBase64);
  if (imgbbUrl) return imgbbUrl;

  // Data URI fallback (works in browsers, no external dependency)
  const mime = cleanBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${cleanBase64}`;
}

export function buildDesignPrompt(product: any): string {
  const name = product.product_name || product.name || product.title || 'this product';
  const brand = product.brand ? ` by ${product.brand}` : '';
  const category = product.best_for || product.category || '';
  const visual = buildProductVisualDetails(product);
  const desc = product.review_summary
    ? `Product description: ${String(product.review_summary).replace(/<[^>]*>/g, '').substring(0, 400)}`
    : '';
  return [
    `Create a premium editorial hero banner image for an affiliate product-review blog post about: ${name}${brand}${category ? ` (category: ${category})` : ''}.`,
    `Showcase THE EXACT product from the reference image — same design, color, materials and shape — as the single hero subject, centered and prominent.`,
    visual,
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
  const visual = buildProductVisualDetails(product);
  const desc = product.review_summary
    ? `Product description: ${String(product.review_summary).replace(/<[^>]*>/g, '').substring(0, 400)}`
    : '';
  return [
    `Premium editorial hero banner image for an affiliate product-review blog post about: ${name}${brand}${category ? ` (category: ${category})` : ''}.`,
    'Showcase THE EXACT product as the single hero subject, centered and prominent. Realistic studio product photography.',
    visual,
    'Style: professional studio product photography, clean deep navy-blue background (#0A1F44) with soft amber/gold accent lighting, gentle reflections, subtle depth of field, ultra high detail, 16:9 widescreen composition.',
    'NO text, NO words, NO logos, NO watermarks, NO other products, NO people, NO hands, NO labels.',
    'Keep it realistic and sharp.',
    desc,
  ].filter(Boolean).join('\n');
}

// Pull concrete visual details (color, material, size, design) from the product's
// specs so the text-only Cloudflare prompt can depict the product accurately.
function buildProductVisualDetails(product: any): string {
  const specs: any = (product && typeof product.specs === 'object' && product.specs) || {};
  const details: any = specs.details || specs.detail_bullets || specs;
  const find = (keys: string[]): string => {
    for (const k of keys) {
      const v = details?.[k] ?? specs?.[k];
      if (v && typeof v === 'string' && v.trim() && v.trim().length < 120) return v.trim();
    }
    return '';
  };
  const color = find(['color', 'colour', 'Color', 'color_name', 'colorName']);
  const material = find(['material', 'Material', 'materials', 'Materials']);
  const size = find(['size', 'Size', 'item_size', 'itemSize', 'unit_size', 'unitSize']);
  const design = find(['design', 'Design', 'pattern', 'style', 'Style', 'shape']);
  const parts: string[] = [];
  if (color) parts.push(`color ${color}`);
  if (material) parts.push(`material ${material}`);
  if (size) parts.push(`size/dimensions ${size}`);
  if (design) parts.push(`design/style ${design}`);
  return parts.length
    ? `Key visual details from the product listing: ${parts.join(', ')}. Depict these accurately so the image matches the real product.`
    : '';
}

function stripDataUriPrefix(base64: string): string {
  return base64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

async function generateWithCloudflare(
  product: any,
  opts?: DesignImageOpts,
): Promise<DesignImageResult | null> {
  // Cloudflare always uses its OWN env token/account — never opts.apiKey, which
  // the auto-articles config fills with the Gemini key (different provider).
  const apiKey = CLOUDFLARE_IMAGE_API_KEY.trim();
  const accountId = (CLOUDFLARE_ACCOUNT_ID.trim() || opts?.accountId?.trim() || '');
  if (!apiKey || !accountId) return null;

  const model = (opts?.model && String(opts.model).startsWith('@cf/')) ? String(opts.model) : CLOUDFLARE_IMAGE_MODEL;
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
    const url2 = await uploadGeneratedImage(base64, 'article');
    return { url: url2, generated: true, source: 'cloudflare', fallback: 'none' };
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
 * used as a REFERENCE (Gemini) so the AI faithfully depicts the actual product.
 * Provider chain:
 *   auto      -> Gemini (reference-accurate) -> Cloudflare (fast) -> Imagen -> product photo
 *   gemini    -> Gemini image model -> Imagen -> product photo
 *   cloudflare -> Cloudflare Workers AI only (falls back to product photo)
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

  // Cloudflare Workers AI first — flux is fast and reliable. Reference-accurate
  // Gemini is tried as a fallback (and when provider='gemini').
  if (provider === 'cloudflare' || (provider === 'auto' && isCloudflareConfigured())) {
    const cf = await generateWithCloudflare(product, opts);
    if (cf) return cf;
    if (provider === 'cloudflare') return productFallback();
  }

  // Reference-based Gemini path — uses the real product photo as an image
  // reference so the hero banner accurately depicts the actual product.
  if (provider === 'gemini' || provider === 'auto') {
    const apiKey = resolveApiKey(provider === 'gemini' ? opts?.apiKey : ENV_API_KEY);
    const imageModel = (opts?.model && !String(opts.model).startsWith('@cf/')) ? opts.model : GEMINI_IMAGE_MODEL;

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
          const url = await uploadGeneratedImage(image.base64, 'article');
          return { url, generated: true, source: 'gemini-image', fallback: 'none' };
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
          const url = await uploadGeneratedImage(bytes, 'article');
          return { url, generated: true, source: 'imagen', fallback: 'none' };
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

