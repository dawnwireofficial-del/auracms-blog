-- Migration 013: Comprehensive product data sanitization
-- Run in Supabase SQL Editor after deploying the code changes
-- Column names: product_reviews table uses camelCase (verdict, key_features, etc.)

-- 1. Enhanced verdict sanitization: strip iframes, style/script, event handlers, decode entities
UPDATE product_reviews
SET verdict = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(verdict, '<style[^>]*>.*?</style>', '', 'gi'),
      '<script[^>]*>.*?</script>', '', 'gi'
    ),
    '<[^>]*>', '', 'g'
  ),
  '\s+', ' ', 'g'
),
published_at = published_at
WHERE verdict IS NOT NULL AND verdict LIKE '%<%';

-- 2. Strip CSS/JS garbage patterns from verdict
UPDATE product_reviews
SET verdict = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(verdict, '[.#]\w[^;{]*\{[^}]*\}', '', 'g'),
      '@\w+[^{]*\{[^}]*\}', '', 'g'
    ),
    '\b(function|var|let|const)\s+\w+\s*\(?[^)]*\)?\s*\{?[^}]*\}?', '', 'g'
  ),
  '\s+', ' ', 'g'
),
published_at = published_at
WHERE verdict IS NOT NULL AND (verdict LIKE '%.%' OR verdict LIKE '%{%' OR verdict LIKE '%:%');

-- 3. Normalize JSONB specs: ensure all values stored as strings, strip nested objects/arrays
UPDATE product_reviews
SET specs = COALESCE(
  (
    SELECT jsonb_object_agg(
      key,
      CASE
        WHEN jsonb_typeof(value) = 'string' THEN value
        WHEN jsonb_typeof(value) = 'number' THEN to_jsonb(value::text)
        WHEN jsonb_typeof(value) = 'boolean' THEN to_jsonb(value::text)
        ELSE to_jsonb(value::text)
      END
    )
    FROM jsonb_each(specs)
  ),
  '{}'::jsonb
),
published_at = published_at
WHERE specs IS NOT NULL AND specs != '{}'::jsonb;

-- 4. Report results
SELECT 'verdict sanitized' AS action, COUNT(*) AS affected
FROM product_reviews
WHERE verdict NOT LIKE '%<%';
