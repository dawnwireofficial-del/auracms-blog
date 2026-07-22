import React from 'react';
import { store } from '../../lib/store';

interface AffiliateCTAProps {
  affiliateUrl: string;
  productId: string;
  asin: string;
  productTitle: string;
  category?: string;
  brand?: string;
  variant?: 'primary' | 'deal' | 'secondary' | 'outline' | 'sticky_mobile';
  size?: 'sm' | 'md' | 'lg';
  label?: 'Check Price on Amazon' | 'View Deal on Amazon' | 'Buy on Amazon' | 'See Latest Price' | 'Check Availability' | string;
  position?: string;
  className?: string;
}

export const AffiliateCTA: React.FC<AffiliateCTAProps> = ({
  affiliateUrl,
  productId,
  asin,
  productTitle,
  category = 'General',
  brand = 'General',
  variant = 'primary',
  size = 'md',
  label = 'Check Price on Amazon',
  position = 'product_card',
  className = ''
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Log affiliate click event
    store.logAffiliateClick({
      productId,
      asin,
      productTitle,
      category,
      brand,
      ctaText: label,
      ctaPosition: position,
      pageSource: window.location.pathname,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      marketplace: 'US'
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'deal':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 border-none font-extrabold';
      case 'sticky_mobile':
        return 'w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 shadow-xl text-center rounded-xl text-base flex items-center justify-center gap-2';
      case 'secondary':
        return 'bg-blue-900 hover:bg-blue-950 text-white shadow-md font-bold';
      case 'outline':
        return 'border-2 border-orange-500/80 hover:border-orange-600 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-bold';
      default:
        return 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold shadow-md shadow-orange-500/20';
    }
  };

  const getSizeStyles = () => {
    if (variant === 'sticky_mobile') return '';
    switch (size) {
      case 'sm':
        return 'py-1.5 px-3 text-xs rounded-lg gap-1.5';
      case 'lg':
        return 'py-3.5 px-6 text-base rounded-2xl gap-2.5';
      default:
        return 'py-2.5 px-4 text-sm rounded-xl gap-2';
    }
  };

  return (
    <a
      href={affiliateUrl || `https://www.amazon.com/dp/${asin}?tag=dawnwire-20`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] select-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      <span>{label}</span>
      {/* Amazon Smile/Arrow SVG icon */}
      <svg className="w-4 h-4 opacity-90" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    </a>
  );
};
