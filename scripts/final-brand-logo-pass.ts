import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deduplicateBrands() {
  console.log('🔄 Deduplicating brands...\n');
  
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, logo_url, status')
    .order('name');

  if (error) throw error;

  // Group by normalized name
  const groups = new Map<string, any[]>();
  for (const b of brands || []) {
    const key = b.name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }

  let deleted = 0;
  for (const [name, items] of groups) {
    if (items.length > 1) {
      // Keep the one with logo, or the first
      items.sort((a, b) => {
        if (a.logo_url && !b.logo_url) return -1;
        if (!a.logo_url && b.logo_url) return 1;
        return 0;
      });
      const keep = items[0];
      for (let i = 1; i < items.length; i++) {
        console.log(`   🗑️  Deleting duplicate: ${items[i].name} (id: ${items[i].id})`);
        const { error } = await supabase.from('brands').delete().eq('id', items[i].id);
        if (!error) deleted++;
        else console.error(`   ❌ Failed:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Deleted ${deleted} duplicates\n`);
  return deleted;
}

async function tryAllSources(brand: any): Promise<string | null> {
  const name = brand.name.trim();
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  
  // Multiple domain guesses
  const domains = [
    `${cleanName}.com`,
    `${cleanName}.net`,
    `${cleanName}.co`,
    `${cleanName}.io`,
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.com',
    name.toLowerCase().replace(/\s+/g, '') + '.com',
  ];

  // Add known domain overrides
  const knownOverrides: Record<string, string> = {
    'kiko milano': 'kikomilano.com',
    'du de wipes': 'dudewipes.com',
    "dr.scholl's shoes": 'drscholls.com',
    "she's birdie": 'shesbirdie.com',
    'party like sophia': 'partylikesophia.com',
    'u.s. art supply': 'usartsupply.com',
    'one beat': 'onebeat.com',
    'color nymph': 'colornymph.com',
    'cleverfy': 'cleverfy.com',
    'eudele': 'eudele.com',
    'fulmoon': 'fulmoon.com',
    'goodbaby': 'goodbaby.com',
    'heukikt': 'heukikt.com',
    'hiboom': 'hiboom.com',
    'jamiewin': 'jamiewin.com',
    'jtwking': 'jtwking.com',
    'krniuc': 'krniuc.com',
    'kumufenc': 'kumufenc.com',
    'lemonsac': 'lemonsac.com',
    'mirravative': 'mirravative.com',
    'mqrw': 'mqrw.com',
    'mwykzrt': 'mwykzrt.com',
    'oow': 'oow.com',
    'peasug': 'peasug.com',
    'qttier': 'qttier.com',
    'qzyl': 'qzyl.com',
    'superjare': 'superjare.com',
    'tamaki': 'tamaki.com',
    'toymis': 'toymis.com',
    'uwiwutei': 'uwiwutei.com',
    'vigor fun': 'vigorfun.com',
    'yaztops': 'yaztops.com',
    'yhoon': 'yhoon.com',
    'youdenova': 'youdenova.com',
    'yr yrhh-pet': 'yrpet.com',
    'zesliwy': 'zesliwy.com',
    'zooron': 'zooron.com',
    'amabazr': 'amabazr.com',
  };

  const override = knownOverrides[name.toLowerCase()];
  if (override) domains.unshift(override);

  // Try all sources for each domain
  for (const domain of domains) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    const sources = [
      `https://logo.clearbit.com/${cleanDomain}?size=200`,
      `https://img.logo.dev/${cleanDomain}?format=png&size=200`,
      `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
    ];

    for (const url of sources) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const ct = res.headers.get('content-type');
          if (ct?.startsWith('image/')) return url;
        }
      } catch { continue; }
    }
  }

  // Last resort: try generic placeholder with brand name for Clearbit
  try {
    const searchUrl = `https://logo.clearbit.com/${encodeURIComponent(name)}.com?size=200`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(searchUrl, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return searchUrl;
  } catch {}

  return null;
}

async function main() {
  await deduplicateBrands();

  console.log('🔍 Fetching brands needing logos...\n');
  
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url, status')
    .is('logo_url', null)
    .eq('status', 'active')
    .order('name');

  if (error) throw error;

  console.log(`🎯 ${brands?.length || 0} active brands need logos\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < (brands || []).length; i++) {
    const brand = brands[i];
    console.log(`[${i + 1}/${brands.length}] Searching: ${brand.name}...`);

    const logoUrl = await tryAllSources(brand);
    if (logoUrl) {
      try {
        const { error } = await supabase
          .from('brands')
          .update({ logo_url: logoUrl })
          .eq('id', brand.id);
        if (!error) {
          console.log(`   ✅ ${brand.name} → ${logoUrl}`);
          updated++;
        } else {
          console.error(`   ❌ Update failed:`, error.message);
          failed++;
        }
      } catch (e) {
        console.error(`   ❌ Error:`, e);
        failed++;
      }
    } else {
      console.log(`   ⚠️  No logo found for ${brand.name}`);
      failed++;
    }

    if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total: ${brands?.length || 0}`);
}

main().catch(console.error);