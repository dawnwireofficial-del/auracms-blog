/**
 * Pinterest board routing — picks the right board per product so pins rank in
 * niche-specific boards (Electronics, Beauty, Home & Kitchen, …) instead of one
 * catch-all board. Shared by the server scheduler (auto-social.ts) and the
 * admin publish endpoints (api/routes/social-media.ts).
 *
 * Matching strategy:
 *   1. Resolve the product's broad category name from `category_id` (DB lookup)
 *      or an explicit `categoryName` — this is the strongest signal (the DB
 *      categories table uses names like "Electronics", "Beauty & Personal Care").
 *   2. Add secondary signals: best_for, specs.details.department, category slug.
 *   3. Fetch the account's boards (cached 5 min), score each board name against
 *      the signals, return the best match. Falls back to the default board when
 *      nothing scores above the threshold.
 */

import { getSupabaseAdmin } from './lib/supabase';

export const PIN_BOARD_KEYWORDS: Record<string, string> = {
  'beauty-personal-care': 'Beauty',
  'home-kitchen': 'Kitchen',
  'electronics': 'Electronics',
  'technology': 'Technology',
  'gaming': 'Gaming',
  'sports-outdoors': 'Sports',
  'fitness': 'Fitness',
  'baby-products': 'Baby',
  'automotive': 'Automotive',
  'toys-games': 'Toys',
  'office-productivity': 'Office',
  'ai-software-tools': 'AI',
};

let boardsCache: { at: number; boards: { id: string; name: string }[] } | null = null;
let categoryNameCache = new Map<string, string>();

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

async function fetchUserBoards(accessToken: string): Promise<{ id: string; name: string }[]> {
  if (boardsCache && Date.now() - boardsCache.at < 5 * 60 * 1000) return boardsCache.boards;

  const boards: { id: string; name: string }[] = [];
  let bookmark: string | null = null;
  try {
    do {
      const url = new URL('https://api.pinterest.com/v5/boards');
      url.searchParams.set('page_size', '100');
      if (bookmark) url.searchParams.set('bookmark', bookmark);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) break;
      const data: any = await res.json();
      if (Array.isArray(data.items)) {
        for (const b of data.items) {
          if (b?.id && b?.name) boards.push({ id: b.id, name: b.name });
        }
      }
      bookmark = data?.bookmark || null;
    } while (bookmark && boards.length < 500);
  } catch (e) {
    console.warn('[pinterest] board fetch failed:', (e as Error).message);
  }

  boardsCache = { at: Date.now(), boards };
  return boards;
}

/** Resolve a category_id to its display name via the DB (cached). */
export async function resolveCategoryName(categoryId?: string): Promise<string> {
  if (!categoryId) return '';
  const hit = categoryNameCache.get(categoryId);
  if (hit !== undefined) return hit;
  try {
    const supabase = await getSupabaseAdmin();
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .maybeSingle();
    const name = data?.name ? String(data.name) : '';
    categoryNameCache.set(categoryId, name);
    return name;
  } catch {
    return '';
  }
}

/** Extract category signals from a product row. */
export async function productCategorySignals(product: any): Promise<string[]> {
  const signals: string[] = [];
  // Primary: broad category name resolved from the DB or passed in explicitly.
  const catName =
    (product?.categoryName ? String(product.categoryName) : '') ||
    (await resolveCategoryName(product?.category_id || product?.categoryId));
  if (catName) signals.push(catName);
  // Keyword map gives exact matches for the boards we recommend admins create.
  for (const [slug, word] of Object.entries(PIN_BOARD_KEYWORDS)) {
    if (String(product?.category || product?.category_slug || '').includes(slug)) signals.push(word);
    if (catName && normalize(catName).includes(slug.replace(/-/g, ' '))) signals.push(word);
  }
  // Secondary: specifics from the product itself.
  if (product?.best_for) signals.push(String(product.best_for));
  if (product?.specs?.details?.department) signals.push(String(product.specs.details.department));
  if (product?.specs?.details?.category) signals.push(String(product.specs.details.category));
  return signals.filter(Boolean);
}

/**
 * Pick the board for a product. Returns the best-matching board ID, or
 * `defaultBoardId` when no board scores above the threshold.
 */
export async function resolveBoardForProduct(
  accessToken: string,
  defaultBoardId: string,
  product: any,
): Promise<string> {
  if (!defaultBoardId) return '';
  const signals = await productCategorySignals(product);
  if (signals.length === 0) return defaultBoardId;

  const boards = await fetchUserBoards(accessToken);
  if (boards.length === 0) return defaultBoardId;

  let bestId = defaultBoardId;
  let bestScore = 0;
  let bestName = '';

  for (const board of boards) {
    const name = normalize(board.name);
    let score = 0;
    for (const signal of signals) {
      const norm = normalize(signal);
      if (!norm) continue;
      for (const token of norm.split(' ')) {
        if (token.length < 3) continue;
        if (name.includes(token)) score += 1;
      }
      // Whole-phrase bonus (e.g. board "Home & Kitchen" vs signal "Home & Kitchen")
      if (name.includes(norm)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = board.id;
      bestName = board.name;
    }
  }

  if (bestScore >= 1 && bestName) return bestId;
  return defaultBoardId;
}