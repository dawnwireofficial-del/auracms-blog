import React from 'react';
import { store } from '../../lib/store';

interface AffiliateCTAProps {
  affiliateUrl: string;
  productId: string;
  asin: string;
  productTitle: string;
  productSlug?: string;
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
  productSlug,
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

  // Cloaked redirect: routes through /api/public/go/product/:slug which only
  // ever redirects to the manually-pasted affiliate URL (or a clean public URL).
  const cloakHref = productSlug ? `/api/public/go/product/${encodeURIComponent(productSlug)}${position && position !== 'product_card' ? `?placement=${encodeURIComponent(position)}` : ''}` : '';

  const getVariantStyles = () => {
    switch (variant) {
      case 'deal':
        return 'bg-gradient-to-r from-dw-blue to-dw-orange hover:from-dw-blue-600 hover:to-orange-500 text-white shadow-lg shadow-dw-orange/25 border-none font-extrabold';
      case 'sticky_mobile':
        return 'w-full bg-gradient-to-r from-dw-blue to-dw-orange hover:opacity-90 text-white font-bold py-3 px-6 shadow-xl text-center rounded-xl text-base flex items-center justify-center gap-2';
      case 'secondary':
        return 'bg-[#246BFF] hover:bg-[#164EE8] text-white shadow-md font-bold';
      case 'outline':
        return 'border-2 border-dw-orange/80 hover:border-dw-orange text-dw-orange hover:bg-orange-50 dark:hover:bg-orange-950/30 font-bold';
      default:
        return 'bg-gradient-to-r from-[#246BFF] to-[#4F7CFF] hover:from-dw-blue-700 hover:to-dw-blue-600 text-white font-extrabold shadow-md shadow-dw-blue/25';
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
      href={cloakHref || affiliateUrl || '#'}
      target="_blank"
      rel="sponsored noopener noreferrer"
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
