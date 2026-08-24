import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const tables = ['users','categories','brands','product_reviews','posts','categories','shopping_events'];
for (const t of tables) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(t + ': ' + count);
}
