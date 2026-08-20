#!/usr/bin/env npx tsx
/**
 * Brand Logo Fetcher
 *
 * Fetches brand logos from known domains and stores them as imgbb URLs.
 * For brands without a known domain, generates letter-based avatars.
 *
 * Usage: npx tsx scripts/fetch-brand-logos.ts [--limit N] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || 'https://kbfngsmaikmuqplsoafw.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--limit') || '0');

// Well-known brand → domain mappings
const BRAND_DOMAINS: Record<string, string> = {
  'Apple': 'apple.com', 'Samsung': 'samsung.com', 'Logitech': 'logitech.com',
  'Razer': 'razer.com', 'Dell': 'dell.com', 'HP': 'hp.com', 'Lenovo': 'lenovo.com',
  'Sony': 'sony.com', 'Canon': 'canon.com', 'Epson': 'epson.com',
  'TP-Link': 'tp-link.com', 'Corsair': 'corsair.com', 'Anker': 'anker.com',
  'CeraVe': 'cerave.com', 'Cetaphil': 'cetaphil.com', 'Garnier': 'garnier.com',
  'Vaseline': 'vaseline.com', 'Dove': 'dove.com', 'Swiffer': 'swiffer.com',
  'Reynolds': 'reynoldsbrands.com', 'KitchenAid': 'kitchenaid.com',
  'Vitamix': 'vitamix.com', 'Cuisinart': 'cuisinart.com', 'OXO': 'oxo.com',
  'Yeti': 'yeti.com', 'Carhartt': 'carhartt.com', 'Coleman': 'coleman.com',
  'Brother': 'brother.com', 'Western Digital': 'westerndigital.com',
  'Crucial': 'crucial.com', 'Seagate': 'seagate.com', 'SanDisk': 'sandisk.com',
  'ASUS ROG': 'rog.asus.com', 'GIGABYTE': 'gigabyte.com',
  'AMD Ryzen': 'amd.com', 'NVIDIA': 'nvidia.com',
  'Philips': 'philips.com', 'BLACK+DECKER': 'blackanddecker.com',
  'Spalding': 'spalding.com', 'Wilson': 'wilson.com',
  'EltaMD': 'eltamd.com', 'Supergoop': 'supergoop.com',
  'Tree Hut': 'treehut.com', 'The Ordinary': 'theordinary.com',
  'Sunday Riley': 'sundayriley.com', 'Dr Teal': 'd rteals.com',
  'Beauty of Joseon': 'beautyofjoseon.com', 'BIODANCE': 'biodance.com',
  'Cosori': 'cosori.com', 'CHEFMAN': 'chefman.com',
  'Amazon Basics': 'amazon.com', 'Amazon Renewed': 'amazon.com',
  'Logitech G': 'logitechg.com', 'Razer Viper': 'razer.com',
  'Samsung SSD': 'samsung.com', 'ROVE': 'roverdc.com',
  'StarTech.com': 'startech.com', 'UGREEN': 'ugreen.com',
  'Redragon': 'redragon.com', 'SABRENT': 'sabrent.com',
  'Dell': 'dell.com', 'Etekcity': 'etekcity.com',
  'e.l.f.': 'elfcosmetics.com', 'Aesop': 'aesop.com',
  'EOS': 'eosproducts.com', 'ROCKET CHEF': 'walmart.com',
  'Spice Shelf': 'spicyshelf.com', 'Biodance': 'biodance.com',
  'Acer': 'acer.com', 'ASUS': 'asus.com', 'Bose': 'bose.com',
  'Brother': 'brother.com', 'Canon': 'canon.com', 'Coleman': 'coleman.com',
  'Corsair': 'corsair.com', 'Crucial': 'crucial.com', 'Cuisinart': 'cuisinart.com',
  'Dell': 'dell.com', 'Epson': 'epson.com', 'Etekcity': 'etekcity.com',
  'GIGABYTE': 'gigabyte.com', 'HP': 'hp.com', 'Lenovo': 'lenovo.com',
  'Logitech': 'logitech.com', 'OXO': 'oxo.com', 'Philips': 'philips.com',
  'Redragon': 'redragon.com', 'ROVE': 'rove.com', 'SABRENT': 'sabrent.com',
  'Samsung': 'samsung.com', 'SanDisk': 'sandisk.com', 'Seagate': 'seagate.com',
  'Sony': 'sony.com', 'StarTech.com': 'startech.com', 'TP-Link': 'tp-link.com',
  'UGREEN': 'ugreen.com', 'Verbatim': 'verbatim.com', 'Vitamix': 'vitamix.com',
  'Western Digital': 'westerndigital.com', 'Xbox': 'xbox.com',
  'Carhartt': 'carhartt.com', 'Spalding': 'spalding.com', 'Wilson': 'wilson.com',
  'Swiffer': 'swiffer.com', 'Reynolds': 'reynoldsbrands.com',
  'KitchenAid': 'kitchenaid.com', 'Black+Decker': 'blackanddecker.com',
  'e.l.f.': 'elfcosmetics.com', 'Aesop': 'aesop.com',
  'EltaMD': 'eltamd.com', 'Supergoop': 'supergoop.com',
  'The Ordinary': 'theordinary.com', 'Tree Hut': 'treehut.com',
  'Samsung SSD': 'samsung.com', 'ASUS ROG': 'rog.asus.com',
  'AMD Ryzen': 'amd.com', 'NVIDIA': 'nvidia.com',
  'Cosori': 'cosori.com', 'Cerave': 'cerave.com',
  'Garnier': 'garnier.com', 'Vaseline': 'vaseline.com',
  'Logitech G': 'logitechg.com', 'Razer Viper': 'razer.com',
  'Razer Basilisk': 'razer.com', 'Razer Cobra': 'razer.com',
  'Razer Naga': 'razer.com',
  'Dove Body': 'dove.com', 'Canon': 'canon.com',
  'Brother Genuine': 'brother.com', 'Cool Toner': 'cooltoner.com',
  'Sceptre': 'sceptre.com', 'Gaiatop': 'gaiatop.com',
  'WOLFBOX': 'wolfbox.com', 'DEKAVA': 'dekava.com',
  'Spring Chef': 'springchef.com', 'MUeller': 'muellers.com',
  'Koonie': 'koonie.com', 'Quntis': 'quntis.com',
  'BIODANCE': 'biodance.com', 'CeraVe': 'cerave.com',
  'Medicube': 'medicube.com', 'Celimax': 'celimax.com',
  'VT Cosmetics': 'vtcosmetics.com', 'AXIS-Y': 'axis-y.com',
  'Torriden': 'torriden.com', 'TOSOWOONG': 'tosowoong.com',
  'Dr.Althea': 'dralthea.com', 'Dr.Melaxin': 'drmelaxin.com',
  'The INKEY List': 'theinkeylist.com', 'eos': 'eosproducts.com',
  'Aquaphor': 'aquaphor.com', 'Banana Boat': 'bananaboat.com',
  'Cetaphil': 'cetaphil.com', 'Olaplex': 'olaplex.com',
  'Sunday Riley': 'sundayriley.com', 'TruSkin': 'truskin.com',
  'Vanicream': 'vanicream.com', 'Eminence': 'eminenceorganics.com',
  'SkinMedica': 'skinmedica.com', 'Colorescience': 'colorescience.com',
  'Replenix': 'replenix.com', 'La Roche-Posay': 'laroche-posay.com',
  'Olay': 'olay.com', 'Neutrogena': 'neutrogena.com',
  'Himalaya': 'himalayawellness.com', 'Dr Teal': 'd rteals.com',
  'Shea Moisture': 'sheamoisture.com', 'RENPURE': 'renpure.com',
  'Suave': 'suave.com', 'Pantene': 'pantene.com',
  'Head Shoulders': 'headandshoulders.com', 'Curel': 'curel.com',
  'Aveeno': 'aveeno.com', 'Bioderma': 'bioderma.com',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function uploadToImgBB(b64: string): Promise<string | null> {
  if (!IMGBB_KEY) return null;
  try {
    const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: b64 }),
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await resp.json();
    return data.success ? data.data.url : null;
  } catch { return null; }
}

async function fetchLogoFromDomain(domain: string): Promise<Buffer | null> {
  try {
    // Try common logo paths
    const paths = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png'];
    for (const path of paths) {
      const resp = await fetch(`https://${domain}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
        redirect: 'follow',
      });
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.length > 200) return buf; // Skip tiny/empty favicons
      }
    }
    return null;
  } catch { return null; }
}

function generateLetterSVG(name: string): string {
  const colors = ['#246BFF', '#FF8A00', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#F59E0B', '#EC4899'];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const bg = colors[colorIdx];
  const letter = name.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="24" fill="${bg}"/>
    <text x="64" y="72" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,sans-serif" font-size="56" font-weight="700">${letter}</text>
  </svg>`;
  return Buffer.from(svg).toString('base64');
}

async function main() {
  console.log('=== Brand Logo Fetcher ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT || 'ALL'}`);
  console.log(`imgbb: ${IMGBB_KEY ? 'SET' : 'MISSING'}\n`);

  const sb = createClient(SB_URL, SB_KEY);

  // Fetch all brands without logos
  let query = sb.from('brands').select('id, name, slug, logo_url').is('logo_url', null).order('name');
  if (LIMIT) query = query.limit(LIMIT);

  const { data: brands, error } = await query;
  if (error) { console.error('DB error:', error); process.exit(1); }

  console.log(`Found ${brands?.length || 0} brands without logos\n`);

  let stats = { total: 0, domain: 0, generated: 0, failed: 0 };

  for (const brand of brands || []) {
    stats.total++;
    const name = brand.name || '';

    // Try to find a domain mapping
    const domain = BRAND_DOMAINS[name] || BRAND_DOMAINS[name.toLowerCase()];

    if (domain) {
      const buf = await fetchLogoFromDomain(domain);
      if (buf) {
        const b64 = buf.toString('base64');
        if (DRY_RUN) {
          console.log(`[${stats.total}] ${name} → ${domain} (would upload ${buf.length} bytes)`);
          stats.domain++;
        } else {
          const url = await uploadToImgBB(b64);
          if (url) {
            await sb.from('brands').update({ logo_url: url }).eq('id', brand.id);
            console.log(`[${stats.total}] ${name} → ${url}`);
            stats.domain++;
          } else {
            console.log(`[${stats.total}] ${name} → imgbb upload failed`);
            stats.failed++;
          }
        }
        await sleep(300);
        continue;
      }
    }

    // Fallback: generate letter avatar
    if (DRY_RUN) {
      console.log(`[${stats.total}] ${name} → letter avatar (would generate)`);
      stats.generated++;
    } else {
      const svgB64 = generateLetterSVG(name);
      const url = await uploadToImgBB(svgB64);
      if (url) {
        await sb.from('brands').update({ logo_url: url }).eq('id', brand.id);
        console.log(`[${stats.total}] ${name} → ${url}`);
        stats.generated++;
      } else {
        stats.failed++;
      }
      await sleep(300);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${stats.total}`);
  console.log(`From domain: ${stats.domain}`);
  console.log(`Letter avatars: ${stats.generated}`);
  console.log(`Failed: ${stats.failed}`);
}

main().catch(console.error);
