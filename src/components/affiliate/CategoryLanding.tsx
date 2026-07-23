import React, { useState, useEffect } from 'react';
import { ChevronRight, ShoppingBag, Star, TrendingUp, Award, Sparkles, DollarSign, BookOpen } from 'lucide-react';
import { Category, ProductReview, CategoryBanner, CategorySection } from '../../types';
import ProductCard from './ProductCard';
import DealCard from './DealCard';
import Breadcrumbs from '../Breadcrumbs';
import CategoryOrb from '../CategoryOrb';
import CategoryPresetCanvas from '../motion/CategoryPresetCanvas';

interface CategoryLandingProps {
  category: Category & { banners?: CategoryBanner[]; sections?: CategorySection[]; subcategories?: Category[]; products?: ProductReview[] };
  allProducts?: ProductReview[];
  allCategories?: Category[];
  brands?: { id: string; name: string; slug: string }[];
  onNavigate?: (route: string, param?: string) => void;
}

export default function CategoryLanding({ category, allProducts, allCategories, brands, onNavigate }: CategoryLandingProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const banners = category.banners || [];
  const sections = category.sections || [];
  const subcategories = category.subcategories || [];
  const products = category.products || allProducts?.filter(p => {
    if (p.status !== 'published') return false;
    if (p.categoryId === category.id) return true;
    const bf = ((p as any).best_for || p.bestFor || '').toLowerCase();
    const cn = (category.name || '').toLowerCase();
    const pn = (p.productName || (p as any).product_name || '').toLowerCase();
    if (!bf) {
      const catWords = cn.split(/\s+/).filter(Boolean);
      const specDept = ((p as any).specs?.details?.department || '').toLowerCase();
      if (pn.includes(cn)) return true;
      if (specDept && catWords.some((w: string) => specDept.includes(w))) return true;
      return false;
    }
    const catWords = cn.split(/\s+/).filter(Boolean);
    const bestWords = bf.split(/\s+/).filter(Boolean);
    return catWords.some((w: string) => bestWords.includes(w));
  }) || [];
  const featured = products.filter(p => (p as any).isFeatured);
  const deals = products.filter(p => (p as any).isDeal || parseFloat(String(p.originalPrice || '0')) > parseFloat(String(p.price || p.currentPrice || '0')));
  const topRated = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  const trending = products.filter(p => (p as any).isTrending).length > 0 ? products.filter(p => (p as any).isTrending) : [...products].sort((a, b) => (b.pageViews || 0) - (a.pageViews || 0)).slice(0, 8);

  // Auto-rotate hero banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setActiveSlide(s => (s + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  const renderSection = (section: CategorySection) => {
    const settings = section.settings || {};
    const sectionType = section.sectionType || section.type;

    switch (sectionType) {
      case 'hero_banner':
        // Banners are rendered separately above
        return null;

      case 'subcategory_grid':
        if (subcategories.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            {section.title && <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-6">{section.title}</h2>}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start">
              {subcategories.map((sub, i) => (
                <CategoryOrb
                  key={sub.id}
                  label={sub.name}
                  iconUrl={sub.image || sub.iconName}
                  href={`/browse/${sub.slug}`}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        );

      case 'product_carousel':
      case 'featured_products': {
        const items = sectionType === 'featured_products' ? featured : products;
        if (items.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{section.title || 'Featured Products'}</h2>
              <a href={`/category/${category.slug}`} className="text-xs font-semibold text-[#0c5adb] hover:underline">View All →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.slice(0, (settings as any).limit || 8).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );
      }

      case 'best_sellers': {
        const sorted = [...products].sort((a, b) => (b.pageViews || 0) - (a.pageViews || 0));
        if (sorted.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || 'Best Sellers'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sorted.slice(0, (settings as any).limit || 8).map(p => (
                <ProductCard key={p.id} product={{ ...p, isFeatured: true, discountPercentage: (p as any).discountPercentage }} />
              ))}
            </div>
          </div>
        );
      }

      case 'amazon_deals':
        if (deals.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{section.title || "Today's Amazon Deals"}</h2>
              <a href="/deals" className="text-xs font-semibold text-red-500 hover:underline">All Deals →</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {deals.slice(0, (settings as any).limit || 4).map(p => (
                <DealCard key={p.id} product={{ ...p, deal: { salePrice: parseFloat(String(p.price || 0)), regularPrice: parseFloat(String(p.originalPrice || 0)), discountPercentage: (p as any).discountPercentage || 0, endDate: '', dealType: 'daily' } }} />
              ))}
            </div>
          </div>
        );

      case 'trending_products':
        if (trending.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || 'Trending Now'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {trending.slice(0, (settings as any).limit || 8).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );

      case 'top_rated_products':
        if (topRated.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || 'Top Rated'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topRated.slice(0, (settings as any).limit || 8).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );

      case 'products_by_price': {
        const maxPrice = (settings as any).priceMax || 50;
        const byPrice = products.filter(p => parseFloat(String(p.price || 0)) <= maxPrice);
        if (byPrice.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || `Products Under $${maxPrice}`}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {byPrice.slice(0, (settings as any).limit || 8).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );
      }

      case 'editors_choice': {
        const editorsPick = products.filter(p => (p as any).isFeatured || p.bestFor);
        if (editorsPick.length === 0) return null;
        return (
          <div key={section.id} className="mb-10 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800/50 rounded-xl border border-blue-100 dark:border-zinc-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || "Editor's Picks"}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {editorsPick.slice(0, (settings as any).limit || 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );
      }

      case 'featured_brands':
        if (!brands || brands.length === 0) return null;
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || 'Featured Brands'}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {brands.slice(0, (settings as any).limit || 12).map(brand => (
                <a key={brand.id} href={`/products?brand=${brand.slug}`} className="flex flex-col items-center p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-md transition-all">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{brand.name}</span>
                </a>
              ))}
            </div>
          </div>
        );

      case 'promotional_banner':
        if (!settings.promotionalBanner) return null;
        return (
          <div key={section.id} className="mb-10 relative rounded-xl overflow-hidden bg-gradient-to-r from-[#0c5adb] to-[#3326fc] p-8 text-white">
            <h3 className="text-xl font-bold">{section.title || 'Special Offer'}</h3>
            {section.subtitle && <p className="text-sm opacity-90 mt-1">{section.subtitle}</p>}
            {(settings as any).ctaText && (
              <a href={(settings as any).ctaLink || '#'} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-white text-[#0c5adb] text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                {(settings as any).ctaText} →
              </a>
            )}
          </div>
        );

      case 'buying_guides':
        return (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">{section.title || 'Buying Guides'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].slice(0, (settings as any).limit || 2).map(i => (
                <a key={i} href={`/buyers-guide/${category.slug}`} className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-md transition-all">
                  <BookOpen className="h-8 w-8 text-[#0c5adb] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">How to Choose the Best {category.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Complete buying guide for {category.name}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );

      case 'blog_articles':
        return null; // Blog articles would be loaded from posts

      case 'custom_text':
        return (
          <div key={section.id} className="mb-10">
            {section.title && <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-2">{section.title}</h2>}
            {(settings as any).customHtml && <div className="text-sm text-slate-600 dark:text-zinc-400 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: (settings as any).customHtml }} />}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="Container px-4 py-3">
        <Breadcrumbs items={[
          { label: 'Home', onClick: () => onNavigate?.('home') },
          { label: 'Categories', onClick: () => onNavigate?.('categories') },
          { label: category.name },
        ]} />
      </div>

      {/* Hero Banner */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden bg-slate-100 dark:bg-zinc-900">
          {banners.map((banner, i) => (
            <div key={banner.id} className={`relative w-full transition-opacity duration-500 ${i === activeSlide ? 'block' : 'hidden'}`}>
              {/* Desktop */}
              <a href={banner.ctaLink || '#'} target="_blank" rel="noopener noreferrer" className="hidden md:block">
                <img src={banner.desktopImage} alt={banner.altText || category.name} className="w-full h-[300px] lg:h-[400px] object-cover" />
                {(banner.heading || banner.description) && (
                  <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/50 to-transparent">
                    <div className="Container px-4">
                      {banner.heading && <h1 className="text-3xl lg:text-4xl font-bold text-white max-w-xl">{banner.heading}</h1>}
                      {banner.description && <p className="text-sm text-white/80 mt-2 max-w-md">{banner.description}</p>}
                      {banner.ctaText && <span className="inline-block mt-4 bg-[#0c5adb] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#0a4db8] transition-colors">{banner.ctaText} →</span>}
                    </div>
                  </div>
                )}
              </a>
              {/* Mobile */}
              <a href={banner.ctaLink || '#'} target="_blank" rel="noopener noreferrer" className="md:hidden">
                <img src={banner.mobileImage || banner.desktopImage} alt={banner.altText || category.name} className="w-full h-[200px] object-cover" />
                {(banner.heading || banner.description) && (
                  <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/50 to-transparent">
                    <div className="px-4">
                      {banner.heading && <h1 className="text-xl font-bold text-white max-w-xs">{banner.heading}</h1>}
                      {banner.ctaText && <span className="inline-block mt-2 bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{banner.ctaText} →</span>}
                    </div>
                  </div>
                )}
              </a>
            </div>
          ))}
          {/* Slide indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setActiveSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category heading (when no banner) */}
      {banners.length === 0 && (
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl mx-4 my-4 p-8 md:p-12 border border-slate-800 shadow-xl">
          <CategoryPresetCanvas categorySlugOrName={category.slug || category.name} />
          <div className="relative z-10">
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{category.name}</h1>
            {category.description && <p className="text-sm text-blue-200/80 mt-2 max-w-2xl leading-relaxed">{category.description}</p>}
          </div>
        </div>
      )}

      {/* Sections from page builder */}
      <div className="Container px-4 py-6">
        {sections.map(renderSection)}

        {/* Default: show all products if no sections are configured */}
        {sections.filter(s => s.sectionType !== 'hero_banner').length === 0 && (
          <div>
            {/* Subcategories */}
            {subcategories.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-6">Shop by {category.name}</h2>
                <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                  {subcategories.map((sub, i) => (
                    <CategoryOrb
                      key={sub.id}
                      label={sub.name}
                      iconUrl={sub.image}
                      href={`/browse/${sub.slug}`}
                      delay={i * 0.1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Deals */}
            {deals.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">Amazon Deals in {category.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {deals.slice(0, 4).map(p => (
                    <DealCard key={p.id} product={{ ...p, deal: { salePrice: parseFloat(String(p.price || 0)), regularPrice: parseFloat(String(p.originalPrice || 0)), discountPercentage: (p as any).discountPercentage || 0, endDate: '', dealType: 'daily' } }} />
                  ))}
                </div>
              </div>
            )}

            {/* All products */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">All {category.name}</h2>
              <a href={`/browse/${category.slug}`} className="text-xs font-semibold text-[#0c5adb] hover:underline">View All →</a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {products.slice(0, 20).map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
