import { Star, Heart, ShoppingBag, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductReview } from '../../types';
import { useMotion } from '../motion/MotionProvider';

interface ProductCardProps {
  product: ProductReview & { isFeatured?: boolean; isDeal?: boolean; discountPercentage?: number };
  viewMode?: 'grid' | 'list';
  onWishlistToggle?: (id: string) => void;
  inWishlist?: boolean;
  onCompare?: (id: string) => void;
  compareSelected?: boolean;
}

export default function ProductCard({
  product, viewMode = 'grid', onWishlistToggle, inWishlist, onCompare, compareSelected,
}: ProductCardProps) {
  const price = parseFloat((product.price || '0').replace(/[^0-9.]/g, ''));
  const origPrice = parseFloat((product.originalPrice || '0').replace(/[^0-9.]/g, ''));
  const hasDiscount = origPrice > price && origPrice > 0;
  const discount = product.discountPercentage || (hasDiscount ? Math.round((1 - price / origPrice) * 100) : 0);
  const isOutOfStock = product.stockStatus === 'out_of_stock';

  const renderStars = (rating?: number) => {
    if (!rating || rating <= 0) {
      return <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic">Not rated</span>;
    }
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-400/50' : 'text-slate-200 dark:text-zinc-600'}`} />
          ))}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderDealBadge = () => {
    if (product.dealBadge) {
      return <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{product.dealBadge}</span>;
    }
    if (discount > 0) {
      return <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">-{discount}%</span>;
    }
    return null;
  };

  const renderStockBadge = () => {
    if (product.stockStatus === 'out_of_stock') return <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5"><AlertCircle className="h-2.5 w-2.5" /> Out of Stock</span>;
    if (product.stockStatus === 'low_stock') return <span className="text-[9px] font-bold text-amber-500">Low Stock</span>;
    if (product.stockStatus === 'limited') return <span className="text-[9px] font-bold text-orange-500">Limited</span>;
    return null;
  };

  const handleAffiliateClick = () => {
    fetch('/api/public/track/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        categoryId: (product as any).categoryId,
        pageUrl: window.location.pathname,
        pageType: window.location.pathname.includes('/category/') ? 'category' : window.location.pathname.includes('/product/') ? 'product' : 'listing',
        ctaPosition: viewMode === 'list' ? 'list_card' : 'grid_card',
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        sessionId: localStorage.getItem('sessionId'),
      }),
    }).catch(() => {});
  };

  const { globalEnabled } = useMotion();

  const gridView = (
    <motion.div
      whileHover={globalEnabled ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative glass-panel rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-brand-secondary/20 hover:border-brand-secondary/40"
    >
      {/* Image */}
      <a href={`/product/${product.slug || product.id}`} className="relative aspect-square bg-white/5 overflow-hidden">
        {product.productImage ? (
          <img src={product.productImage} alt={product.productName} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {renderDealBadge()}
          {product.couponCode && <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Coupon</span>}
          {(product as any).primeEligible && <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5"><Shield className="h-2 w-2" /> Prime</span>}
        </div>
        {/* Wishlist */}
        {onWishlistToggle && (
          <button onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id); }} className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-zinc-800/80 rounded-full hover:bg-white dark:hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100">
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
          </button>
        )}
      </a>
      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        {product.brand && <p className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider">{product.brand}</p>}
        <a href={`/product/${product.slug || product.id}`} className="text-xs font-semibold text-slate-800 dark:text-zinc-100 mt-0.5 line-clamp-2 hover:text-brand-accent transition-colors leading-tight block">
          {product.productName}
        </a>
        {/* Rating */}
        <div className="mt-1.5">
          {renderStars(product.rating)}
        </div>
        {/* Best For */}
        {product.bestFor && <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1">Best for: {product.bestFor}</p>}
        {/* Price */}
        <div className="mt-auto pt-2 flex items-center gap-1.5">
          <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">${price.toFixed(2)}</span>
          {hasDiscount && <span className="text-[11px] text-slate-400 dark:text-zinc-500 line-through">${origPrice.toFixed(2)}</span>}
        </div>
        {/* Stock */}
        {renderStockBadge() && <div className="mt-1">{renderStockBadge()}</div>}
        {/* Actions */}
        <div className="mt-2 flex items-center gap-2">
          <a
            href={product.affiliateUrl || '#'}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={handleAffiliateClick}
            className="flex-1 text-center bg-brand-secondary hover:bg-brand-accent text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
          >
            {product.ctaText || 'Check Price'}
          </a>
          {onCompare && (
            <button onClick={(e) => { e.preventDefault(); onCompare(product.id); }} className={`p-2 rounded-lg border text-[10px] font-semibold transition-colors ${compareSelected ? 'bg-brand-secondary text-white border-brand-secondary' : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-brand-secondary hover:text-brand-secondary'}`}>
              Compare
            </button>
          )}
        </div>
        {/* Coupon */}
        {product.couponCode && (
          <p className="mt-1.5 text-[9px] text-green-600 dark:text-green-400 font-semibold">Use code: {product.couponCode}</p>
        )}
      </div>
    </motion.div>
  );

  const listView = (
    <motion.div
      whileHover={globalEnabled ? { y: -2 } : {}}
      className="flex gap-4 glass-panel rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 border border-brand-secondary/20 hover:border-brand-secondary/40"
    >
      <a href={`/product/${product.slug || product.id}`} className="w-32 h-32 shrink-0 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
        {product.productImage ? (
          <img src={product.productImage} alt={product.productName} className="w-full h-full object-contain p-2" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600"><ShoppingBag className="h-8 w-8" /></div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {renderDealBadge()}
          {product.couponCode && <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Coupon</span>}
        </div>
        {product.brand && <p className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider mt-1">{product.brand}</p>}
        <a href={`/product/${product.slug || product.id}`} className="text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:text-brand-accent line-clamp-1 mt-0.5 block">
          {product.productName}
        </a>
        {renderStars(product.rating)}
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 line-clamp-1">{product.reviewSummary || product.bestFor}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">${price.toFixed(2)}</span>
          {hasDiscount && <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">${origPrice.toFixed(2)}</span>}
        </div>
        {renderStockBadge()}
        <div className="mt-2 flex items-center gap-2">
          <a
            href={product.affiliateUrl || '#'}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={handleAffiliateClick}
            className="bg-brand-secondary hover:bg-brand-accent text-white text-[10px] font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {product.ctaText || 'Check Price'}
          </a>
          {onWishlistToggle && (
            <button onClick={() => onWishlistToggle(product.id)} className={`p-2 rounded-lg border transition-colors ${inWishlist ? 'text-red-500 border-red-200' : 'border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-red-500'}`}>
              <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-red-500' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return viewMode === 'list' ? listView : gridView;
}
