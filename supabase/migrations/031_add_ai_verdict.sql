-- 031_add_ai_verdict.sql
-- Ensures the ai_verdict column exists so the "Generate AI Verdict" action
-- (POST /api/admin/seo/product-reviews/:id/generate-ai-verdict) can persist
-- its result and the product page can render it (ProductDetail -> AiVerdictCard).
-- Idempotent; safe to re-run.
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS ai_verdict TEXT;