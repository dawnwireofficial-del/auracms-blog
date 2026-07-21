# Homepage Redesign Plan

## Goal
Full rewrite of `HomePage.tsx` — 11 redundant sections condensed to 7, with improved conversion, proof density, and modern 2026 SaaS layout.

## Before/After

| Aspect | Current | New |
|---|---|---|
| Sections | 11 | 7 |
| Lines | 789 | ~630 |
| Trust strips | 3 (repetitive) | 1 proof bar |
| Services on homepage | Full 6-card grid + 4 feature cards | Removed (dedicated /services page exists) |
| Content display | Articles + Products in separate blocks | Tabbed: All / Articles / Product Reviews |
| Deals/urgency | None | Horizontal hot-deals scroll row |
| Mobile CTA | None | Sticky bottom bar |
| Newsletter | Large card with icon | Compact inline |
| Final CTA | Single button | Dual buttons (reviews + partnership) |

## New Section Layout

### 1. HERO
- Headline: "Product Reviews & Growth Content — Tested. Reviewed. Verified."
- Keeps original background blobs, trust line (avatars + stars), two CTAs
- Right side: Mascot bot (left) + top product pick card (right, side-by-side in a white card)
- Product card shows: image, name, rating, price (with original strikethrough), "Read Review" CTA

### 2. PROOF BAR
- Metrics row in gray band: 2,000+ Creators · 4.9★ Avg Rating · 50+ Product Reviews · 15+ Categories
- Each stat has an icon in a rounded white box

### 3. FEATURED CONTENT (tabbed, replaces both separate sections)
- **All** tab: mixed grid of 3 article cards + 1 product card
- **Articles** tab: up to 6 article cards (same style as current, with badges, categories, reading time)
- **Product Reviews** tab: up to 4 product cards with deal badges, coupon codes, originalPrice strikethrough

### 4. WHY DAWNWIRE (merges old "Inside DawnWire" + "Why DawnWire")
- Left: Office image + 3 stat cards (50+ Reviews, 15+ Categories, 100% Independent)
- Right: Title + bullets + DawnWire quote blockquote + "Learn About DawnWire" button

### 5. HOT DEALS (new)
- Horizontal snap-scroll row of 8 products
- Each card: product image, deal badge, rating, name, price (original strikethrough), Buy/View buttons
- "Hot Deals" badge in section header

### 6. NEWSLETTER (compact)
- Single row: text heading + inline email form
- Blue-tinted gradient background
- "You're subscribed!" state unchanged

### 7. FINAL CTA
- Dark gradient (same as current)
- Dual buttons: "Browse Reviews" (white) + "Partner With DawnWire" (blue)
- Responsive: stacked on mobile, side-by-side on desktop

### STICKY MOBILE CTA
- Fixed bottom bar on md:hidden
- Shows "Top Pick: [product name]" + "Read Review" button
- White bg with backdrop blur, top border, subtle shadow

## Files to Change

| File | Action |
|---|---|
| src/components/pages/HomePage.tsx | Full rewrite |
| src/components/MascotAnimation.tsx | No change (reused in hero) |

## What Stays the Same
- All props, types, and interface
- All API calls (newsletter, product-reviews fetch)
- Category accent color maps, fallback images
- Product data, loading skeleton, empty states
- Navigation functions (onNavigate)

## What's Removed
- Feature cards section (4 cards: Expert Insights, Amazon Affiliate, Proven Strategies, Digital Solutions)
- Services section (6 service cards + "What We Do" header)
- Separate "Inside DawnWire" section (merged into Why DawnWire)
- Separate "Why DawnWire" testimonial block (merged)
- Duplicate trust strips below articles and product sections
- "Carousel dots" decorative element
- Product search/filter/compare UI (too much for homepage; functionality stays on /products page)
- Affiliate disclosure banner (already in footer)

## What's Added
- Content tab system (All / Articles / Reviews)
- Hot Deals horizontal scroll section
- Sticky mobile CTA bar
- Proof bar with metrics
- Top product pick card in hero

## How to Implement
1. Switch to edit mode (allow writes)
2. Replace src/components/pages/HomePage.tsx with new code
3. npm run build to verify
4. vercel --prod to deploy
