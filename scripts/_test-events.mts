import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data, error } = await sb.from('product_reviews').select('id').limit(3);
console.log('join-fk test products:', error ? 'ERR ' + error.message : 'ok rows=' + data.length);
const { data: ev } = await sb.from('shopping_events').select('id,slug').eq('slug','black-friday').single();
console.log('event:', ev?.slug);
const { error: joinErr } = await sb.from('event_products').select('id, product:product_reviews(slug)').limit(1);
console.log('event_products fk path:', joinErr ? 'ERR ' + joinErr.message : 'OK');
