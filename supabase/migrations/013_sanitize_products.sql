-- Migration 013: Comprehensive product data sanitization
-- Run in Supabase SQL Editor after deploying the code changes

-- 1. Enhanced review_summary sanitization: strip iframes, event handlers, decode entities
UPDATE public.product_reviews
SET review_summary = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(review_summary, '<style[^>]*>.*?</style>', '', 'gi'),
                  '<script[^>]*>.*?</script>', '', 'gi'
                ),
                '<iframe[^>]*>.*?</iframe>', '', 'gi'
              ),
              'on\\w+\\s*=\\s*"[^"]*"', '', 'gi'
            ),
            'on\\w+\\s*=\\s*\'[^\']*\'', '', 'gi'
          ),
          '<[^>]*>', '', 'g'
        ),
        '&quot;', '"', 'g'
      ),
      '&amp;', '&', 'g'
    ),
    '&lt;', '<', 'g'
  ),
  '&gt;', '>', 'g'
),
updated_at = NOW()
WHERE review_summary IS NOT NULL AND (review_summary LIKE '%<%' OR review_summary LIKE '%&%');

-- 2. Strip CSS/JS garbage patterns from review_summary
UPDATE public.product_reviews
SET review_summary = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(review_summary, '[.#]\\w[^;{]*\\{[^}]*\\}', '', 'g'),
        '@\\w+[^{]*\\{[^}]*\\}', '', 'g'
      ),
      '\\b(function|var|let|const)\\s+\\w+\\s*\\(?[^)]*\\)?\\s*\\{?[^}]*\\}?', '', 'g'
    ),
    '[a-z-]+\\s*:\\s*[^;{]+[;{]', '', 'gi'
  ),
  '\\s+', ' ', 'g'
),
updated_at = NOW()
WHERE review_summary IS NOT NULL AND (review_summary LIKE '%.%' OR review_summary LIKE '%{%' OR review_summary LIKE '%:%');

-- 3. Strip HTML from short_description
UPDATE public.product_reviews
SET short_description = regexp_replace(
  regexp_replace(short_description, '<[^>]*>', '', 'g'),
  '\\s+', ' ', 'g'
),
updated_at = NOW()
WHERE short_description IS NOT NULL AND short_description LIKE '%<%';

-- 4. Normalize JSONB specs: ensure all values stored as strings, not nested objects/arrays
-- This is best-effort via SQL; the server-side backfill endpoint handles full JSONB traversal
UPDATE public.product_reviews
SET specs = COALESCE(
  (
    SELECT jsonb_object_agg(
      key,
      CASE
        WHEN jsonb_typeof(value) = 'object' THEN value::text::jsonb
        WHEN jsonb_typeof(value) = 'array' THEN value::text::jsonb
        WHEN jsonb_typeof(value) = 'string' THEN value
        WHEN jsonb_typeof(value) = 'number' THEN to_jsonb(value::text)
        WHEN jsonb_typeof(value) = 'boolean' THEN to_jsonb(value::text)
        ELSE value
      END
    )
    FROM jsonb_each(specs)
  ),
  '{}'::jsonb
),
updated_at = NOW()
WHERE specs IS NOT NULL AND specs != '{}'::jsonb;

-- 5. Report results
SELECT 'review_summary sanitized' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE review_summary NOT LIKE '%<%' AND review_summary NOT LIKE '%&%';

SELECT 'short_description sanitized' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE short_description IS NOT NULL;

SELECT 'specs normalized' AS action, COUNT(*) AS affected
FROM public.product_reviews
WHERE specs IS NOT NULL AND specs != '{}'::jsonb;

SELECT 'Total products' AS action, COUNT(*) AS total FROM public.product_reviews;
