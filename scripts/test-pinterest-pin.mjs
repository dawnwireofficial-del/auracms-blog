#!/usr/bin/env node
/**
 * Live Pinterest end-to-end test for DawnWire auto-pin.
 *
 * Exercises the exact flow the extension + server scheduler use:
 *   1. Fetch the active Pinterest credential from the DawnWire account
 *   2. Pick a real published product from the public API
 *   3. Resolve the niche board for that product's category
 *   4. POST a pin to Pinterest API v5 (deep-linked to the DawnWire review page)
 *   5. Report the pin URL for verification
 *
 * Prereqs: a valid Pinterest access token + board ID saved in the dashboard
 * (Admin → Social Media → Settings → Pinterest), and an admin token for the
 * credential fetch. Or pass them directly:
 *
 *   PINTEREST_TOKEN=... PINTEREST_BOARD=... node scripts/test-pinterest-pin.mjs
 *
 * Flags:
 *   --product <slug|id>   pin a specific product instead of the top-rated one
 *   --admin-token <tok>   admin token used to fetch the stored credential
 *   --no-cred-fetch       skip the server credential fetch (use env token)
 *   --dry-run             resolve everything but don't create the pin
 */
import 'dotenv/config';

const API = process.env.API_URL || 'https://www.dawnwire.com';
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main() {
  let token = process.env.PINTEREST_TOKEN || '';
  let board = process.env.PINTEREST_BOARD || '';

  // 1. Fetch the stored credential from the DawnWire account (same endpoint the
  //    extension background uses).
  if (!args.includes('--no-cred-fetch')) {
    const adminToken = getArg('--admin-token') || process.env.ADMIN_TOKEN || '';
    if (adminToken) {
      const res = await fetch(`${API}/api/admin/social-media/credentials/active/pinterest`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          token = data.access_token || token;
          board = data.board_id || board;
          console.log(`✅ Credential fetched from ${API} (profile: ${data.profile_name || 'unknown'})`);
          console.log(`   Recommended category boards: ${(data.category_boards || []).join(', ')}`);
        }
      } else {
        console.warn(`⚠️  Could not fetch credential from server (HTTP ${res.status}) — using env vars`);
      }
    } else {
      console.log('ℹ️  No --admin-token provided; using PINTEREST_TOKEN/PINTEREST_BOARD env vars directly');
    }
  }

  if (!token || !board) {
    console.error('❌ Missing Pinterest credentials. Set PINTEREST_TOKEN + PINTEREST_BOARD, or pass --admin-token.');
    process.exit(1);
  }
  console.log(`🔑 Using token …${token.slice(-8)} → default board ${board}`);

  // 2. Pick a product.
  let product;
  const slug = getArg('--product');
  if (slug) {
    const res = await fetch(`${API}/api/public/product-reviews/slug/${slug}`);
    product = (await res.json()).data || null;
  } else {
    const res = await fetch(`${API}/api/public/product-reviews?limit=10&sort=editor_score&status=published`);
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    product = list[0] || null;
  }
  if (!product) {
    console.error('❌ No published product found to pin.');
    process.exit(1);
  }
  console.log(`📦 Product: ${product.product_name} (score ${product.editor_score || '?'}/10)`);
  console.log(`   Category signals: best_for="${product.best_for || ''}" category="${product.category || ''}"`);
  const image = product.product_image || (product.specs?.gallery || [])[0] || '';
  if (!image) console.warn('⚠️  Product has no image — Pinterest will reject the pin');

  // 3. Resolve the niche board (mirrors server/extension logic).
  const resolved = await resolveBoard(token, board, product);
  console.log(`🎯 Resolved board: ${resolved.name} (${resolved.id})`);

  if (args.includes('--dry-run')) {
    console.log('\n🏁 DRY RUN — no pin created.');
    return;
  }

  // 4. Build the pin (same payload shape as autoPinProduct).
  const title = `${product.product_name} Review — DawnWire Score ${product.editor_score || '?'}/10`.substring(0, 100);
  const link = `${API}/products/${product.slug || product.id}?utm_source=pinterest&utm_medium=social&utm_campaign=auto_social`;
  const description = [
    product.review_summary || '',
    product.final_verdict || '',
    product.best_for ? `Best for: ${product.best_for}` : '',
    product.price ? `Price: $${product.price}` : '',
    product.editor_score ? `DawnWire Editor Score: ${product.editor_score}/10` : '',
    '',
    `🔗 Full review: ${link}`,
    '#ProductReview #BestDeals #AmazonFinds #DawnWire',
  ].filter(Boolean).join('\n').substring(0, 500);

  console.log('\n📌 Creating pin…');
  const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ board_id: resolved.id, title, description, link, image_url: image }),
  });
  const pinData = await pinRes.json();

  if (pinData.code && pinData.code !== 200) {
    console.error(`❌ Pinterest error ${pinData.code}: ${pinData.message || 'unknown'}`);
    if (pinData.code === 401) console.error('   → Token is invalid or expired. Regenerate it at developers.pinterest.com.');
    process.exit(1);
  }

  console.log(`✅ Pin created! ID: ${pinData.id}`);
  console.log(`   URL: https://www.pinterest.com/pin/${pinData.id}/`);
  console.log(`   Link: ${link}`);
  console.log('\n🎉 E2E test PASSED. The same code path runs on every auto-pin.');
}

// ─── Board resolution (mirrors server/pinterest.ts + social-background.js) ───
const KEYWORDS = {
  'beauty-personal-care': 'Beauty', 'home-kitchen': 'Kitchen', electronics: 'Electronics',
  technology: 'Technology', gaming: 'Gaming', 'sports-outdoors': 'Sports', fitness: 'Fitness',
  'baby-products': 'Baby', automotive: 'Automotive', 'toys-games': 'Toys',
  'office-productivity': 'Office', 'ai-software-tools': 'AI',
};
let cache = { at: 0, boards: [] };
async function fetchBoards(token) {
  if (Date.now() - cache.at < 5 * 60 * 1000) return cache.boards;
  const boards = [];
  let bookmark = null;
  try {
    do {
      const url = new URL('https://api.pinterest.com/v5/boards');
      url.searchParams.set('page_size', '100');
      if (bookmark) url.searchParams.set('bookmark', bookmark);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) break;
      const data = await res.json();
      for (const b of data.items || []) if (b?.id && b?.name) boards.push({ id: b.id, name: b.name });
      bookmark = data?.bookmark || null;
    } while (bookmark && boards.length < 500);
  } catch (e) { console.warn('board fetch failed:', e.message); }
  cache = { at: Date.now(), boards };
  return boards;
}
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
async function resolveBoard(token, defaultBoardId, product) {
  const signals = [];
  if (product.best_for) signals.push(String(product.best_for));
  if (product.category) signals.push(String(product.category));
  if (product.specs?.details?.department) signals.push(String(product.specs.details.department));
  if (product.specs?.details?.category) signals.push(String(product.specs.details.category));
  for (const [slug, word] of Object.entries(KEYWORDS)) {
    if (String(product.category || '').includes(slug)) signals.push(word);
  }
  const boards = await fetchBoards(token);
  if (signals.length === 0 || boards.length === 0) {
    return boards.find((b) => b.id === defaultBoardId) || { id: defaultBoardId, name: '(default)' };
  }
  let best = null, bestScore = 0;
  for (const board of boards) {
    const name = norm(board.name);
    let score = 0;
    for (const signal of signals) {
      const n = norm(signal);
      if (!n) continue;
      for (const tok of n.split(' ')) { if (tok.length >= 3 && name.includes(tok)) score += 1; }
      if (name.includes(n)) score += 2;
    }
    if (score > bestScore) { bestScore = score; best = board; }
  }
  return bestScore >= 1 && best ? best : (boards.find((b) => b.id === defaultBoardId) || { id: defaultBoardId, name: '(default)' });
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });