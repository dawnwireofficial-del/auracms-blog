import 'dotenv/config';
import { getSupabaseAdmin } from '../server/lib/supabase';

async function main() {
  const sb = await getSupabaseAdmin();
  const { data } = await sb
    .from('product_reviews')
    .select('id')
    .eq('status', 'published')
    .is('seo_title', null);
  console.log('Published products still missing seo_title:', (data || []).length);
}
main();
