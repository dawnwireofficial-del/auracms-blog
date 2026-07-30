# DawnWire Animated Hero Kit

This kit recreates the light, premium, glassmorphism hero direction approved in the concept while retaining the current DawnWire mascot and site information architecture.

## Included

- Six animated SVG data cards
- Animated orbit background
- Animated robot platform/halo
- Complete responsive hero CSS
- React/Next.js component example
- Optional pointer-parallax JavaScript
- Design system and full OpenCode implementation prompt

## Installation

1. Copy `svg/` into your public folder, for example `public/dawnwire/svg/`.
2. Copy the existing transparent DawnWire mascot to `public/images/dawnwire-bot.webp`.
3. Import `css/dawnwire-hero-theme.css` globally or in the hero component.
4. Use `react/DawnwireHero.tsx` as the implementation reference.
5. Update the two CTA routes to your real routes.
6. Test at 1440px, 1024px, 768px and 390px widths.

## SVG usage

The SVGs can be used as regular images:

```html
<img src="/dawnwire/svg/live-deals.svg" alt="Live Amazon deals" />
```

Their internal CSS animations run without JavaScript. For maximum control, inline the SVG markup in your component.

## Important production notes

- Do not convert the animated SVGs into PNGs.
- Keep SVG files local rather than loading from an external CDN during initial testing.
- Set explicit width and height or CSS aspect ratio to avoid layout shift.
- Keep the hero background light. The current dark star-field background should be removed from the hero only.
- Preserve the navy top announcement bar and existing navigation hierarchy.
- Use real metrics from your database. The numbers in this concept are placeholders until connected to production data.
