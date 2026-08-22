import { getSupabaseAdmin } from './lib/supabase';

// Shopping-events directory layer: admin-enabled seasonal landing pages
// (Black Friday, Christmas, Prime Day, Back-to-School ...) with curated or
// keyword-auto-matched product collections.

export interface ShoppingEventRow {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  emoji: string | null;
  hero_image: string | null;
  theme_color: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  keywords: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface EventProductRow {
  id: string;
  slug: string;
  product_name: string;
  brand: string | null;
  product_image: string | null;
  price: number | null;
  original_price: number | null;
  rating: number | null;
  review_count: number | null;
  editor_score: number | null;
  deal_badge: string | null;
  stock_status: string | null;
  affiliate_url: string | null;
}

const EVENT_COLS = 'id,name,slug,tagline,description,emoji,hero_image,theme_color,start_date,end_date,is_active,featured,sort_order,keywords,seo_title,seo_description';

export async function listEvents(activeOnly: boolean): Promise<ShoppingEventRow[]> {
  const sb = await getSupabaseAdmin();
  let q = sb.from('shopping_events').select(EVENT_COLS).order('sort_order', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getEventBySlug(slug: string): Promise<ShoppingEventRow | null> {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb.from('shopping_events').select(EVENT_COLS).eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

// Curated products for an event; when none assigned yet, auto-fill from
// published catalog by matching the event's keyword slugs against category
// slugs / product names so every enabled landing page is never empty.
export async function getEventProducts(event: ShoppingEventRow, limit = 24): Promise<EventProductRow[]> {
  const sb = await getSupabaseAdmin();
  const { data: curated, error } = await sb
    .from('event_products')
    .select('sort_order, product:product_reviews!inner(id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,deal_badge,stock_status,affiliate_url,status)')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })
    .limit(limit);
  if (!error && Array.isArray(curated)) {
    const rows = curated.map((c: any) => c.product).filter((p: any) => p && p.status === 'published');
    if (rows.length > 0) return rows;
  }

  // Auto-fill path
  const kwRaw = String(event.keywords || '');
  if (!kwRaw.trim()) return [];
  const terms = kwRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  const catSlugs = new Set(terms.filter((t) => t.includes('-')));
  const { data: cats } = await sb.from('categories').select('id,slug');
  const catIds = new Set((cats || []).filter((c: any) => catSlugs.has(c.slug)).map((c: any) => c.id));

  const cols = 'id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,deal_badge,stock_status,affiliate_url';
  let q = sb.from('product_reviews').select(cols).eq('status', 'published').order('editor_score', { ascending: false }).limit(limit * 3);
  if (catIds.size > 0) q = q.in('category_id', [...catIds]);
  const { data: pool } = await q;
  let rows: any[] = pool || [];

  if (rows.length === 0 && catIds.size === 0) {
    // name-word fallback
    for (const t of terms) {
      const { data } = await sb.from('product_reviews').select(cols).eq('status','published').ilike('product_name', `%${t.replace(/-/g,' ')}%`).limit(limit);
      rows = rows.concat(data || []);
    }
  }

  const seen = new Set<string>();
  return rows
    .filter((r) => r.slug && !seen.has(r.slug) && seen.add(r.slug))
    .sort((a, b) => Number(b.editor_score || 0) - Number(a.editor_score || 0))
    .slice(0, limit);
}

export async function createEvent(input: Partial<ShoppingEventRow>): Promise<ShoppingEventRow> {
  const sb = await getSupabaseAdmin();
  const { randomUUID } = await import('crypto');
  const payload = {
    id: randomUUID(),
    name: input.name || 'Untitled Event',
    slug: input.slug || String(input.name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ...input,
  };
  const { data, error } = await sb.from('shopping_events').insert(payload).select(EVENT_COLS).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEvent(id: string, patch: Partial<ShoppingEventRow>): Promise<ShoppingEventRow> {
  const sb = await getSupabaseAdmin();
  const allowed: Record<string, unknown> = {};
  for (const k of ['name','slug','tagline','description','emoji','hero_image','theme_color','start_date','end_date','is_active','featured','sort_order','keywords','seo_title','seo_description']) {
    if (k in patch) allowed[k] = (patch as any)[k];
  }
  allowed.updated_at = new Date().toISOString();
  const { data, error } = await sb.from('shopping_events').update(allowed).eq('id', id).select(EVENT_COLS).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const sb = await getSupabaseAdmin();
  const { error } = await sb.from('shopping_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function setEventProducts(eventId: string, productIds: string[]): Promise<number> {
  const sb = await getSupabaseAdmin();
  const { error: delErr } = await sb.from('event_products').delete().eq('event_id', eventId);
  if (delErr) throw new Error(delErr.message);
  if (!productIds.length) return 0;
  const { randomUUID } = await import('crypto');
  const rows = productIds.slice(0, 100).map((pid, i) => ({ id: randomUUID(), event_id: eventId, product_id: pid, sort_order: i }));
  const { error } = await sb.from('event_products').insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function getEventProductIds(eventId: string): Promise<string[]> {
  const sb = await getSupabaseAdmin();
  const { data } = await sb.from('event_products').select('product_id').eq('event_id', eventId).order('sort_order');
  return (data || []).map((r: any) => r.product_id);
}
