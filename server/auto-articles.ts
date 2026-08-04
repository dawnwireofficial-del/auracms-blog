import { dbInstance } from './db';
import { getSupabaseAdmin } from './lib/supabase';
import { getProductReviews, getProductReviewById } from './seo-engine';
import { generateArticleFromProduct } from './ai';
import { generateDesignImage, ImageProvider } from './image-gen';

export interface AutoArticleConfig {
  enabled: boolean;
  intervalMinutes: number;
  batchSize: number;
  dailyLimit: number;
  status: 'published' | 'draft';
  withImage: boolean;
  minScore: number;
  imageModel: string;
  imageApiKey: string;
  imageProvider: ImageProvider;
  imageAccountId: string;
}

export interface AutoArticleResult {
  productId: string;
  productName?: string;
  productImage?: string;
  postId?: string;
  slug?: string;
  title?: string;
  status?: string;
  featuredImage?: string;
  image?: { generated: boolean; source: string; fallback: string };
  skipped?: string;
  error?: string;
}

const CONFIG_TABLE = 'auto_article_settings';

const DEFAULT_CONFIG: AutoArticleConfig = {
  enabled: process.env.AUTO_ARTICLE_ENABLED !== 'false',
  intervalMinutes: parseInt(process.env.AUTO_ARTICLE_INTERVAL_MIN || '30', 10) || 30,
  batchSize: parseInt(process.env.AUTO_ARTICLE_BATCH || '5', 10) || 5,
  dailyLimit: parseInt(process.env.AUTO_ARTICLE_DAILY_LIMIT || '50', 10) || 50,
  status: (process.env.AUTO_ARTICLE_STATUS as AutoArticleConfig['status']) || 'published',
  withImage: process.env.AUTO_ARTICLE_IMAGE !== 'false',
  minScore: parseInt(process.env.AUTO_ARTICLE_MIN_SCORE || '6', 10) || 6,
  imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation',
  imageApiKey: process.env.GEMINI_API_KEY || '',
  imageProvider: (process.env.AUTO_ARTICLE_IMAGE_PROVIDER as ImageProvider) || 'auto',
  imageAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
};

let cachedConfig: AutoArticleConfig | null = null;
let generatedToday = 0;
let generatedDate = new Date().toISOString().slice(0, 10);

function bumpDailyCounter(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (generatedDate !== today) {
    generatedDate = today;
    generatedToday = 0;
  }
  const cfg = cachedConfig || DEFAULT_CONFIG;
  if (generatedToday >= cfg.dailyLimit) return false;
  generatedToday += 1;
  return true;
}

export async function getConfig(): Promise<AutoArticleConfig> {
  if (cachedConfig) return cachedConfig;
  const cfg = { ...DEFAULT_CONFIG };
  try {
    const sb = await getSupabaseAdmin();
    const { data, error } = await sb.from(CONFIG_TABLE).select('*').limit(1).maybeSingle();
    if (!error && data) {
      if (typeof data.enabled === 'boolean') cfg.enabled = data.enabled;
      if (data.interval_minutes) cfg.intervalMinutes = Number(data.interval_minutes);
      if (data.batch_size) cfg.batchSize = Number(data.batch_size);
      if (data.daily_limit) cfg.dailyLimit = Number(data.daily_limit);
      if (data.status === 'published' || data.status === 'draft') cfg.status = data.status;
      if (typeof data.with_image === 'boolean') cfg.withImage = data.with_image;
      if (data.min_score != null) cfg.minScore = Number(data.min_score);
      if (data.image_model) cfg.imageModel = data.image_model;
      if (data.image_api_key) cfg.imageApiKey = data.image_api_key;
      if (data.image_provider === 'gemini' || data.image_provider === 'cloudflare' || data.image_provider === 'auto') cfg.imageProvider = data.image_provider;
      if (data.image_account_id) cfg.imageAccountId = data.image_account_id;
      generatedToday = Number(data.generated_today || 0);
      generatedDate = data.generated_date || generatedDate;
      if (generatedDate !== new Date().toISOString().slice(0, 10)) generatedToday = 0;
    }
  } catch {
    /* table may not exist — use env defaults */
  }
  cachedConfig = cfg;
  return cfg;
}

export async function saveConfig(updates: Partial<AutoArticleConfig>): Promise<AutoArticleConfig> {
  const cfg = { ...(cachedConfig || await getConfig()), ...updates };
  cachedConfig = cfg;
  try {
    const sb = await getSupabaseAdmin();
    const payload: Record<string, any> = {
      enabled: cfg.enabled,
      interval_minutes: cfg.intervalMinutes,
      batch_size: cfg.batchSize,
      daily_limit: cfg.dailyLimit,
      status: cfg.status,
      with_image: cfg.withImage,
      min_score: cfg.minScore,
      image_model: cfg.imageModel,
      image_api_key: cfg.imageApiKey,
      image_provider: cfg.imageProvider,
      image_account_id: cfg.imageAccountId,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await sb.from(CONFIG_TABLE).select('id').limit(1).maybeSingle();
    if (existing) {
      await sb.from(CONFIG_TABLE).update(payload).eq('id', existing.id);
    } else {
      await sb.from(CONFIG_TABLE).insert({ id: crypto.randomUUID(), ...payload });
    }
  } catch {
    /* in-memory only */
  }
  return cfg;
}

export async function resetDailyCounter(): Promise<void> {
  generatedToday = 0;
  generatedDate = new Date().toISOString().slice(0, 10);
  try {
    const sb = await getSupabaseAdmin();
    const { data: existing } = await sb.from(CONFIG_TABLE).select('id').limit(1).maybeSingle();
    if (existing) {
      await sb.from(CONFIG_TABLE).update({ generated_today: 0, generated_date: generatedDate, updated_at: new Date().toISOString() }).eq('id', existing.id);
    }
  } catch {
    /* ignore */
  }
}

async function getSystemAuthorId(): Promise<string> {
  try {
    const sb = await getSupabaseAdmin();
    const { data: admin } = await sb.from('users').select('id').in('role', ['super_admin', 'admin']).limit(1).maybeSingle();
    if (admin?.id) return admin.id;
    const { data: anyUser } = await sb.from('users').select('id').limit(1).maybeSingle();
    if (anyUser?.id) return anyUser.id;
  } catch {
    /* fall through */
  }
  return 'auto-article';
}

function slugify(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function findSimilarProducts(product: any, allReviews: any[]): any[] {
  return allReviews
    .filter((r: any) => {
      if (r.id === product.id) return false;
      if (product.best_for && r.best_for && String(r.best_for).toLowerCase() === String(product.best_for).toLowerCase()) return true;
      const words = String(product.product_name || '').toLowerCase().split(/\s+/);
      const rWords = String(r.product_name || '').toLowerCase().split(/\s+/);
      const common = words.filter((w: string) => w.length > 3 && rWords.includes(w));
      return common.length >= 2;
    })
    .slice(0, 5);
}

export async function hasArticleForProduct(productId: string): Promise<boolean> {
  try {
    const posts = await dbInstance.getPostsByProductId(productId);
    return posts.length > 0;
  } catch {
    const posts = await dbInstance.getPosts();
    return posts.some((p: any) => p.productId === productId || p.product_id === productId);
  }
}

export async function autoGenerateArticleForProduct(
  product: any,
  opts?: { status?: AutoArticleConfig['status']; withImage?: boolean },
): Promise<AutoArticleResult> {
  const productId = product.id || product.product_id;
  const config = await getConfig();
  const status = opts?.status || config.status;
  const withImage = opts?.withImage ?? config.withImage;

  try {
    if (await hasArticleForProduct(productId)) {
      return { productId, productName: product.product_name, skipped: 'article already exists' };
    }

    const allReviews = await getProductReviews();
    const similar = findSimilarProducts(product, allReviews);
    const { title, content, excerpt } = await generateArticleFromProduct(product, similar);

    let featuredImage = '';
    let imageResult: AutoArticleResult['image'];
    if (withImage) {
      const img = await generateDesignImage(product, {
        apiKey: config.imageApiKey,
        model: config.imageModel,
        provider: config.imageProvider,
        accountId: config.imageAccountId,
      });
      featuredImage = img.url || product.product_image || '';
      imageResult = { generated: img.generated, source: img.source, fallback: img.fallback };
    } else {
      featuredImage = product.product_image || '';
      imageResult = { generated: false, source: 'product', fallback: 'none' };
    }

    const imageMd = product.product_image ? `![${product.product_name}](${product.product_image})\n\n` : '';
    const fullContent = imageMd + content;

    let slug = (product.slug || productId) + '-' + slugify(product.product_name).substring(0, 40) + '-guide';
    const existingPost = await dbInstance.getPostBySlug(slug);
    if (existingPost) slug = slug + '-' + Date.now().toString(36);

    const authorId = await getSystemAuthorId();
    const post = await dbInstance.createPost({
      title,
      slug,
      excerpt: (excerpt || '').substring(0, 300),
      content: fullContent,
      featuredImage,
      categoryId: product.category_id || '',
      productId,
      tags: [product.product_name, product.brand || '', 'review', 'buying guide'].filter(Boolean),
      status,
      visibility: 'public',
      isFeatured: false,
      isTrending: false,
      isEditorsPick: false,
      allowComments: true,
      seoTitle: title,
      seoDescription: (excerpt || '').substring(0, 160),
      seoKeywords: [product.product_name, product.brand || '', 'review', 'buying guide', 'best ' + (product.best_for || '')].filter(Boolean).join(', '),
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
    }, authorId);

    try {
      const sb = await getSupabaseAdmin();
const { data: existing } = await sb.from(CONFIG_TABLE).select('id, generated_today').limit(1).maybeSingle();
      if (existing) {
        await sb.from(CONFIG_TABLE).update({
          generated_today: (Number(existing.generated_today) || 0) + 1,
          generated_date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      }
    } catch {
      /* ignore */
    }

    return {
      productId,
      productName: product.product_name,
      productImage: product.product_image || '',
      postId: post.id,
      slug,
      title,
      status,
      featuredImage,
      image: imageResult,
    };
  } catch (e: any) {
    return { productId, productName: product.product_name, productImage: product.product_image || '', error: e.message || 'Unknown error' };
  }
}

export async function autoGenerateArticles(params?: {
  limit?: number;
  onlyMissing?: boolean;
  status?: AutoArticleConfig['status'];
  withImage?: boolean;
  minScore?: number;
}): Promise<{ processed: number; results: AutoArticleResult[]; limited: boolean }> {
  const config = await getConfig();
  const limit = Math.min(params?.limit ?? config.batchSize, 20);
  const onlyMissing = params?.onlyMissing ?? true;
  const status = params?.status ?? config.status;
  const withImage = params?.withImage ?? config.withImage;
  const minScore = params?.minScore ?? config.minScore;

  const all = await getProductReviews();
  let targets = (all || []).filter((p: any) => p.status === 'published');
  if (minScore > 0) targets = targets.filter((p: any) => Number(p.editor_score || p.editorScore || 0) >= minScore);
  if (onlyMissing) {
    const withArticles = new Set<string>();
    try {
      const posts = await dbInstance.getPosts();
      for (const p of posts as any[]) {
        const pid = p.productId || p.product_id;
        if (pid) withArticles.add(pid);
      }
    } catch {
      /* treat all as missing */
    }
    targets = targets.filter((p: any) => !withArticles.has(p.id));
  }

  const results: AutoArticleResult[] = [];
  let processed = 0;
  for (const p of targets.slice(0, limit)) {
    if (!bumpDailyCounter()) {
      break;
    }
    const r = await autoGenerateArticleForProduct(p, { status, withImage });
    results.push(r);
    processed += 1;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return { processed, results, limited: processed < limit && targets.length > limit };
}

export async function getAutoArticleStats(): Promise<{
  totalProducts: number;
  publishedProducts: number;
  withArticle: number;
  missingArticle: number;
  postCount: number;
  publishedPosts: number;
  draftPosts: number;
  dailyLimit: number;
  generatedToday: number;
  config: AutoArticleConfig;
}> {
  const config = await getConfig();
  const all = await getProductReviews();
  const published = (all || []).filter((p: any) => p.status === 'published');
  let posts: any[] = [];
  try {
    posts = await dbInstance.getPosts();
  } catch {
    posts = [];
  }
  const withProductId = new Set(posts.filter((p) => p.productId || p.product_id).map((p) => p.productId || p.product_id));
  const withArticle = published.filter((p) => withProductId.has(p.id)).length;
  const publishedPosts = posts.filter((p: any) => p.status === 'published').length;
  const draftPosts = posts.filter((p: any) => p.status === 'draft').length;
  const today = new Date().toISOString().slice(0, 10);
  if (generatedDate !== today) generatedToday = 0;

  return {
    totalProducts: (all || []).length,
    publishedProducts: published.length,
    withArticle,
    missingArticle: published.length - withArticle,
    postCount: posts.length,
    publishedPosts,
    draftPosts,
    dailyLimit: config.dailyLimit,
    generatedToday,
    config,
  };
}
