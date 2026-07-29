-- Migration 014: Clean garbled deal_badge and coupon_code values
-- Run after deploying code changes

-- 1. Sanitize deal_badge: strip CSS class names, excess whitespace, truncate
UPDATE product_reviews
SET deal_badge = regexp_replace(
  regexp_replace(deal_badge, '\.\w+', '', 'g'),
  '\s+', ' ', 'g'
),
published_at = published_at
WHERE deal_badge IS NOT NULL AND deal_badge LIKE '%.%';

-- 2. Remove deal_badge values that are just garbage (no recognizable deal text)
UPDATE product_reviews
SET deal_badge = NULL,
published_at = published_at
WHERE deal_badge IS NOT NULL
AND deal_badge !~* 'deal|sale|discount|off|save|prime|coupon|offer|free shipping|clearance|flash|bargain|hot';

-- 3. Clear coupon_code if it contains garbage CSS class names
UPDATE product_reviews
SET coupon_code = NULL,
published_at = published_at
WHERE coupon_code IS NOT NULL AND coupon_code LIKE '%.%';

-- 4. Normalize price columns: strip $ and non-numeric chars
UPDATE product_reviews
SET price = regexp_replace(price, '[^0-9.]', '', 'g'),
published_at = published_at
WHERE price IS NOT NULL AND price ~ '[^0-9.]';

UPDATE product_reviews
SET original_price = regexp_replace(original_price, '[^0-9.]', '', 'g'),
published_at = published_at
WHERE original_price IS NOT NULL AND original_price ~ '[^0-9.]';

-- 5. Report
SELECT 'Deal badge cleaned' AS action, COUNT(*) AS affected
FROM product_reviews WHERE deal_badge IS NOT NULL;

SELECT 'Price normalized' AS action, COUNT(*) AS affected
FROM product_reviews WHERE price IS NOT NULL;
