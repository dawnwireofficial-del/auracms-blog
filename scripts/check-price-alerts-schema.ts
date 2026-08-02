import 'dotenv/config';
import { getSupabaseAdmin } from '../server/lib/supabase';

async function main() {
  const sb = await getSupabaseAdmin();
  const { data, error } = await sb.from('price_alerts').select('id, alert_type, status, user_id, session_id, current_price, triggered_at').limit(5);
  if (error) {
    console.log('ERR', error.message);
  } else {
    console.log('price_alerts select OK rows=', data.length);
  }
  const { data: insert, error: insErr } = await sb.from('price_alerts').insert({
    id: crypto.randomUUID(),
    email: 'test-check@dawnwire.com',
    product_id: '00000000-0000-0000-0000-000000000000',
    alert_type: 'price_increase',
    target_price: 10,
  }).select('id, alert_type, status');
  if (insErr) console.log('INSERT ERR', insErr.message);
  else {
    console.log('INSERT OK alert_type=', insert[0]?.alert_type);
    await sb.from('price_alerts').delete().eq('id', insert[0].id);
  }
}
main();
