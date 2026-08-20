import { Star, Heart, ShoppingBag, AlertCircle, Shield, TrendingDown, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductReview } from '../../types';
import { useMotion } from '../motion/MotionProvider';
import { proxyImageUrl } from '../../utils/safeRender';
import { cloakHref } from '../../lib/cloak';

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
  const price = parseFloat(String(product.price || product.currentPrice || '0').replace(/[^0-9.]/g, ''));
  const origPrice = parseFloat(String(product.originalPrice || product.referencePrice || '0').replace(/[^0-9.]/g, ''));
  const rawDiscount = origPrice > price && origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0;
  const discount = product.discountPercentage || (rawDiscount > 0 && rawDiscount <= 70 ? rawDiscount : 0);
  const hasDiscount = discount > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const validPrice = !isNaN(price) && price > 0;
  const validOrigPrice = !isNaN(origPrice) && origPrice > 0;

  const renderStars = (rating?: number) => {
    if (!rating || rating <= 0) {
      return <span className="text-[11px] text-slate-400 italic">No ratings yet</span>;
    }
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-400/50' : 'text-slate-200'}`} />
          ))}
        </div>
        <span className="text-[11px] text-slate-500 font-medium">{rating.toFixed(1)}</span>
        {product.reviewCount ? <span className="text-[10px] text-slate-400">({Number(product.reviewCount).toLocaleString()})</span> : null}
      </div>
    );
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
      whileHover={globalEnabled ? { y: -6, scale: 1.015 } : {}}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-white border border-slate-100 hover:border-blue-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_20px_48px_-16px_rgba(36,107,255,0.15)] transition-all duration-300 overflow-hidden flex flex-col"
    >
       {/* Image */}
       <a href={`/products/${product.slug || product.id}`} className="relative aspect-square bg-gradient-to-b from-slate-50 to-white overflow-hidden">
         {product.productImage ? (
            <img src={proxyImageUrl(product.productImage)} alt={product.productName} className="w-full h-full object-contain p-5 group-hover:scale-110 transition-transform duration-500 ease-out" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const img = e.currentTarget; if (img.src.includes('/api/public/image-proxy')) { const m = img.src.match(/url=([^&]+)/); if (m) img.src = decodeURIComponent(m[1]); } else { (e.target as HTMLElement).style.display = 'none'; } }} />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-300">
             <ShoppingBag className="h-16 w-16" />
           </div>
         )}
       {/* Editor Score badge */}
       {product.editorScore && product.editorScore > 0 && (
         <div className="absolute top-3 left-3 z-10">
           <div className="flex items-center gap-1 bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-orange-500/30">
             <span className="text-[9px]">★</span>
             <span>{product.editorScore}/10</span>
           </div>
         </div>
       )}
       {/* Discount badge */}
       {hasDiscount && (
         <div className="absolute top-3 right-3 z-10">
           <div className="flex items-center gap-0.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-red-500/30">
             <TrendingDown className="h-3 w-3" />
             <span>-{discount}%</span>
           </div>
         </div>
       )}
       {/* Wishlist */}
       {onWishlistToggle && (
         <button onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id); }} className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
           <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400'}`} />
         </button>
       )}
       {/* Coupon tag */}
       {product.couponCode && (
         <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-md">
           <Tag className="h-3 w-3" />
           <span>Coupon</span>
         </div>
       )}
     </a>
     {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
       {product.brand && <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{product.brand}</p>}
       <a href={`/products/${product.slug || product.id}`} className="text-[13px] font-semibold text-slate-800 line-clamp-2 hover:text-blue-600 transition-colors leading-snug min-h-[36px]">
         {product.productName}
       </a>
       {/* Rating */}
       <div className="mt-1.5">
         {renderStars(product.rating)}
       </div>
       {/* Best For */}
       {product.bestFor && <p className="text-[9px] text-dw-text-muted mt-1">Best for: {product.bestFor}</p>}
       {/* Price Row */}
       <div className="mt-auto pt-3 flex items-baseline gap-2 border-t border-slate-100">
         {validPrice ? (
           <span className="text-xl font-black text-slate-900">${price.toFixed(2)}</span>
         ) : (
           <span className="text-[13px] font-semibold text-slate-500">Check Price</span>
         )}
         {validOrigPrice && hasDiscount && <span className="text-[12px] text-slate-400 line-through">${origPrice.toFixed(2)}</span>}
       </div>
       {/* Stock */}
       {isOutOfStock && (
         <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
           <AlertCircle className="h-3 w-3" /> Out of Stock
         </div>
       )}
        {/* Actions */}
        <div className="mt-2.5 flex items-center gap-2">
          <a
            href={cloakHref(product.slug, viewMode === 'list' ? 'list_card' : 'grid_card') || product.affiliateUrl || '#'}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={handleAffiliateClick}
            className="flex-1 text-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] hover:from-[#e67b00] hover:to-[#e06000] text-white text-[11px] font-bold shadow-[0_4px_14px_-4px_rgba(255,138,0,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(255,138,0,0.6)] transition-all duration-200 hover:-translate-y-0.5"
          >
            {product.ctaText || 'Check Price on Amazon'}
          </a>
         {onCompare && (            <button onClick={(e) => { e.preventDefault(); onCompare(product.id); }} className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 ${compareSelected ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50'}`}>
             {compareSelected ? '✓ Comparing' : 'Compare'}
           </button>
         )}
       </div>
       {/* Coupon */}
       {product.couponCode && (
         <p className="mt-1.5 text-[9px] text-dw-success font-semibold">Use code: {product.couponCode}</p>
       )}
     </div>
   </motion.div>
  );

  const listView = (
    <motion.div
      whileHover={globalEnabled ? { y: -2 } : {}}
      className="group flex gap-5 bg-white border border-slate-100 hover:border-blue-200 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_20px_48px_-16px_rgba(36,107,255,0.15)] transition-all duration-300 p-5"
    >
      <a href={`/products/${product.slug || product.id}`} className="w-36 h-36 shrink-0 bg-gradient-to-b from-slate-50 to-white rounded-xl overflow-hidden flex items-center justify-center">
        {product.productImage ? (
          <img src={proxyImageUrl(product.productImage)} alt={product.productName} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const img = e.currentTarget; if (img.src.includes('/api/public/image-proxy')) { const m = img.src.match(/url=([^&]+)/); if (m) img.src = decodeURIComponent(m[1]); } else { (e.target as HTMLElement).style.display = 'none'; } }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="h-10 w-10" /></div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {product.editorScore && product.editorScore > 0 && (
            <span className="text-[10px] font-black bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] text-white px-2 py-0.5 rounded-md">★ {product.editorScore}/10</span>
          )}
          {hasDiscount && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">-{discount}%</span>
          )}
          {product.couponCode && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">🏷 Coupon</span>
          )}
        </div>
        {product.brand && <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-1">{product.brand}</p>}
        <a href={`/products/${product.slug || product.id}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600 line-clamp-1 mt-0.5 transition-colors">
          {product.productName}
        </a>
        {renderStars(product.rating)}
        <p className="text-[10px] text-dw-text-muted mt-1 line-clamp-1">{product.reviewSummary || product.bestFor}</p>
        <div className="mt-2 flex items-center gap-2">
          {validPrice ? (
            <span className="text-xl font-black text-slate-900">${price.toFixed(2)}</span>
          ) : (
            <span className="text-base font-bold text-slate-500">Check Price</span>
          )}
          {validOrigPrice && hasDiscount && <span className="text-xs text-dw-text-muted line-through">${origPrice.toFixed(2)}</span>}
        </div>
        {isOutOfStock && <span className="text-[10px] font-bold text-red-500">Out of Stock</span>}
        <div className="mt-2 flex items-center gap-2">
          <a
            href={cloakHref(product.slug, viewMode === 'list' ? 'list_card' : 'grid_card') || product.affiliateUrl || '#'}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={handleAffiliateClick}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF6A00] hover:from-[#e67b00] hover:to-[#e06000] text-white text-[11px] font-bold shadow-[0_4px_14px_-4px_rgba(255,138,0,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(255,138,0,0.6)] transition-all duration-200"
          >
            {product.ctaText || 'Check Price'}
          </a>
          {onWishlistToggle && (
            <button onClick={() => onWishlistToggle(product.id)} className={`p-2.5 rounded-xl border transition-all duration-200 ${inWishlist ? 'text-red-500 border-red-200 bg-red-50' : 'border-slate-200 text-slate-400 hover:text-red-400 hover:border-red-200'}`}>
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return viewMode === 'list' ? listView : gridView;
}
