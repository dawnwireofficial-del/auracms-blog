import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await sb.from('information_schema.tables').select('table_name').eq('table_schema','public');
console.log((data||[]).map(t => t.table_name).join('\n'));
