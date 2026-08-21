#!/usr/bin/env npx tsx
/**
 * Fix Product Categories Script
 *
 * 1. Creates missing categories (School Supplies, Books, Fashion, etc.)
 * 2. Re-categorizes all 835 products based on keyword analysis
 * 3. Identifies back-to-school products
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const sb = createClient(SB_URL, SB_KEY);

// New categories to create
const NEW_CATEGORIES = [
  { name: 'School & Office Supplies', slug: 'school-office-supplies', description: 'Pencils, notebooks, organizers, calculators, and all school essentials' },
  { name: 'Bags & Backpacks', slug: 'bags-backpacks', description: 'Backpacks, laptop bags, travel bags, and carrying cases' },
  { name: 'Books & Reading', slug: 'books-reading', description: 'Books, reading materials, bookmarks, and book accessories' },
  { name: 'Fashion & Clothing', slug: 'fashion-clothing', description: 'Clothing, hoodies, shoes, and fashion accessories' },
  { name: 'Health & Wellness', slug: 'health-wellness', description: 'Health products, supplements, first aid, and wellness items' },
  { name: 'Computer Accessories', slug: 'computer-accessories', description: 'Keyboards, mice, cables, hubs, monitors, and PC components' },
  { name: 'Kitchen Appliances', slug: 'kitchen-appliances', description: 'Air fryers, blenders, coffee makers, and small kitchen appliances' },
  { name: 'Art & Craft Supplies', slug: 'art-craft-supplies', description: 'Drawing kits, sketchbooks, paint sets, and craft materials' },
  { name: 'Pet Supplies', slug: 'pet-supplies', description: 'Pet food, toys, grooming, and accessories' },
  { name: 'Cleaning & Home', slug: 'cleaning-home', description: 'Cleaning supplies, organizers, storage, and home improvement' },
];

// Category matching rules — ordered by priority (first match wins)
const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  // School & Office Supplies
  { keywords: ['pencil', 'notebook', 'calculator', 'eraser', 'ruler', 'scissors', 'glue stick', 'marker', 'crayon', 'sharpener', 'folder', 'binder', 'backpack school', 'school supply', 'school kit', 'student kit', 'school essentials', 'index card', 'sticky note', 'tape dispenser', 'stapler', 'paper clip', 'binder clip', 'ruler', 'protractor', 'compass geometry', 'lunch box school', 'lunch bag', 'pencil case', 'desk organizer student', 'planner 202', 'academic planner'], category: 'School & Office Supplies' },

  // Back-to-school specific
  { keywords: ['back to school', 'back-to-school', 'college', 'dorm', 'student', 'textbook', 'campus', 'fraternity', 'sorority', 'semester', 'freshman', 'sophomore'], category: 'School & Office Supplies' },

  // Bags & Backpacks
  { keywords: ['backpack', 'laptop bag', 'messenger bag', 'travel bag', 'duffel', 'carry-on', 'rolling luggage', 'tote bag', 'fanny pack', 'crossbody bag', 'sling bag', 'weekender', 'garment bag', 'bookbag'], category: 'Bags & Backpacks' },

  // Books
  { keywords: ['romance', 'novel', 'book', 'kindle', 'reading', 'fiction', 'nonfiction', 'manga', 'comic', 'graphic novel', 'journal', 'memoir', 'biography', 'cookbook', 'coloring book', 'activity book', 'word search', 'crossword', 'trivia', 'story', 'tutor', 'giver', 'stalker', 'jitters', 'restart'], category: 'Books & Reading' },

  // Fashion & Clothing
  { keywords: ['hoodie', 'sweatshirt', 't-shirt', 'tee', 'jeans', 'pants', 'shorts', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'cardigan', 'leggings', 'yoga pants', 'activewear', 'athletic', 'socks', 'underwear', 'shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'clog', 'crocs', 'adidas', 'skechers', 'clothing', 'outfit', 'womens fashion', 'mens fashion', 'hat', 'cap', 'beanie', 'scarf', 'glove', 'belt', 'watch band', 'sunglasses'], category: 'Fashion & Clothing' },

  // Health & Wellness
  { keywords: ['vitamin', 'supplement', 'protein', 'first aid', 'bandage', 'thermometer', 'blood pressure', 'pulse oximeter', 'massager', 'heating pad', 'ice pack', 'sunscreen', 'insect repellent', 'hand sanitizer', 'mask', 'face mask surgical', 'medicine', 'pain relief', 'tens unit', 'yoga mat', 'meditation', 'aromatherapy', 'essential oil diffuser', 'humidifier', 'neti pot', 'eye drops', 'ear wax', 'dental', 'teeth whitening', 'electric toothbrush', 'floss', 'mouthwash', 'tongue scraper', 'sleep aid', 'melatonin', 'neck pillow travel'], category: 'Health & Wellness' },

  // Beauty & Personal Care
  { keywords: ['moisturizer', 'serum', 'cleanser', 'toner', 'sunscreen face', 'makeup', 'foundation', 'concealer', 'mascara', 'lipstick', 'eyeshadow', 'blush', 'beauty blender', 'skincare', 'anti-aging', 'collagen', 'retinol', 'vitamin c serum', 'hyaluronic', 'peptide', 'salicylic', 'benzoyl', 'acne', 'pimple', 'blackhead', 'pore', 'face mask beauty', 'sheet mask', 'eye cream', 'eye patch', 'eye mask', 'nail', 'hair', 'shampoo', 'conditioner', 'hair dryer', 'straightener', 'curling iron', 'beard', 'shaving', 'deodorant', 'perfume', 'cologne', 'fragrance', 'lotion', 'body wash', 'bath bomb', 'candle scented', 'cotton swab', 'cotton pad', 'makeup remover', 'micellar', 'toner pad', 'cleansing foam', 'sunstick', 'lip balm', 'hand cream', 'body scrub', 'facial cleansing', 'toner pads', 'cosmetic', 'makeup bag', 'makeup organizer', 'mirror vanity', 'beauty tool', 'facial steamer', 'derma roller', 'gua sha', 'face roller'], category: 'Beauty & Personal Care' },

  // Electronics
  { keywords: ['cable', 'charger', 'adapter', 'hub', 'dongle', 'monitor', 'tv', 'speaker', 'headphone', 'earbud', 'airpod', 'earphone', 'microphone', 'webcam', 'camera', 'dash cam', 'security camera', 'ring light', 'tripod', 'selfie stick', 'power bank', 'battery', 'usb', 'hdmi', 'displayport', 'ethernet', 'wifi', 'router', 'modem', 'smart watch', 'smartwatch', 'fitness tracker', 'kindle', 'tablet', 'ipad', 'fire stick', 'roku', 'chromecast', 'alexa', 'echo', 'google home', 'smart plug', 'smart bulb', 'smart home', 'robot vacuum', 'vacuum', 'blender', 'coffee maker', 'espresso', 'toaster', 'rice cooker', 'instant pot', 'pressure cooker', 'slow cooker', 'air fryer', 'food processor', 'mixer', 'juicer', 'kettle', 'water filter', 'purifier', 'fan', 'heater', 'ac', 'air conditioner', 'dehumidifier', 'humidifier', 'space heater', 'iron clothes', 'steamer clothes', 'sewing machine', 'lint roller', 'flashlight', 'lantern', 'headlamp', 'drone', 'gopro', 'ipod', 'mp3', 'projector', 'screen protector', 'phone case', 'iphone', 'samsung', 'galaxy', 'pixel', 'macbook', 'laptop', 'desktop', 'pc', 'monitor arm', 'standing desk converter', 'usb c', 'lightning', 'wireless charging', 'magsafe', 'bluetooth', 'anker', 'belkin', 'logitech', 'razer', 'corsair', 'amd ryzen', 'intel', 'nvidia', 'geforce', 'graphics card', 'ram', 'ssd', 'hdd', 'processor', 'cpu', 'gpu', 'motherboard', 'power supply', 'case pc', 'keyboard', 'mouse', 'mousepad', 'gaming chair', 'desk', 'monitor stand', 'ergonomic wrist', 'palm rest', 'extension cord', 'power strip', 'surge protector', 'outlet', 'plug', 'inverter'], category: 'Electronics' },

  // Computer Accessories (subset of electronics for peripherals)
  { keywords: ['keyboard', 'mouse', 'mousepad', 'wrist rest', 'palm rest', 'monitor stand', 'laptop stand', 'laptop riser', 'cable management', 'cable tray', 'cable clip', 'cable sleeve', 'webcam cover', 'privacy screen', 'blue light glasses', 'ergonomic', 'office chair', 'desk mat', 'desk pad'], category: 'Computer Accessories' },

  // Kitchen & Home
  { keywords: ['air fryer basket', 'oven', 'can opener', 'bottle brush', 'mason jar', 'pitcher', 'cutting board', 'knife', 'spatula', 'tongs', 'whisk', 'measuring cup', 'measuring spoon', 'mixing bowl', 'bakeware', 'cake pan', 'muffin', 'cookie sheet', 'silicone mat', 'trivet', 'coaster', 'placemat', 'tablecloth', 'napkin', 'dish rack', 'drying mat', 'sponge', 'dish soap', 'trash bag', 'garbage bag', 'storage container', 'food container', 'baggie', 'foil', 'plastic wrap', 'parchment paper', 'chip clip', 'bag clip', 'wine opener', 'corkscrew', 'ice cube', 'coffee mug', 'travel mug', 'water bottle', 'thermos', 'tumbler', 'straw', 'coaster', 'towel kitchen', 'apron', 'oven mitt', 'potholder', 'spice rack', 'seasoning', 'salt', 'pepper', 'cookbook', 'recipe'], category: 'Kitchen & Home' },

  // Cleaning & Home
  { keywords: ['cleaning', 'vacuum', 'mop', 'broom', 'dustpan', 'duster', 'compressed air', 'wipes', 'disinfectant', 'bleach', 'detergent', 'fabric softener', 'stain remover', 'odor eliminator', 'air freshener', 'candle', 'fairy lights', 'led strip', 'curtain', 'shower curtain', 'bath mat', 'rug', 'doormat', 'hanger', 'organizer', 'storage bin', 'shoe rack', 'closet', 'drawer', 'shelf', 'hook', 'wall mount', 'adhesive', 'command strip', 'velcro', 'hook and loop', 'flashlight', 'lantern', 'extension cord 10', 'power strip surge', 'outlet extender'], category: 'Cleaning & Home' },

  // Kitchen Appliances (specific)
  { keywords: ['air fryer', 'blender', 'coffee maker', 'espresso machine', 'toaster', 'toaster oven', 'rice cooker', 'instant pot', 'pressure cooker', 'slow cooker', 'food processor', 'stand mixer', 'hand mixer', 'juicer', 'kettle electric', 'water purifier', 'water filter pitcher', 'ice maker', 'bread maker', 'sous vide', 'waffle maker', 'panini press', 'grill electric', 'smokeless', 'induction cooktop', 'hot plate'], category: 'Kitchen Appliances' },

  // Art & Craft Supplies
  { keywords: ['art supply', 'sketch', 'drawing', 'paint', 'canvas', 'easel', 'brush', 'colored pencil', 'watercolor', 'acrylic', 'oil paint', 'pastel', 'charcoal', 'marker art', 'pen set', 'ink', 'calligraphy', 'watercolor palette', 'sketchbook', 'sketch pad', 'drawing pad', 'craft', 'glue gun', 'hot glue', 'bead', 'string', 'yarn', 'knitting', 'crochet', 'embroidery', 'sewing kit', 'fabric', 'ribbon', 'sticker', 'scrapbook', 'stamp', 'die cut', 'silhouette', 'crayola', 'crayon', 'model kit', 'lego', 'building block'], category: 'Art & Craft Supplies' },

  // Fitness & Sports
  { keywords: ['dumbbell', 'kettlebell', 'resistance band', 'pull up bar', 'push up', 'ab roller', 'jump rope', 'yoga', 'pilates', 'gym', 'workout', 'exercise', 'fitness', 'running', 'cycling', 'swimming', 'hiking', 'camping', 'tent', 'sleeping bag', 'backpack hiking', 'waterproof backpack', 'cooler', 'camping chair', 'hammock', 'binoculars', 'compass', 'fire starter', 'water bottle sport', 'compression', 'arm sleeve', 'knee brace', 'ankle brace', 'wrist wrap', 'weight lifting', 'barbell', 'bench', 'squat rack', 'treadmill', 'elliptical', 'bike', 'surf', 'skateboard', 'scooter', 'fishing', 'hunting', 'golf', 'tennis', 'basketball', 'soccer', 'football', 'baseball'], category: 'Sports & Outdoors' },

  // Toys & Games
  { keywords: ['toy', 'game', 'puzzle', 'board game', 'card game', 'plush', 'stuffed animal', 'action figure', 'doll', 'barbie', 'lego', 'building', 'stem', 'educational toy', 'remote control car', 'drone toy', 'play dough', 'slime', 'fidget', 'spinner', 'rubik', 'cube puzzle', 'LEGO', 'magnetic tile', 'playset', 'dollhouse', 'train set', 'hot wheels', 'nerf', 'paintball', 'nerf gun'], category: 'Toys & Games' },

  // Gaming
  { keywords: ['gaming', 'controller', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'switch', 'steam deck', 'gaming headset', 'gaming keyboard', 'gaming mouse', 'gaming monitor', 'gaming chair', 'game pad', 'joystick', 'vr headset', 'oculus', 'meta quest', 'gaming mousepad', 'rgb', 'gaming laptop'], category: 'Gaming' },

  // Baby Products
  { keywords: ['baby', 'infant', 'toddler', 'newborn', 'stroller', 'car seat', 'crib', 'bassinet', 'diaper', 'wipes baby', 'baby monitor', 'pacifier', 'bottle baby', 'burp cloth', 'baby carrier', 'swaddle', 'onesie', 'baby clothes', 'kids', 'child', 'little kid', 'big kid'], category: 'Baby Products' },

  // Automotive
  { keywords: ['car', 'auto', 'vehicle', 'truck', 'suv', 'motorcycle', 'tire', 'wheel', 'seat cover', 'floor mat', 'dash cam', 'car charger', 'car mount', 'phone holder car', 'windshield', 'wiper', 'air freshener car', 'trunk organizer', 'car vacuum', 'jump starter', 'obd', 'diagnostic', 'car wash', 'wax', 'polish', 'car cover', 'parking sensor', 'blind spot', 'backup camera', 'gps tracker car'], category: 'Automotive' },

  // AI & Software Tools
  { keywords: ['software', 'app', 'subscription', 'saas', 'cloud', 'vpn', 'antivirus', 'password manager', 'backup', 'encryption', 'ai tool', 'chatgpt', 'copilot', 'grammarly', 'canva', 'adobe', 'photoshop', 'premiere', 'da vinci', 'logic pro', 'ableton', 'office 365', 'microsoft 365', 'google workspace', 'notion', 'slack', 'zoom', 'teams'], category: 'AI & Software Tools' },

  // Office & Productivity
  { keywords: ['desk', 'chair office', 'file cabinet', 'bookshelf', 'whiteboard', 'corkboard', 'nameplate', 'pen holder', 'paper tray', 'label maker', 'laminator', 'shredder', 'scanner', 'printer', 'ink cartridge', 'toner', 'paper ream', 'envelope', 'stamp office', 'wax seal', 'desk lamp', 'task light', 'standing desk', 'monitor arm', 'ergonomic chair', 'lumbar support', 'footrest'], category: 'Office & Productivity' },
];

// Trash categories to merge
const MERGE_MAP: Record<string, string> = {
  'Alpha Male Romance': 'Books & Reading',
  'Children\'s Humor': 'Books & Reading',
  'College Guides': 'School & Office Supplies',
  'Historical Fantasy': 'Books & Reading',
  'Girls\' Skirt Sets': 'Fashion & Clothing',
  'Women\'s Fashion Hoodies': 'Fashion & Clothing',
  'Facial Cleansing Washes': 'Beauty & Personal Care',
  'Eye Masks': 'Beauty & Personal Care',
  'Body Scrubs & Treatments': 'Beauty & Personal Care',
  'unisex-adult': 'Fashion & Clothing',
  'Business': 'Books & Reading',
  'Technology': 'Electronics',
  'Lifestyle': 'Fashion & Clothing',
  'SEO & Marketing': 'AI & Software Tools',
};

function matchCategory(productName: string, bestFor: string, currentCat: string): string {
  const text = `${productName} ${bestFor || ''}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return rule.category;
      }
    }
  }
  return currentCat || 'Electronics'; // default fallback
}

async function main() {
  console.log('=== Product Category Fix ===\n');

  // Step 1: Get existing categories
  const { data: existingCats } = await sb.from('categories').select('id, name, slug');
  const catByName = new Map<string, any>();
  existingCats?.forEach(c => catByName.set(c.name, c));

  // Step 2: Create missing categories
  console.log('--- Creating missing categories ---');
  const newCatIds: Record<string, string> = {};
  for (const nc of NEW_CATEGORIES) {
    if (catByName.has(nc.name)) {
      console.log(`  ✓ ${nc.name} already exists`);
      newCatIds[nc.name] = catByName.get(nc.name).id;
    } else {
      const id = crypto.randomUUID();
      const { error } = await sb.from('categories').insert({
        id, name: nc.name, slug: nc.slug, description: nc.description,
        status: 'active', sortOrder: 100,
      });
      if (error) {
        console.log(`  ✗ ${nc.name}: ${error.message}`);
      } else {
        console.log(`  + Created: ${nc.name}`);
        newCatIds[nc.name] = id;
      }
    }
  }

  // Refresh category list
  const { data: allCats } = await sb.from('categories').select('id, name, slug');
  const catLookup = new Map<string, string>();
  allCats?.forEach(c => catLookup.set(c.name, c.id));

  // Step 3: Re-categorize all products
  console.log('\n--- Re-categorizing products ---');
  let allProducts: any[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from('product_reviews')
      .select('id, product_name, category_id, best_for')
      .range(offset, offset + 99);
    if (!data?.length) break;
    allProducts = allProducts.concat(data);
    offset += 100;
  }
  console.log(`  Total products: ${allProducts.length}`);

  // Build reverse cat name lookup
  const idToName = new Map<string, string>();
  allCats?.forEach(c => idToName.set(c.id, c.name));

  let updated = 0;
  let unchanged = 0;
  let mergedFromTrash = 0;
  const categoryCounts: Record<string, number> = {};

  for (const p of allProducts) {
    const currentName = idToName.get(p.category_id) || '';

    // Check if current category is a trash category that should be merged
    let newCatName: string;
    if (MERGE_MAP[currentName]) {
      newCatName = MERGE_MAP[currentName];
      mergedFromTrash++;
    } else {
      newCatName = matchCategory(p.product_name || '', p.best_for || '', currentName);
    }

    const newCatId = catLookup.get(newCatName);
    if (!newCatId) {
      console.log(`  ⚠ No cat ID for "${newCatName}" — keeping original`);
      categoryCounts[currentName] = (categoryCounts[currentName] || 0) + 1;
      continue;
    }

    if (newCatId !== p.category_id) {
      const { error } = await sb.from('product_reviews')
        .update({ category_id: newCatId })
        .eq('id', p.id);
      if (error) {
        console.log(`  ✗ Update failed for ${p.product_name?.substring(0, 40)}: ${error.message}`);
      } else {
        updated++;
      }
    } else {
      unchanged++;
    }

    categoryCounts[newCatName] = (categoryCounts[newCatName] || 0) + 1;
  }

  console.log(`\n  Updated: ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Merged from trash categories: ${mergedFromTrash}`);

  // Step 4: Report
  console.log('\n=== FINAL CATEGORY DISTRIBUTION ===');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`  ${name.padEnd(30)}: ${count}`);
    });

  // Step 5: Identify back-to-school products
  const btsKeywords = ['school', 'college', 'dorm', 'student', 'campus', 'notebook', 'pencil', 'backpack', 'calculator', 'planner', 'academic', 'lunch box', 'desk organizer', 'eraser', 'folder', 'binder'];
  const btsProducts = allProducts.filter(p => {
    const text = (p.product_name || '').toLowerCase();
    return btsKeywords.some(kw => text.includes(kw));
  });
  console.log(`\n=== BACK-TO-SCHOOL PRODUCTS (${btsProducts.length}) ===`);
  btsProducts.forEach(p => console.log(`  - ${p.product_name?.substring(0, 70)}`));
}

main().catch(e => { console.error(e); process.exit(1); });
