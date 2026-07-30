# One-time OpenCode prompt

You are working inside the existing DawnWire production codebase for https://www.dawnwire.com/. Redesign the landing-page header and hero to match a premium, light, futuristic glassmorphism interface while preserving all existing routes, data integrations, SEO metadata, accessibility, authentication, search, category navigation, admin access, analytics and Amazon affiliate disclosure behavior.

## Goal

Replace only the current dark star-field hero presentation with a bright high-end AI product-discovery hero. Retain the current DawnWire mascot, but place it in a soft white/ice-blue environment with animated floating glass metric cards, orbital rings, bubbles and subtle blue/violet/cyan glows. The result must feel custom designed, not like a generic AI template.

## Required palette

Create global or component-scoped tokens:

- `--dw-navy-950: #061438`
- `--dw-navy-900: #0A1F44`
- `--dw-navy-800: #12316A`
- `--dw-blue-700: #164EE8`
- `--dw-blue-600: #2463FF`
- `--dw-blue-500: #3C7BFF`
- `--dw-indigo-600: #5B4BFF`
- `--dw-violet-500: #8A5CFF`
- `--dw-magenta-400: #D45EFF`
- `--dw-cyan-400: #55E6FF`
- `--dw-mint-400: #28E4BA`
- `--dw-orange-500: #FF6A00`
- `--dw-ink-700: #41577F`
- `--dw-ink-500: #6E7FA2`

Use this hero background exactly:
`linear-gradient(135deg, #FBFDFF 0%, #F0F5FF 42%, #F6F2FF 72%, #FFFFFF 100%)`

Use this main blue-violet CTA and highlighted-text gradient:
`linear-gradient(135deg, #2463FF 0%, #5B4BFF 55%, #D45EFF 100%)`

Use orange only for deal urgency, the NEW badge and the Ask AI header action. Do not use bronze/gold text in the hero.

## Header updates

Keep the same header information architecture and links, but refine the styling:

1. Keep the top announcement bar navy.
2. Main header should be translucent white with `backdrop-filter: blur(18px)` and a subtle lower border.
3. Preserve logo, categories, product search, AI Product Finder, Ask AI, wishlist, sign-in, contrast control and dark-mode control.
4. Search field background `#F4F7FC`, 14px radius and a thin `rgba(31,61,124,.10)` border.
5. Keep a blue Search button, violet AI Product Finder button and orange Ask AI button.
6. Keep the secondary category/navigation row and editorial transparency row, but reduce their visual weight.
7. Do not change link destinations or business logic.

## Hero copy and actions

Use the current content meaning, with this visual hierarchy:

Eyebrow:
`AI-Powered Discovery Engine & Live Amazon Deals`

Heading:
`Amazon Product Reviews &`
`AI-Powered Buying Guides.`

Apply navy to the first line and the blue-violet-magenta gradient only to `AI-Powered Buying Guides.`

Body copy:
`DawnWire scans verified Amazon reviews, technical specifications and independent benchmarks to surface stronger product picks and useful price drops.`

Primary CTA:
`Launch AI Product Finder`

Secondary CTA:
`Ask AI Assistant`

Trust items:
- `24/7 Price Drop Alerts`
- `Verified Buyer Analysis`
- `Direct Amazon Links`

Keep all existing live routes. If labels in the current code are tied to analytics events, preserve those events or update event labels without removing tracking.

## Layout

Desktop container max width: `1480px`.
Hero min height: `720px`; preferred visual height `760px-860px`.
Use a two-column grid: content approximately `46%`, visual approximately `54%`.
Content max width: `650px`.
Visual stage minimum desktop width: `620px` and minimum height `610px`.
Heading size: `clamp(52px, 5.2vw, 78px)`, line-height `.98`, letter-spacing `-0.055em`, font-weight `800-850`.
Paragraph: `18px/1.67`.
CTA height: `58px`; radius `15px`.

## Visual composition

1. Use the current transparent DawnWire bot as the center-right focal object.
2. Add `/public/dawnwire/svg/orbit-background.svg` behind the bot.
3. Add `/public/dawnwire/svg/robot-platform.svg` below the bot.
4. Add these animated SVG cards around the bot:
   - `/public/dawnwire/svg/live-deals.svg`
   - `/public/dawnwire/svg/verified-reviews.svg`
   - `/public/dawnwire/svg/price-drops.svg`
   - `/public/dawnwire/svg/lab-benchmarks.svg`
   - `/public/dawnwire/svg/top-pick.svg`
   - `/public/dawnwire/svg/categories-covered.svg`
5. Use absolute positioning only inside the visual stage, not across the full page.
6. Keep all cards readable and prevent overlap with the mascot's face and chest logo.
7. Add soft translucent bubbles and tiny light points using CSS pseudo-elements; no heavy particle library.

## Card design

Cards should use:

- background `rgba(255,255,255,.58)`
- border `1px solid rgba(255,255,255,.84)`
- radius `28px-32px`
- `backdrop-filter: blur(18px) saturate(135%)`
- shadow `0 28px 80px rgba(69,91,158,.18)`
- inner highlight `inset 0 1px 0 rgba(255,255,255,.92)`

Use navy numbers, muted blue-gray labels, mint for verified/live status, blue for price charts and violet for benchmark charts.

## Motion

Use performant CSS transforms and SVG stroke animation only.

- Mascot: float vertically 12-16px over 5.5 seconds.
- Cards: unique 6.2-7.2 second float loops with max 15px movement and max 1.5 degree rotation.
- Charts: line draw using stroke-dasharray over 3.4-3.8 seconds.
- Live status dot: soft pulse every 2.4 seconds.
- Optional pointer parallax must be subtle, requestAnimationFrame-based and disabled for touch/reduced-motion users.
- Do not use elastic, bounce, rapid rotation, canvas particle engines or continuous expensive blur recalculation.
- Add complete `prefers-reduced-motion: reduce` handling.

## Proof strip

Below the hero grid, add one centered glass strip with four items:

1. `Independent & Unbiased` / `No paid reviews. Ever.`
2. `Real Data, Real Insights` / `Verified reviews & lab tests`
3. `Secure & Transparent` / `Your trust is our priority`
4. `AI That Works for You` / `Smarter picks, every time`

Desktop: four columns. Tablet: two columns. Mobile: one column.

## Responsive requirements

- At 960px and below, stack text above visual, center the content and keep the visual cards.
- At 640px and below, use full-width CTA buttons, mascot width around 250px and cards around 155px.
- Ensure no horizontal scroll at 320px width.
- Keep the headline within three to four lines on mobile.
- Maintain touch targets of at least 44px.

## Technical safeguards

1. First inspect the project stack and existing component paths. Do not assume Next.js if it is another framework.
2. Reuse current typography and icon package where appropriate; do not introduce a second icon library.
3. Do not remove structured data, canonical tags, robots directives, metadata, affiliate disclosures or analytics.
4. Do not hardcode fake business metrics into production data. Keep the visual placeholder numbers only until a real API/data source is mapped. Add a clear code comment where each metric should be connected.
5. Optimize mascot asset to WebP/AVIF while preserving transparency; keep the original file as fallback if required.
6. Lazy-load below-fold assets, but do not lazy-load the primary hero mascot if it is the LCP element. Preload it where appropriate.
7. Set explicit image dimensions to prevent CLS.
8. Do not change admin authentication or expose admin routes.
9. Do not change product, comparison, review or buying-guide URLs.
10. Run lint, type-check and production build after changes. Fix all errors introduced by this work.

## Files supplied with this task

Use the supplied DawnWire Hero Kit files as the visual source of truth:

- `css/dawnwire-hero-theme.css`
- `react/DawnwireHero.tsx` as implementation reference only; adapt it to the actual stack
- `js/dawnwire-hero-motion.js`
- all files inside `svg/`
- `DESIGN-SYSTEM.md`

## Final deliverable

Implement the redesign directly in the existing codebase and return:

1. List of changed files.
2. Brief explanation of component structure.
3. Any production data mappings still required for the six metric cards.
4. Results of lint, type-check and production build.
5. Screenshots or a local preview at desktop 1440px, tablet 768px and mobile 390px.

Do not stop after creating a mockup. Complete the working responsive implementation while preserving all existing functionality.
