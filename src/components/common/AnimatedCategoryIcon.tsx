import React from 'react';
import { CategoryIcon } from './SvgIcons';

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

interface AnimatedCategoryIconProps {
  slug?: string;
  icon?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

export const AnimatedCategoryIcon: React.FC<AnimatedCategoryIconProps> = ({
  slug,
  icon,
  className,
  imgClassName,
  eager,
}) => {
  const match = slug ? CATEGORY_SVG_MAP[slug] : undefined;

  if (match) {
    return (
      <img
        src={`/icons/categories/${match.file}.svg`}
        alt=""
        aria-hidden="true"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={imgClassName || className}
      />
    );
  }

  return <CategoryIcon icon={icon || 'tag'} className={className} />;
};
