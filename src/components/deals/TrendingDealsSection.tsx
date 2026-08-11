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
    <section className="p-6 sm:p-8 bg-gradient-to-br from-[#EEF4FF] via-white to-[#FFF7ED] rounded-3xl border border-[#E2E8F0] shadow-[0_16px_50px_-24px_rgba(36,107,255,0.25)] relative overflow-hidden space-y-6">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8A00]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-[#246BFF] to-[#FF8A00] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
              ⚡ DW DEAL WATCH
            </span>
            <span className="text-xs text-slate-500 font-medium">Updated every 15 minutes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
            Top Trending Amazon Deals
          </h2>
        </div>

        <a
          href="/deals"
          className="text-xs font-bold bg-gradient-to-r from-[#246BFF] to-[#4F7CFF] hover:opacity-90 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-dw-blue/20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          View All Active Deals
        </a>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 bg-slate-200/60 animate-pulse rounded-2xl border border-slate-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="group bg-white hover:bg-white border border-slate-200 hover:border-[#FF8A00]/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl relative"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-44 bg-[#F4F8FF] rounded-xl p-3 flex items-center justify-center overflow-hidden mb-3">
                  <img
                    src={proxyImageUrl(deal.images[0])}
                    alt={deal.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2210%22 fill=%22%2394a3b8%22>Image</text></svg>'; }}
                  />
                  {deal.discountPercentage > 0 && !isNaN(deal.discountPercentage) && (
                    <span className="absolute top-2 left-2 bg-[#FF334F] text-white font-extrabold text-[10px] px-2 py-0.5 rounded shadow">
                      -{deal.discountPercentage}% OFF
                    </span>
                  )}
                  {deal.expiresInHours > 0 && (
                    <span className="absolute bottom-2 right-2 bg-white/90 border border-slate-200 text-[#e67b00] font-extrabold text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                      Ends in {deal.expiresInHours}h
                    </span>
                  )}
                </div>

                {deal.dealBadge && deal.dealBadge.trim() && (
                  <span className="text-[10px] font-extrabold text-[#FF8A00] bg-[#FFF3E6] px-2 py-0.5 rounded-full border border-[#FF8A00]/30 inline-block mb-1">
                    {sanitizeHtml(deal.dealBadge)}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#246BFF] transition-colors">
                  {deal.title}
                </h3>
              </div>

              {/* Pricing & CTA */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-slate-900">
                      ${Number(deal.currentPrice).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 line-through ml-1.5">
                      ${Number(deal.referencePrice).toFixed(2)}
                    </span>
                  </div>
                  {Number(deal.rating) > 0 && (
                    <div className="text-[10px] text-[#FF8A00] font-bold">
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
