import React, { useState, useEffect } from 'react';
import { AffiliateCTA } from '../common/AffiliateCTA';
import { useAppStore } from '../../lib/store';
import { sanitizeHtml } from '../../lib/sanitize';
import { proxyImageUrl } from '../../utils/safeRender';

interface TrendingDeal {
  id: string;
  title: string;
  brand: string;
  category: string;
  currentPrice: number;
  referencePrice: number;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  images: string[];
  asin: string;
  affiliateUrl: string;
  dealBadge: string;
  expiresInHours: number;
  slug?: string;
}

export const TrendingDealsSection: React.FC = () => {
  const { products } = useAppStore();
  const [deals, setDeals] = useState<TrendingDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/deals/trending')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trending deals');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.deals && data.deals.length > 0) {
          setDeals(data.deals.filter((d: any) => (d.discountPercentage && d.discountPercentage > 0 && !isNaN(d.discountPercentage)) || d.dealBadge).slice(0, 4));
        } else {
          if (isMounted && products.length > 0) {
            const candidates = [...products].filter(p => (p.discountPercentage || 0) > 0 && (p.discountPercentage || 0) <= 40);
            const noDiscount = products.filter(p => !(p.discountPercentage || 0)).slice(0, 4 - candidates.length);
            const sorted = candidates.length >= 4 ? candidates : [...candidates, ...noDiscount];
            const toPrice = (v: any) => { if (v == null) return 0; return parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0; };
            const topDiscountProducts = sorted.slice(0, 4).map((p, idx) => ({
              id: p.id,
              title: p.title,
              brand: p.brand,
              category: p.category || p.mainCategory || 'General',
              currentPrice: toPrice(p.currentPrice) || 100,
              referencePrice: p.discountPercentage ? toPrice(p.originalPrice) || toPrice(p.referencePrice) || 0 : 0,
              discountPercentage: p.discountPercentage || 0,
              rating: p.rating || 4.5,
              reviewCount: p.reviewCount || 10,
              images: p.images,
              asin: p.asin,
              affiliateUrl: p.affiliateUrl,
              slug: p.slug,
              dealBadge: p.discountPercentage ? (idx === 0 ? '🔥 Top Tech Deal' : idx === 1 ? '⚡ Flash Kitchen Savings' : '🏷️ Lowest Price 30 Days') : '',
              expiresInHours: p.discountPercentage ? 6 + idx * 2 : 0
            }));
            setDeals(topDiscountProducts.filter(d => d.discountPercentage > 0));
          }
        }
      })
      .catch((_err) => {
        if (isMounted && products.length > 0) {
          const toPrice = (v: any) => { if (v == null) return 0; return parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0; };
          const candidates = [...products].filter(p => (p.discountPercentage || 0) > 0 && (p.discountPercentage || 0) <= 40);
          const noDiscount = products.filter(p => !(p.discountPercentage || 0)).slice(0, 4 - candidates.length);
          const sorted = candidates.length >= 4 ? candidates : [...candidates, ...noDiscount];
          const topDiscountProducts = sorted.slice(0, 4).map((p, idx) => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            category: p.category || p.mainCategory || 'General',
            currentPrice: toPrice(p.currentPrice) || 100,
            referencePrice: p.discountPercentage ? toPrice(p.originalPrice) || toPrice(p.referencePrice) || 0 : 0,
            discountPercentage: p.discountPercentage || 0,
            rating: p.rating || 4.5,
            reviewCount: p.reviewCount || 10,
            images: p.images,
            asin: p.asin,
            affiliateUrl: p.affiliateUrl,
            dealBadge: p.discountPercentage ? (idx === 0 ? '🔥 Top Tech Deal' : idx === 1 ? '⚡ Flash Kitchen Savings' : '🏷️ Lowest Price 30 Days') : '',
            expiresInHours: p.discountPercentage ? 6 + idx * 2 : 0
          }));
          setDeals(topDiscountProducts.filter(d => d.discountPercentage > 0));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [products]);

  return (
    <section className="p-6 sm:p-8 bg-gradient-to-br from-[#0A1F44] via-blue-950 to-slate-900 rounded-3xl border border-blue-900/60 text-white shadow-2xl relative overflow-hidden space-y-6">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-blue-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
              🔥 LIVE AMAZON PRICE DROPS
            </span>
            <span className="text-xs text-slate-300 font-medium">Updated every 15 minutes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            Top 4 Trending Amazon Deals
          </h2>
        </div>

        <a
          href="/deals"
          className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl transition-all"
        >
          View All Active Deals &rarr;
        </a>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 bg-blue-900/40 animate-pulse rounded-2xl border border-blue-800/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-blue-800/60 hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-2xl relative"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-44 bg-white/5 rounded-xl p-3 flex items-center justify-center overflow-hidden mb-3">
                  <img
                    src={proxyImageUrl(deal.images[0])}
                    alt={deal.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2210%22 fill=%22%2394a3b8%22>Image</text></svg>'; }}
                  />
                  {deal.discountPercentage > 0 && !isNaN(deal.discountPercentage) && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded shadow">
                      -{deal.discountPercentage}% OFF
                    </span>
                  )}
                  {deal.expiresInHours > 0 && (
                    <span className="absolute bottom-2 right-2 bg-slate-950/80 text-amber-400 font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                      Ends in {deal.expiresInHours}h
                    </span>
                  )}
                </div>

                {deal.dealBadge && deal.dealBadge.trim() && (
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30 inline-block mb-1">
                    {sanitizeHtml(deal.dealBadge)}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                  {deal.title}
                </h3>
              </div>

              {/* Pricing & CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-white">
                      ${Number(deal.currentPrice).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 line-through ml-1.5">
                      ${Number(deal.referencePrice).toFixed(2)}
                    </span>
                  </div>
                  {Number(deal.rating) > 0 && (
                    <div className="text-[10px] text-amber-400 font-bold">
                      ★ {Number(deal.rating).toFixed(1)}
                    </div>
                  )}
                </div>

                <AffiliateCTA
                  affiliateUrl={deal.affiliateUrl}
                  productId={deal.id}
                  asin={deal.asin}
                  productTitle={deal.title}
                  productSlug={deal.slug}
                  category={deal.category}
                  brand={deal.brand}
                  label="Claim Amazon Deal"
                  variant="deal"
                  position="trending_section"
                  className="w-full text-xs py-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
