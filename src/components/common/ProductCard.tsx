import React, { useState, Suspense, lazy } from 'react';
import { Product } from '../../types';
import { AffiliateCTA } from './AffiliateCTA';
import { DwBadge } from './DwBadge';
import { PriceAlertModal } from '../product/PriceAlertModal';
import { useAppStore, store } from '../../lib/store';
import { toast } from '../../lib/toastStore';
import { sanitizeHtml } from '../../lib/sanitize';
import { proxyImageUrl } from '../../utils/safeRender';

const ProductSparkline = lazy(() => import('../product/ProductSparkline').then(m => ({ default: m.ProductSparkline })));

const Sparkline: React.FC<{ productId: string; currentPrice: number }> = ({ productId, currentPrice }) => (
  <Suspense fallback={<div className="h-8" />}>
    <ProductSparkline productId={productId} currentPrice={currentPrice} />
  </Suspense>
);

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onSelectCompare?: (productId: string) => void;
  isComparing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  onSelectCompare,
  isComparing = false
}) => {
  const { wishlist } = useAppStore();
  const isWishlisted = wishlist.includes(product.id);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleWishlist(product.id);
    if (!isWishlisted) {
      toast.success(`Saved "${product.title}" to Wishlist!`);
    } else {
      toast.info(`Removed "${product.title}" from Wishlist.`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/products/${product.slug}`;
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on DawnWire!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Product deep link copied to clipboard!');
      } catch (err) {
        toast.error('Unable to copy link.');
      }
    }
  };

  if (viewMode === 'list') {
    return (
      <div data-gravity-cursor="view" className="group relative flex flex-col md:flex-row bg-white dark:bg-dw-card rounded-[18px] border border-dw-border-soft/50 hover:border-dw-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
        {/* Image Container */}
        <div className="relative w-full md:w-64 h-52 md:h-auto shrink-0 bg-white dark:bg-dw-section p-4 flex items-center justify-center overflow-hidden">
          <img
            src={proxyImageUrl(product.images?.[0] || product.productImage) || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">No image</text></svg>')}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">No image</text></svg>'); }}
          />
          {product.isDeal && (
            <span className="absolute top-3 left-3 bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-md">
              -{product.discountPercentage || 20}% DEAL
            </span>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-full transition-colors bg-white/80 dark:bg-slate-800/80 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
              title="Share Product"
              aria-label="Share product"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={() => setIsPriceAlertOpen(true)}
              className="p-2 rounded-full transition-colors bg-white/80 dark:bg-slate-800/80 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60"
              title="Set Price Alert"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full transition-colors ${
                isWishlisted ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400' : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500'
              }`}
              title="Save to Wishlist"
            >
              <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {product.brand}
              </span>
              {product.bestFor && (
                <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/30">
                  {product.bestFor}
                </span>
              )}
            </div>

            <a href={`/products/${product.slug}`} className="block">
              <h3 className="text-lg font-bold text-dw-text group-hover:text-primary transition-colors line-clamp-2">
                {product.title}
              </h3>
            </a>

            <p className="text-sm text-dw-text-muted mt-2 line-clamp-2">
              {sanitizeHtml(product.shortDescription)}
            </p>

            {/* Features list */}
            {product.mainFeatures?.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-dw-text-muted">
                {product.mainFeatures.slice(0, 2).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate">{feat}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom Price & CTA */}
          <div className="mt-4 pt-3 border-t border-dw-border-soft/30 flex flex-wrap items-center justify-between gap-3">
            <div>
              {(() => {
                const cp = Number(product.currentPrice || product.price || 0);
                const rp = Number(product.referencePrice || 0);
                const vc = !isNaN(cp) && cp > 0;
                const vr = !isNaN(rp) && rp > 0;
                if (!vc) return <span className="text-sm font-semibold text-dw-text-muted italic">Check Price on Amazon</span>;
                return <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-amazon-orange">${cp.toFixed(2)}</span>
                  {vr && rp > cp && <span className="text-xs text-dw-text-muted line-through">${rp.toFixed(2)}</span>}
                  {product.isPrime && <span className="text-[10px] font-extrabold text-cyan italic bg-cyan/10 px-1.5 py-0.5 rounded">Prime</span>}
                </div>;
              })()}
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex text-amber-400 text-xs">
                  {'★'.repeat(Math.round(product.rating || 4.5))}
                </div>
                <span className="text-xs text-slate-500">
                  {product.rating} ({product.reviewCount?.toLocaleString()} reviews)
                </span>
              </div>
            </div>

            {/* Price Movement Sparkline */}
            {product.currentPrice && (
              <Sparkline productId={product.id} currentPrice={product.currentPrice} />
            )}

            <div className="flex items-center gap-2">
              {onSelectCompare && (
                <button
                  onClick={() => onSelectCompare(product.id)}
                  className={`text-xs px-3 py-2 rounded-xl font-semibold border transition-colors ${
                    isComparing ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {isComparing ? 'Comparing' : 'Compare'}
                </button>
              )}
              <AffiliateCTA
                affiliateUrl={product.affiliateUrl}
                productId={product.id}
                asin={product.asin}
                productTitle={product.title}
                productSlug={product.slug}
                category={product.mainCategory}
                brand={product.brand}
                label={product.isDeal ? 'View Deal on Amazon' : 'Check Price on Amazon'}
                variant={product.isDeal ? 'deal' : 'primary'}
                position="card_list"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div data-gravity-cursor="view" className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-2xl hover:shadow-blue-600/10 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col items-start gap-1">
          {product.isDeal ? (
            <DwBadge type="popular-deal" />
          ) : product.editorScore >= 9.4 ? (
            <DwBadge type="editors-choice" />
          ) : product.editorScore >= 8.5 ? (
            <DwBadge type="expert-reviewed" />
          ) : null}
          {product.couponCode && (
            <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md">
              🏷️ {product.couponCode}
            </span>
          )}
          {product.stockStatus && product.stockStatus !== 'in_stock' && (
            <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md shadow-md text-white ${
              product.stockStatus === 'out_of_stock' ? 'bg-slate-700' : 'bg-amber-600'
            }`}>
              {product.stockStatus === 'out_of_stock' ? 'Out of Stock' : product.stockStatus === 'low_stock' ? '⚠️ Low Stock' : product.stockStatus}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleShare}
            className="p-2 rounded-full transition-colors backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60"
            title="Share Product"
            aria-label="Share product"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={() => setIsPriceAlertOpen(true)}
            className="p-2 rounded-full transition-colors backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60"
            title="Set Price Alert"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full transition-colors backdrop-blur-sm ${
              isWishlisted ? 'bg-red-50/90 text-red-600 dark:bg-red-950/90 dark:text-red-400' : 'bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500'
            }`}
            title="Save to Wishlist"
          >
            <svg className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <a href={`/products/${product.slug}`} className="relative h-64 bg-white dark:bg-[#030712]/60 p-5 flex items-center justify-center overflow-hidden border-b border-slate-200/60 dark:border-blue-500/10">
        <img
          src={proxyImageUrl(product.images?.[0] || product.productImage) || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">No image</text></svg>')}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.10)] group-hover:scale-110 group-hover:-rotate-1 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f1f5f9"/><text x="100" y="105" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">No image</text></svg>'); }}
        />
      </a>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{product.brand}</span>
            <span>{product.subcategory}</span>
          </div>

          <a href={`/products/${product.slug}`} className="block">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </a>

          {product.bestFor && (
            <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 truncate">
              {product.bestFor}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              {(product.currentPrice || product.price) ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                    ${Number(product.currentPrice || product.price || 0).toFixed(2)}
                  </span>
                  {product.referencePrice && Number(product.referencePrice) > Number(product.currentPrice || 0) && (
                    <span className="text-xs text-slate-400 line-through">
                      ${Number(product.referencePrice).toFixed(2)}
                    </span>
                  )}
                  {product.referencePrice && Number(product.referencePrice) > Number(product.currentPrice || 0) && (
                    <span className="ml-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                      −{Math.round((1 - Number(product.currentPrice) / Number(product.referencePrice)) * 100)}%
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-500">Check Price on Amazon</span>
              )}
            </div>

            {product.rating && (
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-amber-400">★</span>
                <span className="font-bold">{product.rating}</span>
                <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Sparkline Trend Chart */}
          {product.currentPrice && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Sparkline productId={product.id} currentPrice={product.currentPrice} />
              {onSelectCompare && (
                <button
                  onClick={() => onSelectCompare(product.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                    isComparing ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isComparing ? 'Comparing' : 'Compare'}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <AffiliateCTA
              affiliateUrl={product.affiliateUrl}
              productId={product.id}
              asin={product.asin}
              productTitle={product.title}
              productSlug={product.slug}
              category={product.mainCategory}
              brand={product.brand}
              label={product.isDeal ? 'View Deal on Amazon' : 'Check Price on Amazon'}
              variant={product.isDeal ? 'deal' : 'primary'}
              size="lg"
              position="card_grid"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {isPriceAlertOpen && (
        <PriceAlertModal
          product={product}
          onClose={() => setIsPriceAlertOpen(false)}
        />
      )}
    </div>
  );
};
