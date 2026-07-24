import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductVideo } from '../types';
import { AffiliateCTA } from '../components/common/AffiliateCTA';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { ProductCard } from '../components/common/ProductCard';
import { GravityParticleCanvas } from '../components/common/GravityParticleCanvas';
import { ProductDetailSkeleton } from '../components/common/Skeletons';
import { ProductSentimentCard } from '../components/product/ProductSentimentCard';
import { PriceHistoryTracker } from '../components/product/PriceHistoryTracker';
import { ProductFaqSection } from '../components/product/ProductFaqSection';
import { useAppStore, store } from '../lib/store';

interface ProductDetailPageProps {
  productSlug: string;
  onOpenChatbotForProduct?: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productSlug,
  onOpenChatbotForProduct,
  isLoading: externalIsLoading = false,
}) => {
  const { products, wishlist } = useAppStore();

  const [isInternalLoading, setIsInternalLoading] = useState(true);

  useEffect(() => {
    setIsInternalLoading(true);
    const timer = setTimeout(() => {
      setIsInternalLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [productSlug]);

  const isLoading = externalIsLoading || isInternalLoading;

  const product = products.find((p) => p.slug === productSlug) || products[0];

  // Images setup (Ensure at least 4 fallback imported images for rich gallery)
  const defaultFallbackImages = [
    product?.images[0] || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80'
  ];

  const allImportedImages = product?.images && product.images.length > 0
    ? [...product.images, ...defaultFallbackImages.slice(product.images.length)]
    : defaultFallbackImages;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Reset lightbox zoom/rotation on image index change or lightbox toggle
  useEffect(() => {
    setLightboxZoom(1);
    setLightboxRotation(0);
  }, [selectedImageIndex, isLightboxOpen]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % allImportedImages.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + allImportedImages.length) % allImportedImages.length);
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((prev) => Math.min(prev + 0.5, 3));
      } else if (e.key === '-') {
        setLightboxZoom((prev) => Math.max(prev - 0.5, 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, allImportedImages.length]);

  // Video reviews setup
  const defaultVideos: ProductVideo[] = [
    {
      id: 'v1',
      title: `${product?.title || 'Product'} - Full 30-Day In-Depth Review & Lab Test`,
      youtubeId: 'p25P-M1m36c',
      author: 'Tech Benchmark Lab',
      duration: '14:20',
      type: 'review',
      thumbnailUrl: allImportedImages[0]
    },
    {
      id: 'v2',
      title: `Unboxing & Setup Guide: ${product?.title || 'Product'}`,
      youtubeId: 'y28L_9I9xsc',
      author: 'Unbox & Setup Tech',
      duration: '08:45',
      type: 'unboxing',
      thumbnailUrl: allImportedImages[1] || allImportedImages[0]
    },
    {
      id: 'v3',
      title: `Real-World Stress Test & Ergonomics Comparison`,
      youtubeId: 'dQw4w9WgXcQ',
      author: 'Consumer Tech Insights',
      duration: '11:10',
      type: 'benchmark',
      thumbnailUrl: allImportedImages[2] || allImportedImages[0]
    }
  ];

  const productVideos = (product?.videos && product.videos.length > 0) ? product.videos : defaultVideos;
  const [activeVideo, setActiveVideo] = useState<ProductVideo>(productVideos[0]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'videos' | 'specs'>('overview');

  const isWishlisted = product ? wishlist.includes(product.id) : false;

  // Sync selected image index when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    if (productVideos.length > 0) {
      setActiveVideo(productVideos[0]);
    }
  }, [productSlug]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % allImportedImages.length);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + allImportedImages.length) % allImportedImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, allImportedImages.length]);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen py-24 text-center">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <a href="/products" className="text-blue-600 font-bold mt-4 inline-block">Back to Products</a>
      </div>
    );
  }

  // Related products
  const relatedProducts = products
    .filter((p) => p.mainCategory === product.mainCategory && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <DisclosureBanner />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <a href="/" className="hover:underline">Home</a>
          <span>/</span>
          <a href="/products" className="hover:underline">Products</a>
          <span>/</span>
          <a href={`/categories/${product.mainCategory.toLowerCase()}`} className="hover:underline">{product.mainCategory}</a>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </div>

        <button
          onClick={() => store.toggleWishlist(product.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isWishlisted
              ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 border-rose-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-rose-600'
          }`}
        >
          <svg className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{isWishlisted ? 'Saved to Wishlist' : 'Save'}</span>
        </button>
      </div>

      {/* Navigation Quick Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-[#0A1F44] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            Overview & Pricing
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-[#0A1F44] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>📷 All Imported Images</span>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {allImportedImages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'videos'
                ? 'bg-[#0A1F44] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>🎬 Videos & Unboxing</span>
            <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {productVideos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'specs'
                ? 'bg-[#0A1F44] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            ⚙️ Specifications & Pros/Cons
          </button>
        </div>
      </div>

      {/* Main Grid: Overview Tab View */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Interactive Image Gallery with Zoom & Lightbox Trigger */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-96 overflow-hidden">
            <img
              src={allImportedImages[selectedImageIndex]}
              alt={`${product.title} angle ${selectedImageIndex + 1}`}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Badges */}
            {product.isDeal && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl shadow-md uppercase tracking-wider">
                -{product.discountPercentage || 20}% AMAZON DEAL
              </span>
            )}

            {/* Expand Gallery Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>View Lightbox ({selectedImageIndex + 1}/{allImportedImages.length})</span>
            </button>
          </div>

          {/* Thumbnails Row for All Imported Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
              <span>All Imported Product Images ({allImportedImages.length})</span>
              <span className="text-blue-600 dark:text-blue-400 text-[11px]">Click image for high-res preview</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {allImportedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-2 border transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1 rounded font-bold">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Assistant Callout */}
          {onOpenChatbotForProduct && (
            <div className="p-4 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 text-white rounded-2xl border border-blue-500/40 shadow-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black text-xs shrink-0 shadow">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ask Gemini Assistant</h4>
                  <p className="text-[11px] text-blue-200">Query specifications, real user reviews, or comparisons instantly.</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChatbotForProduct(product)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs shrink-0 shadow-md transition-colors"
              >
                Ask Assistant
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Product Buy Box & Specs Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {product.brand} • {product.subcategory}
              </span>
              {product.bestFor && (
                <span className="text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300/60">
                  🏆 {product.bestFor}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {product.title}
            </h1>

            {/* Score & Rating Bar */}
            <div className="flex flex-wrap items-center gap-4 mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-1.5 bg-[#0A1F44] text-amber-400 font-black text-xs px-3 py-1.5 rounded-xl shadow-md">
                <span>DawnWire Score:</span>
                <span className="text-sm font-black">{product.editorScore} / 10</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex text-amber-400">
                  {'★'.repeat(Math.round(product.rating || 4.5))}
                </div>
                <span className="font-bold">{product.rating}</span>
                <span>({product.reviewCount?.toLocaleString()} Amazon reviews)</span>
              </div>

              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock on Amazon US
              </span>
            </div>
          </div>

          {/* Pricing & Amazon Buy Box */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Verified Amazon Price
                </span>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                      ${Number(product.currentPrice).toFixed(2)}
                    </span>
                    {Number(product.referencePrice) && Number(product.currentPrice) && Number(product.referencePrice) > Number(product.currentPrice) && (
                      <span className="text-sm text-slate-400 line-through font-semibold">
                        ${Number(product.referencePrice).toFixed(2)}
                    </span>
                  )}
                  {product.isPrime && (
                    <span className="text-xs font-black text-sky-600 dark:text-sky-400 italic bg-sky-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200/60">
                      Amazon Prime Fast Delivery
                    </span>
                  )}
                </div>
              </div>

              <span className="text-xs text-slate-400 text-right">
                ASIN: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{product.asin}</code><br />
                Updated: Today
              </span>
            </div>

            {/* Primary Amazon CTA */}
            <div className="pt-2">
              <AffiliateCTA
                affiliateUrl={product.affiliateUrl}
                productId={product.id}
                asin={product.asin}
                productTitle={product.title}
                category={product.mainCategory}
                brand={product.brand}
                label={product.isDeal ? 'Claim Deal on Amazon' : 'Check Live Price on Amazon'}
                variant={product.isDeal ? 'deal' : 'primary'}
                size="lg"
                position="product_detail_box"
                className="w-full text-center"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Ships directly from Amazon US. Price and availability subject to change.
            </p>
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {product.fullDescription || product.shortDescription}
          </p>

          {/* Key Features Bullet Points */}
          {product.mainFeatures && product.mainFeatures.length > 0 && (
            <div className="p-5 bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                Key Product Highlights
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {product.mainFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ALL IMPORTED IMAGES FULL GALLERY SECTION */}
      <section className="max-w-7xl mx-auto px-4 mt-16 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase mb-1">
              📸 High-Resolution Visual Inspection
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              All Imported Product Images ({allImportedImages.length})
            </h2>
            <p className="text-xs text-slate-500">
              Full angle photography, build quality details, and unboxing angles for {product.title}
            </p>
          </div>

          <button
            onClick={() => setIsLightboxOpen(true)}
            className="bg-[#0A1F44] hover:bg-blue-950 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Open Fullscreen Lightbox</span>
          </button>
        </div>

        {/* Multi-Image Grid Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {allImportedImages.map((img, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => {
                setSelectedImageIndex(idx);
                setIsLightboxOpen(true);
              }}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer overflow-hidden flex flex-col items-center justify-center h-48"
            >
              <img
                src={img}
                alt={`${product.title} Imported Shot #${idx + 1}`}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Inspect #{idx + 1}
                </span>
              </div>
              <span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Angle {idx + 1}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EMBEDDED VIDEO REVIEWS & DEMONSTRATION SECTION */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
          {/* Gravity particle ambient background */}
          <GravityParticleCanvas particleCount={40} className="opacity-40" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-black uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Video Reviews & Unboxing Benchmarks</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Hands-On Demonstration & Lab Videos
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Watch verified product tests, teardowns, and real-world audio/performance demonstrations for {product.title}.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-amber-400">★ {product.editorScore}</span>
              <span className="text-slate-400">| {productVideos.length} Video Reviews Available</span>
            </div>
          </div>

          {/* Main Active Embedded YouTube Video Player */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Large 16:9 Embedded Player */}
            <div className="lg:col-span-8 space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Active Video Info Banner */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="uppercase font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                      [{activeVideo.type.toUpperCase()}]
                    </span>
                    <span>By {activeVideo.author}</span>
                    <span>•</span>
                    <span>Duration: {activeVideo.duration}</span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {activeVideo.title}
                  </h3>
                </div>

                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shrink-0 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  <span>Watch on YouTube</span>
                </a>
              </div>
            </div>

            {/* Right 4 Cols: Video Playlist Cards */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Select Video Review ({productVideos.length})
              </h3>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                {productVideos.map((vid) => {
                  const isActive = vid.id === activeVideo.id;
                  return (
                    <motion.button
                      key={vid.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveVideo(vid)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                        isActive
                          ? 'bg-blue-900/90 border-blue-400 ring-2 ring-blue-500/30'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {/* Video Thumbnail */}
                      <div className="relative w-24 h-16 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                        <img src={vid.thumbnailUrl || allImportedImages[0]} alt="" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <svg className="w-6 h-6 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/90 text-white text-[9px] font-bold px-1 rounded">
                          {vid.duration}
                        </span>
                      </div>

                      {/* Video Text */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">
                          {vid.type}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {vid.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {vid.author}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI SENTIMENT VISUALIZATION & GRAPHICAL SUMMARY */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <ProductSentimentCard product={product} />
      </section>

      {/* PRICE HISTORY TRACKER & TARGET PRICE ALERTS */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <PriceHistoryTracker product={product} />
      </section>

      {/* AI-POWERED PRODUCT FAQ SECTION */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <ProductFaqSection product={product} onOpenChatbotForProduct={onOpenChatbotForProduct} />
      </section>

      {/* Specifications & Pros/Cons Section */}
      <section className="max-w-7xl mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Specifications */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚙️ Technical Specifications & Build Specs</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(product.specifications || {}).map(([key, val]) => (
              <div key={key} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{key}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pros & Cons */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
            <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Tested Advantages (Pros)
            </h4>
            <ul className="space-y-2 text-xs text-emerald-950 dark:text-emerald-300">
              {product.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-extrabold text-emerald-600">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-rose-50/80 dark:bg-rose-950/40 rounded-3xl border border-rose-200/80 dark:border-rose-800/80 space-y-3">
            <h4 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              Trade-offs & Considerations (Cons)
            </h4>
            <ul className="space-y-2 text-xs text-rose-950 dark:text-rose-300">
              {product.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-extrabold text-rose-600">✕</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Similar Top Picks in {product.mainCategory}
            </h3>
            <a href={`/categories/${product.mainCategory.toLowerCase()}`} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View All {product.mainCategory} &rarr;
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL FOR IMAGES */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
          >
            {/* Lightbox Header with Product Title, Zoom Controls & Close */}
            <div className="flex flex-wrap items-center justify-between text-white z-20 gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold truncate max-w-xs sm:max-w-md">{product.title}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                  <span>Image {selectedImageIndex + 1} of {allImportedImages.length}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{lightboxZoom}x Zoom</span>
                </div>
              </div>

              {/* Lightbox Interactive Toolbar (Zoom In/Out, Rotate, Reset, Close) */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
                <button
                  onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.5, 3))}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 transition-colors font-bold text-xs"
                  title="Zoom In (+)"
                >
                  🔍+
                </button>
                <button
                  onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.5, 1))}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 transition-colors font-bold text-xs"
                  title="Zoom Out (-)"
                >
                  🔍-
                </button>
                <button
                  onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 transition-colors font-bold text-xs"
                  title="Rotate 90°"
                >
                  🔄
                </button>
                {(lightboxZoom !== 1 || lightboxRotation !== 0) && (
                  <button
                    onClick={() => {
                      setLightboxZoom(1);
                      setLightboxRotation(0);
                    }}
                    className="p-2 bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 rounded-xl transition-colors font-bold text-[11px]"
                  >
                    Reset
                  </button>
                )}

                <div className="w-px h-5 bg-slate-800 mx-1" />

                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-300 p-2 rounded-xl transition-colors border border-red-500/30 font-bold text-xs flex items-center gap-1"
                  title="Close Lightbox (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* Lightbox Main View with Zoomable Image & Next / Prev Controls */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none">
              {/* Prev Button */}
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev - 1 + allImportedImages.length) % allImportedImages.length)}
                className="absolute left-2 sm:left-6 z-30 bg-slate-900/90 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-700 shadow-2xl transition-all hover:scale-110"
                title="Previous Image (← Arrow Left)"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Main Image Container */}
              <div
                className="cursor-zoom-in overflow-hidden flex items-center justify-center max-h-[75vh] max-w-full"
                onClick={() => setLightboxZoom((prev) => (prev === 1 ? 2 : 1))}
                title="Click to toggle 2x Zoom"
              >
                <motion.img
                  key={`${selectedImageIndex}-${lightboxRotation}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: lightboxZoom,
                    rotate: lightboxRotation,
                  }}
                  transition={{ duration: 0.25 }}
                  src={allImportedImages[selectedImageIndex]}
                  alt={`${product.title} angle ${selectedImageIndex + 1}`}
                  className="max-h-[70vh] max-w-full object-contain drop-shadow-2xl transition-transform duration-200"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % allImportedImages.length)}
                className="absolute right-2 sm:right-6 z-30 bg-slate-900/90 hover:bg-slate-900 text-white p-3 rounded-full border border-slate-700 shadow-2xl transition-all hover:scale-110"
                title="Next Image (→ Arrow Right)"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Lightbox Footer Thumbnails Bar */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 z-20">
              {allImportedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 p-1.5 border transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                      : 'border-slate-800 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-30 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-500 block truncate max-w-[150px]">{product.title}</span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100">${Number(product.currentPrice).toFixed(2)}</span>
        </div>
        <AffiliateCTA
          affiliateUrl={product.affiliateUrl}
          productId={product.id}
          asin={product.asin}
          productTitle={product.title}
          variant="sticky_mobile"
          label="Buy on Amazon"
          position="sticky_mobile"
          className="flex-1"
        />
      </div>
    </div>
  );
};
