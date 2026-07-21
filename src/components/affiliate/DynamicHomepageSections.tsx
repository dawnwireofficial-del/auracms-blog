import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, TrendingUp, Zap, ShoppingBag, Award, Sparkles } from 'lucide-react';

interface HomepageSection {
  id: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  sortOrder: number;
  isActive: boolean;
  settings?: Record<string, any>;
}

export default function DynamicHomepageSections({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public/homepage').then(r => r.json()).then(res => {
      if (res?.sections) setSections(res.sections.filter((s: any) => s.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    }).catch(() => {});
    fetch('/api/public/homepage-hero').then(r => r.json()).then(res => {
      if (Array.isArray(res)) setHeroSlides(res.filter((s: any) => s.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    }).catch(() => {});
    fetch('/api/public/product-reviews?limit=20').then(r => r.json()).then(res => {
      setProducts(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
    }).catch(() => {});
    fetch('/api/public/categories').then(r => r.json()).then(res => {
      setCategories(Array.isArray(res) ? res : []);
    }).catch(() => {});
    fetch('/api/public/brands').then(r => r.json()).then(res => {
      setBrands(Array.isArray(res) ? res : []);
    }).catch(() => {});
  }, []);

  if (sections.length === 0) return null;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-600'}`} />)}
    </div>
  );

  const renderSection = (section: HomepageSection) => {
    switch (section.sectionType) {
      case 'todays_deals':
      case 'best_sellers':
      case 'trending_products':
      case 'featured_products':
      case 'editors_picks':
      case 'top_rated_products':
      case 'latest_reviews':
        return (
          <div key={section.id} className="py-12 border-b border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-900">{section.title || section.sectionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                  {section.subtitle && <p className="text-sm text-slate-500 mt-1">{section.subtitle}</p>}
                </div>
                <button onClick={() => onNavigate('products')} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">View All <ArrowRight className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {products.slice(0, section.settings?.limit || 10).map((p: any) => (
                  <div key={p.id || p.slug} onClick={() => onNavigate('product', p.slug)} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4 relative flex items-center justify-center p-2">
                      {p.image_url ? <img src={p.image_url} alt={p.product_name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">No img</div>}
                      {p.original_price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                          SALE
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug mb-2 group-hover:text-blue-600 transition-colors">{p.product_name}</p>
                      {p.rating && <div className="mt-auto mb-2">{renderStars(p.rating)}</div>}
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-slate-900">{p.price || p.sale_price || '?'}</p>
                        {p.original_price && <p className="text-xs text-gray-400 line-through">{p.original_price}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'shop_by_category':
        return (
          <div key={section.id} className="py-10 border-b border-slate-100 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{section.title || 'Shop by Category'}</h3>
                {section.subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{section.subtitle}</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((cat: any) => (
                  <button key={cat.id} onClick={() => onNavigate('category', cat.slug)} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 text-center hover:border-[#0c5adb] hover:shadow-md transition-all group">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0c5adb]/10 to-blue-500/10 dark:from-[#0c5adb]/20 dark:to-blue-500/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-5 w-5 text-[#0c5adb]" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'featured_brands':
        return (
          <div key={section.id} className="py-10 border-b border-slate-100 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{section.title || 'Featured Brands'}</h3>
                {section.subtitle && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{section.subtitle}</p>}
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {brands.map((b: any) => (
                  <div key={b.id} className="flex flex-col items-center gap-1.5">
                    {b.logo_url ? <img src={b.logo_url} alt={b.name} className="h-10 w-auto grayscale hover:grayscale-0 transition-all" /> : <div className="h-10 w-20 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase">{b.name?.substring(0, 10)}</div>}
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'custom_text':
        return (
          <div key={section.id} className="py-10 border-b border-slate-100 dark:border-zinc-800">
            <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{section.title}</h3>
              {section.subtitle && <p className="text-sm text-slate-600 dark:text-zinc-300 mt-3 leading-relaxed">{section.subtitle}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-900/50">
      {/* Active sections */}
      {sections.map(renderSection)}
    </div>
  );
}
