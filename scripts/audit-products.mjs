// Phase 2a/3 audit: how many products are missing category / best_for /
// affiliate tags / images / editor score — and per-category product counts.
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'srv1932.hstgr.io',
  port: +(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'u916810702_dawnwire',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'u916810702_dawnwire',
});

const [tot] = await db.query(`SELECT COUNT(*) c FROM product_reviews WHERE status='published'`);
console.log('published products:', tot[0].c);

const [missing] = await db.query(`
  SELECT
    SUM(category_id IS NULL OR category_id = '') AS no_category,
    SUM(best_for IS NULL OR best_for = '') AS no_best_for,
    SUM(product_image IS NULL OR product_image = '') AS no_image,
    SUM(editor_score IS NULL OR editor_score = 0) AS no_editor_score,
    SUM(affiliate_url IS NULL OR affiliate_url = '') AS no_affiliate_url,
    SUM(asin IS NULL OR asin = '') AS no_asin,
    SUM(rating IS NULL OR rating = 0) AS no_rating,
    SUM(review_summary IS NULL OR review_summary = '') AS no_review_summary
  FROM product_reviews WHERE status='published'
`);
console.log('missing fields:', JSON.stringify(missing[0]));

// Affiliate URL quality — tag present?
const [tag] = await db.query(`
  SELECT
    SUM(affiliate_url LIKE '%tag=dawnwire-20%' OR affiliate_url LIKE '%tag=dawnwire-2%' OR amazon_url LIKE '%tag=dawnwire-20%') AS tagged,
    SUM(affiliate_url IS NOT NULL AND affiliate_url NOT LIKE '%tag=%' AND amazon_url IS NOT NULL AND amazon_url NOT LIKE '%tag=%') AS untagged_both,
    SUM(affiliate_url LIKE '%tag=%' AND affiliate_url NOT LIKE '%tag=dawnwire-20%') AS wrong_tag
  FROM product_reviews WHERE status='published'
`);
console.log('affiliate tags:', JSON.stringify(tag[0]));

// Hosts used for product_image
const [hosts] = await db.query(`
  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(product_image, '/', 3), '/', -1) AS host, COUNT(*) c
  FROM product_reviews WHERE status='published' AND product_image IS NOT NULL AND product_image != ''
  GROUP BY host ORDER BY c DESC LIMIT 8
`);
console.log('image hosts:', JSON.stringify(hosts));

// Per-category counts (published products with category set)
const [byCat] = await db.query(`
  SELECT c.name, c.slug, COUNT(p.id) products
  FROM categories c LEFT JOIN product_reviews p ON p.category_id = c.id AND p.status='published'
  GROUP BY c.id, c.name, c.slug ORDER BY products DESC
`);
console.log('products per category:', JSON.stringify(byCat, null, 1).slice(0, 3000));

// Products with category_id set but no matching category row (dangling)
const [dang] = await db.query(`
  SELECT COUNT(*) c FROM product_reviews p
  WHERE p.status='published' AND p.category_id IS NOT NULL AND p.category_id != ''
    AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id)
`);
console.log('dangling category_id:', dang[0].c);

// Marketplace/domain variety for affiliate URLs
const [dom] = await db.query(`
  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(affiliate_url, '/', 3), '/', -1) AS domain, COUNT(*) c
  FROM product_reviews WHERE status='published' AND affiliate_url IS NOT NULL AND affiliate_url != ''
  GROUP BY domain ORDER BY c DESC
`);
console.log('affiliate domains:', JSON.stringify(dom));

await db.end();
