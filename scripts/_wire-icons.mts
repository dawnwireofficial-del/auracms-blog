import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const map = JSON.parse(fs.readFileSync('scripts/asset-urls-freeimage.json', 'utf8'));
const { data: cats } = await sb.from('categories').select('id, name, image');
let updated = 0;
for (const [key, val] of Object.entries(map)) {
  if (!key.startsWith('Categories Icons/')) continue;
  const name = key.replace('Categories Icons/', '').replace(/\.png$/i, '').trim();
  const cat = (cats || []).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (!cat) { console.log('no match:', name); continue; }
  const url = (val as any).thumb || (val as any).full;
  if (cat.image === url) continue;
  const { error } = await sb.from('categories').update({ image: url }).eq('id', cat.id);
  if (error) console.error(name, error.message);
  else { updated++; console.log(`ok ${name} -> ${url}`); }
}
console.log(`updated=${updated}`);
