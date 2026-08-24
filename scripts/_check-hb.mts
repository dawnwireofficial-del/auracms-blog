import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data: cols } = await sb.from('information_schema.columns').select('column_name,data_type').eq('table_name','homepage_banners').order('ordinal_position');
console.log('homepage_banners cols:', (cols||[]).map(c => `${c.column_name}:${c.data_type}`).join(', '));
const { data: rows } = await sb.from('homepage_banners').select('id,placement,title,image_url,mobile_image_url,link_url,is_active,sort_order').order('placement');
for (const r of rows||[]) console.log(`${r.placement.padEnd(12)} active=${r.is_active} title=${(r.title||'').slice(0,30)} link=${r.link_url||'-'} img=${(r.image_url||'').slice(0,40)}`);
