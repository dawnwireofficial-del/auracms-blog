## Goal
Complete Vike SSR migration, deploy to Vercel, and maintain the production site at https://dawnwire.com.

## Progress

### Session — Code-Splitting Perf + API-Based Auto-Deploy (this session)
- **Perf: cut initial JS 2.1 MB → ~556 KB raw** (commit `4b70e54`): `React.lazy()` + `Suspense` in `src/App.tsx` for ProductCatalogPage, BestCategoryPage, ProductDetailPage, DealsPage, ComparisonPage, ReviewsPage, BuyingGuidesPage, PostDetailPage, AdminDashboardPage, BrandsPage, ChatbotDrawer, AIProductFinderModal; vendored `manualChunks` in `vite.config.ts` (charts/video/firebase/knock/motion/markdown/icons/supabase/ai/react); lazy-loaded `ProductSparkline` (recharts) + `NotificationBell` (knock) out of the entry. Live entry is now `/assets/index-*.js` ~180 KB + preloads react/motion/icons.
- **CI auto-deploy fixed via direct API** — the Vercel CLI (`vercel --prod`) rejects the user-created tokens in GitHub Actions (`The token provided via --token argument is not valid` / `Could not retrieve Project Settings`) because session tokens are machine-bound (`vca_…`/`vcr_…` in `auth.json`) and scoped `vck_`/`vcp_` tokens can't read `/v2/user`+`/teams/{id}`. Vercel also refuses API-restricted token minting ("Not authorized").
  - **Working token**: user-provided project-scoped `vcp_` token — CAN `GET /v9/projects/{id}` (200), CAN `POST /v2/files` (200), CAN `POST /v13/deployments` — but NOT via the CLI (CLI still demands team-read). It's stored as GitHub secret `VERCEL_TOKEN` (repo `dawnwireofficial-del/auracms-blog`), backup copy at `C:\Users\atifn\AppData\Local\Temp\opencode\setsecret\vtok.txt`.
  - **scripts/vercel-deploy.mjs** (new, runs in CI): `git ls-files` → SHA‑1 digest per file → parallel upload to `POST /v2/files?teamId=` (headers `x-now-digest` sha1hex, `x-now-size`, `application/octet-stream`) → create prod deploy `POST /v13/deployments?teamId=` with `{name,project,target:'production',files}` → poll `/v13/deployments/{id}` until `READY`.
  - **`.github/workflows/deploy.yml`**: now just `setup-node@v4` (node 20) + `node scripts/vercel-deploy.mjs` with `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` env. CLI-based step removed.
  - **Verified**: push `master` triggered run #5 → uploaded 1573 files → deploy `dpl_DGXy6xfd…` → READY, aliases `www.dawnwire.com`+`dawnwire.com` assigned. Live checks: home 200, `/assets/index-DZKVIcS4.js` 180.1 KB.

### Session — Article Generator + Editorial Hubs + /blog/:slug
- **`server/ai.ts`**: added `generateBuyingGuideFromCategory(category, topProducts)` — 10-section buying-guide structure (Quick Summary, Key Takeaways, What to Look For, Our Top Picks with `[affiliate-card:slug]` embeds, comparison table, budget tiers, FAQ, Verdict).
- **`api/routes/seo.ts`**: added `POST /buying-guides/generate/:categoryId` (auth + editor role) — finds category, top 6 published products by `editor_score`, generates guide, creates **draft** post with slug `best-{category-slug}-buying-guide` (dedup suffix), tags `[category name, 'buying guide', 'best <cat>']`, logs 'Buying Guide Generated'; 400 if category empty.
- **`src/components/ArticleGenerator.tsx`** (new, ~630 lines): admin "Article Generator" sidebar item. Product tab (search `/api/admin/seo/product-reviews?limit=500`, cards show image/name/brand/price/★/editor_score/best_for) + Category tab (`/api/public/categories`). Generate buttons call the two endpoints, then fetch full post via `/api/admin/posts?limit=1000` and open a blog editor: title/slug/excerpt/markdown content (with `[affiliate-card:]` hint)/status, featured-image **file upload** (imgbb via `/api/admin/upload-image`) + **Use Product Image** shortcut + preview, category select, tags, SEO fields, Save → `PUT /api/admin/posts/:id`, View link → `/post/{slug}`.
- **`src/pages/PostDetailPage.tsx`** (new): public `/post/:slug` renderer — fetches `/api/public/posts/slug/:slug` + categories + affiliate links + related posts; ports `SimpleMarkdown` + `renderBodyWithAffiliates` (affiliate shortcode CTA cards) from PublicPages.tsx:478; SeoHelmet (Article JSON-LD, breadcrumbs); 404 state.
- **`src/App.tsx`**: `/post` added to `validPaths`; `/post/:slug` route renders `PostDetailPage`.
- **`src/pages/EditorialPages.tsx`**: rebuilt `ReviewsPage` hub — renders published products from store with `editorScore > 0` as cards (image, brand, ★ editor score/10, verdict, rating/review-count, price), category filter dropdown + sort (Editor Score / User Rating / Newest), links → `/products/:slug`. Rebuilt `BuyingGuidesPage` hub — Best-Of Roundups CTA → `/best`, Browse All Guides CTA → `/buying-guides`, plus a grid of published posts tagged `buying guide` → `/post/:slug`.
- **`src/components/AdminPanel.tsx`**: `'article-generator'` added to `activeMenu` union, nav item (Sparkles icon) after Product Articles, renders `<ArticleGenerator token={token} />`.
- **`api/app_source.ts`**: removed Express middleware that 308-redirected bare `/reviews` → `/products` (was blocking the hub).
- **`vercel.json`**: removed both `/reviews` + `/reviews/` → `/products` redirect entries (was still 308-ing at edge).
- **`scripts/cleanup-orphaned-posts.ts`** (new): deletes non-published posts with `product_id IS NULL`; removed 11 orphaned draft posts (garbage slugs from old generate-article runs).
- **Verified prod**: all 32 smoke checks pass (incl. `/reviews`, `/guides`, `/best`, `/post`); `/reviews` 200; buying-guide generate route registered (401 unauth). Commits `e83a580`, `771f2e3`, `dd43f21`, `fdcce52`, `1b08544` all deployed to `www.dawnwire.com`.

### Phase 0 — AI SEO Optimization Engine
- `server/optimization-prompts.ts` (6 prompts), `server/seo-optimizer.ts` (analyzeContent, getOptimizationCandidates, optimizePost, optimizeProduct, previewOptimization, bulkOptimize, getOptimizationStats, suggestPostMeta), 7 API endpoints, `SeoOptimizerPanel.tsx` admin UI, `SeoDashboard.tsx` optimizer tab.

### Phase 1a — Product videos
- `browser-extension/content.js` scrapes video URLs from Amazon; `server/seo-engine.ts` import accepts `videoUrl`; `PublicProductReview.tsx` renders YouTube embed or native `<video>`.

### Phase 1b — Dark mode fix
- AdminPanel.tsx + ContentManager.tsx: ~200+ `dark:` class additions for text, bg, borders, inputs, tables.

### Phase 1c — Loader animation
- `LoaderAnimation.tsx` with SVG robot, rotating rings, gradient progress bar; `src/index.css` keyframes; `App.tsx` updated.

### Phase 1d — Social share buttons
- `SocialShareButtons.tsx` (6 platforms + copy, compact/default modes); integrated in PublicPages.tsx, PublicProductReview.tsx, PublicProductsPage.tsx.

### Phase 2a — Dashboard analytics
- `server/analytics.ts` (trackPageView, getTrafficData, getClickData, getEngagementData, getContentPerformance, getRecentActivity, getNewsletterAnalytics, getProductAnalytics); API endpoints; `DashboardAnalytics.tsx` (Recharts: stat cards, traffic chart, top pages, referrers, content performance table, revenue tracker, SEO health gauge, live activity feed, CSV export, product performance section); AdminPanel.tsx dashboard tab replaced.

### Phase 2b — Landing page mascot
- `MascotAnimation.tsx` (canvas robot with rotating dots, glowing eyes, antenna pulse, sparkles); HomePage.tsx hero card replaced.

### Phase 2c — Extra dashboard features
- Content performance table (sortable/searchable), revenue tracker (est. $0.35/click), SEO health gauge (0-100%), live activity feed, CSV export, product performance analytics.

### Fix all pre-existing TS errors
- server.ts (String(value) cast), PublicPortfolio.tsx (slug type), PublicProductReview.tsx (`as const`), SeoDashboard.tsx (state types), 404 now returns HTTP 404 status.

### Phase 3a — Auto affiliate linking
- `server/auto-affiliate.ts` (scans content for product titles, replaces with `[affiliate-card:slug]`, bulk mode); API endpoints; `AutoAffiliateLinker.tsx` admin UI.

### Phase 3b — Image optimization
- Enhanced `OptimizedImage.tsx` (IntersectionObserver lazy load, fade-in, priority, sizes); `MediaGallery.tsx` admin UI; Media tab in AdminPanel sidebar.

### Phase 3c — Scheduled publishing
- `server/scheduler.ts` (processScheduledPosts checks `scheduledAt <= now`); middleware every 60s; API endpoints; post editor has `scheduledAt` datetime-local input.

### Phase 3d — Multi-language i18n
- `src/lib/i18n.ts` with 14-language translation map; `LanguageSwitcher.tsx` dropdown component; language field in post editor.

### Phase 3e — Email automation
- Newsletter analytics API (`GET /api/admin/analytics/newsletter`) with subscriber growth data.

### Phase 3f — Analytics alerts
- `server/analytics-alerts.ts` (milestone detection 100–1M, traffic spike detection, daily/weekly digest emails); `AnalyticsAlerts.tsx` admin UI with config, milestone progress bars/chart, manual trigger; 4 API endpoints; "Alerts" sidebar item.

### Sales-Boosting Features

#### 1. Product Review Admin UI (`ProductReviewManager.tsx`)
- Full CRUD table under "Products" tab in admin sidebar
- Create/edit modal with all fields: name, brand, price, original price, rating, best_for, stock status, deal badge, coupon code, affiliate URL, pros/cons/features (one per line), review summary, final verdict, status
- Live search, generate buying guide article button, view on site link

#### 2. Cross-Sell Carousel (`CrossSellCarousel.tsx`)
- "People Also Bought" horizontal scrollable carousel on every product review page
- Shows image, brand, name, rating, price, deal badge, stock status; View + Buy buttons

#### 3. Buyers' Guide Landing Pages (`BuyerGuidePage.tsx`)
- Route `/buyers-guide/:category` (e.g., `/buyers-guide/gaming`)
- Filters products by `best_for` field, sorts by rating/price
- Grid layout with all product info + CTA buttons; linked in footer nav

#### 4. Price Drop / Deal / Stock Badges
- Product type enhanced with `originalPrice`, `stockStatus`, `dealBadge`, `couponCode`
- Product cards show original price strikethrough, 🔥 deal badge, 🏷️ coupon code, stock indicators
- Import pipeline stores `stock_status`, `deal_badge`, `original_price` from Amazon

#### 5. Per-Product Analytics (`GET /api/admin/analytics/products`)
- Each product's page views, affiliate clicks, conversion rate %, estimated earnings ($0.35/click)
- DashboardAnalytics.tsx renders "Product Performance" section with totals + top 10 sortable table

#### 6. Browser Extension — Full Rewrite (`browser-extension/`)
- **Multi-store support** — Amazon (20+ TLDs), Walmart, Best Buy, AliExpress, eBay
- **Search result detection** — "Import All (N)" banner on Amazon search, brand store, wishlist pages
- **Bulk import** — Sequential fetch with queue, progress bar, ETA
- **Import queue** — Background.js manages queue with status transitions (pending → importing → done/failed)
- **Popup UI** — Settings (API URL + token), test connection, live queue status with progress bar
- **Duplicate detection** — Server checks ASIN via `GET /api/admin/seo/product-reviews/check-duplicate`
- **Auto affiliate link creation** — Background.js auto-creates `/go/[slug]` cloak link on import
- **AI article generation** — Background.js auto-triggers `generate-article` endpoint on import
- **Category mapping** — Amazon breadcrumbs mapped to `best_for` field
- **BSR extraction** — Best Sellers Rank stored in `specs.bestSellersRank`
- **Price history** — `original_price` set from `listPrice` on import
- **Stock/deal extraction** — Stock status, deal badge, coupon code extracted per retailer
- **Screenshot capture** — Popup invokes `chrome.tabs.captureVisibleTab`

#### 7. Coupon/Deal Field Management
- Full admin UI for deal badge + coupon code fields on products
- Displayed prominently on product cards and review pages
- `couponExpiry` field tracked in import pipeline

### Extension Bug Fixes (this session)
- **`Cannot read properties of undefined (reading 'sendMessage')`** — Fixed by adding `sendMessage()` wrapper in content.js that falls back to `fallbackImport()` when `chrome.runtime` is undefined; `fallbackImport()` makes direct `fetch()` calls to the DawnWire API; credential fallback via `chromeStorageGet()` which checks `chrome.storage.sync` then `localStorage`.
- **`:contains()` CSS pseudo-selector not valid** — Fixed: `extractBestSellersRank` iterates `doc.querySelectorAll` + `textContent.includes` instead.
- **`doc` parameter handled correctly** — All extraction functions (`extractBestSellersRank`, `extractCategory`, `extractStockStatus`, `extractDealInfo`, `extractDetailBullets`) accept optional `doc` parameter and use it when provided.
- **`extractVideoUrl(doc)` enhanced** — 8-priority search: YouTube iframes, `<source>` CDN URLs, `data-video-url`, script tag patterns (`"videoUrl"`, `"sourceUrl"`, CDN regex), `video[src]` (non-blob), link elements, server-side `fetch-video/:id` fallback.
- **Manifest only covered Amazon** — Fixed: `manifest.json` lists all 27 store domains in both `host_permissions` and `content_scripts.matches`.
- **`PublicProductReview.tsx` blob video URLs** — Added `isValidVideoUrl` filter to hide blob/data URLs.

### Server-Side Video Fetch (this session)
- **`POST /api/admin/seo/product-reviews/fetch-video/:id`** — Server-side proxy that:
  1. Extracts ASIN from `specs.asin`, `amazon_url`, `affiliate_url`, or `review_summary` (embedded script tags)
  2. Fetches `https://www.amazon.com/dp/{ASIN}` with browser-like User-Agent
  3. HTML-entity-decodes (`&quot;` → `"`) before regex matching
  4. Searches for YouTube iframe embeds
  5. Searches for `m.media-amazon.com` CDN mp4/webm URLs
  6. Falls back to `"videoUrl"` JSON patterns in script tags
  7. Stores ASIN in specs for future retries
- **`POST /api/admin/seo/product-reviews/cleanup-blob-videos`** — Removes blob/data/corrupted (>300 chars, HTML entities) video URLs from all products.
- **`background.js`** — Triggers `fetch-video/:id` after every import.
- **`fallbackImport()` in content.js** — Also triggers `fetch-video/:id` after direct import.

### ASIN & Slug Fixes (this session)
- **`importProductReview` stores ASIN** — `specs.asin` and `specs.source` set on import.
- **Slug deduplication** — Both `createProductReview` and `importProductReview` query existing slugs and append `-1`, `-2` etc. if taken.
- **`check-duplicate` endpoint** — Now matches by `specs.asin`, `r.slug`, and `r.product_name`.

### Database Migrations (this session)
- **`supabase/migrations/004_add_product_review_columns.sql`** — Added 8 columns: `original_price`, `stock_status`, `deal_badge`, `coupon_code`, `coupon_expiry`, `category_id`, `click_count`, `page_views`.
- **`scripts/migrate-supabase.ts`** — Updated to run all `.sql` files in `supabase/migrations/` sorted by name.
- **Applied via Supabase SQL editor** (direct connection blocked from Vercel).

### Deployments (this session)
- Multiple Vercel deployments for the `fetch-video`, `cleanup-blob-videos`, ASIN extraction, slug dedup, HTML entity handling fixes.

### Session 2 Fixes
- **Imported products not showing on website** — Root cause: `importProductReview` set `status: 'draft'`, but public API `getPublishedProductReviews()` filters by `status = 'published'`. Fixed by changing default to `'published'` in `seo-engine.ts:277`. Also added `status: 'published'` to the duplicate-update path in `background.js`.
- **HLS (.m3u8) video URLs not playing** — Amazon video CDN serves `.m3u8` (HLS stream) URLs that can't play in native `<video>` (only Safari supports HLS). Fixed: created `HlsVideo` component in `PublicProductReview.tsx` that dynamically imports `hls.js` and attaches HLS streams to `<video>` elements. Installed `hls.js` dependency.
- **CDN regex corrupted by HTML entities** — Amazon uses `&quot;` instead of `"` in HTML attributes, causing the CDN regex to greedily consume JSON data. Fixed: HTML-entity-decode (`&quot;` → `"`, `&amp;` → `&`, etc.) before regex matching in the `fetch-video` endpoint. Also added URL length validation (<300 chars).
- **Fetch-video failed for amzn.to products** — Products with shortened `amzn.to` affiliate URLs had no visible ASIN. Fixed: extract ASIN from `review_summary` field (embedded `<script>var asin = 'B0XXXXX';</script>`).
- **Auth-related TypeScript errors fixed**

### Session 4 — Complete Affiliate Shopping Platform Rewrite
- **New DB schema** (`supabase/migrations/006_affiliate_platform.sql`): 14 new tables — brands, category_banners, category_sections, deals, homepage_sections, homepage_hero_slides, wishlist_items, recently_viewed, saved_comparisons, affiliate_clicks, search_logs, price_alerts + extended product_reviews with 20+ new columns
- **Expanded types** (`src/types.ts`): ~200 new lines — Brand, CategoryBanner, CategorySection, Deal, HomepageSection, HomepageHeroSlide, WishlistItem, RecentlyViewed, SavedComparison, AffiliateClick, SearchLog, PriceAlert, ExtendedProductReview
- **Supabase DB** (`server/db/supabase-db.ts`): 30+ new CRUD methods (brands, banners, sections, deals, homepage, wishlist, recently viewed, comparisons, price alerts, click analytics, search analytics)
- **Legacy DB stubs** (`server/db/legacy-db.ts`): Added matching stubs for all new methods to satisfy union type
- **Admin API routes** (`api/routes/admin.ts`): 20+ new endpoints — brands CRUD, banners CRUD per category, sections CRUD, deals CRUD, homepage sections CRUD, homepage hero slides CRUD, click analytics, search analytics
- **Public API routes** (`api/routes/public.ts`): 20+ new endpoints — brands list, category detail with banners/sections/subcategories/products, filtered product-reviews with full filter/sort/pagination, homepage data, search suggestions, wishlist, recently viewed, comparisons, price alerts, affiliate click tracking
- **New header** (`src/components/Header.tsx`): Complete e-commerce redesign — search bar with category selector, search suggestions dropdown, mega menu, deals/best-sellers/buying-guide links, wishlist icon, recently viewed, dark mode, responsive mobile menu with category list
- **MegaMenu** (`src/components/affiliate/MegaMenu.tsx`): Full desktop mega menu with categories/subcategories, deal links, featured categories, responsive hover states
- **ProductCard** (`src/components/affiliate/ProductCard.tsx`): Grid + list view product card with ratings, prices, discounts, stock badges, prime badge, deal badges, coupon codes, affiliate CTA buttons, wishlist, compare toggle
- **ProductList** (`src/components/affiliate/ProductList.tsx`): Full product listing with sort (rating/popularity/newest/price/discount), filters (category/brand/price range/rating/discount/in-stock), grid/list toggle, compare mode
- **ProductDetail** (`src/components/affiliate/ProductDetail.tsx`): Full product detail — image gallery with thumbnails, brand/title/rating/reviews, price with discounts, stock status, prime/shipping info, coupon display, key features, pros/cons, editor's verdict, technical specs, affiliate disclosure, mobile sticky CTA, social share, similar/related products, wishlist, recently viewed auto-tracking
- **CategoryLanding** (`src/components/affiliate/CategoryLanding.tsx`): Dynamic category page with hero banner slideshow, subcategory grid, deals section, best sellers, trending, top rated, featured brands, editor's picks, products by price, promotional banners, buying guides — all driven by `category_sections` DB table
- **DealCard** (`src/components/affiliate/DealCard.tsx`): Deal card with live countdown timer, flash sale badge, price display, affiliate CTA, click tracking
- **Admin UIs**: AdminBrands (full CRUD), AdminBanners (per-category banner management with preview), AdminDeals (deal CRUD with countdown display), AdminHomepage (homepage section builder + hero slide CRUD with reorder), AdminCategorySections (per-category section builder with width/type config)
- **Routing** (`src/App.tsx` + `PublicPages.tsx`): New SPA routes — `/browse/:slug` (category), `/product/:slug` (detail), `/categories` (all), `/deals`, `/wishlist`, `/buying-guides`, `/recently-viewed`, `/search` — all wired through `resolveRoute` and `navigateTo`
- **DynamicHomepageSections** (`src/components/affiliate/DynamicHomepageSections.tsx`): Renders active homepage sections on the blog homepage (product carousels, shop by category, featured brands, custom text — driven by admin configuration)
- Deployed to `www.dawnwire.com`

### Session 3 — Vercel Bandwidth & Video Fix
- **Vercel Hobby plan blocked** for 30 GB Fast Origin Transfer exceeded (limit: 10 GB)
- **Migrated to new Vercel account** (`dawn-wire/auracms-blog`), custom domain `www.dawnwire.com` aliased
- **Static assets** (`dist/client/assets/`, 2.3 MB) now served from CDN via `includeFiles` in function config + `Cache-Control: max-age=31536000, immutable` headers — 1st hit through function, then CDN edge
- **Pagination** (`limit`/`offset`) added to ALL list endpoints (public, admin, SEO) — returns `{ data, total, limit, offset }` instead of unbounded arrays
- **`GET /api/public/product-reviews/slug/:slug`** — new endpoint so product pages fetch 1 review instead of all
- **SSR data scoped** — `pages/+data.ts` limits to 20 posts, `pages/post/@slug/+data.ts` uses `getPostBySlug()` + 50-post sidebar
- **`/api/llm/content`** truncates body to 1000 chars per item
- **Analytics queries** (`getTrafficData`, `getContentPerformance`, `getProductAnalytics`, `getEngagementData`) — added `.limit()` + column-select on all `page_views` queries
- **`getProductReviewById()`** added to seo-engine.ts — replaces "fetch-all-to-find-one" in `fetch-video`, `generate-article`, `check-duplicate` endpoints
- **DB query limits** — `getPosts()`: 500, `getProductReviews()`: 1000, `getPublishedProductReviews()`: 1000
- **Supabase connected** — environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `COHERE_API_KEY`, `RESEND_API_KEY`, `APP_URL`, `ALLOWED_ORIGINS`) set on new Vercel project
- **Product video not loading** — Root cause: CSP `connect-src` blocked `m.media-amazon.com`. Fixed: added Amazon CDN to CSP + `media-src blob:`. Also created **`GET /api/public/video-proxy?url=`** that fetches HLS manifests from Amazon, rewrites `.ts` segment URLs to go through the proxy, avoiding CORS issues entirely. `HlsVideo` component updated to use proxy URL.
- **Deployed** to `www.dawnwire.com` on new Vercel account

### Known Limitations
- **Retroactive video fetch is best-effort** — Amazon serves most product videos via MSE (blob URLs) loaded dynamically by JS. Server-side scraping from Vercel IPs may get different HTML or captcha pages. The reliable pipeline is: **browser extension → live DOM → `extractVideoUrl()` → server**. New imports via the extension will find videos correctly.
- **`amzn.to` shortened links** — Products imported with shortened affiliate URLs have no visible ASIN. The `review_summary` may contain an embedded ASIN in a `<script>` tag, which the `fetch-video` endpoint now extracts.
- **Only 2 of 6 existing products had ASINs** — Those with `amzn.to` links had no ASIN in their URL. The remaining 4 couldn't be scanned for videos.
- **Amazon video URLs are often HLS (.m3u8)** — These require hls.js to play in most browsers. The `HlsVideo` component now handles this via dynamic import of `hls.js`.

## Key Decisions
- **Cohere command-r-plus-08-2024** for all AI features
- **Bulk concurrency limited to 3** for Cohere rate limiting
- **Client-side image optimization** (IntersectionObserver + CSS fade-in) — no sharp on Vercel
- **Scheduler runs in middleware** every 60s
- **i18n is static** translation map, no runtime auto-translate
- **CSV export uses Blob download** — client-side
- **Browser extension uses Manifest V3** for Chrome
- **Multi-store extraction** per retailer via unique DOM selectors in single content.js
- **Duplicate detection** by ASIN match across specs.asin, amazon_url, or product_name similarity
- **Auto affiliate linking on import** — background.js creates cloak link + triggers AI article generation
- **Extension safe mode** — `sendMessage()` wrapper falls back to direct `fetch()` + localStorage credentials when chrome.runtime unavailable
- **Video fetch server-side proxy** — Amazon blob URLs are ephemeral and cross-origin restricted, so server fetches product page HTML to find video URLs
- **HTML entity decoding** — Amazon pages use `&quot;` in attributes; CDN regex matching now decodes entities first

## Build & Run Commands
- `npm run build` — Vite client + SSR builds, then `build-styles.mjs` generates CSS, then esbuild → `dist/server.mjs`
- `NODE_ENV=production node dist/server.mjs` — Production server on port 3000

## Remaining Blockers
- **Migration 006 requires manual run** — `supabase/migrations/006_affiliate_platform.sql` must be executed in Supabase SQL Editor before the affiliate platform tables are available at DB level.
- **Migration 007 requires manual run** — `supabase/migrations/007_amazon_sync.sql` must be executed in Supabase SQL Editor before Amazon Sync tables are available.
- **Migration 008 requires manual run** — `supabase/migrations/008_db_cleanup.sql` must be executed in Supabase SQL Editor. This sanitizes all existing review_summary fields, creates missing affiliate categories, infers `best_for` on products with empty values, sets `category_id`, and removes duplicate products.
- **Amazon PA-API credentials needed** — You must set AWS Access Key, Secret Key, and Partner Tag either via:
  - Vercel env vars: `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG` (for US marketplace)
  - Or the admin UI: Admin → Amazon Sync → Credentials tab

### Session 5 — SEO Spam Cleanup & Category Matching Fix (this session)
- **Duplicate newsletter section removed** from HomePage.tsx (Footer.tsx already has it)
- **Double hero on homepage fixed** — PublicPages.tsx: HeroSlider only renders for category routes, not homepage
- **Noindex + 410 middleware** in api/app_source.ts — 410 for /products/, /article/, /blog/; noindex for /post/, /review/, /category/ numeric. Updated robots.txt + sitemap.
- **Double render on /products** fixed — removed legacy PublicProductsPage component
- **sanitizeReviewSummary()** added to seo-engine.ts — strips CSS/JS/style/script from imported review_summary; applied on import
- **Category-product matching fallback** fixed — now checks specs.details.department when best_for is empty; stricter word-level matching to prevent false positives
- **DB Cleanup migration** (supabase/migrations/008_db_cleanup.sql) — sanitizes existing review_summary, creates missing product categories, infers best_for, sets category_id, removes duplicates
- **Duplicate Zeerun Weighted Vest removed** via script (1 record with -1 slug)

### Session — Amazon Product Synchronization
- **`server/amazon-api-client.ts`** — Full PA-API 5.0 client with AWS Signature V4 signing: `getItemsByAsin()` (batch by ASIN), `searchItems()`, `extractAsinFromUrl()`, `extractPartnerTagFromUrl()`, `getMarketplaceFromDomain()`, `parseAmazonResponse()`. Reads all available resources: images, title, brand, features, price, availability, deal info, Prime status, variations, variation summaries.
- **`server/amazon-sync-engine.ts`** — Complete sync orchestration engine: priority queue, batch processing (10/batch), rate limiting (360 req/hr), retry with max limits, price history recording, availability tracking, deal/Prime sync, variation support, scheduled sync cycles, manual sync controls (single/selected/category/featured/all), pause/resume, `initializeExistingProducts()` to link current products by ASIN, dashboard stats generation, duplicate ASIN detection, price alert checking.
- **`supabase/migrations/007_amazon_sync.sql`** — 7 new tables: `amazon_marketplaces` (20 marketplaces seeded), `amazon_sync_status` (per-product sync state with priority, pricing, availability, deal info, ASIN validation), `amazon_price_history` (full price change log), `amazon_sync_logs` (detailed operation records), `amazon_api_usage` (daily request tracking), `amazon_sync_settings` (configurable intervals, batch size, field mappings, auto-overwrite), `amazon_api_credentials` (encrypted key storage per marketplace).
- **`server/db/supabase-db.ts`** — 11 new CRUD methods: get/update/list amazon sync status, price history, sync logs, marketplaces, credentials, settings, API usage.
- **`server/db/legacy-db.ts`** — Matching stubs for all new methods.
- **`api/routes/admin.ts`** — 20+ new admin endpoints: stats, product list with filter/search, sync controls (one/selected/category/featured/all/pause/resume), initialize, settings CRUD, credentials CRUD, price history, sync logs, marketplaces, API usage, trigger cycle.
- **`api/app_source.ts`** — Amazon sync scheduler runs every 120 seconds alongside the post scheduler.
- **`src/components/AmazonSyncDashboard.tsx`** — Full admin UI with 4 tabs: Overview (stat cards, API usage bar, schedule info, duplicate ASIN warnings, action buttons), Products (searchable/filterable table with pagination, bulk select, per-product sync, status badges, price comparison, last sync date), Settings (sync intervals, batch size, retries, field-to-sync config, auto-overwrite fields, notification toggles), Credentials (marketplace selector, access/secret key fields, partner tag, save, saved list).
- **`src/components/AdminPanel.tsx`** — "Amazon Sync" sidebar item added with RefreshCw icon; AmazonSyncDashboard rendered when selected.

### Session 6 — Runtime Crash Fixes & Enhanced Amazon Data Extraction (this session)
- **5 admin component crash fixes** (`AdminDeals`, `AdminBrands`, `AdminBanners`, `AdminHomepage`, `AdminCategorySections`): added `response.ok` + `Array.isArray()` guards to prevent `.map()` crash on 401 API responses.
- **DashboardAnalytics.tsx fixed**: all 6 analytics fetches now check `res.ok` and default to safe empty states; line 294 `traffic.dailyViews.length` crash fixed with optional chaining.
- **TrendingDealsSection.tsx fixed**: removed `console.warn` on empty deals payload; silently falls back to product-derived deals.
- **Auth persistence restored**: session restore in `App.tsx` (`useEffect` on mount) reads `dawnwire_auth_token` from localStorage, calls `GET /api/auth/me` to rehydrate `currentUser`. Added `store.setUser()` method.
- **Header.tsx null-guard**: wrapped mega-menu category detail panel in `{currentMegaCategory && <div>...}` to prevent `Cannot read properties of null (reading 'name')`.
- **Import-from-ASIN route path fixed**: `POST /api/admin/products/import-from-asin` now matches route definition (was `/import-from-asin` without `/products/`).
- **AdminDashboardPage auth header fixed**: `handlePublishExtractedProduct` now attaches `Authorization: Bearer <token>` from localStorage.
- **Extension content.js duplicate update URL fixed**: now calls `PUT /api/admin/seo/product-reviews/{dupData.id}` (was `PUT /.../import`).
- **Browser Extension API Token** displayed in Profile tab (read-only with Copy button).
- **Enhanced Amazon product data extraction** — 5 new extractor functions added to `content.js`:
  - `extractIngredients(doc)` — captures ingredients list from `#important-information`, `.ingredients`, safety info
  - `extractUnitInfo(doc)` — captures `unitSize` (e.g., "1.01 Fl Oz (Pack of 1)") and `unitPrice` (e.g., "$11.33 / Fl Oz")
  - `extractBSRDetail(doc)` — parses `bestSellersRank` string into structured array `[{rank: 155, category: "Beauty & Personal Care"}, {rank: 1, category: "Eye Treatment Serums"}]`
  - `extractReviewHighlights(doc)` — captures "Customers say" AI summary section from review widget
  - `extractProductData()` now returns `ingredients`, `unitSize`, `unitPrice`, `bsrDetail`, `reviewHighlights` fields
- **Description extraction extended** from 500 to 3000 chars; includes A+ content fallback if initial description is short.
- **Import banner enhanced**: shows unit size, unit price, top BSR badge, ingredients indicator, review highlights indicator.
- **`importProductReview()` updated** in `server/seo-engine.ts` — accepts and stores all new fields in `specs` (ingredients, unit_size, unit_price, best_sellers_rank_detail, review_highlights).
- **Deployment ready**: all fixes in source; next `git push` to Vercel will deploy the corrected bundle.

### Session 7 — Customer Reviews Extraction & Admin Panel Overhaul (this session)
- **Extension Settings Tab** added to Admin Panel sidebar (`ExtensionManager.tsx`) — 3 sub-tabs: Setup Guide (step-by-step install), Settings (API URL + token display with Copy + Test Connection), Imported Products (placeholder).
- **Customer reviews extraction** added to `content.js` — 5 store-specific extractors:
  - `extractAmazonReviews()` — captures reviewer name, avatar image, rating, date, title, body (up to 2000 chars), verified purchase badge, review images (up to 5)
  - `extractWalmartReviews()`, `extractBestBuyReviews()`, `extractAliExpressReviews()`, `extractEbayReviews()` — same fields per store
  - `extractReviewStats()` — total count, average rating, star distribution (5★–1★) from histogram
  - `extractReviews()` — unified dispatcher routes to correct store extractor
- **`extractProductData()` and `extractProductDataFromDoc()`** — now return `reviews[]` and `reviewStats` fields
- **Server-side storage** — `specs.reviews` (JSONB array, up to 50), `specs.review_stats`, and `review_count` DB column all populated
- **CustomerReviews.tsx** — new component at `src/components/affiliate/CustomerReviews.tsx`:
  - Rating summary card with distribution bars
  - "Customers say" AI highlights section
  - Individual review cards (avatar, name, verified badge, stars, date, title, body with expand/collapse, images gallery)
  - "Show all N reviews" toggle
  - Integrated into `ProductDetail.tsx` below Full Review section
- **Admin Dashboard swap** — `AdminDashboardPage.tsx` now renders `AdminPanel` component (full sidebar) instead of the legacy inline tab UI. Users now see all features: Dashboard, Posts, Categories, Products, Brands, Banners, Deals, Homepage, Sections, Amazon Sync, Extension, Media, Clusters, etc.
- **Content.js TS syntax fix** — removed 2 TypeScript `: any` annotations that would crash in plain JS runtime
- **Deployed** all changes to `https://www.dawnwire.com`

### Session 8 — Image Fixes, imgbb Storage, Bulk Optimization, Headless Scraper (this session)
- **Proxy fix deployed**: image proxy restored with streaming + retry + 10s timeout; `proxyImageUrl()` routes Amazon CDN through `/api/public/image-proxy`. Committed `9c4e37d` and pushed.
- **Gallery bug fixed**: `ProductDetailPage.tsx` line 91 now merges `data.specs?.gallery` into images array (was only using `product_image`). Store mapper was already correct.
- **36 unprotected img tags fixed** across 25 files: `proxyImageUrl()`, `referrerPolicy="no-referrer"`, `onError` fallback added to AdminBanners, AdminHomepage, AdminPanel, AdminProfileCropModal, AIProductFinderModal, AmazonBulkImporter, AmazonSyncDashboard, BrandsPage, CategoryOrb, ChatbotDrawer, CustomerAccountPage, DealsPage, ExtensionManager, Header, OpenGraphAuditTool, PortfolioPage, PriceAlertModal, ProductReviewManager, PublicPortfolio, PublicProductsPage, SeoDashboard, SeoHealthProgressChart, ShoppingAssistant, SideBySideComparisonModal, WishlistPage.
- **ImgBB permanent storage on import**: `uploadToImgBB()` helper added to `server/seo-engine.ts` — downloads Amazon CDN images, uploads to imgbb, stores permanent URL. `importProductReview()` accepts `uploadImages: boolean` flag. Enabled in `bulk-importer.ts` bulk imports with `uploadImages: true`.
- **Slug dedup optimization**: `importProductReview()` and `createProductReview()` accept optional `slugSet` parameter. `bulk-importer.ts` pre-fetches all existing slugs once before the loop (instead of one DB query per import).
- **Headless Amazon scraper**: `scripts/headless-amazon-scraper.ts` — standalone Playwright script for VPS/cron. Accepts `--asins`, `--urls`, `--file`. Full DOM extraction (name, brand, price, gallery, specs, features, deals, coupons). Supports imgbb upload, batch processing (5/batch), dry-run mode.
- **All changes committed** in `f590850` and pushed to Vercel for deployment.

### Session 9 — AI Gateway Migration, TS Errors Fixed, production deployment (this session)
- **`AI_GATEWAY_API_KEY` env var** added to Vercel production env; `.env.example` docs updated
- **AI SDK v7 API fixes**: `maxTokens` → `maxOutputTokens` (renamed in AI SDK v7), `maxSteps` → `stopWhen: isStepCount(n)` (controlled via `stopWhen` callback), `parameters` → `inputSchema` (schema property renamed), tool results via `result.toolResults[i].output` (not `tc.result`)
- **7 tool execute function signatures** fixed with explicit `any` types to match AI SDK v7 `tool()` overload resolution
- **Zero TypeScript errors** in both local build and Vercel build
- **Deployed** to `www.dawnwire.com` with all AI features routed through AI Gateway

### Session 9b — Cohere Provider Fix (this session)
- **`@ai-sdk/cohere` installed** (v4.0.16) replacing `@ai-sdk/openai` — Cohere key doesn't work with OpenAI-format provider
- **Base URL fixed to `https://api.cohere.ai/v2`** — Cohere v1 `/chat` expects `message` (singular), but AI SDK sends `messages` (plural) which requires v2; shopping assistant was failing with "message must be at least 1 token long"
- **Default model**: `command-r-plus-08-2024`
- **Valid Cohere API key set** in Vercel (was invalid key ending `...ersr`, replaced with working key)
- **Root cause found for "Invalid JSON response"** — Cohere v2 returns tool-citation sources as `{type:"tool", id, tool_output}` with NO `document` field, but `@ai-sdk/cohere`'s `cohereChatResponseSchema` requires `citations.sources[].document`. When a tool returns real product data, the model cites it, and the response fails schema validation → `AI_APICallError: Invalid JSON response`. Fixed by wrapping `createCohere({ fetch })` in both `server/ai.ts` and `server/ai-shopping-assistant.ts`: the wrapper re-parses JSON responses and injects a synthetic `document: { text, title }` into any citation source missing one.
- **Verified working in production**: AI shopping assistant (tool-calling with `search_products` returning real product citations), sentiment analysis (returns real percentages/summary/factors), FAQ generation (returns real Q&A JSON) — all on `www.dawnwire.com`
- **Temporary debug error messages restored** to friendly user-facing copy

### Session 10 — Product Image Placeholder Fix + imgbb Scope Correction (this session)
- **Root cause of "Image unavailable" placeholders** — `index.html`'s pre-React script (from commit `4ba16a2`) ran a `MutationObserver` that replaced ANY `<img>` whose src contained `m.media-amazon.com` with a placeholder SVG — including images already routed through `/api/public/image-proxy` (the proxy URL still contains that domain in its query string). Result: every product image showed "Image unavailable" even though the proxy returned 200.
- **Fix in `index.html`** — removed the DOM-walk + MutationObserver entirely; the script now only reacts to real `error` events and skips any image whose src contains `/api/public/image-proxy` (those are handled by component-level retry logic).
- **Fix in `src/App.tsx`** — the React global capture-phase image error handler now also skips proxied images (`!(img.src || '').includes('/api/public/image-proxy')`), so it can't clobber component fallbacks (e.g., ProductCard/ProductDetailPage retry with the raw URL).
- **imgbb scope corrected** — imgbb is now used ONLY for banners and profile images via `POST /api/admin/upload-image` (`api/routes/admin.ts:290`). It is NOT used for imported product images. Removed `uploadImages: true` from:
  - `browser-extension/background.js:85` and `browser-extension/content.js:45` (extension import)
  - `server/bulk-importer.ts:387` (bulk import)
  - `scripts/headless-amazon-scraper.ts` (removed imgbb upload block; products keep original Amazon CDN URLs)
- **`.env.example`** — IMGBB_API_KEY docs updated to say "banner/profile image storage", not product import
- **`IMGBB_API_KEY`** env var set in Vercel production + local `.env` (key `467debc656646bc3b9b530339ca31161`)
- **Verified in production**: all 20 gallery images of the Beauty of Joseon product return `200 image/jpeg` through `/api/public/image-proxy`; AI endpoints re-verified: `/api/public/chat` (returns product cards), `/api/ai/sentiment` (real percentages/summary), `/api/ai/faq` (real Q&A JSON) — all on `www.dawnwire.com`
- Committed `38d0a9a` and deployed to production

### Session — Automated Import Pipeline (this session)
- **`server/auto-import.ts`** — Fully automated import enrichment so no product needs manual editing to go live:
  - `detectBrandForProduct()` — uses `brand` field, else extracts from product name prefix (2-word heuristic, skips generic lead words), normalizes, auto-creates brand row via `ensureBrandForProduct`
  - `detectCategoryForProduct()` — signals in priority order: breadcrumb `category` → Amazon `bsrDetail[].category` → `bestSellersRank` → spec `details.department`; word-overlap scoring vs existing categories; **auto-creates a missing category** (word-level matched, never from `best_for` badge values); returns `best_for` badge
  - `generateSeoForProduct()` — Cohere AI (via `cohereChat`) generates `seo_title`, `seo_description`, `seo_keywords`, `best_for`, `final_verdict`, `editor_score`, `review_summary`, `pros`, `cons`; deterministic heuristic fallback if AI unavailable (editor_score = rating 0-5 → 0-10 scale)
  - `autoProcessProduct(id)` — orchestrates brand + category + AI SEO; **never overwrites existing editorial/SEO fields** (only fills missing); returns change list
  - `autoProcessAllProducts(limit, onlyMissing)` — backfill published products missing category/SEO
- **Wired into `importProductReview`** (`server/seo-engine.ts`) — after insert, if no category resolved, runs `detectCategoryForProduct` smart fallback (BSR/department/breadcrumb + auto-create) and updates `category_id`/`best_for`
- **Fixed `createCategory`/`updateCategory` schema bug** (`server/db/supabase-db.ts`) — removed non-existent `image` column from insert/update payloads (was 500 on every category creation, would have broken auto-create)
- **New admin endpoints** (`api/routes/seo.ts`): `POST /product-reviews/auto-process/:id`, `POST /product-reviews/bulk-auto-process` (limit 1-100, `onlyMissing` flag)
- **Extension integration** (`browser-extension/background.js`) — auto-process called after new import AND after duplicate update; result surfaced as `autoProcessed` in return payload
- **Bulk importer** (`server/bulk-importer.ts`) — `autoProcessProduct()` called after each created row
- **Live-verified on `www.dawnwire.com`**: test imports → brand row auto-created, category_id set (matched existing "Beauty & Personal Care", auto-created "Body Oils"/"Face Moisturizers"/"Facial Cleansers"), AI SEO (title/description/keywords/verdict/score/pros/cons) persisted and visible via public slug endpoint; editor_score scale fixed (4.8/5 → 9.5); all test rows + brands + categories cleaned up
- Committed `81f214a` + `46a1cff` and deployed to production

### Session — Production Smoke Test Fixes (this session)
- **Search suggestions 504 fixed** (`api/routes/public.ts:463`) — root cause: `(r.seoKeywords || r.productName).toLowerCase()` crashed because (a) `getProductReviews()` returns raw snake_case rows so `r.seoKeywords`/`r.productName` are undefined, and (b) `seo_keywords` is stored as a JSON-encoded string like `"[\"a\",\"b\"]"`. Since the handler had no try/catch, the unhandled rejection hung the Vercel function until the 60s `FUNCTION_INVOCATION_TIMEOUT`. Fixed with a `val()` snake_case/camelCase fallback helper, JSON-parse for array-encoded keywords, and a try/catch → 500 wrapper. Live-verified 200 (returns products, categories, brands, keywords).
- **`createPost` id bug fixed** (`server/db/supabase-db.ts:172`) — production DB's `posts.id` lacks the `DEFAULT gen_random_uuid()` from migration 001, so `generate-article` returned `null value in column "id" of relation "posts"`. Added `id: crypto.randomUUID()` to the insert + corePayload retry.
- **Proactive UUID fixes across ALL create/insert/upsert paths** in `server/db/supabase-db.ts` (24 insert/upsert sites): `createPost`, `createTag`, `createComment`, `createAffiliateLink`, `createPage`, `createTopicCluster`, `createCategoryBanner`, `createCategorySection`, `createDeal`, `createHomepageSection`, `createHomepageHeroSlide`, `createPriceAlert`, `uploadMedia`, `submitMessage`, `addNewsletterSubscriber`, `activity_logs`, `addWishlistItem`, `addRecentlyViewed`, `saveComparison`, `logAffiliateClick`, `logSearch`, `bulkCreateAmazonSyncStatus`, `upsertAmazonApiCredential` — all now supply explicit UUIDs (production DB is missing id defaults on many tables).
- **`generate-article` 504 fixed** (`server/ai.ts:146`) — full-article generation with 3000 maxOutputTokens took ~45-50s, leaving no time for post creation within Vercel's 60s function `maxDuration`. Reduced to `cohereChat(prompt, systemPrompt, 42000, 2200)` → completes in ~35s. Live-verified 200: creates a draft post with title/excerpt/content; test post cleaned up after verification.
- **Production DB cleanup** — deleted unused test brand "Method" (`c7bae8bc`), leaving 2 real brands (Beauty of Joseon, Vaseline). Restored brand list verified via `GET /api/admin/brands` (public endpoint has 60s cache).
- **Final smoke test (23 checks) all PASS** on `www.dawnwire.com`: all 7 public pages 200, product-reviews (2 published), categories (15), brands (2), deals, homepage, product slug (cat set, best_for, seo_title, editor_score=9, final_verdict), category browse, both search-suggestions queries, filtered product-reviews, and 5 admin endpoints.
- Commits: `966064f` (search-suggestions), `50b5a50` (snake_case val helper), `0f30c1c` (JSON keyword parse), `ffd1066` (UUID on create/insert paths), `4cb5daf` (article token/timeout reduction). All deployed to `www.dawnwire.com`.

### Key design decisions
- **PA-API 5.0 only** — No scraping. Uses official Amazon Product Advertising API with proper SigV4 authentication.
- **ASIN is primary identifier** — Extracted from affiliate URLs on initialization, stored in both `product_reviews.asin` and `amazon_sync_status.asin`.
- **Field-level auto-overwrite control** — `fields_auto_overwrite` setting lists which fields Amazon may overwrite (price, availability, deal status, images, brand). Editorial content (description, pros/cons, scores, SEO) is never touched.
- **Priority-based sync** — Manual > high priority > recently viewed > deal > featured > standard. Fast sync interval (15min) for high-priority, standard interval (60min) for base.
- **Price history preserved** — Every price change is recorded in `amazon_price_history` with old/new values, change type (drop/increase/deal_started/etc.).
- **Freshness enforcement** — If product hasn't synced within `freshness_days`, price is hidden and "Check latest price on Amazon" is shown.
- **Marketplace isolation** — Each product is tagged with its marketplace code. Prices from US don't display for UK products.
