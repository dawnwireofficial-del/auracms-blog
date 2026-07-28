import React, { useState, useEffect } from 'react';
import { Star, Heart, Share2, ShoppingBag, Shield, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Award, Sparkles } from 'lucide-react';
import { ProductReview } from '../../types';
import Breadcrumbs from '../Breadcrumbs';
import SocialShareButtons from '../SocialShareButtons';
import PriceAlertModal from './PriceAlertModal';
import AiVerdictCard from './AiVerdictCard';
import MultiStoreComparison from './MultiStoreComparison';
import CustomerReviews from './CustomerReviews';
import ProductCard from './ProductCard';
import ProductSpotlight from '../motion/ProductSpotlight';
import TechGrid from '../motion/TechGrid';
import DiscoveryTrail from '../motion/DiscoveryTrail';
import { safeText } from '../../utils/safeRender';
import { sanitizeHtml } from '../../lib/sanitize';

interface ProductDetailProps {
  product: ProductReview & { asin?: string; gallery?: string[]; editorRating?: number; features?: string[]; technicalSpecs?: Record<string, string>; isFeatured?: boolean; isDeal?: boolean; discountPercentage?: number; reviewCount?: number; shippingInfo?: string; pros?: string[]; cons?: string[]; amazonUrl?: string; priceUpdatedAt?: string };
  relatedProducts?: ProductReview[];
  similarProducts?: ProductReview[];
  onNavigate?: (route: string, param?: string) => void;
}

export default function ProductDetail({ product, relatedProducts, similarProducts, onNavigate }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = (idx: number) => {
    setBrokenImages(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const specsGallery = (product as any).specs?.gallery;
  const galleryArr = Array.isArray(specsGallery) ? specsGallery : [];
  const rawGallery = product.gallery || [];
  const images = [product.productImage, ...rawGallery, ...galleryArr].filter(Boolean) as string[];
  const price = parseFloat(String(product.price || product.currentPrice || '0').replace(/[^0-9.]/g, ''));
  const origPrice = parseFloat(String(product.originalPrice || product.referencePrice || '0').replace(/[^0-9.]/g, ''));
  const rawDiscount = origPrice > price && origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0;
  const discount = product.discountPercentage || (rawDiscount > 0 && rawDiscount <= 40 ? rawDiscount : 0);
  const hasDiscount = discount > 0;
  const features = product.features || product.keyFeatures || [];
  const specs = product.technicalSpecs || product.specs || {};
  const pros = product.pros || [];
  const cons = product.cons || [];

  const pageUrl = window.location.href;
  const productUrl = product.affiliateUrl || product.amazonUrl || '#';

  const handleAffiliateClick = (position: string) => {
    fetch('/api/public/track/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id, categoryId: (product as any).categoryId, pageUrl: window.location.pathname,
        pageType: 'product', ctaPosition: position, deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        sessionId: localStorage.getItem('sessionId'),
      }),
    }).catch(() => {});
  };

  const toggleWishlist = () => {
    const sessionId = localStorage.getItem('sessionId');
    if (inWishlist) {
      setInWishlist(false);
      fetch(`/api/public/wishlist/${product.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    } else {
      setInWishlist(true);
      fetch('/api/public/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, sessionId }),
      }).catch(() => {});
    }
  };

  const renderStars = (rating: number, size = 'h-4 w-4') => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`${size} ${i < full ? 'text-amber-400 fill-amber-400' : i === full && half ? 'text-amber-400 fill-amber-400/50' : 'text-slate-200 dark:text-zinc-600'}`} />
        ))}
      </div>
    );
  };

  // Track page view
  useEffect(() => {
    fetch('/api/public/track/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, sessionId: localStorage.getItem('sessionId') }),
    }).catch(() => {});
    // Add to recently viewed
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      fetch('/api/public/recently-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, sessionId }),
      }).catch(() => {});
    }
  }, [product.id]);

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="Container px-4 py-3">
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => onNavigate?.('home') },
          { label: 'Categories', onClick: () => onNavigate?.('categories') },
          { label: product.bestFor || 'Products' },
          { label: product.productName || product.title || 'Product Detail' },
        ]} />
      </div>

      <div className="Container px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Left: Image Gallery */}
          <div>
            <div className="relative aspect-square glass-panel rounded-xl overflow-hidden shadow-lg border border-brand-secondary/20 hover:border-brand-secondary/40 transition-all flex items-center justify-center bg-white/5">
              <ProductSpotlight />
              {images.length > 0 ? (
                brokenImages.has(activeImage) ? (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
                    <ShoppingBag className="h-20 w-20" />
                  </div>
                ) : (
                  <img src={images[activeImage]} alt={product.productName} className="w-full h-full object-contain p-6" onError={() => handleImageError(activeImage)} />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
                  <ShoppingBag className="h-20 w-20" />
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.dealBadge && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">{product.dealBadge}</span>}
                {discount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">-{discount}%</span>}
                {(product as any).primeEligible && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Prime</span>}
              </div>
              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-zinc-800/80 rounded-full hover:bg-white dark:hover:bg-zinc-700 transition-all"><ChevronLeft className="h-4 w-4 text-slate-600" /></button>
                  <button onClick={() => setActiveImage(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-zinc-800/80 rounded-full hover:bg-white dark:hover:bg-zinc-700 transition-all"><ChevronRight className="h-4 w-4 text-slate-600" /></button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${i === activeImage ? 'border-brand-secondary' : 'border-slate-200 dark:border-zinc-700 hover:border-brand-secondary/50'}`}>
                    {brokenImages.has(i) ? (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    ) : (
                      <img src={img} alt="" className="w-full h-full object-contain p-1" loading="lazy" onError={() => handleImageError(i)} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Brand */}
            {product.brand && <p className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">{product.brand}</p>}
            {/* Title */}
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-zinc-100 mt-1 leading-tight">{product.productName}</h1>
            
            {/* AI Verdict */}
            {product.aiVerdict && <AiVerdictCard verdict={product.aiVerdict} />}
            
            {/* Rating */}
            <div className="flex items-center gap-2 mt-4">
              {renderStars(product.rating || 4.5, 'h-4 w-4')}
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{product.rating || 4.5}</span>
              {(product.reviewCount || product.reviewCount === 0) && <span className="text-xs text-slate-400 dark:text-zinc-500">({product.reviewCount} reviews)</span>}
            </div>
            {/* Best For */}
            {product.bestFor && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2"><Award className="h-3 w-3 inline mr-1 text-brand-secondary" />Best for: <span className="font-semibold text-slate-700 dark:text-zinc-200">{product.bestFor}</span></p>}

            {/* Price */}
            <div className="mt-4 p-4 glass-panel rounded-xl shadow-lg border border-brand-secondary/10">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-800 dark:text-zinc-100">${price.toFixed(2)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-slate-400 dark:text-zinc-500 line-through">${origPrice.toFixed(2)}</span>
                    <span className="text-sm font-bold text-red-500">You save ${(origPrice - price).toFixed(2)}</span>
                  </>
                )}
              </div>
              {/* Stock status */}
              <div className="mt-2 flex items-center gap-2">
                {product.stockStatus === 'out_of_stock' ? (
                  <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Out of Stock</span>
                ) : product.stockStatus === 'low_stock' ? (
                  <span className="text-xs text-amber-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Only few left</span>
                ) : (
                  <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> In Stock</span>
                )}
                {(product as any).primeEligible && <span className="text-xs text-blue-600 flex items-center gap-1"><Shield className="h-3 w-3" /> Prime Eligible</span>}
              </div>
              {/* Shipping */}
              {(product as any).shippingInfo && <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">{(product as any).shippingInfo}</p>}
              {/* Last updated */}
              {(product as any).priceUpdatedAt && (
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  Price updated: {new Date((product as any).priceUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Price Disclaimer */}
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 italic">
              Price and availability are accurate as of {new Date().toLocaleDateString()} and are subject to change on Amazon.
            </p>

            {/* Coupon */}
            {product.couponCode && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs font-bold text-green-700 dark:text-green-400">🏷️ Coupon: <span className="font-mono">{product.couponCode}</span></p>
                {product.couponExpiry && <p className="text-[10px] text-green-600 dark:text-green-500 mt-0.5">Expires: {new Date(product.couponExpiry).toLocaleDateString()}</p>}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <a
                href={productUrl}
                target="_blank" rel="sponsored noopener noreferrer"
                onClick={() => handleAffiliateClick('main_cta')}
                className="flex-1 text-center bg-[#0c5adb] hover:bg-[#0a4db8] text-white text-sm font-bold py-3 rounded-lg transition-colors"
              >
                {product.ctaText || 'Check Price'} →
              </a>
              <div className="flex gap-2">
                <PriceAlertModal productId={product.id} currentPrice={price} productName={product.productName || product.title} />
                <button onClick={toggleWishlist} className={`px-4 py-3 rounded-lg border text-xs font-semibold transition-colors ${inWishlist ? 'bg-red-50 border-red-200 text-red-600' : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>
              <button onClick={() => { const evt = new CustomEvent('open-chat', { detail: { productSlug: product.slug } }); window.dispatchEvent(evt); }}
                className="px-4 py-3 rounded-lg border border-[#246BFF]/30 bg-[#246BFF]/5 text-[#246BFF] text-xs font-semibold hover:bg-[#246BFF]/10 transition-colors flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Ask AI
              </button>
              <div className="relative">
                <button onClick={() => setShowShare(!showShare)} className="px-4 py-3 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
                {showShare && (
                  <div className="absolute right-0 top-full mt-2 z-10">
                    <SocialShareButtons url={pageUrl} title={product.productName || product.title} compact />
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Store Comparison */}
            <MultiStoreComparison 
              amazonPrice={String(product.price || price)} 
              amazonUrl={productUrl} 
              stores={product.alternativeStores} 
            />

            {/* Mobile Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 p-3 lg:hidden z-40 flex items-center gap-3">
              <div className="flex-1">
                <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">${price.toFixed(2)}</span>
                {hasDiscount && <span className="text-xs text-slate-400 line-through ml-1">${origPrice.toFixed(2)}</span>}
              </div>
              <a
                href={productUrl}
                target="_blank" rel="sponsored noopener noreferrer"
                onClick={() => handleAffiliateClick('mobile_sticky')}
                className="bg-[#0c5adb] hover:bg-[#0a4db8] text-white text-xs font-bold px-6 py-3 rounded-lg transition-colors"
              >
                {product.ctaText || 'Check Price'}
              </a>
            </div>

            {/* Affiliate Disclosure */}
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-4 p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-lg italic leading-relaxed">
              {product.affiliateDisclaimer || 'As an Amazon Associate, we earn from qualifying purchases. This site contains affiliate links.'}
            </p>

            {/* Key Features */}
            {features.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-3">Key Features</h2>
                <ul className="space-y-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Technical Specifications */}
        {Object.keys(specs).length > 0 && (
          <div className="relative overflow-hidden mt-8 p-6 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
            <TechGrid />
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4">Technical Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(specs).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-zinc-900 rounded-lg">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{safeText(String(val))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discovery Trail Relationship Visualization */}
        <DiscoveryTrail
          className="mt-8"
          currentProductTitle={product.productName || product.title || ''}
          categoryName={product.bestFor || 'Technology'}
          similarProductsCount={(similarProducts || []).length}
          onNavigate={(r, p) => onNavigate?.(r, p)}
        />

        {/* Pros & Cons */}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pros.length > 0 && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">Pros</h3>
                <ul className="space-y-1.5">
                  {pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-300">
                      <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">Cons</h3>
                <ul className="space-y-1.5">
                  {cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-500 dark:text-red-300">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Editor's Verdict */}
        {product.finalVerdict && (
          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-xl border border-blue-100 dark:border-zinc-700">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-2">
              <Award className="h-4 w-4 inline mr-1 text-[#0c5adb]" />
              Editor's Verdict
            </h2>
            {product.editorRating && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400">Editor Rating:</span>
                <div className="flex">{renderStars(product.editorRating, 'h-3.5 w-3.5')}</div>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">{product.editorRating}/5</span>
              </div>
            )}
            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{product.finalVerdict}</p>
          </div>
        )}

        {/* Review Summary */}
        {product.reviewSummary && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-3">Full Review</h2>
            <div className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">{sanitizeHtml(product.reviewSummary)}</div>
          </div>
        )}

        {/* Customer Reviews */}
        {(() => {
          const specs = product.specs as any;
          const reviews = specs?.reviews;
          const reviewStats = specs?.review_stats;
          const reviewHighlights = specs?.review_highlights;
          if (!reviews || reviews.length === 0) return null;
          return (
            <div className="mt-8">
              <CustomerReviews reviews={reviews} reviewStats={reviewStats} reviewHighlights={reviewHighlights} />
            </div>
          );
        })()}

        {/* Related Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {similarProducts.slice(0, 5).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {relatedProducts.slice(0, 5).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
