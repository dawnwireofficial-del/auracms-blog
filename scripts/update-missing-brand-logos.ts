import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function isRealBrand(name: string): boolean {
  const n = name.trim();
  const lower = n.toLowerCase();
  if (lower.startsWith('by ')) return false;
  if (lower.includes('(author)') || lower.includes('(illustrator)') || lower.includes('(narrator)')) return false;
  if (lower.includes('(publisher)') || lower.includes('(director)') || lower.includes('(actor)')) return false;
  if (lower.includes('format:') || lower.includes('kindle') || lower.includes('paperback') || lower.includes('hardcover') || lower.includes('dvd') || lower.includes('audio')) return false;
  if (lower.includes('rated:')) return false;
  if (n.length > 100) return false;
  if (/^[a-z]{1,2}$/i.test(n)) return false;
  if (/^[A-Z]{2,}\s+[A-Z]{2,}\s+[A-Z]{2,}/.test(n)) return false;
  return true;
}

const KNOWN_DOMAINS: Record<string, string> = {
  'beauty-of-joseon': 'beautyofjoseon.com', 'vaseline': 'vaseline.com', 'cera-ve': 'cerave.com',
  'la-roche-posay': 'laroche-posay.com', 'neutrogena': 'neutrogena.com', 'olay': 'olay.com',
  'loreal': 'loreal.com', 'maybelline': 'maybelline.com', 'revlon': 'revlon.com',
  'covergirl': 'covergirl.com', 'nyx': 'nyxcosmetics.com', 'elf': 'elfcosmetics.com',
  'milk-makeup': 'milkmakeup.com', 'glossier': 'glossier.com', 'fenty-beauty': 'fentybeauty.com',
  'rare-beauty': 'rarebeauty.com', 'huda-beauty': 'hudabeauty.com', 'tatcha': 'tatcha.com',
  'drunk-elephant': 'drunkelephant.com', 'the-ordinary': 'deciem.com', 'paulas-choice': 'paulaschoice.com',
  'skin-ceuticals': 'skinceuticals.com', 'obagi': 'obagi.com', 'aveeno': 'aveeno.com',
  'eucerin': 'eucerin.com', 'cetaphil': 'cetaphil.com', 'vanicream': 'vanicream.com',
  'la-mer': 'lamer.com', 'estee-lauder': 'esteelauder.com', 'clinique': 'clinique.com',
  'origins': 'origins.com', 'kiehls': 'kiehls.com', 'fresh': 'fresh.com', 'belif': 'belif.com',
  'dr-jart': 'drjart.com', 'laneige': 'laneige.com', 'innisfree': 'innisfree.com',
  'etude-house': 'etudehouse.com', 'tonymoly': 'tonymoly.com', 'missha': 'missha.com',
  'cosrx': 'cosrx.com', 'benton': 'benton.com', 'klairs': 'klairs.com', 'dear-klairs': 'klairs.com',
  'some-by-mi': 'somebymi.com', 'purito': 'purito.com', 'iunik': 'iunik.com',
  'mizon': 'mizon.com', 'secret-key': 'secretkey.com', 'holika-holika': 'holikaholika.com',
  'skinfood': 'skinfood.com', 'the-face-shop': 'thefaceshop.com', 'nature-republic': 'naturerepublic.com',
  'sulwhasoo': 'sulwhasoo.com', 'history-of-whoo': 'historyofwhoo.com', 'su-m37': 'su-m37.com',
  'ohui': 'ohui.com', 'hera': 'hera.com', 'iope': 'iope.com', 'mamonde': 'mamonde.com',
  'aveda': 'aveda.com', 'bobbi-brown': 'bobbibrown.com', 'mac': 'maccosmetics.com',
  'urban-decay': 'urbandecay.com', 'too-faced': 'toofaced.com', 'benefit': 'benefitcosmetics.com',
  'nars': 'narscosmetics.com', 'laura-mercier': 'lauramercier.com', 'hourglass': 'hourglasscosmetics.com',
  'charlotte-tilbury': 'charlottetilbury.com', 'pat-mcgrath': 'patmcgrath.com',
  'makeup-forever': 'makeupforever.com', 'sephora': 'sephora.com', 'ulta': 'ulta.com',
  'amazon': 'amazon.com', 'walmart': 'walmart.com', 'target': 'target.com',
  'cvs': 'cvs.com', 'walgreens': 'walgreens.com', 'rite-aid': 'riteaid.com',
  'dyson': 'dyson.com', 'shark': 'sharkclean.com', 'ninja': 'ninjakitchen.com',
  'instant-pot': 'instantpot.com', 'kitchenaid': 'kitchenaid.com', 'cuisinart': 'cuisinart.com',
  'breville': 'breville.com', 'vitamix': 'vitamix.com', 'nutribullet': 'nutribullet.com',
  'krups': 'krups.com', 'delonghi': 'delonghi.com', 'nespresso': 'nespresso.com',
  'keurig': 'keurig.com', 'jura': 'jura.com', 'smeg': 'smeg.com', 'le-creuset': 'lecreuset.com',
  'staub': 'staub.com', 'all-clad': 'all-clad.com', 'calphalon': 'calphalon.com',
  'lodge': 'lodgemfg.com', 'oxo': 'oxo.com', 'joseph-joseph': 'josephjoseph.com',
  'ikea': 'ikea.com', 'wayfair': 'wayfair.com', 'west-elm': 'westelm.com',
  'crate-and-barrel': 'crateandbarrel.com', 'pottery-barn': 'potterybarn.com',
  'williams-sonoma': 'williams-sonoma.com', 'anthropologie': 'anthropologie.com',
  'cb2': 'cb2.com', 'article': 'article.com', 'joybird': 'joybird.com',
  'burrow': 'burrow.com', 'floyd': 'floydhome.com', 'maiden-home': 'maidenhome.com',
  'inside-weather': 'insideweather.com', 'benchmark': 'benchmarkfurniture.com',
  'carlson': 'carlsonfurniture.com', 'la-z-boy': 'la-z-boy.com',
  'ashley': 'ashleyfurniture.com', 'bassett': 'bassetfurniture.com',
  'hookers': 'hookersfurniture.com', 'kincaid': 'kincaidfurniture.com',
  'stickley': 'stickley.com', 'herman-miller': 'hermanmiller.com',
  'steelcase': 'steelcase.com', 'knoll': 'knoll.com', 'humanscale': 'humanscale.com',
  'haworth': 'haworth.com', 'branch': 'branchfurniture.com', 'fully': 'fully.com',
  'uplift': 'upliftdesk.com', 'vari': 'vari.com', 'autonomous': 'autonomous.ai',
  'secretlab': 'secretlab.co', 'noblechairs': 'noblechairs.com', 'dxracer': 'dxracer.com',
  'akracing': 'akracing.com', 'vertagear': 'vertagear.com', 'gtracing': 'gtracing.com',
  'respawn': 'respawnproducts.com', 'corsair': 'corsair.com', 'razer': 'razer.com',
  'logitech': 'logitech.com', 'steelseries': 'steelseries.com', 'hyperx': 'hyperxgaming.com',
  'turtle-beach': 'turtlebeach.com', 'astrogaming': 'astrogaming.com',
  'cooler-master': 'coolermaster.com', 'nzxt': 'nzxt.com', 'fractal-design': 'fractal-design.com',
  'phanteks': 'phanteks.com', 'lian-li': 'lian-li.com', 'be-quiet': 'bequiet.com',
  'noctua': 'noctua.at', 'arctic': 'arctic.de', 'samsung': 'samsung.com',
  'lg': 'lg.com', 'wd': 'wd.com', 'seagate': 'seagate.com', 'toshiba': 'toshiba.com',
  'hitachi': 'hitachi.com', 'crucial': 'crucial.com', 'kingston': 'kingston.com',
  'adata': 'adata.com', 'team-group': 'teamgroup.com.tw', 'g-skill': 'gskill.com',
  'patriot': 'patriotmemory.com', 'sandisk': 'sandisk.com', 'lexar': 'lexar.com',
  'transcend': 'transcend-info.com', 'intel': 'intel.com', 'amd': 'amd.com',
  'nvidia': 'nvidia.com', 'asus': 'asus.com', 'msi': 'msi.com',
  'gigabyte': 'gigabyte.com', 'asrock': 'asrock.com', 'evga': 'evga.com',
  'zotac': 'zotac.com', 'palit': 'palit.com', 'gainward': 'gainward.com',
  'inno3d': 'inno3d.com', 'colorful': 'colorful.cn', 'galax': 'galax.com',
  'kfa2': 'kfa2.com', 'manli': 'manli.com.cn', 'pega': 'pega.com',
  'maxsun': 'maxsun.com.cn', 'yeston': 'yeston.com', 'soyo': 'soyo.com',
  'xfy': 'xfy.com.cn', 'super-flower': 'superflower.com.tw', 'fsp': 'fsp.com.tw',
  'silverstone': 'silverstonetek.com', 'antec': 'antec.com', 'seasonic': 'seasonic.com',
  'thermaltake': 'thermaltake.com', 'deepcool': 'deepcool.com',
  'apple': 'apple.com', 'microsoft': 'microsoft.com', 'google': 'google.com',
  'meta': 'meta.com', 'dell': 'dell.com', 'hp': 'hp.com', 'lenovo': 'lenovo.com',
  'acer': 'acer.com', 'sony': 'sony.com', 'panasonic': 'panasonic.com',
  'sharp': 'sharp.com', 'hisense': 'hisense.com', 'tcl': 'tcl.com',
  'vizio': 'vizio.com', 'roku': 'roku.com',
};

function normalizeBrandName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function guessDomain(name: string): string {
  const normalized = normalizeBrandName(name);
  return KNOWN_DOMAINS[normalized] || `${normalized}.com`;
}

async function tryFetchLogo(brand: any): Promise<string | null> {
  const domain = guessDomain(brand.name);
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
  return null;
}

async function main() {
  console.log('🔍 Fetching brands needing logos (no logo_url, active, real brands)...\n');
  
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url, status')
    .is('logo_url', null)
    .eq('status', 'active')
    .order('name');

  if (error) throw error;

  const realBrands = (brands || []).filter(b => isRealBrand(b.name));
  console.log(`🎯 ${realBrands.length} active real brands need logos\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < realBrands.length; i++) {
    const brand = realBrands[i];
    if ((i + 1) % 20 === 0) console.log(`📈 Progress: ${i + 1}/${realBrands.length}`);

    const logoUrl = await tryFetchLogo(brand);
    if (logoUrl) {
      try {
        const { error } = await supabase
          .from('brands')
          .update({ logo_url: logoUrl })
          .eq('id', brand.id);
        if (!error) {
          console.log(`✅ ${brand.name} → ${logoUrl}`);
          updated++;
        } else {
          console.error(`❌ ${brand.name} update failed:`, error.message);
          failed++;
        }
      } catch (e) {
        console.error(`❌ ${brand.name} error:`, e);
        failed++;
      }
    } else {
      failed++;
    }

    if (i % 15 === 0) await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n📊 Logo Update Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Failed/No logo: ${failed}`);
  console.log(`   📦 Total processed: ${realBrands.length}`);
}

main().catch(console.error);