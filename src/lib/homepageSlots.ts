import type { CategoryBanner, BannerPlacement } from '../types';

function activeAt(now: number, b: CategoryBanner): boolean {
  if (!b.isActive && !b.isEnabled) return false;
  if (b.startDate && new Date(b.startDate).getTime() > now) return false;
  if (b.endDate && new Date(b.endDate).getTime() < now) return false;
  return true;
}

/** Pick the banner configured for a placement, honoring schedule + active state. */
export function pickForPlacement(banners: CategoryBanner[], placement: BannerPlacement | string, now = Date.now()): CategoryBanner | null {
  const list = Array.isArray(banners) ? banners : [];
  const matches = list
    .filter(b => (b.placement || 'hero_main') === placement && activeAt(now, b))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return matches[0] || null;
}

export interface HomepageBannerSlots {
  heroMain: CategoryBanner | null;
  heroTiles: (CategoryBanner | null)[]; // 4
  promos: (CategoryBanner | null)[]; // 3
}

export function assignHomepageSlots(banners: CategoryBanner[], now = Date.now()): HomepageBannerSlots {
  const heroTiles: (CategoryBanner | null)[] = [];
  for (let i = 1; i <= 4; i++) heroTiles.push(pickForPlacement(banners, `hero_tile_${i}`, now));
  const promos: (CategoryBanner | null)[] = [];
  for (let i = 1; i <= 3; i++) promos.push(pickForPlacement(banners, `promo_${i}`, now));
  return {
    heroMain: pickForPlacement(banners, 'hero_main', now),
    heroTiles,
    promos,
  };
}