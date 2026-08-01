import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_toy-BSdhpLKpoHIzaQDevg_bqKOOW94';
if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE_URL or service key'); process.exit(1); }
const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
}

async function findBrandId(name: string): Promise<string | null> {
  const slug = slugify(name);
  const { data: bySlug } = await sb.from('brands').select('id').eq('slug', slug).maybeSingle();
  if (bySlug?.id) return bySlug.id;
  const { data: byName } = await sb.from('brands').select('id').ilike('name', name).maybeSingle();
  if (byName?.id) return byName.id;
  const { data: byExact } = await sb.from('brands').select('id').eq('name', name).maybeSingle();
  return byExact?.id || null;
}

async function main() {
  console.log('Fetching all product reviews...');
  const { data: products, error } = await sb.from('product_reviews').select('id,product_name,brand,brand_id').order('created_at', { ascending: false }).limit(1000);
  if (error) { console.error('Error:', error); process.exit(1); }
  console.log(`Found ${products!.length} products`);

  const brandMap = new Map<string, string | null>();
  let created = 0, linked = 0, skipped = 0;

  for (const p of products!) {
    const brandName = (p.brand || '').trim();
    if (!brandName || brandName === 'Generic' || brandName === 'generic') { skipped++; continue; }

    let brandId = brandMap.get(brandName);
    if (brandId === undefined) {
      brandId = await findBrandId(brandName);
      if (!brandId) {
        const slug = slugify(brandName);
        const brand = { id: crypto.randomUUID(), name: brandName, slug, status: 'active' } as { id: string; name: string; slug: string; status: string };
        let { data, error: insErr } = await sb.from('brands').insert(brand).select().single();
        if (insErr) {
          console.warn(`  Insert failed for "${brandName}", falling back to lookup:`, insErr.message);
          brandId = await findBrandId(brandName);
          if (!brandId) {
            console.error(`  Could not create/lookup brand "${brandName}"`);
            brandMap.set(brandName, null);
            skipped++;
            continue;
          }
        } else {
          brandId = data?.id || brand.id;
          created++;
          console.log(`  Created brand: ${brandName} -> ${brandId}`);
        }
      }
      brandMap.set(brandName, brandId || null);
    }

    if (brandId && p.brand_id !== brandId) {
      const { error: updErr } = await sb.from('product_reviews').update({ brand_id: brandId }).eq('id', p.id);
      if (updErr) {
        console.warn(`  Update failed for "${p.product_name}":`, updErr.message);
      } else {
        linked++;
      }
    }
  }

  console.log(`\nDone. Created ${created} brands, linked ${linked} products, skipped ${skipped}.`);
}

main().catch(console.error);
