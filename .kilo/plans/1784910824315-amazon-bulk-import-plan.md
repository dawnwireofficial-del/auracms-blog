# Amazon Bulk Product Import Plan

## Goal
Enable DawnWire admins to bulk-import Amazon products (up to 1000+) via three methods — CSV upload, keyword search, and category scan — using Amazon search-result page scraping. Each imported product gets a direct Amazon affiliate URL (`tag=dawnwire-20`) AND a cloaked `/go/[slug]` affiliate link. Existing products are updated with fresh pricing/data.

## User Decisions (Confirmed)
- **ASIN sources**: CSV upload, keyword search, category scan (all three)
- **Affiliate format**: Both direct Amazon URL + cloaked `/go/` link
- **Speed**: Browser-like header scraping with 10s timeout, rate-limited batches
- **Duplicates**: Update existing products with latest prices/data, skip ASINs that genuinely don't exist

## Current State Audit
| Component | Exists | Gap |
|---|---|---|
| `server/amazon-extractor.ts` | ✅ Scrapes individual `/dp/{asin}` pages | ❌ No search-result page scraper |
| `server/amazon-api-client.ts` | ✅ PA-API 5.0 client | User explicitly wants scraping, not PA-API |
| `server/seo-engine.ts` | ✅ `importProductReview()`, `createProductReview()`, `updateProductReview()` | No bulk orchestrator |
| `api/routes/admin.ts` | ✅ `/products/import-from-asin` (single) | ❌ No bulk import endpoints |
| `src/components/AdminPanel.tsx` | ✅ Full admin sidebar + routing | ❌ No "Bulk Import" menu item |
| `src/components/AmazonSyncDashboard.tsx` | ✅ Syncs existing products | ❌ No new-product discovery UI |
| `bulk_import_jobs` table | ❌ Does not exist | Must be created |

## Architecture

### Data Flow
```
Admin UI (AmazonBulkImporter.tsx)
  │
  ├── CSV Upload ──► Parse ASINs/URLs ──► Bulk Import API
  ├── Keyword Search ──► scrapeAmazonSearch() ──► Select products ──► Bulk Import API
  └── Category Scan ──► scrapeAmazonSearch() by category terms ──► Bulk Import API
       │
       ▼
  POST /api/admin/products/bulk-import
       │
       ▼
  server/bulk-importer.ts
       │
       ├── Validate ASINs, deduplicate input list
       ├── Process in batches of 10 (rate-limited, ~1-3s delay between batches)
       │
       ├── Per ASIN:
       │   ├── Check duplicate: SELECT from product_reviews WHERE specs.asin = ?
       │   ├── If exists → updateProductReview() with fresh price/stock/deal data
       │   ├── If new → extractAmazonProductData() (scrape /dp/{asin})
       │   ├── importProductReview() with dawnwire-20 affiliate URL
       │   ├── Create cloaked affiliate link via POST /api/admin/affiliate
       │   └── Record result in bulk_import_jobs
       │
       └── Return { jobId, status, progress }
```

## Files to Create

### 1. `server/amazon-search-scraper.ts` (NEW)
**Purpose**: Scrape Amazon search result pages to discover product ASINs.

**Key exports**:
- `searchAmazon(query, marketplace, maxResults)` — Main entry point
  - Fetches `https://www.amazon.{domain}/s?k={encodeURIComponent(query)}`
  - Headers: rotating User-Agent, `Accept-Language` matching marketplace, spoofed Amazon cookie
  - Timeout: 10s
  - Returns `SearchResult[]` or `null` on CAPTCHA/bot-check

- `extractFromAmazonSearch(html)` — Parse search result HTML
  - Walk HTML by ASIN regex (`data-asin="([A-Z0-9]{10})"`)
  - Extract per product: `asin`, `title` (from `s-image` alt text, strip "Sponsored Ad -"), `price` (from `a-offscreen`), `image` (from `s-image` src), `url` (built from ASIN)
  - Deduplicate by ASIN
  - Return `SearchResult[]`

- `tryAddResult(result, query)` — Relevance filter
  - Word-level Jaccard similarity between result title and query
  - Include if similarity > 0.3 (configurable)
  - Rejects obvious unrelated results

- `getRandomHeaders(marketplace)` — Rotating User-Agent pool + locale-matched Accept-Language + i18n-prefs cookie

**Interface**:
```typescript
interface SearchResult {
  asin: string;
  title: string;
  price: number | null;
  image: string;
  url: string;
  relevanceScore: number;
}
```

### 2. `server/bulk-importer.ts` (NEW)
**Purpose**: Orchestrate bulk import with progress tracking, dedup, and affiliate link creation.

**Key exports**:
- `startBulkImport(params)` — Create job, return `jobId`
  - `params.source`: 'csv' | 'search' | 'category'
  - `params.asins`: string[] (for CSV)
  - `params.queries`: string[] (for search)
  - `params.marketplace`: string (default 'US')
  - `params.maxProducts`: number (default 1000)
  - `params.onProgress`: callback with `{processed, succeeded, failed, skipped, currentAsin}`

- `processBulkImport(jobId)` — Process a queued job
  - Load job from DB
  - Resolve ASIN list based on source
  - For search/category: call `searchAmazon()` to discover ASINs
  - Batch processing: 10 ASINs per batch, 1-3s delay between batches
  - Per ASIN:
    1. Check duplicate by `specs.asin`
    2. If duplicate & user chose "update":
       - Fetch fresh data via `extractAmazonProductData()`
       - Call `updateProductReview(id, freshData)`
    3. If new:
       - Fetch full data via `extractAmazonProductData()`
       - Call `importProductReview()` with `affiliate_url` = direct Amazon URL with `tag=dawnwire-20`
       - Create cloaked link: `POST /api/admin/affiliate` with `shortSlug = product.slug`
    4. Log success/failure/skip
  - Update job progress in DB after each item
  - Return final summary

- `getBulkImportJob(jobId)` — Return job status + progress
- `cancelBulkImport(jobId)` — Set status to 'cancelled'

### 3. `supabase/migrations/009_bulk_import.sql` (NEW)
**Table**: `bulk_import_jobs`
```sql
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('csv','search','category')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  succeeded INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  params JSONB NOT NULL DEFAULT '{}',
  result JSONB DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. New API Endpoints in `api/routes/admin.ts`
- `POST /api/admin/products/bulk-import` — Start import
  - Body: `{ source, asins?, queries?, marketplace?, maxProducts? }`
  - Auth: super_admin, admin, editor
  - Returns `{ jobId, status, totalItems }`
- `GET /api/admin/products/bulk-import/:jobId` — Get status
- `POST /api/admin/products/bulk-import/:jobId/cancel` — Cancel job
- `POST /api/admin/products/search-amazon` — Search without importing
  - Body: `{ query, marketplace?, maxResults? }`
  - Returns `{ results: SearchResult[] }`

### 5. `src/components/AmazonBulkImporter.tsx` (NEW)
**Tabs**:
1. **CSV Upload**
   - File input (accept `.csv,.txt`)
   - Parse ASINs/URLs from file (one per line)
   - Preview table: ASIN, URL, status
   - "Import N Products" button
   - Progress bar + live stats during import

2. **Keyword Search**
   - Search input + marketplace dropdown
   - "Search Amazon" button → shows results table
   - Results table: checkbox per row, title, ASIN, price, image
   - "Select All" + "Import Selected" button
   - Max results selector (50, 100, 500, 1000)

3. **Category Scan**
   - Category selector (Electronics, Home & Kitchen, etc.)
   - Pre-built query list per category (e.g., "best [category] 2025", "[category] deals")
   - "Scan & Import" button
   - Same progress UI as CSV

**Progress Panel** (sticky, shown during import):
- Progress bar (% complete)
- Stats: Processed / Succeeded / Failed / Skipped
- Current ASIN being processed
- Cancel button
- Expandable error log

### 6. Admin Panel Integration
**`src/components/AdminPanel.tsx`**:
- Add `'bulk-import'` to `activeMenu` type
- Add sidebar item: `{ key: 'bulk-import', icon: Package, label: 'Bulk Import' }`
- Add render block:
  ```tsx
  {activeMenu === 'bulk-import' && (
    <AmazonBulkImporter token={token} />
  )}
  ```

### 7. Affiliate Link Auto-Creation
**In `server/bulk-importer.ts`**:
After each `importProductReview()` success:
```typescript
const affiliateRes = await fetch('/api/admin/affiliate', {
  method: 'POST',
  headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: product.product_name,
    destinationUrl: directAmazonUrl,  // with tag=dawnwire-20
    affiliateUrl: directAmazonUrl,
    shortSlug: product.slug,
    buttonText: 'Buy on Amazon',
    noFollow: true,
    sponsored: true,
    openInNewTab: true,
    status: 'active'
  })
});
```

Also update `importProductReview()` to ALWAYS set `affiliate_url` to the direct Amazon URL with `tag=dawnwire-20` (currently it uses raw `amazon_url` or `affiliate_url` from input).

## Implementation Order

1. **`server/amazon-search-scraper.ts`** — Foundation. Must work before bulk importer.
2. **`supabase/migrations/009_bulk_import.sql`** — Run in Supabase SQL Editor.
3. **`server/bulk-importer.ts`** — Core orchestration. Depends on search scraper + DB table.
4. **API endpoints** in `api/routes/admin.ts` — Depends on bulk-importer.
5. **`src/components/AmazonBulkImporter.tsx`** — Admin UI. Depends on API endpoints.
6. **`src/components/AdminPanel.tsx`** — Wire it in.
7. **Affiliate link auto-creation** — Final step, can be done inside bulk-importer.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Amazon CAPTCHA / bot detection blocks scraping | Detect CAPTCHA in `extractFromAmazonSearch` + `scrapeAmazonHtml`, return `null`, skip gracefully. Admin sees "Failed: CAPTCHA" in error log. |
| Amazon changes HTML selectors | Search scraper uses multiple fallback regexes per field. If extraction fails, skip that product and log. |
| Rate limiting / IP bans | Batch delay of 1-3s between requests, rotating User-Agent pool, 10s timeout per fetch. |
| 1000 imports hit DB hard | Each import is a single INSERT/UPDATE. No transaction wrapping the whole batch (if one fails, others continue). |
| Affiliate link slug collision | Use product review slug + dedup check on `affiliate_links.short_slug`. |
| Large CSV parsing in memory | Stream parse or chunk into 100-ASIN batches. |

## Validation Steps

1. Run migration 009 in Supabase SQL Editor.
2. Start server, log into admin.
3. Navigate to "Bulk Import" in sidebar.
4. **CSV test**: Upload a CSV with 3 known ASINs (B09XS7JWHH, B0C762112C, B0CHWRXH8B). Verify all 3 appear as published products with cloaked `/go/` links.
5. **Search test**: Search "wireless headphones", verify 10-50 results appear in preview table, select 5, import. Verify products created with `affiliate_url` containing `tag=dawnwire-20`.
6. **Duplicate test**: Import the same ASIN again with "Update existing" selected. Verify price/stock updates without creating duplicate slug.
7. **Progress test**: Import 100 ASINs. Verify progress bar updates, cancel button works, error log shows CAPTCHA skips.
8. Verify public site: `/go/[slug]` redirects to Amazon with correct tag.

## Open Questions
- **Amazon.ae vs Amazon.com**: User mentioned amazon.com in the request but amazon.ae in the scraping details. Plan supports configurable marketplace. Default: `US` (amazon.com). User can switch to `AE` in UI.
- **PA-API vs scraping**: User explicitly said "Amazon has no API in this system — it's scraped." Plan uses scraping exclusively for discovery and product detail. Existing PA-API code remains untouched for the Amazon Sync feature.
