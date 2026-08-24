import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  description?: string | null;
  status: string;
}

async function fetchAllBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

async function updateBrandLogo(id: string, logoUrl: string): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .update({ logo_url: logoUrl })
    .eq('id', id);

  if (error) throw error;
}

function normalizeBrandName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function guessDomain(name: string): string {
  const normalized = normalizeBrandName(name);
  const knownDomains: Record<string, string> = {
    'beauty-of-joseon': 'beautyofjoseon.com',
    'vaseline': 'vaseline.com',
    'cera-ve': 'cerave.com',
    'la-roche-posay': 'laroche-posay.com',
    'neutrogena': 'neutrogena.com',
    'olay': 'olay.com',
    'loreal': 'loreal.com',
    'maybelline': 'maybelline.com',
    'revlon': 'revlon.com',
    'covergirl': 'covergirl.com',
    'nyx': 'nyxcosmetics.com',
    'elf': 'elfcosmetics.com',
    'milk-makeup': 'milkmakeup.com',
    'glossier': 'glossier.com',
    'fenty-beauty': 'fentybeauty.com',
    'rare-beauty': 'rarebeauty.com',
    'huda-beauty': 'hudabeauty.com',
    'tatcha': 'tatcha.com',
    'drunk-elephant': 'drunkelephant.com',
    'the-ordinary': 'deciem.com',
    'paulas-choice': 'paulaschoice.com',
    'skin-ceuticals': 'skinceuticals.com',
    'obagi': 'obagi.com',
    'neutrogena': 'neutrogena.com',
    'aveeno': 'aveeno.com',
    'eucerin': 'eucerin.com',
    'cetaphil': 'cetaphil.com',
    'vanicream': 'vanicream.com',
    'la-mer': 'lamer.com',
    'estee-lauder': 'esteelauder.com',
    'clinique': 'clinique.com',
    'origins': 'origins.com',
    'kiehls': 'kiehls.com',
    'fresh': 'fresh.com',
    'belif': 'belif.com',
    'dr-jart': 'drjart.com',
    'laneige': 'laneige.com',
    'innisfree': 'innisfree.com',
    'etude-house': 'etudehouse.com',
    'tonymoly': 'tonymoly.com',
    'missha': 'missha.com',
    'cosrx': 'cosrx.com',
    'benton': 'benton.com',
    'klairs': 'klairs.com',
    'dear-klairs': 'klairs.com',
    'some-by-mi': 'somebymi.com',
    'purito': 'purito.com',
    'iunik': 'iunik.com',
    'benton': 'benton.com',
    'mizon': 'mizon.com',
    'secret-key': 'secretkey.com',
    'holika-holika': 'holikaholika.com',
    'skinfood': 'skinfood.com',
    'the-face-shop': 'thefaceshop.com',
    'nature-republic': 'naturerepublic.com',
    'tonymoly': 'tonymoly.com',
    'etude': 'etudehouse.com',
    'innisfree': 'innisfree.com',
    'laneige': 'laneige.com',
    'sulwhasoo': 'sulwhasoo.com',
    'history-of-whoo': 'historyofwhoo.com',
    'su-m37': 'su-m37.com',
    'ohui': 'ohui.com',
    'hera': 'hera.com',
    'iope': 'iope.com',
    'mamonde': 'mamonde.com',
    'aveda': 'aveda.com',
    'bobbi-brown': 'bobbibrown.com',
    'mac': 'maccosmetics.com',
    'urban-decay': 'urbandecay.com',
    'too-faced': 'toofaced.com',
    'benefit': 'benefitcosmetics.com',
    'nars': 'narscosmetics.com',
    'laura-mercier': 'lauramercier.com',
    'hourglass': 'hourglasscosmetics.com',
    'charlotte-tilbury': 'charlottetilbury.com',
    'pat-mcgrath': 'patmcgrath.com',
    'makeup-forever': 'makeupforever.com',
    'sephora': 'sephora.com',
    'ulta': 'ulta.com',
    'amazon': 'amazon.com',
    'walmart': 'walmart.com',
    'target': 'target.com',
    'cvs': 'cvs.com',
    'walgreens': 'walgreens.com',
    'rite-aid': 'riteaid.com',
  };

  return knownDomains[normalized] || `${normalized}.com`;
}

async function tryFetchLogo(brand: Brand): Promise<string | null> {
  const domain = brand.website || guessDomain(brand.name);
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  const sources = [
    // Clearbit Logo API (free, no key needed)
    `https://logo.clearbit.com/${cleanDomain}?size=200`,
    // Logo.dev (free tier)
    `https://img.logo.dev/${cleanDomain}?format=png&size=200`,
    // Favicon fallback
    `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`,
    // DuckDuckGo favicon
    `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        return url;
      }
      // For Clearbit/Logo.dev, they might return 200 even for missing logos with a placeholder
      // So also try GET and check content-length
      const getRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (getRes.ok) {
        const contentType = getRes.headers.get('content-type');
        const contentLength = getRes.headers.get('content-length');
        if (contentType?.startsWith('image/') && (!contentLength || parseInt(contentLength) > 1000)) {
          return url;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function main() {
  console.log('🔍 Fetching all brands from database...');
  const brands = await fetchAllBrands();
  console.log(`📦 Found ${brands.length} brands`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const brand of brands) {
    if (brand.logo_url) {
      console.log(`⏭️  ${brand.name} - already has logo`);
      skipped++;
      continue;
    }

    console.log(`🔎 Searching logo for: ${brand.name}...`);
    const logoUrl = await tryFetchLogo(brand);

    if (logoUrl) {
      try {
        await updateBrandLogo(brand.id, logoUrl);
        console.log(`✅ Updated ${brand.name} with logo: ${logoUrl}`);
        updated++;
      } catch (e) {
        console.error(`❌ Failed to update ${brand.name}:`, e);
        failed++;
      }
    } else {
      console.log(`⚠️  No logo found for ${brand.name}`);
      failed++;
    }

    // Be nice to APIs
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped (already had logo): ${skipped}`);
  console.log(`   ❌ Failed/No logo found: ${failed}`);
  console.log(`   📦 Total: ${brands.length}`);
}

main().catch(console.error);