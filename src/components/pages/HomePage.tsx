import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, TrendingUp, Activity, BookOpen, ShoppingBag, Lightbulb, Monitor, Star, Check, Sparkles, ArrowUpRight, Search, Eye, Heart, Zap, Info, ChevronRight, Tag, Users, Clock, LayoutGrid, Award, BarChart3, Globe, Shield, MessageCircle, ChevronLeft, Quote, Play, Headphones, Truck, Bot } from 'lucide-react';
import { Post, Category, SiteSettings } from '../../types';
import ScrollReveal, { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';
import DynamicHomepageSections from '../affiliate/DynamicHomepageSections';
import { BannerCarousel } from '../common/BannerCarousel';
import ParticleNetwork from '../motion/ParticleNetwork';
import CategoryConstellation from '../motion/CategoryConstellation';
import TrendWave from '../motion/TrendWave';
import { Suspense, lazy } from 'react';
import MascotAnimation from '../MascotAnimation';
import { proxyImageUrl } from '../../utils/safeRender';
import { useAppStore } from '../../lib/store';
const ParticleCanvas = lazy(() => import('../ParticleCanvas'));

interface HomePageProps {
  posts: Post[];
  categories: Category[];
  settings: SiteSettings | null;
  onNavigate: (route: string, param?: string) => void;
}

export default function HomePage({ posts, categories, settings, onNavigate }: HomePageProps) {
  const [contentTab, setContentTab] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const { banners } = useAppStore();

  const allPublished = posts.filter(p => p.status === 'published');
  const topProducts = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const topPick = topProducts[0];

  const cleanExcerpt = (excerpt: string) =>
    excerpt.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 120);

  useEffect(() => {
    fetch('/api/public/product-reviews?limit=50')
      .then(r => r.json())
      .then(res => setProducts(Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const categoryFallbacks: Record<string, string> = {
    "Gym Equipment's": 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800&h=500',
    Jewelry: 'https://images.unsplash.com/photo-1515562141589-6773d6e4e15a?auto=format&fit=crop&q=80&w=800&h=500',
    'Personal Care': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800&h=500',
    default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800&h=500',
  };

  const catAccents: Record<string, string> = {
    "Gym Equipment's": 'bg-gradient-to-r from-emerald-400 to-teal-300',
    Jewelry: 'bg-gradient-to-r from-amber-400 to-yellow-300',
    'Personal Care': 'bg-gradient-to-r from-rose-400 to-pink-300',
    default: 'bg-gradient-to-r from-blue-500 to-cyan-300',
  };

  return (
    <div className="bg-body-bg dark:bg-zinc-950">
      {/* Sticky Mobile CTA (sits above bottom nav) */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 md:hidden flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <span className="text-xs text-text/60 flex-1 leading-tight">
          <span className="font-bold text-primary">Top Pick:</span>{' '}
          {topPick ? (topPick.product_name || topPick.productName || 'Top Product')?.substring(0, 30) + '...' : 'Product Reviews'}
        </span>
        <motion.button
          onClick={() => topPick && onNavigate('review', topPick?.slug || topPick?.id || '')}
          className="bg-primary2 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 cursor-pointer transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Read Review
        </motion.button>
      </div>

      {/* ============ 1. HERO ============ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-slate-900 dark:bg-zinc-950 flex flex-col justify-center min-h-[90vh]">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <ParticleNetwork />
        </div>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/50 via-transparent to-[#020617] pointer-events-none z-0" />

        <ScrollReveal variant="fadeUp" className="relative z-10">
          <div className="relative max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-10 items-center py-16 md:py-24 lg:py-32">
              {/* Left */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-primary2 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary2">Technology Growth Platform</span>
                </div>

                <h1 className="font-display font-bold text-[28px] sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
                  Amazon Product Reviews<br />
                  &amp; <span className="dw-gradient-text">AI-Powered Buying Guides</span>
                </h1>

                <p className="text-base md:text-lg text-blue-200/70 leading-relaxed max-w-lg">
                  In-depth reviews, buying guides, and strategies at the intersection of technology, AI, and affiliate marketing — backed by real testing.
                </p>

                <div className="flex flex-wrap gap-3">
                  <motion.button
                    onClick={() => onNavigate('products')}
                    className="primary-btn px-8 py-4 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    AI Product Finder <Sparkles className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => onNavigate('search')}
                    className="ghost-btn px-8 py-4 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Ask AI Assistant <MessageCircle className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Trust indicators bar — IT Tech style */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary2 to-primary3 border-2 border-secondary shadow-lg" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-xs text-blue-300/80 font-medium">Trusted by 2,000+ creators</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-blue-300/80 font-medium">4.9 Avg Rating</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Top Pick Card with gradient glow */}
              <div className="relative flex items-center justify-center">
                {/* Glow effect behind card */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary2/20 via-primary3/10 to-transparent rounded-3xl blur-2xl" />

                <div className="relative w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col items-center text-center">
                      <MascotAnimation className="w-36 h-36 md:w-40 md:h-40" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary2 mt-2">AI-Powered</span>
                    </div>
                    <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-4">
                      {topPick ? (
                        <div className="text-center sm:text-left">
                          <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 border border-amber-500/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            Top Pick
                          </div>
                          <div className="aspect-square w-full max-w-[120px] mx-auto sm:mx-0 bg-white/5 rounded-lg overflow-hidden mb-2 border border-white/10">
                            {topPick.productImage ? (
                              <img src={proxyImageUrl(topPick.productImage)} alt={topPick.productName} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20"><ShoppingBag className="w-8 h-8" /></div>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-sm text-white leading-snug line-clamp-2">{topPick.productName}</h4>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`w-3 h-3 ${i <= Math.round(topPick.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-blue-300/60">{topPick.rating?.toFixed(1)}</span>
                          </div>
                          <div className="mt-2">
                            {topPick.originalPrice ? (
                              <div className="flex items-center justify-center sm:justify-start gap-2">
                                <span className="text-xs text-white/40 line-through">{topPick.originalPrice}</span>
                                <span className="font-bold text-lg text-white">{topPick.price}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-lg text-white">{topPick.price}</span>
                            )}
                          </div>
                          <motion.button
                            onClick={() => onNavigate('review', topPick.slug || topPick.id)}
                            className="mt-2 inline-flex items-center gap-1 bg-primary2 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Read Full Review <ArrowUpRight className="w-3 h-3" />
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-4">
                          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse mb-2" />
                          <div className="w-24 h-3 bg-white/10 animate-pulse rounded mb-1" />
                          <div className="w-16 h-3 bg-white/10 animate-pulse rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom fade transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-body-bg dark:from-zinc-950 to-transparent pointer-events-none" />
      </section>

      {/* ============ 2. PROOF BAR — IT Tech stats bar ============ */}
      <section className="relative -mt-1 bg-body-bg dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { value: '2,000+', label: 'Creators & Brands', icon: Users, color: 'from-blue-500 to-cyan-400' },
              { value: '4.9', label: 'Average Rating', icon: Star, suffix: '★', color: 'from-amber-500 to-orange-400' },
              { value: '50+', label: 'In-Depth Reviews', icon: ShoppingBag, color: 'from-emerald-500 to-teal-400' },
              { value: '15+', label: 'Categories Covered', icon: LayoutGrid, color: 'from-purple-500 to-pink-400' },
            ].map((stat, i) => (
              <StaggerItem key={i} className="group bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-2xl text-heading">{stat.value}<span className="text-sm text-text">{stat.suffix || ''}</span></span>
                    <p className="text-[10px] text-text font-medium uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ============ 2.5 CATEGORY CONSTELLATION DISCOVERY ============ */}
      <section className="py-12 bg-slate-900 text-white overflow-hidden border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Interactive Discovery</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white">
              Category Constellation Network
            </h2>
            <p className="text-xs md:text-sm text-blue-200/70 mt-1">
              Explore interconnected tech and product ecosystems using our visual neural graph.
            </p>
          </div>

          <CategoryConstellation
            categories={categories}
            onSelectCategory={(slug) => onNavigate('category', slug)}
          />
        </div>
      </section>
      <ScrollReveal as="section" className="relative py-16 md:py-20 bg-white overflow-hidden">
        {/* Subtle background watermark — IT Tech style */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[250px] md:text-[400px] font-black text-primary/[0.03] tracking-tight font-display">DW</span>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Featured Content</span>
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-heading tracking-tight">
                Honest Reviews. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary2">Proven Strategies.</span>
              </h2>
              <p className="text-text mt-2 max-w-xl">Expert insights and real product testing to help you make smarter buying decisions.</p>
            </div>
            <motion.button
              onClick={() => onNavigate('articles')}
              className="hidden md:inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-primary hover:text-white border border-gray-200 hover:border-primary transition-all shrink-0 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All' },
              { key: 'articles', label: 'Articles' },
              { key: 'reviews', label: 'Product Reviews' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setContentTab(tab.key)}
                className={`text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full cursor-pointer transition-all shrink-0 ${
                  contentTab === tab.key
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-text border border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: All */}
          {contentTab === 'all' && (
            <div>
              <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allPublished.slice(0, 3).map((post, idx) => {
                  const cat = categories.find(c => c.id === post.categoryId);
                  const catName = cat?.name || '';
                  const accentColor = catAccents[catName] || catAccents['default'];
                  const badge = post.isTrending ? 'TRENDING' : post.isEditorsPick ? "EDITOR'S PICK" : post.isFeatured ? 'TOP RATED' : '';
                  const fallbackImg = categoryFallbacks[catName] || categoryFallbacks['default'];
                  return (
                    <StaggerItem key={post.id}>
                      <article onClick={() => onNavigate('post', post.slug)} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                          <img src={proxyImageUrl(post.featuredImage || fallbackImg)} alt={post.title} width={400} height={250} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          {badge && (
                            <span className={`absolute top-3 left-3 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${
                              badge === 'TRENDING' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-primary to-primary2'
                            }`}>{badge}</span>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-text px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 inline mr-1" />{post.readingTime || 3} min
                          </div>
                        </div>
                        <div className="p-4 space-y-2 relative">
                          {cat && <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">{cat.name}</span>}
                          <h3 className="font-display font-bold text-sm text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-xs text-text leading-relaxed line-clamp-2">{cleanExcerpt(post.excerpt || '')}</p>
                          <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor} rounded-b-2xl`} />
                        </div>
                      </article>
                    </StaggerItem>
                  );
                })}
                {topProducts.slice(0, 1).map((product, idx) => {
                  const cardId = product.id || `prod-hero-${idx}`;
                  return (
                    <StaggerItem key={cardId}>
                      <HoverScale>
                        <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/30 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                          <div className="relative h-[180px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                            {product.product_image ? (
                              <img src={proxyImageUrl(product.product_image)} alt={product.product_name} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="max-h-full max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <ShoppingBag className="w-10 h-10 text-gray-200" />
                            )}
                            <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">TOP PICK</span>
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-heading">{product.rating?.toFixed(1) || '—'}</span>
                            </div>
                          </div>
                          <div className="p-4 space-y-2 flex flex-col flex-1">
                            {product.brand && <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">{product.brand}</span>}
                            <h3 className="font-display font-bold text-sm text-heading leading-snug line-clamp-2">{product.product_name}</h3>
                            <div className="flex items-center gap-2 mt-auto">
                              <span className="font-bold text-lg text-heading">{product.price}</span>
                              {product.original_price && <span className="text-xs text-text line-through">{product.original_price}</span>}
                            </div>
                            <div className="flex gap-2">
                              <a href={product.affiliate_url || '#'} target={product.affiliate_url ? '_blank' : undefined} rel={product.affiliate_url ? 'noopener noreferrer sponsored' : undefined} className="flex-1 inline-flex items-center justify-center bg-primary2 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition-all cursor-pointer" onClick={() => { if (product.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}>
                                {product.ctaText || 'Buy Now'}
                              </a>
                              <button onClick={() => onNavigate('review', product.slug || product.id)} className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all cursor-pointer shrink-0">
                                <Eye className="w-4 h-4 text-text" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
              <div className="flex md:hidden justify-center mt-6">
                <motion.button onClick={() => onNavigate('articles')} className="inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-primary hover:text-white border border-gray-200 hover:border-primary transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  View All Content <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Tab: Articles */}
          {contentTab === 'articles' && (
            <div>
              {allPublished.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-text">Articles coming soon.</p>
                </div>
              ) : (
                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPublished.slice(0, 6).map((post, idx) => {
                    const cat = categories.find(c => c.id === post.categoryId);
                    const catName = cat?.name || '';
                    const accentColor = catAccents[catName] || catAccents['default'];
                    const badge = post.isTrending ? 'TRENDING' : post.isEditorsPick ? "EDITOR'S PICK" : post.isFeatured ? 'TOP RATED' : '';
                    const fallbackImg = categoryFallbacks[catName] || categoryFallbacks['default'];
                    return (
                      <StaggerItem key={post.id}>
                        <article onClick={() => onNavigate('post', post.slug)} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                            <img src={proxyImageUrl(post.featuredImage || fallbackImg)} alt={post.title} width={400} height={250} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            {badge && (
                              <span className={`absolute top-3 left-3 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${
                                badge === 'TRENDING' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-primary to-primary2'
                              }`}>{badge}</span>
                            )}
                          </div>
                          <div className="p-4 md:p-5 space-y-2 relative">
                            {cat && <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">{cat.name}</span>}
                            <h3 className="font-display font-bold text-sm md:text-base text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                            <p className="text-xs text-text leading-relaxed line-clamp-2">{cleanExcerpt(post.excerpt || '')}</p>
                            <div className="flex items-center gap-3 text-[10px] text-text uppercase tracking-wider pt-1">
                              <span>{post.readingTime || 3} MIN READ</span>
                              {post.publishedAt && <><span className="w-1 h-1 rounded-full bg-gray-300" /><span>{new Date(post.publishedAt).toLocaleDateString()}</span></>}
                            </div>
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${accentColor} rounded-b-2xl`} />
                          </div>
                        </article>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
              {allPublished.length > 6 && (
                <div className="flex justify-center mt-8">
                  <motion.button onClick={() => onNavigate('articles')} className="inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-6 py-3 rounded-full shadow-sm hover:bg-primary hover:text-white border border-gray-200 hover:border-primary transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    Show More Articles <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Product Reviews */}
          {contentTab === 'reviews' && (
            <div className="relative">
              <TrendWave />
              {productsLoading ? (
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <StaggerItem key={i}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
                        <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                        <div className="p-5 space-y-3">
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                          <div className="h-4 bg-gray-100 rounded w-full" />
                          <div className="h-8 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-text">No products yet. Check back soon.</p>
                </div>
              ) : (
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(showAllProducts ? products : products.slice(0, 4)).map((product, idx) => {
                    const cardId = product.id || `prod-${idx}`;
                    return (
                      <StaggerItem key={cardId}>
                        <HoverScale>
                          <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-100/30 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                            <div className="relative h-[200px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                              {product.product_image ? (
                                <img src={proxyImageUrl(product.product_image)} alt={product.product_name} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="max-h-full max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              ) : (
                                <ShoppingBag className="w-10 h-10 text-gray-200" />
                              )}
                              {product.deal_badge && (
                                <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                  <Tag className="w-3 h-3" /> {product.deal_badge}
                                </span>
                              )}
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-heading">{product.rating?.toFixed(1) || '—'}</span>
                              </div>
                            </div>
                            <div className="p-4 space-y-2 flex flex-col flex-1">
                              {product.brand && <span className="text-[9px] font-bold uppercase tracking-widest text-primary block">{product.brand}</span>}
                              <h3 className="font-display font-bold text-sm text-heading leading-snug line-clamp-2">{product.product_name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-heading">{product.price}</span>
                                {product.original_price && <span className="text-xs text-text line-through">{product.original_price}</span>}
                              </div>
                              {product.coupon_code && (
                                <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-1 rounded">
                                  <Tag className="w-3 h-3" /> {product.coupon_code}
                                </div>
                              )}
                              <div className="flex gap-2 mt-auto pt-1">
                                <a href={product.affiliate_url || '#'} target={product.affiliate_url ? '_blank' : undefined} rel={product.affiliate_url ? 'noopener noreferrer sponsored' : undefined} className="flex-1 inline-flex items-center justify-center bg-primary2 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg transition-all cursor-pointer" onClick={() => { if (product.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}>
                                  {product.ctaText || 'Buy Now'}
                                </a>
                                <button onClick={() => onNavigate('review', product.slug || product.id)} className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all cursor-pointer shrink-0">
                                  <Eye className="w-4 h-4 text-text" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </HoverScale>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
              {products.length > 4 && (
                <div className="flex justify-center mt-6">
                  <motion.button onClick={() => setShowAllProducts(!showAllProducts)} className="inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-6 py-3 rounded-full shadow-sm hover:bg-primary hover:text-white border border-gray-200 hover:border-primary transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    {showAllProducts ? 'Show Less' : `Show All Products (${products.length})`}
                    <ArrowRight className={`w-4 h-4 transition-transform ${showAllProducts ? 'rotate-90' : ''}`} />
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* ============ 4. WHY DAWNWIRE — IT Tech About section ============ */}
      <section className="py-16 md:py-20 bg-body-bg dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative">
              {/* Image with counter overlay — IT Tech style */}
              <ScrollReveal variant="fadeRight">
                <div className="relative mb-6">
                  <div className="absolute -bottom-4 -left-4 w-full h-full rounded-2xl bg-primary/5 border border-primary/10" />
                  <img src={proxyImageUrl('/Office.png')} alt="DawnWire office" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="relative w-full h-auto rounded-2xl shadow-xl shadow-gray-200/60 object-cover" loading="lazy" />
                </div>

                {/* Stats counter box — IT Tech style floating counter */}
                <div className="relative -mt-12 ml-4 md:ml-6 inline-block bg-white rounded-2xl border border-gray-100 shadow-lg p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-display font-bold text-2xl md:text-3xl text-heading">+300%</span>
                      <p className="text-[10px] text-text font-medium uppercase tracking-wider">Growing Organic Traffic</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Bottom stats grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { value: '50+', label: 'Reviews Published' },
                  { value: '15+', label: 'Categories' },
                  { value: '100%', label: 'Independent' },
                ].map((stat, i) => (
                  <ScrollReveal key={i} variant="fadeUp" delay={i * 0.1}>
                    <div className="text-center bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <span className="font-display font-bold text-2xl text-heading block">{stat.value}</span>
                      <span className="text-[10px] text-text font-medium uppercase tracking-wider">{stat.label}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div>
              <ScrollReveal variant="fadeLeft">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 rounded-full px-3.5 py-1.5 shadow-sm mb-5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Why DawnWire</span>
                </div>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-heading tracking-tight mb-5">
                  Built for Brands That Need More Than Traffic
                </h2>
                <p className="text-text leading-relaxed mb-6">
                  DawnWire brings together content strategy, SEO, affiliate marketing, product reviews, and digital solutions to help brands grow with clarity and trust.
                </p>

                {/* Bullet list with icons — IT Tech style */}
                <div className="space-y-4 mb-8">
                  {[
                    { text: 'Technology-focused insights and product reviews', icon: Monitor },
                    { text: 'SEO and affiliate growth strategy', icon: TrendingUp },
                    { text: 'Content built around search intent', icon: Search },
                    { text: 'Editorial standards that protect credibility', icon: Shield },
                    { text: 'Full-service content production & distribution', icon: Globe },
                  ].map((item, i) => (
                    <ScrollReveal key={i} variant="fadeUp" delay={i * 0.05}>
                      <div className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <item.icon className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-text text-sm leading-snug pt-1">{item.text}</span>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>

                {/* Testimonial/quote block */}
                <ScrollReveal variant="scaleUp">
                  <blockquote className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center text-white font-bold text-base shadow-md">DW</div>
                      <div>
                        <p className="font-display font-bold text-heading text-sm">DawnWire</p>
                        <p className="text-xs text-text">Technology Growth Platform</p>
                      </div>
                      <div className="ml-auto">
                        <Quote className="w-8 h-8 text-primary/10" />
                      </div>
                    </div>
                    <p className="text-text italic leading-relaxed text-sm border-l-4 border-primary pl-4">
                      "We help SaaS, AI, and digital product companies grow through expert content, trusted product reviews, search strategy, affiliate campaigns, and conversion-focused web experiences."
                    </p>
                  </blockquote>
                </ScrollReveal>

                <motion.button onClick={() => onNavigate('about')} className="mt-6 primary-btn inline-flex items-center gap-2 px-7 py-3.5 text-sm cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  Learn About DawnWire <ArrowRight className="w-4 h-4" />
                </motion.button>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 5. HOT DEALS — IT Tech horizontal scroll section ============ */}
      {topProducts.length > 1 && (
        <ScrollReveal as="section" className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-red-50 rounded-full px-3.5 py-1.5 shadow-sm mb-4">
                  <Tag className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-500">Hot Deals</span>
                </div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-heading tracking-tight">
                  Top Picks &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary2">Best Value</span>
                </h2>
              </div>
              <motion.button onClick={() => onNavigate('products')} className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary2 transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                View All <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Horizontal scrollable carousel */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {topProducts.slice(0, 8).map((product, idx) => (
                <HoverScale key={product.id || `deal-${idx}`} className="snap-start shrink-0 w-[230px]">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="relative h-[160px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl overflow-hidden">
                      {product.product_image ? (
                        <img src={proxyImageUrl(product.product_image)} alt={product.product_name} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="max-h-full max-w-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-gray-200" />
                      )}
                      {product.deal_badge && (
                        <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">{product.deal_badge}</span>
                      )}
                      {product.coupon_code && (
                        <span className="absolute top-2 right-8 bg-emerald-500 text-white text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">{product.coupon_code}</span>
                      )}
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-heading">{product.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {product.brand && <span className="text-[8px] font-bold uppercase tracking-widest text-primary block truncate">{product.brand}</span>}
                      <h3 className="font-display font-bold text-xs text-heading leading-snug line-clamp-2 min-h-[2rem]">{product.product_name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-heading">{product.price}</span>
                        {product.original_price && <span className="text-[10px] text-text line-through">{product.original_price}</span>}
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <a href={product.affiliate_url || '#'} target={product.affiliate_url ? '_blank' : undefined} rel={product.affiliate_url ? 'noopener noreferrer sponsored' : undefined} className="flex-1 inline-flex items-center justify-center bg-primary2 hover:bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all cursor-pointer" onClick={() => { if (product.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}>
                          Buy Now
                        </a>
                        <button onClick={() => onNavigate('review', product.slug || product.id)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all cursor-pointer shrink-0">
                          <Eye className="w-3 h-3 text-text" />
                        </button>
                      </div>
                    </div>
                  </div>
                </HoverScale>
              ))}
            </div>

            <div className="flex md:hidden justify-center mt-6">
              <motion.button onClick={() => onNavigate('products')} className="inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-primary hover:text-white border border-gray-200 hover:border-primary transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                View All Products <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ============ HOMEPAGE BANNER CAROUSEL ============ */}
      {banners.length > 0 && (
        <div className="Container px-4 py-6">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* ============ DYNAMIC HOMEPAGE SECTIONS ============ */}
      <DynamicHomepageSections onNavigate={onNavigate} />

      {/* ============ FINAL CTA ============ */}
      <ScrollReveal as="section" className="py-16 md:py-20 bg-gradient-to-br from-secondary via-secondary to-[#0a1628] relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight mb-2">
                Ready to Grow With Better Content?
              </h2>
              <p className="text-blue-200/80 leading-relaxed max-w-lg">
                Let's build a growth system around search, trust, reviews, and conversion.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button onClick={() => onNavigate('articles')} className="primary-btn inline-flex items-center gap-2 px-6 py-3.5 text-sm cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                Browse Reviews <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button onClick={() => onNavigate('advertise')} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-full border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                Partner With DawnWire <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Spacer for mobile sticky CTA + bottom nav */}
      <div className="h-24 md:hidden" />
    </div>
  );
}
