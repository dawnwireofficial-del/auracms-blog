import React, { useState, useEffect, useCallback } from 'react';
import { Building2, ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollReveal from '../ScrollReveal';
import { proxyImageUrl } from '../../utils/safeRender';

const PER_PAGE = 24;

export default function BrandsPage({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setBrands([]);
    setProductCounts({});
    try {
      const res = await fetch(`/api/public/brands?limit=${PER_PAGE}&offset=${p * PER_PAGE}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        setBrands(list);
        setTotal(Array.isArray(data) ? list.length : (data?.total || list.length));
        const counts: Record<string, number> = {};
        await Promise.all(list.map(async (b: any) => {
          try {
            const pr = await fetch(`/api/public/product-reviews?brand=${encodeURIComponent(b.name || b.slug)}&limit=1`);
            if (pr.ok) {
              const pd = await pr.json();
              counts[b.id || b.name] = pd?.total || 0;
            }
          } catch {}
        }));
        setProductCounts(counts);
      }
    } catch (e) {
      console.error("Failed to load brands:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const goToPage = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    setPage(p);
    fetchPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ScrollReveal>
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">Shop by Brand</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-2xl">
              Browse products from top brands we recommend. Each brand has been vetted for quality, value, and customer satisfaction.
            </p>
          </div>
        </ScrollReveal>

        {loading && brands.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-zinc-500">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold mb-1">No Brands Yet</p>
            <p className="text-sm">Brands will appear here once they are added by the admin.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {brands.map((brand, i) => (
                <motion.button
                  key={brand.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onNavigate('products', `?brand=${encodeURIComponent(brand.name || brand.slug)}`)}
                  className="flex flex-col items-center p-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-lg hover:border-blue-500/30 transition-all group text-center"
                >
                  {brand.logo_url ? (
                    <img src={proxyImageUrl(brand.logo_url)} alt={brand.name} referrerPolicy="no-referrer" className="h-20 w-20 object-contain mb-4 group-hover:scale-110 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                      <Building2 className="h-10 w-10 text-blue-500" />
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-1">{brand.name}</h3>
                  {brand.description && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">{brand.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-zinc-500 mt-auto">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      {productCounts[brand.id || brand.name] ?? '...'} products
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                      Browse <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-10">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 0 || loading}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                  const start = Math.max(0, Math.min(page - 4, totalPages - 9));
                  const p = start + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                        p === page ? 'bg-[#246BFF] text-white shadow' : 'border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
