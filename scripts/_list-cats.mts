import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await sb.from('categories').select('id, name, slug, status').order('name');
for (const c of data||[]) console.log(`${c.slug.padEnd(30)} ${c.name} (${c.status})`);
console.log(`total: ${(data||[]).length}`);
