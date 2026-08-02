import { getSupabaseAdmin } from '../server/lib/supabase';

(async () => {
  const sb = await getSupabaseAdmin();
  const test = await sb.from('product_reviews').insert({
    id: '00000000-0000-0000-0000-000000000001',
    product_name: '__RLS_TEST__',
    slug: '__rls-test__',
    status: 'draft',
  }).select('id').maybeSingle();
  if (test.error) {
    console.log('WRITE DENIED:', test.error.message);
  } else {
    console.log('WRITE OK, cleaning up');
    await sb.from('product_reviews').delete().eq('id', '00000000-0000-0000-0000-000000000001');
  }
})();
