import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await sb.from('category_banners').select('*').limit(10);
console.log('category_banners:', error ? 'ERR ' + error.message : JSON.stringify(data, null, 1).slice(0, 800));
const { data: cols } = await sb.from('information_schema.columns').select('column_name,table_name').eq('table_name','category_banners');
console.log('columns:', (cols||[]).map(c => c.column_name).join(', '));
