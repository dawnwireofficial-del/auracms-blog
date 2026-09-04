# DawnWire — $10K/Month Revenue Roadmap

*Last updated 2026-09-04. All numbers below are pulled from the live DB on this date.*

---

## 1. Where you are right now (real numbers)

| Metric | Value |
|---|---|
| Published products | 836 |
| Products with working Amazon tag (`dawnwire-20`) | 836 (100%) |
| Affiliate clicks all-time | 468 |
| Affiliate clicks in the last 7 days | ~4 |
| Page views recorded in last 7 days | ~38 |
| Categories with products | 17 (all populated) |

**Honest baseline:** the site earns ≈ **$0–10/month today**. Not because anything is
broken (the plumbing is now fully verified end-to-end), but because there is
essentially **no traffic**. $10K/month is a *traffic problem*, not a *code problem*.
Everything below is engineered to fix exactly that.

---

## 2. The commission math (what $10K actually requires)

Amazon Associates pays **~4%** of the purchase price on average (1–10% by category).

```
$10,000 / month target
÷ 4% commission        = $250,000 in Amazon sales / month
÷ $35 avg. order value = ~7,150 orders / month
÷ 8% click→buy rate    = ~89,000 qualified clicks / month
≈ 2,900–3,000 clicks EVERY DAY
```

On a review site, roughly **2–4 clicks per 100 visitors** click an affiliate link,
so the real traffic requirement is:

| Visitors/day | Clicks/day | Est. orders/day | Est. monthly revenue |
|---|---|---|---|
| 1,000 | 20–40 | 2–3 | $190–350 |
| 5,000 | 100–200 | 8–16 | $800–1,700 |
| 25,000 | 500–1,000 | 40–80 | $4,300–8,400 |
| 50,000 | 1,000–2,000 | 80–160 | **$8,400–16,800** ✅ |

> **So the whole game is: get 25K–50K real visitors/day.** That is achievable in
> 6–18 months with the traffic engine below — it is NOT achievable by tweaking the
> website alone, which is why Phase 5 (social) matters as much as SEO.

---

## 3. The four traffic engines (free, ranked by ROI)

### Engine A — Pinterest (biggest, fastest, free)
Pinterest is a **visual search engine**, not social media. Product pins rank for
months/years and send steady clicks. It is the #1 free traffic source for
affiliate product sites.

**What's already built (verified live):**
- ✅ Auto-pin pipeline (extension + server `auto-social.ts`) posts to Pinterest v5
- ✅ Every pin deep-links to a DawnWire product page with UTM tracking
- ✅ **Public always-fresh catalog**: `https://www.dawnwire.com/api/public/pinterest-catalog.csv`
  (836 products) — Pinterest's catalog crawler ingests this URL directly
- ✅ Pin descriptions carry "DawnWire Editor Score X/10" + "Best for" + price

**What YOU must do (30 minutes, once):**
1. Go to https://developers.pinterest.com/ → *My apps* → create app for DawnWire
2. Request access: **pin creation** scope (instant auto-approval for personal apps)
3. Generate a long-lived access token → paste in Extension popup → Settings
4. Board: `https://www.pinterest.com/dawnwireofficial/products/` (already set up)
5. In Pinterest Business hub: **Catalogs → create feed → paste the catalog URL**
   above. Pinterest auto-creates Product Pins from the feed.

**Cadence once live:** 10–30 pins/day (auto-scheduler), 1 new board per
category (Electronics, Beauty, Home & Kitchen, Gaming, …) so each board ranks
for its niche.

### Engine B — SEO (compounding, 3–6 month ramp)
- ✅ 836 product pages, SSR homepage + category + post pages (Google sees full HTML)
- ✅ 17 clean category hubs + buying-guide posts (230+ after dedup cleanup)
- Missing: **backlinks**. Google won't rank a zero-backlink domain for money terms.
  - Free: HARO/Connectively responses, niche-relevant guest posts, broken-link
    outreach to "best X products" lists, Reddit/Quora answers (with real value,
    link in profile/bio not spammy).
  - 3–6 months of consistent outreach → 50–100 relevant backlinks → rankings
    on long-tail "best [category] products" terms.

### Engine C — Social (Facebook/Instagram/X)
- ✅ Server + extension posting code ready (Graph API + v5 Pinterest)
- Needs: FB page token + IG business token (30-min setup in each developer console).
- FB/IG drive *engagement* traffic — small vs Pinterest/SEO for affiliate, but
  free and worth doing once Engine A is running.

### Engine D — Content velocity
Every import via the extension now auto-generates a buying-guide post + gets
categorized. **Post cadence rule:** publish 3–5 new guides weekly targeting
"best [thing] for [use case]" — those are the money keywords. 250 guides @ 500
organic visitors/day = 125K visitors/mo by year two. The pipeline is built; the
input is picking the right products/categories to import.

---

## 4. Conversion plumbing (already verified, keep it healthy)

| Check | Status |
|---|---|
| Every product link carries `tag=dawnwire-20` on redirect | ✅ Verified |
| `/go/product/:slug` logs every click + 302s | ✅ Verified (counter 2→3 in test) |
| Page views recorded with session/UA/product | ✅ Verified |
| Admin dashboard shows clicks-today + placement breakdown | ✅ Verified |
| Multi-store affiliate redirects (Walmart/eBay/…) | ✅ New — verified E2E |
| Pinterest catalog feed | ✅ New — 836 products live |

**Weekly hygiene task (2 min):** run `node scripts/audit-products.mjs` — it prints
how many products lack a tag/image/category. Fix = re-import via extension.

---

## 5. Milestone plan

| Phase | Goal | KPI | Timeframe |
|---|---|---|---|
| 0 ✅ | Ship plumbing (done this session) | — | — |
| 1 | Pinterest live | 500 pins posted | Week 1 |
| 2 | Pinterest catalog + boards per category | 1,000+ visitors/wk from Pinterest | Weeks 2–4 |
| 3 | Backlink outreach starts | 10 links/mo | Weeks 2–12 |
| 4 | Guides at 3–5/wk | 250 published | Months 1–6 |
| 5 | FB/IG/X live | 3 platforms posting daily | Week 2 |
| 6 | **10K visitors/day** | ads/consistency loop | Months 6–18 |

**Realistic revenue curve with all engines running:**
- Month 1–3: $50–300/mo (Pinterest ramping)
- Month 4–6: $300–1,500/mo (SEO starts + Pinterest compounding)
- Month 7–12: $1,500–5,000/mo
- Month 12–18: **$5,000–10,000+/mo** if backlinks + content velocity hold

> Nobody gets $10K/month in month one — the math above shows exactly what the
> traffic numbers have to be, and the pipelines to generate them are now built.
> The one human input required today: **a fresh Pinterest access token** (the one
> on file expired) + pasting it into the extension, then clicking "Start".

---

## 6. Quick-start checklist (do this now)

- [ ] **Get fresh Pinterest token** (developers.pinterest.com → app → token) — 15 min
- [ ] Paste it in **Extension popup → Settings** (also add FB/IG tokens later)
- [ ] Add the catalog feed URL in Pinterest Business → Catalogs
- [ ] Turn on auto-pin in the extension; verify first pin lands on your board
- [ ] Run `node scripts/audit-products.mjs` weekly; re-import anything missing a tag
- [ ] Start 1 backlink outreach email/day (Engine B)
- [ ] Import 5–10 new products/week through the extension (Engine D feeds A+B)
