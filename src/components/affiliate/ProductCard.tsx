import { Star, Heart, ShoppingBag, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductReview } from '../../types';
import { useMotion } from '../motion/MotionProvider';
import { proxyImageUrl } from '../../utils/safeRender';

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
  const discount = product.discountPercentage || (rawDiscount > 0 && rawDiscount <= 40 ? rawDiscount : 0);
  const hasDiscount = discount > 0;
  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const validPrice = !isNaN(price) && price > 0;
  const validOrigPrice = !isNaN(origPrice) && origPrice > 0;

  const renderStars = (rating?: number) => {
    if (!rating || rating <= 0) {
      return <span className="text-[10px] text-dw-text-muted italic">Not rated</span>;
    }
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-400/50' : 'text-dw-border-soft'}`} />
          ))}
        </div>
        <span className="text-[10px] text-dw-text-muted font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderDealBadge = () => {
    if (product.dealBadge) {
      return <span className="bg-deal-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">{product.dealBadge}</span>;
    }
    if (discount > 0) {
      return <span className="bg-deal-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">-{discount}%</span>;
    }
    return null;
  };

  const renderStockBadge = () => {
    if (product.stockStatus === 'out_of_stock') return <span className="text-[9px] font-bold text-deal-red flex items-center gap-0.5"><AlertCircle className="h-2.5 w-2.5" /> Out of Stock</span>;
    if (product.stockStatus === 'low_stock') return <span className="text-[9px] font-bold text-amber-500">Low Stock</span>;
    if (product.stockStatus === 'limited') return <span className="text-[9px] font-bold text-amazon-orange">Limited</span>;
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
      className="group relative bg-dw-card border border-dw-border-soft hover:border-dw-border rounded-[18px] shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden flex flex-col"
    >
       {/* Image */}
       <a href={`/product/${product.slug || product.id}`} className="relative aspect-square bg-dw-section overflow-hidden">
         {product.productImage ? (
            <img src={proxyImageUrl(product.productImage)} alt={product.productName} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const img = e.currentTarget; if (img.src.includes('/api/public/image-proxy')) { const m = img.src.match(/url=([^&]+)/); if (m) img.src = decodeURIComponent(m[1]); } else { (e.target as HTMLElement).style.display = 'none'; } }} />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-dw-text-muted">
             <ShoppingBag className="h-12 w-12" />
           </div>
         )}
       {/* Badges */}
       <div className="absolute top-2 left-2 flex flex-col gap-1">
         {renderDealBadge()}
         {product.couponCode && <span className="bg-dw-success text-[#07101F] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Coupon</span>}
         {(product as any).primeEligible && <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5"><Shield className="h-2 w-2" /> Prime</span>}
       </div>
       {/* Wishlist */}
       {onWishlistToggle && (
         <button onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id); }} className="absolute top-2 right-2 p-1.5 bg-dw-card/80 rounded-full hover:bg-dw-card-hover transition-all opacity-0 group-hover:opacity-100">
           <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-deal-red text-deal-red' : 'text-dw-text-muted'}`} />
         </button>
       )}
     </a>
     {/* Info */}
     <div className="p-3 flex-1 flex flex-col">
       {product.brand && <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{product.brand}</p>}
       <a href={`/product/${product.slug || product.id}`} className="text-xs font-semibold text-dw-text mt-0.5 line-clamp-2 hover:text-cyan transition-colors leading-tight block">
         {product.productName}
       </a>
       {/* Rating */}
       <div className="mt-1.5">
         {renderStars(product.rating)}
       </div>
       {/* Best For */}
       {product.bestFor && <p className="text-[9px] text-dw-text-muted mt-1">Best for: {product.bestFor}</p>}
       {/* Price */}
       <div className="mt-auto pt-2 flex items-center gap-1.5">
         {validPrice ? (
           <span className="text-sm font-bold text-amazon-orange">${price.toFixed(2)}</span>
         ) : (
           <span className="text-sm font-bold text-dw-text">Check price</span>
         )}
         {validOrigPrice && hasDiscount && <span className="text-[11px] text-dw-text-muted line-through">${origPrice.toFixed(2)}</span>}
       </div>
       {/* Stock */}
       {renderStockBadge() && <div className="mt-1">{renderStockBadge()}</div>}
       {/* Actions */}
       <div className="mt-2 flex items-center gap-2">
         <a
           href={product.affiliateUrl || '#'}
           target="_blank" rel="sponsored noopener noreferrer"
           onClick={handleAffiliateClick}
           className="flex-1 text-center amazon-btn !py-2 !text-[10px]"
         >
           {product.ctaText || 'Check Price on Amazon'}
         </a>
         {onCompare && (
           <button onClick={(e) => { e.preventDefault(); onCompare(product.id); }} className={`p-2 rounded-lg border text-[10px] font-semibold transition-colors ${compareSelected ? 'bg-primary text-white border-primary' : 'border-dw-border-soft text-dw-text-muted hover:border-primary hover:text-primary'}`}>
             Compare
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
      className="flex gap-4 bg-dw-card border border-dw-border-soft hover:border-dw-border rounded-[18px] shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 p-4"
    >
      <a href={`/product/${product.slug || product.id}`} className="w-32 h-32 shrink-0 bg-dw-section rounded-lg overflow-hidden flex items-center justify-center">
        {product.productImage ? (
          <img src={proxyImageUrl(product.productImage)} alt={product.productName} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const img = e.currentTarget; if (img.src.includes('/api/public/image-proxy')) { const m = img.src.match(/url=([^&]+)/); if (m) img.src = decodeURIComponent(m[1]); } else { (e.target as HTMLElement).style.display = 'none'; } }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dw-text-muted"><ShoppingBag className="h-8 w-8" /></div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {renderDealBadge()}
          {product.couponCode && <span className="bg-dw-success text-[#07101F] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Coupon</span>}
        </div>
        {product.brand && <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-1">{product.brand}</p>}
        <a href={`/product/${product.slug || product.id}`} className="text-sm font-semibold text-dw-text hover:text-cyan line-clamp-1 mt-0.5 block">
          {product.productName}
        </a>
        {renderStars(product.rating)}
        <p className="text-[10px] text-dw-text-muted mt-1 line-clamp-1">{product.reviewSummary || product.bestFor}</p>
        <div className="mt-2 flex items-center gap-2">
          {validPrice ? (
            <span className="text-lg font-bold text-amazon-orange">${price.toFixed(2)}</span>
          ) : (
            <span className="text-lg font-bold text-dw-text">Check price</span>
          )}
          {validOrigPrice && hasDiscount && <span className="text-xs text-dw-text-muted line-through">${origPrice.toFixed(2)}</span>}
        </div>
        {renderStockBadge()}
        <div className="mt-2 flex items-center gap-2">
          <a
            href={product.affiliateUrl || '#'}
            target="_blank" rel="sponsored noopener noreferrer"
            onClick={handleAffiliateClick}
            className="amazon-btn !py-2 !px-4 !text-[10px]"
          >
            {product.ctaText || 'Check Price'}
          </a>
          {onWishlistToggle && (
            <button onClick={() => onWishlistToggle(product.id)} className={`p-2 rounded-lg border transition-colors ${inWishlist ? 'text-deal-red border-deal-red/30' : 'border-dw-border-soft text-dw-text-muted hover:text-deal-red'}`}>
              <Heart className={`h-3.5 w-3.5 ${inWishlist ? 'fill-deal-red' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return viewMode === 'list' ? listView : gridView;
}
