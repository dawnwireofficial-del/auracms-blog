import React from 'react';
import { CategoryIcon } from './SvgIcons';
import { proxyImageUrl } from '../../utils/safeRender';

const CATEGORY_SVG_MAP: Record<string, { file: string; icon: string }> = {
  'ai-software-tools': { file: 'ai-software-tools', icon: 'sparkle' },
  automotive: { file: 'automotive', icon: 'headphone' },
  'baby-products': { file: 'baby-products', icon: 'baby' },
  'beauty-personal-care': { file: 'beauty-personal-care', icon: 'sparkle' },
  'body-scrubs-treatments': { file: 'body-scrubs-treatments', icon: 'sparkle' },
  business: { file: 'business', icon: 'headphone' },
  electronics: { file: 'electronics', icon: 'headphone' },
  fitness: { file: 'fitness', icon: 'activity' },
  gaming: { file: 'gaming', icon: 'headphone' },
  'home-kitchen': { file: 'home-kitchen', icon: 'coffee' },
  lifestyle: { file: 'lifestyle', icon: 'sparkle' },
  'office-productivity': { file: 'office-productivity', icon: 'headphone' },
  'seo-marketing': { file: 'seo-marketing', icon: 'sparkle' },
  'sports-outdoors': { file: 'sports-outdoors', icon: 'activity' },
  technology: { file: 'technology', icon: 'headphone' },
  'toys-games': { file: 'toys-games', icon: 'baby' },
};

const ANIM_CLASSES = ['', 'anim-pulse', 'anim-float', 'anim-spin', 'anim-soft', 'anim-bounce'] as const;

function resolveAnimation(animationStyle?: string): string {
  if (animationStyle && ANIM_CLASSES.includes(animationStyle as any)) {
    return animationStyle as string;
  }
  const gDefault = typeof document !== 'undefined' ? document.documentElement.dataset.catAnim : undefined;
  if (gDefault && gDefault !== 'none' && ANIM_CLASSES.includes(gDefault as any)) {
    return gDefault;
  }
  return '';
}

interface AnimatedCategoryIconProps {
  slug?: string;
  icon?: string;
  image?: string;
  animationStyle?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

export const AnimatedCategoryIcon: React.FC<AnimatedCategoryIconProps> = ({
  slug,
  icon,
  image,
  animationStyle,
  className,
  imgClassName,
  eager,
}) => {
  const animClass = resolveAnimation(animationStyle);
  const imgCls = [imgClassName || className, animClass].filter(Boolean).join(' ');

  // 1) Explicit uploaded image/icon override always wins
  if (image) {
    return (
      <img
        src={proxyImageUrl(image) || image}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={imgCls || className}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  // 2) Custom sequential SVG / raw path (set via Design Studio icon picker)
  if (icon && (icon.startsWith('/') || /\.svg$/i.test(icon))) {
    return (
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={imgCls || className}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  // 3) Built-in static map by slug
  const match = slug ? CATEGORY_SVG_MAP[slug] : undefined;
  if (match) {
    const src = icon && !icon.startsWith('/') && CATEGORY_SVG_MAP[icon] ? `/icons/categories/${CATEGORY_SVG_MAP[icon].file}.svg` : `/icons/categories/${match.file}.svg`;
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={imgCls || className}
      />
    );
  }

  // 4) Generic inline icon
  return <CategoryIcon icon={icon || 'tag'} className={className} />;
};