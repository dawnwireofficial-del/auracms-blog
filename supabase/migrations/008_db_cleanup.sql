-- DB Cleanup Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/nzghdxvbrndzkkoqdlqw/sql/new)

-- 1. Sanitize review_summary: strip CSS/JS garbage from Amazon imports
UPDATE public.product_reviews
SET review_summary = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(review_summary, '<style[^>]*>.*?</style>', '', 'gi'),
        '<script[^>]*>.*?</script>', '', 'gi'
      ),
      '<[^>]*>', '', 'g'
    ),
    '[.#]\\w[^;{]*\\{[^}]*\\}', '', 'g'
  ),
  '\\s+', ' ', 'g'
),
updated_at = NOW()
WHERE review_summary IS NOT NULL AND review_summary LIKE '%{%' OR review_summary LIKE '%<%';

-- 2. Create affiliate product categories if they don't exist
INSERT INTO public.categories (name, slug, description, status) VALUES
  ('Fitness', 'fitness', 'Fitness apparel, equipment, and accessories', 'active'),
  ('Gaming', 'gaming', 'Gaming chairs, headsets, mice, keyboards, and accessories', 'active'),
  ('Home & Kitchen', 'home-kitchen', 'Home improvement, kitchen gadgets, furniture, and decor', 'active'),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Skincare, makeup, hair care, and personal grooming', 'active'),
  ('Tech', 'tech', 'Consumer electronics, smart home devices, and gadgets', 'active'),
  ('Office & Tech', 'office-tech', 'Office supplies, computer accessories, and productivity tools', 'active'),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment, outdoor gear, and recreation', 'active'),
  ('Toys & Games', 'toys-games', 'Toys, board games, and educational play', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 3. Set best_for on products that have empty values, based on product name or specs department
UPDATE public.product_reviews
SET best_for = 'Baby Care', updated_at = NOW()
WHERE (best_for IS NULL OR best_for = '')
AND (
  product_name ILIKE '%baby%' OR product_name ILIKE '%nursery%' OR product_name ILIKE '%diaper%'
  OR product_name ILIKE '%stroller%' OR product_name ILIKE '%booster seat%' OR product_name ILIKE '%car seat%'
  OR specs->'details'->>'department' ILIKE '%baby%'
);

UPDATE public.product_reviews
SET best_for = 'Fitness', updated_at = NOW()
WHERE (best_for IS NULL OR best_for = '')
AND (
  product_name ILIKE '%fitness%' OR product_name ILIKE '%weighted vest%' OR product_name ILIKE '%jump rope%'
  OR product_name ILIKE '%exercise%' OR product_name ILIKE '%workout%' OR product_name ILIKE '%gym%'
  OR specs->'details'->>'department' ILIKE '%fitness%' OR specs->'details'->>'department' ILIKE '%sport%'
);

UPDATE public.product_reviews
SET best_for = 'Home & Kitchen', updated_at = NOW()
WHERE (best_for IS NULL OR best_for = '')
AND (
  product_name ILIKE '%mount%' OR product_name ILIKE '%tv mount%' OR product_name ILIKE '%furniture%'
  OR product_name ILIKE '%wipe%' OR product_name ILIKE '%clean%' OR product_name ILIKE '%paper towel%'
  OR product_name ILIKE '%chair%' OR product_name ILIKE '%desk%' OR product_name ILIKE '%lamp%'
  OR specs->'details'->>'department' ILIKE '%home%' OR specs->'details'->>'department' ILIKE '%kitchen%'
);

UPDATE public.product_reviews
SET best_for = 'Beauty & Personal Care', updated_at = NOW()
WHERE (best_for IS NULL OR best_for = '')
AND (
  product_name ILIKE '%skin%' OR product_name ILIKE '%collagen%' OR product_name ILIKE '%patch%'
  OR product_name ILIKE '%beauty%' OR product_name ILIKE '%eye cream%' OR product_name ILIKE '%mask%'
  OR product_name ILIKE '%serum%' OR product_name ILIKE '%face%'
  OR specs->'details'->>'department' ILIKE '%beauty%' OR specs->'details'->>'department' ILIKE '%personal care%'
);

-- 4. Set category_id based on best_for
UPDATE public.product_reviews p
SET category_id = c.id, updated_at = NOW()
FROM public.categories c
WHERE (p.category_id IS NULL OR p.category_id = '')
AND LOWER(p.best_for) = LOWER(c.name)
AND c.status = 'active';

-- 5. Remove duplicate Zeerun Weighted Vest (keep the one without -1 suffix)
DELETE FROM public.product_reviews
WHERE slug = 'weighted-vest-6lb8lb10lb12lb15lb18lb20lb24lb30lb-for-men-women-reflective-stripe-adjustable-buckle-comfortable-durable-rucking-vest-for-walking-running-strength-training-1';

-- 6. Report results
SELECT 'Sanitized review_summary' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE review_summary NOT LIKE '%{%' AND review_summary NOT LIKE '%<%';

SELECT 'Products with best_for set' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE best_for IS NOT NULL AND best_for != '';

SELECT 'Products with category_id set' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE category_id IS NOT NULL AND category_id != '';

SELECT name, slug, id FROM public.categories WHERE status = 'active' ORDER BY name;
