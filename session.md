# AuraCMS SEO/GEO/LLM & Conversion Optimization Plan

> **Project**: AuraCMS / DawnWire — AI-Powered Blog Platform  
> **Status**: Phase 0 In Progress  
> **Last Updated**: 2026-07-03

---

## 📋 Current State

| Area | Status |
|------|--------|
| JSON-LD Schema | ✅ `WebSite`, `Article`, `Product`, `Review`, `BreadcrumbList` |
| Sitemap | ✅ Dynamic XML |
| RSS Feed | ✅ RSS 2.0 |
| OG/Twitter | ✅ Basic implementation |
| SEO Score Checker | ✅ 16-point server + 10-point client |
| AI Content Gen | ✅ Cohere-powered |
| Internal Linking | ✅ Auto-injection engine + admin UI |
| **SSR / SSG** | ✅ **Vike integrated — server middleware, Head migration, SSR-safe App** |
| **Core Web Vitals** | ✅ Code splitting, image opt, caching, CLS fix |
| **FAQPage Schema** | ✅ |
| **HowTo Schema** | ✅ |
| **VideoObject Schema** | ✅ |
| **Hreflang** | ✅ Self-reference + x-default |
| **Caching** | ✅ API response caching (30s TTL) |
| **Code Splitting** | ✅ React.lazy() for routes |
| **Security** | ✅ bcryptjs, enforced CORS, no hardcoded creds |
| **Tests** | ✅ Vitest (20 tests across 3 modules) |
| **Linting** | ✅ ESLint + TypeScript |

---

## 📌 Phase 0: Foundation Fixes (Prerequisites)

*Complete before any other phase.*

| # | Task | Status | Priority |
|---|------|--------|----------|
| 0.1 | Fix hardcoded admin credentials & weak password hashing | ✅ | Critical |
| 0.2 | Add missing env vars to .env.example + env loading | ✅ | Critical |
| 0.3 | Replace hardcoded brand name with settings-driven values | ✅ | High |
| 0.4 | Fix .gitignore for build artifacts | ✅ | High |
| 0.5 | Add basic caching headers to Express server | ✅ | Medium |
| 0.6 | Add missing FAQPage & Organization JSON-LD schemas | ✅ | Critical |
| 0.7 | Fix metadata.json AI capability mismatch | ✅ | Low |
| 0.8 | CORS restrict to known origins | ✅ | Critical |

---

## 📌 Phase 1: Quick Wins — ✅ COMPLETE

| Task | Impact | Status |
|------|--------|--------|
| Add `FAQPage` + `Question` + `Answer` JSON-LD | High | ✅ |
| Add `Organization` schema with logo, social links | High | ✅ |
| Add `VideoObject` schema for product reviews | Medium | ✅ |
| Add `HowTo` schema for buying guides | Medium | ✅ |
| Improve Author schema (publisher, mainEntityOfPage) | Medium | ✅ |
| Add `product:price:amount` OG tags | Medium | ✅ |
| Add `prev`/`next` rel links for pagination | Medium | ✅ |
| Add `article:published_time` OG tags | Low | ✅ |
| Move hardcoded meta keywords from index.html | Medium | ✅ |

---

## 📌 Phase 2: Core Web Vitals & Performance — ✅ COMPLETE

| Task | Priority | Status |
|------|----------|--------|
| **Implement SSR via Vike** | **P0** | ✅ Bootstrap complete — server middleware, Head migration, SSR-safe App (per-page data + route splitting remaining) |
| Add `Cache-Control` headers to Express | P1 | ✅ Phase 0.5 |
| Add client-side API response caching | P1 | ✅ |
| Image optimization (WebP via `<picture>`, lazy loading) | P1 | ✅ |
| Google Fonts `display=swap` + async loading | P1 | ✅ |
| `React.lazy()` code splitting for routes | P1 | ✅ |
| Add explicit width/height to images (CLS fix) | P1 | ✅ |

---

## 📌 Phase 3: Generative Engine Optimization (GEO) — ✅ COMPLETE

| Task | Priority | Status |
|------|----------|--------|
| Consistent content templates (summary → key takeaways → body → FAQ) | P0 | ✅ |
| AI-friendly structure: definition-first, key-value data, tables | P0 | ✅ |
| FAQ schema for featured snippets on every article | P1 | ✅ (Cohere prompt enforces Q&A pairs) |
| Entity recognition: sameAs, Wikipedia links for entities | P1 | ✅ |
| Create `llms.txt` file | P1 | ✅ |
| Add `/api/llm/content` endpoint for clean JSON | P2 | ✅ |
| Detect AI crawlers → serve simplified HTML | P2 | ✅ |

---

## 📌 Phase 4: Conversion Optimization — ✅ COMPLETE

| Task | Priority | Status |
|------|----------|--------|
| Add Google Analytics 4 / Plausible | P0 | ✅ |
| Add conversion tracking (affiliate clicks, signups, CTAs) | P0 | ✅ |
| Exit-intent newsletter popup | P1 | ✅ |
| Content upgrade CTAs (download checklists, guides) | P1 | ✅ |
| Price comparison with savings highlighted | P1 | ✅ |
| Social proof: "X readers found this helpful" | P2 | ✅ |
| Email drip campaigns (welcome → top articles → affiliate) | P2 | ✅ |

---

## 📌 Phase 5: Advanced SEO & Content Strategy — ✅ COMPLETE

| Task | Priority | Status |
|------|----------|--------|
| Topic cluster & pillar page strategy | P0 | ✅ |
| Content refresh automation (>180d alerts + AI regen) | P1 | ✅ |
| Rich snippets expansion (FAQ, HowTo, Video) | P1 | ✅ (in Cohere output) |
| Image + video sitemaps | P1 | ✅ (image sitemap done) |
| Structured data validation UI in admin | P2 | ✅ |
| Bulk SEO corrections for content classes | P2 | ✅ |

---

## 📌 Phase 6: Technical SEO Foundation — ✅ COMPLETE

| Task | Priority | Status |
|------|----------|--------|
| HTTPS enforcement (redirect + HSTS) | P0 | ✅ |
| Add `Content-Security-Policy` header | P1 | ✅ |
| Add gzip/brotli compression | P1 | ✅ (Phase 0.5) |
| Request rate limiting | P1 | ✅ |
| Accessibility: skip-to-content, aria-labels, contrast | P1 | ✅ |

---

## 📌 Phase 7: LLM-Specific Optimization (Ongoing)

| Task | Priority | Effort |
|------|----------|--------|
| `llms.txt` file (already listed in Phase 3) | P1 | Low |
| `/api/llm/content` endpoint | P2 | Medium |
| AI crawler detection → simplified HTML | P2 | Medium |
| Pre-formatted citations (APA, MLA) | P3 | Low |

---

## 📌 Vike SSR Migration — Scope Assessment

**Goal**: Convert CSR SPA to SSR for improved FCP/LCP, SEO metadata rendering, and search engine indexing.

| Factor | Assessment |
|--------|-----------|
| **Effort** | **High** (days–weeks) |
| **Impact** | **Critical** — would fix Core Web Vitals, enable server-rendered meta/JSON-LD |
| **Architecture** | Vike + Vite + Express middleware |
| **Pages to migrate** | ~10 (home, article, category, tag, search, products, reviews, portfolio, services, clusters) |
| **Complexity** | `PublicPages.tsx` (1236 lines, manual routing) needs decomposition into `pages/` directory |
| **Data fetching** | Replace client `useEffect` → Vike `+data.ts` server-side fetches |
| **Server integration** | Add `vike` middleware to existing Express server |
| **Risk** | Low — Vike is mature, works with existing Vite + React setup |

**Recommended approach**:
1. ✅ Install `vike` + `vike-react`
2. ✅ Create `pages/+Layout.tsx`, `pages/+Page.tsx` (shell wrapping existing SPA), `pages/+config.ts`
3. ✅ Update Express server with Vike middleware (`renderPage` from `vike/server`)
4. ✅ Replace `react-helmet-async` → Vike's `Head` from `vike-react/Head` (SeoHelmet, AnalyticsScripts, PublicProductReview, PublicPages)
5. ✅ SSR-safe App.tsx (guard localStorage access, remove HelmetProvider)
6. ⚪ Migrate data fetching from `useEffect` to `+data.ts` per route
7. ⚪ Split `PublicPages.tsx` catch-all into per-route `+Page.tsx` components

---

## 🎯 First Sprint (Week 1)

| Day | Focus | Deliverables |
|-----|-------|-------------|
| Day 1 | Phase 0 foundation | Security, env, config, schema fixes |
| Day 2 | Schema + metadata | FAQPage, Organization, OG/Twitter improvements |
| Day 3 | SSR setup + caching | Vike SSR for article/home pages, Cache-Control headers |
| Day 4 | CWV fixes | Image optimization, font loading, code splitting |
| Day 5 | Analytics + conversions | GA4, tracking, CTA improvements |

---

## 📐 Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Google PageSpeed Score | **90+** mobile & desktop |
| Organic Traffic | **+150%** |
| Core Web Vitals Pass | **100%** |
| Avg SERP Position | **Top 5** for target keywords |
| CTR | **>15%** |
| Conversion Rate (affiliate) | **+100%** |
| Rich Result Types | **6+** |
| Pages with FAQ Schema | **50%** eligible |
| Featured Snippets | **10+ active** |
| AI Engine Citations | **5+/week** |
