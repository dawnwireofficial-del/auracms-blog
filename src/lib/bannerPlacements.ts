import type { BannerPlacement } from '../types';

export interface BannerPlacementMeta {
  key: BannerPlacement;
  label: string;
  description: string;
  recommended: string;
  /** Rough visual aspect ratio used for admin previews */
  aspect: string;
  /** Homepage grid slot this placement fills */
  slot: 'hero_main' | 'hero_tiles' | 'promo_banners';
}

export const BANNER_PLACEMENTS: BannerPlacementMeta[] = [
  {
    key: 'hero_main',
    label: 'Hero Main',
    description: 'Featured banner card beside the hero copy. Strong product imagery + headline.',
    recommended: '1200×700 (≈1.7:1)',
    aspect: 'aspect-[7/4]',
    slot: 'hero_main',
  },
  {
    key: 'hero_tile_1',
    label: 'Hero Tile · Top Left',
    description: 'Top-left of the 2×2 promo grid beside the hero.',
    recommended: '640×480 (≈4:3)',
    aspect: 'aspect-[4/3]',
    slot: 'hero_tiles',
  },
  {
    key: 'hero_tile_2',
    label: 'Hero Tile · Top Right',
    description: 'Top-right of the 2×2 promo grid.',
    recommended: '640×480 (≈4:3)',
    aspect: 'aspect-[4/3]',
    slot: 'hero_tiles',
  },
  {
    key: 'hero_tile_3',
    label: 'Hero Tile · Bottom Left',
    description: 'Bottom-left of the 2×2 promo grid.',
    recommended: '640×480 (≈4:3)',
    aspect: 'aspect-[4/3]',
    slot: 'hero_tiles',
  },
  {
    key: 'hero_tile_4',
    label: 'Hero Tile · Bottom Right',
    description: 'Bottom-right of the 2×2 promo grid.',
    recommended: '640×480 (≈4:3)',
    aspect: 'aspect-[4/3]',
    slot: 'hero_tiles',
  },
  {
    key: 'promo_1',
    label: 'Campaign Banner 1',
    description: 'First of the three campaign banners below Today’s Best Deals.',
    recommended: '900×450 (≈2:1)',
    aspect: 'aspect-[2/1]',
    slot: 'promo_banners',
  },
  {
    key: 'promo_2',
    label: 'Campaign Banner 2',
    description: 'Second campaign banner.',
    recommended: '900×450 (≈2:1)',
    aspect: 'aspect-[2/1]',
    slot: 'promo_banners',
  },
  {
    key: 'promo_3',
    label: 'Campaign Banner 3',
    description: 'Third campaign banner.',
    recommended: '900×450 (≈2:1)',
    aspect: 'aspect-[2/1]',
    slot: 'promo_banners',
  },
];

export const BANNER_PLACEMENT_MAP: Record<BannerPlacement, BannerPlacementMeta> =
  BANNER_PLACEMENTS.reduce((acc, p) => {
    acc[p.key] = p;
    return acc;
  }, {} as Record<BannerPlacement, BannerPlacementMeta>);

export const BANNER_PLACEMENT_KEYS = BANNER_PLACEMENTS.map(p => p.key);
