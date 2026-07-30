import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CategoryIcon, TrustBadges } from '../components/common/SvgIcons';
import { ProductCard } from '../components/common/ProductCard';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { BannerCarousel } from '../components/common/BannerCarousel';
import { TrendingDealsSection } from '../components/deals/TrendingDealsSection';
import DawnWireHero from '../components/hero/DawnWireHero';
import { useAppStore } from '../lib/store';
import { triggerPageLoadProgress } from '../lib/navigation';

interface HomePageProps {
  onOpenAiFinder: () => void;
  onOpenChatbot: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAiFinder, onOpenChatbot }) => {
  const { products, categories, deals, comparisons, buyingGuides, reviews, banners } = useAppStore();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const filteredProducts = activeCategoryFilter === 'all'
    ? products
    : products.filter((p) => p.mainCategory.toLowerCase().includes(activeCategoryFilter.toLowerCase()));

  const featuredDeals = deals.slice(0, 4);
  const topRatedProducts = filteredProducts.filter((p) => p.editorScore >= 9.0).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Editorial Transparency Disclosure */}
      <DisclosureBanner />

      {/* Hero Section — Glassmorphism Redesign */}
      <DawnWireHero onOpenAiFinder={onOpenAiFinder} onOpenChatbot={onOpenChatbot} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Promotional Sliders & Banners managed from Admin */}
        {banners.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <BannerCarousel banners={banners} />
          </motion.section>
        )}

        {/* Categories Grid with Scroll Fade In */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Explore Product Sectors
              </h2>
              <p className="text-xs text-slate-500">
                Independent lab reviews and top Amazon picks across key consumer electronics and smart living sectors
              </p>
            </div>
            <a href="/categories" className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
              View All Categories &rarr;
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat, idx) => (
              <motion.a
                key={cat.id}
                href={`/categories/${cat.slug}`}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileHover={{ y: -4, scale: 1.03 }}
                className="group p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/80 hover:shadow-xl transition-all text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="p-3 bg-blue-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 rounded-xl transition-colors">
                  <CategoryIcon icon={cat.icon || 'tag'} className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </span>
              </motion.a>
            ))}
          </div>
        </motion.section>

        {/* Live Trending Deals Section Endpoint Integration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <TrendingDealsSection />
        </motion.div>

        {/* Featured Amazon Deals Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden p-8 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-slate-900/40 rounded-3xl border border-orange-500/30 backdrop-blur-xl shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider mb-2">
                🔥 Hot Amazon Price Drops
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Today's Verified Amazon Deals
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tracked automatically. Prices updated daily directly from Amazon US.
              </p>
            </div>

            <a
              href="/deals"
              className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-colors"
            >
              See All Deals ({deals.length}) &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDeals.map((deal) => {
              const product = products.find((p) => p.id === deal.productId);
              if (!product) return null;
              return (
                <div key={deal.id} className="relative">
                  <ProductCard product={product} />
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Editor's Choice Product Grid with Filter Tabs */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Top Rated & Editor's Picks
              </h2>
              <p className="text-xs text-slate-500">
                Highest scoring products across our 10-point testing taxonomy
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  triggerPageLoadProgress();
                  setActiveCategoryFilter('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-[#0A1F44] text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                All Picks
              </button>
              {categories.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    triggerPageLoadProgress();
                    setActiveCategoryFilter(c.slug);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl transition-all ${
                    activeCategoryFilter === c.slug
                      ? 'bg-[#0A1F44] text-white'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </motion.section>

        {/* Head-to-Head Comparisons Carousel/Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                Head-To-Head Benchmarks
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Featured Product Comparisons
              </h2>
              <p className="text-xs text-slate-400">
                Side-by-side technical specification breakdowns and lab analysis
              </p>
            </div>
            <a href="/compare" className="text-xs font-bold text-amber-400 hover:underline">
              All Comparisons &rarr;
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisons.slice(0, 2).map((comp) => (
              <div
                key={comp.id}
                className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700 flex flex-col justify-between hover:border-amber-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                    <span className="font-bold text-blue-400 uppercase">{comp.category}</span>
                    <span>Updated {comp.lastUpdated}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {comp.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4">
                    {comp.summary}
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 text-xs mb-4">
                    <span className="font-extrabold text-amber-400 block mb-0.5">Winner: {comp.winnerName}</span>
                    <span className="text-slate-400 text-[11px]">{comp.verdict}</span>
                  </div>
                </div>

                <a
                  href={`/compare/${comp.slug}`}
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                >
                  Read Full Comparison &rarr;
                </a>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Buying Guides & Expert Reviews */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Guides */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Latest Buying Guides
              </h2>
              <a href="/guides" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All &rarr;</a>
            </div>
            <div className="space-y-4">
              {buyingGuides.slice(0, 3).map((guide) => (
                <a
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="block p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{guide.category}</span>
                    <span>•</span>
                    <span>{guide.readTimeMinutes} min read</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                    {guide.excerpt}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Expert Editorial Reviews */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                In-Depth Editorial Reviews
              </h2>
              <a href="/reviews" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All &rarr;</a>
            </div>
            <div className="space-y-4">
              {reviews.slice(0, 3).map((rev) => (
                <a
                  key={rev.id}
                  href={`/reviews/${rev.slug}`}
                  className="block p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{rev.productName}</span>
                    <span className="font-black text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                      ★ {rev.overallScore}/10
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rev.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                    {rev.verdict}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* How We Review & Trust Badges */}
        <section className="pt-8">
          <TrustBadges />
        </section>
      </main>
    </div>
  );
};
