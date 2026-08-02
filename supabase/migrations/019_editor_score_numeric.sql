-- 019_editor_score_numeric.sql
-- editor_score is an editorial score on a 0-10 scale that can be a decimal
-- (e.g. 8.8, 9.4). It was created as INTEGER in 012, which caused
-- "invalid input syntax for type integer" on every product save that wrote a
-- decimal score (and, because the PUT route lacked a try/catch, hung the
-- Vercel function into a 60s 504). Make it numeric to accept decimals.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR, then:
--   NOTIFY pgrst, 'reload schema';

ALTER TABLE public.product_reviews ALTER COLUMN editor_score TYPE NUMERIC(5,1) USING editor_score::NUMERIC;
ALTER TABLE public.product_reviews ALTER COLUMN editor_score SET DEFAULT 0;

NOTIFY pgrst, 'reload schema';
