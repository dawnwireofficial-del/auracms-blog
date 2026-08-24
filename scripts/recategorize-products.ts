#!/usr/bin/env npx tsx
/**
 * Recategorizes published products using strong signals:
 *   1. Amazon BSR text (specs.best_sellers_rank_detail[].category)
 *   2. specs.details.department
 *   3. Product-name keyword rules (weighted)
 * Also merges kitchen-home -> home-kitchen. Only moves products when a
 * different category scores confidently; never guesses into junk drawers.
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ---------- keyword rules (slug -> keywords). Order = tiebreak priority ----------
const RULES: Array<[string, string[]]> = [
  ['school-office-supplies', ['back to school', 'school supplies', 'school kit', 'classroom', 'student', 'teacher', 'crayon', 'colored pencil', 'pencil case', 'pencil pouch', 'mechanical pencil', 'gel pen', 'ballpoint', 'fountain pen', 'dry erase', 'whiteboard marker', 'permanent marker', 'highlighter', 'eraser', 'ruler', 'protractor', 'glue stick', 'pourable glue', 'construction paper', 'index card', 'flash card', 'binder', 'folder', 'filler paper', 'loose leaf', 'composition notebook', 'spiral notebook', 'planner', 'sticker labels', 'sharpener', 'scissors kids', 'safety scissors', 'stapler', 'lunch box', 'lunch bag', 'laminator', 'laminating']],
  ['art-craft-supplies', ['acrylic paint', 'watercolor', 'paint set', 'paint brushes', 'canvas board', 'stretch canvas', 'crochet', 'knitting', 'yarn', 'beads for jewelry', 'jewelry making', 'cricut', 'heat transfer vinyl', 'scrapbook', 'origami', 'craft kit', 'slime kit', 'rock painting', 'diamond painting', 'sketch kit', 'art supplies']],
  ['beauty-personal-care', ['serum', 'moisturizer', 'face wash', 'cleanser', 'toner', 'sheet mask', 'clay mask', 'sunscreen', 'spf ', 'shampoo', 'conditioner', 'hair oil', 'hair mask', 'leave-in', 'lip balm', 'lip gloss', 'lipstick', 'lip liner', 'foundation ', 'mascara', 'eyeliner', 'eyeshadow', 'makeup brush', 'blush ', 'perfume', 'fragrance', 'cologne', 'deodorant', 'body lotion', 'body wash', 'bath bomb', 'bath salt', 'nail polish', 'manicure', 'pedicure', 'collagen mask', 'retinol', 'hyaluronic', 'niacinamide', 'vitamin c serum', 'snail mucin', 'rice toner', 'glycolic', 'salicylic', 'beard oil', 'teeth whitening', 'electric toothbrush', 'water floss', 'mouthwash', 'tongue scraper', 'dermaplane', 'gua sha', 'jade roller', 'hair clipper', 'trimmer men', 'eyebrow', 'lash serum', 'micellar']],
  ['toys-games', ['lego', 'building blocks', 'jigsaw puzzle', 'puzzle for kids', 'board game', 'card game', 'plush', 'stuffed animal', 'action figure', 'doll house', 'rc car', 'nerf', 'play-doh', 'playdoh', 'fidget', "rubik's", 'dice set', 'trading card', 'pokemon', 'toy cars', 'train set', 'montessori', 'wooden toys', 'kids camera', 'bubble machine', 'jump rocket']],
  ['baby-products', ['baby ', 'infant', 'newborn', 'diaper', 'stroller', 'car seat ', 'pacifier', 'onesie', 'crib ', 'bassinet', 'baby bottle', 'baby formula', 'baby monitor', 'high chair', 'baby swing', 'nursery decor', 'diaper bag', 'bib set', 'teething']],
  ['bags-backpacks', ['backpack', 'messenger bag', 'tote bag', 'crossbody', 'handbag', 'purse', 'wallet for women', 'bifold wallet', 'luggage', 'suitcase', 'duffel', 'travel bag', 'fanny pack', 'sling bag', 'laptop sleeve']],
  ['fashion-clothing', ['t-shirt', 'tshirt', ' graphic tee', 'hoodie', 'sweatshirt', ' crewneck', 'cardigan', 'sweater', 'jacket', ' raincoat', ' windbreaker', 'dress for women', 'summer dress', 'jeans', ' joggers', 'leggings', ' shorts', 'skirt', 'socks', 'underwear', 'bra ', 'pajamas', 'sleepwear', 'swimsuit', 'bikini', 'tank top', 'blouse', 'thermal underwear', 'costume', 'scrubs for']],
  ['sports-outdoors', ['dumbbell', 'kettlebell', 'resistance band', 'yoga mat', 'foam roller', 'exercise bike', 'treadmill', 'rowing machine', 'tent ', 'sleeping bag', 'camping chair', 'camping table', 'hammock', 'trekking pole', 'fishing rod', 'tackle box', 'kayak', 'bike lock', 'bike helmet', 'hiking backpack', 'lantern camping', 'jump rope', 'ab roller', 'weight plate', 'bench press', 'pull up bar', 'basketball', 'soccer ball', 'volleyball', 'tennis racket', 'golf ', 'disc golf', 'shaker bottle', 'gym gloves', 'ankle weights', 'ping pong', 'badminton', 'inflatable paddle']],
  ['health-wellness', ['supplement', 'vitamin', 'probiotic', 'protein powder', 'omega-3', 'melatonin', 'magnesium glycinate', 'multivitamin', 'gummy vitamin', 'electrolyte', 'blood pressure monitor', 'pulse oximeter', 'heating pad', 'massager', 'massage gun', 'knee brace', 'posture corrector', 'first aid kit', 'bandage', 'thermometer', 'compression socks', 'insoles', 'foot spa', 'epsom salt', 'aromatherapy diffuser', 'essential oils set']],
  ['cleaning-home', ['mop ', 'spin mop', 'broom', 'dustpan', 'vacuum cleaner', 'robot vacuum', 'carpet cleaner', 'steam cleaner', 'cleaning spray', 'all-purpose cleaner', 'disinfectant', 'microfiber cloth', 'sponge', 'scrub brush', 'toilet brush', 'plunger', 'trash bags', 'garbage bag', 'duster', 'lint roller', 'squeegee', 'rubber gloves', 'laundry detergent', 'fabric softener', 'dryer sheets', 'stain remover', 'dish soap', 'dishwasher pods', 'swiffer', 'magic eraser', 'grout brush', 'crevice brush', 'under sink mat', 'shower caddy', 'lint remover']],
  ['books-reading', ['hardcover', 'paperback', ' novel', 'cookbook', 'memoir', 'biography', 'coloring book', 'activity book', 'chapter book for kids', 'story collection', 'journal with prompts']],
  ['automotive', ['dash cam', 'tire inflator', 'tire pressure gauge', 'wiper blade', 'car wax', 'car wash mitt', 'motor oil', 'car vacuum', 'car seat cover', 'floor mats for car', 'jump starter', 'obd2', 'code reader car', 'car phone mount', 'license plate frame', 'steering wheel cover', 'antifreeze', 'car detailing', 'windshield']],
  ['computer-accessories', ['usb hub', 'docking station', 'webcam', 'monitor stand', 'laptop stand', 'external hard drive', 'ssd ', 'sd card', 'card reader', 'usb flash drive', 'ethernet cable', 'wifi router', 'mesh wifi', 'keyboard and mouse wireless', 'wireless keyboard', 'wireless mouse', 'mouse pad', 'laptop cooler', 'cable management']],
  ['office-productivity', ['label maker', 'paper shredder', 'printer ', 'ink cartridge', 'toner cartridge', 'standing desk', 'desk organizer', 'file cabinet', 'hanging folder', 'envelope ', 'business card holder', 'easel pad', 'time clock', 'drafting chair']],
  ['gaming', ['gaming keyboard', 'gaming mouse', 'gaming headset', 'controller for', 'xbox', 'playstation', 'ps5', 'nintendo switch', 'game console', 'graphics card', 'gaming pc', 'gaming chair', 'capture card', 'steam deck']],
  ['home-kitchen', ['air fryer', 'blender', 'coffee maker', 'espresso machine', 'coffee grinder', 'french press', 'gooseneck kettle', 'electric kettle', 'toaster', 'stand mixer', 'hand mixer', 'food processor', 'cookware set', 'frying pan', 'skillet', 'saucepan', 'stock pot', 'dutch oven', 'wok', 'knife set', 'chef knife', 'cutting board', 'utensil set', 'silicone spatula', 'whisk', 'kitchen tongs', 'measuring cups', 'measuring spoons', 'mixing bowl', 'food storage container', 'mason jar', 'thermos', 'tumbler', 'dinnerware set', 'plate set', 'bowls set', 'mugs set', 'wine glasses', 'ice maker', 'vacuum sealer', 'meat thermometer', 'kitchen scale', 'dish drying rack', 'dish drying mat', 'spice rack', 'oil sprayer', 'mandoline', 'vegetable chopper', 'can opener', 'rolling pin', 'bakeware', 'cake pan', 'cookie sheet', 'muffin tin', 'cupcake liner', 'popcorn maker', 'panini press', 'griddle', 'slow cooker', 'instant pot', 'rice cooker', 'pressure cooker', 'sandwich maker', 'juicer', 'milk frother', 'tea infuser', 'teapot', 'pitcher', 'serving tray', 'placemat', 'curtain', 'throw pillow', 'throw blanket', 'bed sheets', 'comforter', 'humidifier', 'reed diffuser', 'candle set', 'picture frames', 'wall clock', 'doormat', 'shoe rack', 'coat rack', 'over the door organizer', 'closet organizer', 'drawer organizer', 'pantry organizer', 'lazy susan', 'turntable organizer', 'hangers']],
];

// BSR / department text -> our slug
const BSR_MAP: Array<[RegExp, string]> = [
  [/beauty & personal care|skin ?care|hair care|makeup|oral care/i, 'beauty-personal-care'],
  [/grocery & gourmet/i, 'home-kitchen'],
  [/home & kitchen|kitchen & dining|furniture|bedding|home décor|home decor/i, 'home-kitchen'],
  [/office products|office & school/i, 'school-office-supplies'],
  [/arts, crafts|crafts, hobbies|sewing|party & occasions/i, 'art-craft-supplies'],
  [/clothing, shoes|shoes & jewelry|men's fashion|women's fashion/i, 'fashion-clothing'],
  [/luggage & travel gear/i, 'bags-backpacks'],
  [/sports & outdoors|exercise & fitness|outdoor recreation|leisure sports/i, 'sports-outdoors'],
  [/health & household|wellness & relaxation|medical care|household supplies/i, 'health-wellness'],
  [/toys & games/i, 'toys-games'],
  [/baby ?\(born\)|baby products|nursery/i, 'baby-products'],
  [/books|audiobook/i, 'books-reading'],
  [/automotive/i, 'automotive'],
  [/video games|pc gaming|playstation|xbox|nintendo/i, 'gaming'],
  [/computers|computer components|computer accessories|data storage|networking/i, 'computer-accessories'],
  [/camera|photo|audio.*video|headphones|cell phones|phones & accessories|tv |television|gps|wearable technology/i, 'electronics'],
  [/tools & home improvement|hardware|paint|power tools|building supplies/i, 'cleaning-home'],
  [/pet supplies/i, ''],
  [/industrial & scientific|patio, lawn|garden/i, ''],
];

function detect(haystackLower: string): string {
  // 1. Name-keyword scoring
  let best = ''; let bestScore = 0;
  for (const [slug, kws] of RULES) {
    let score = 0;
    for (const kw of kws) {
      if (haystackLower.includes(kw)) score += kw.length > 8 ? 3 : 2;
    }
    if (score > bestScore || (score === bestScore && !best)) { bestScore = score; best = slug; }
  }
  return bestScore >= 2 ? best : '';
}

function detectFromBsr(bsrTexts: string[]): string {
  const joined = bsrTexts.join(' | ').toLowerCase();
  for (const [re, slug] of BSR_MAP) {
    if (re.test(joined) && slug) return slug;
  }
  return '';
}

async function main() {
  const { data: cats } = await sb.from('categories').select('id,name,slug');
  const bySlug = new Map((cats || []).map(c => [c.slug as string, c.id as string]));
  const byId = new Map((cats || []).map(c => [c.id as string, c.slug as string]));

  const { data: prods } = await sb.from('product_reviews').select('id,product_name,category_id,best_for,specs,status').eq('status', 'published');
  const moves: Array<{ id: string; to: string; reason: string }> = [];
  let merged = 0;

  for (const p of prods || []) {
    const curSlug = p.category_id ? byId.get(p.category_id) : null;
    const specs: any = p.specs || {};
    const bsrTexts: string[] = Array.isArray(specs.best_sellers_rank_detail)
      ? specs.best_sellers_rank_detail.map((b: any) => String(b?.category || ''))
      : [];
    const dept = String(specs.details?.department || '');
    const hay = `${String(p.product_name || '')} ${dept}`.toLowerCase();

    // Priority: BSR > name rules
    let target = detectFromBsr(bsrTexts);
    let reason = 'bsr';
    if (!target || target === curSlug) {
      const byName = detect(hay);
      if (byName && byName !== curSlug) { target = byName; reason = 'name'; }
      else if (target === curSlug) target = '';
    }

    // Merge duplicate kitchen-home
    if (curSlug === 'kitchen-home') {
      const hk = bySlug.get('home-kitchen');
      if (hk) {
        moves.push({ id: p.id, to: hk, reason: 'merge kitchen-home' });
        merged++;
        continue;
      }
    }

    if (target && target !== curSlug && bySlug.has(target)) {
      moves.push({ id: p.id, to: bySlug.get(target)!, reason });
    }
  }

  console.log(`planned moves: ${moves.length} (incl ${merged} kitchen-home merges)`);
  const preview: Record<string, number> = {};
  for (const m of moves.slice(0, 500)) {
    const slug = byId.get(m.to) || '?';
    preview[slug] = (preview[slug] || 0) + 1;
  }
  console.log('move targets:', JSON.stringify(preview));

  let done = 0;
  for (const m of moves) {
    const { error } = await sb.from('product_reviews').update({ category_id: m.to }).eq('id', m.id);
    if (error) console.error(`fail ${m.id}:`, error.message);
    else done++;
  }
  console.log(`applied: ${done}/${moves.length}`);

  // Post-run distribution
  const { data: after } = await sb.from('product_reviews').select('category_id').eq('status', 'published');
  const dist = new Map<string, number>();
  for (const r of after || []) {
    const s = byId.get(r.category_id || '') || 'UNCATEGORIZED';
    dist.set(s, (dist.get(s) || 0) + 1);
  }
  console.log('--- new distribution ---');
  for (const [k, v] of [...dist.entries()].sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(4)}  ${k}`);
}

main().catch(console.error);
