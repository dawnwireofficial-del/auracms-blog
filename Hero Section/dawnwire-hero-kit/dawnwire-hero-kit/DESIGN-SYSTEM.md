# DawnWire Hero Design System

## Core palette

| Token | HEX | Recommended use |
|---|---:|---|
| Navy 950 | `#061438` | Highest contrast headings |
| DawnWire Navy | `#0A1F44` | Main brand navy, navigation, body accents |
| Navy 800 | `#12316A` | Card numbers and secondary headings |
| Blue 700 | `#164EE8` | Links, active states and small icon strokes |
| Blue 600 | `#2463FF` | Primary gradient start and focus rings |
| Blue 500 | `#3C7BFF` | Chart lines and glows |
| Indigo 600 | `#5B4BFF` | Gradient center and icon strokes |
| Violet 500 | `#8A5CFF` | Benchmark cards and soft accent lines |
| Magenta 400 | `#D45EFF` | Gradient end; use sparingly |
| Cyan 400 | `#55E6FF` | Mascot/platform glow |
| Mint 400 | `#28E4BA` | Verified/live status only |
| Orange 500 | `#FF6A00` | Deals, NEW badges and urgency accents |
| White | `#FFFFFF` | Glass highlights and primary surfaces |
| Hero ice | `#F0F5FF` | Hero background midpoint |
| Hero lavender | `#F6F2FF` | Hero background secondary tint |
| Ink 700 | `#41577F` | Paragraphs on light backgrounds |
| Ink 500 | `#6E7FA2` | Labels and supporting text |

## Gradients

- Hero: `linear-gradient(135deg, #FBFDFF 0%, #F0F5FF 42%, #F6F2FF 72%, #FFFFFF 100%)`
- Primary CTA/text: `linear-gradient(135deg, #2463FF 0%, #5B4BFF 55%, #D45EFF 100%)`
- Secondary blue glow: `radial-gradient(circle, rgba(85,230,255,.24) 0%, transparent 68%)`
- Violet glow: `radial-gradient(circle, rgba(111,91,255,.20) 0%, transparent 70%)`

## Glass settings

- Card background: `rgba(255,255,255,.58)`
- Strong card background: `rgba(255,255,255,.78)`
- Border: `1px solid rgba(255,255,255,.84)`
- Blur: `backdrop-filter: blur(18px) saturate(135%)`
- Main shadow: `0 28px 80px rgba(69,91,158,.18)`
- Inner highlight: `inset 0 1px 0 rgba(255,255,255,.92)`
- Card radius: `28px-32px`
- Button radius: `14px-16px`

## Desktop layout

- Container: max `1480px`, side padding `32px`
- Hero minimum height: `720px`; preferred range `760px-860px`
- Grid: content `46%`, visual `54%`
- Content max width: `650px`
- Visual minimum width: `620px`
- H1: `52px-78px`, line-height `.98`, letter spacing `-0.055em`
- Paragraph: `18px`, line-height `1.67`
- CTA height: `58px`
- Visual cards: `220px-305px` wide
- Keep the mascot near `50% / 51%` of the visual stage

## Responsive behavior

- Below `960px`: stack content over visual, center all text and actions.
- Below `640px`: full-width CTAs, mascot about `250px`, cards about `155px`.
- Do not remove cards on mobile; reposition them and reduce detail only if performance requires it.
- Keep SVG animation, but disable pointer parallax on touch devices.

## Animation rules

- Mascot float: `5.5s ease-in-out infinite`, vertical travel `12px-16px`.
- Cards: `6.2s-7.2s`, vertical travel `10px-15px`, rotation below `1.5deg`.
- Graph draw: `3.4s-3.8s` using `stroke-dasharray`.
- Status pulse: `2.4s`.
- Avoid bounce, elastic or fast spinning effects.
- Always include `prefers-reduced-motion` fallbacks.

## Header alignment notes

Keep the existing DawnWire header structure but visually soften it:

- Main header background: `rgba(255,255,255,.90)` with `backdrop-filter: blur(18px)`.
- Header borders: `#E6ECF8` or `rgba(31,61,124,.10)`.
- Search bar: `#F4F7FC`, radius `14px`.
- Keep orange only for `NEW`, `Deals` and `Ask AI` emphasis.
- Avoid placing more than two high-saturation buttons in the same header row.
