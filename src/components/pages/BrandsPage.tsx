import React, { useState, useEffect } from 'react';
import { Building2, ExternalLink, ShoppingBag, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollReveal from '../ScrollReveal';

export default function BrandsPage({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/public/brands');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setBrands(list);
          const counts: Record<string, number> = {};
          await Promise.all(list.map(async (b: any) => {
            try {
              const pr = await fetch(`/api/public/product-reviews?brand=${encodeURIComponent(b.name || b.slug)}&limit=1`);
              if (pr.ok) {
                const pd = await pr.json();
                const items = Array.isArray(pd?.data) ? pd.data : Array.isArray(pd) ? pd : [];
                counts[b.id || b.name] = items.length > 0 ? (pd.total || items.length) : 0;
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
    }
    fetchBrands();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

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

        {brands.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-zinc-500">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold mb-1">No Brands Yet</p>
            <p className="text-sm">Brands will appear here once they are added by the admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {brands.map((brand, i) => (
              <motion.button
                key={brand.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onNavigate('products', `?brand=${encodeURIComponent(brand.name || brand.slug)}`)}
                className="flex flex-col items-center p-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-lg hover:border-blue-500/30 transition-all group text-center"
              >
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="h-20 w-20 object-contain mb-4 group-hover:scale-110 transition-transform" />
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
        )}
      </div>
    </div>
  );
}
