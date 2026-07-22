import React, { useState, useEffect, useRef } from 'react';
import { Star, CheckCircle, XCircle, ChevronDown, ChevronUp, ShoppingBag, ChevronLeft, ChevronRight, ArrowRight, ThumbsUp, ThumbsDown, Award, Shield, Target, Scale, Zap, Sparkles, HelpCircle, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Head } from 'vike-react/Head';
import SeoHelmet from './SeoHelmet';
import Breadcrumbs from './Breadcrumbs';
import { CompareTable } from './CompareProducts';
import { useReducedMotion } from './useReducedMotion';
import ImageZoom from './ImageZoom';
import SocialShareButtons from './SocialShareButtons';
import CrossSellCarousel from './CrossSellCarousel';

function HlsVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHls = src.endsWith('.m3u8');
  const proxyUrl = isHls ? `/api/public/video-proxy?url=${encodeURIComponent(src)}` : '';
  useEffect(() => {
    if (!isHls || !videoRef.current) return;
    let hls: any = null;
    import('hls.js').then(mod => {
      const Hls: any = mod.default || mod;
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        hls.loadSource(proxyUrl || src);
        hls.attachMedia(videoRef.current!);
        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      }
    }).catch((e) => console.error('[HlsVideo] hls.js load error:', e));
    return () => { hls?.destroy(); };
  }, [src, isHls, proxyUrl]);
  return (
    <video ref={videoRef} src={isHls ? undefined : src} controls className="w-full h-full" preload="none" poster={poster} crossOrigin="anonymous" />
  );
}

function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ImageLightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [idx, setIdx] = useState(index);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [images.length, onClose]);
  if (!images.length) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" aria-label="Close lightbox">&times;</button>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" aria-label="Previous image">&lsaquo;</button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => Math.min(images.length - 1, i + 1)); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl z-10 w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" aria-label="Next image">&rsaquo;</button>
        </>
      )}
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img src={images[idx]} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">{idx + 1} / {images.length}</div>
      </div>
    </div>
  );
}

function TrustBadges() {
  const badges = [
    { icon: '🔄', label: '30-Day Returns', desc: 'No questions asked' },
    { icon: '🔒', label: 'Secure Checkout', desc: 'SSL encrypted' },
    { icon: '📦', label: 'Free Shipping', desc: 'On orders over $25' },
    { icon: '✅', label: '1-Year Warranty', desc: 'Manufacturer covered' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {badges.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1 bg-white dark:bg-zinc-950/20 rounded-xl p-3 border border-slate-200 dark:border-zinc-700/40 text-center">
          <span className="text-lg">{b.icon}</span>
          <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-100">{b.label}</span>
          <span className="text-[9px] text-slate-500 dark:text-zinc-400">{b.desc}</span>
        </div>
      ))}
    </div>
  );
}

function SpecsTable({ specs }: { specs: Record<string, string> }) {
  const entries = Object.entries(specs || {}).filter(([k, v]) => k !== 'asin' && k !== 'source' && k !== 'gallery' && k !== 'bestSellersRank' && k !== 'details' && v && typeof v === 'string');
  if (!entries.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700/50">
            <th className="text-left px-5 py-3 font-bold text-slate-800 dark:text-zinc-100 text-xs uppercase tracking-wider">Specification</th>
            <th className="text-left px-5 py-3 font-bold text-slate-800 dark:text-zinc-100 text-xs uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val], i) => (
            <tr key={key} className={`${i % 2 === 0 ? 'bg-white dark:bg-zinc-950/10' : 'bg-slate-50/50 dark:bg-zinc-950/5'} border-b border-slate-200/50 dark:border-zinc-700/30`}>
              <td className="px-5 py-3 text-slate-500 dark:text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</td>
              <td className="px-5 py-3 font-medium text-slate-800 dark:text-zinc-200">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentlyViewed({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dw_recently_viewed');
      if (raw) setItems(JSON.parse(raw).slice(0, 6));
    } catch (e) { console.error(e) }
  }, []);
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🕐</span>
        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Recently Viewed</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item: any, i: number) => (
          <button key={i} onClick={() => onNavigate('review', item.slug || item.id)} className="shrink-0 w-28 group text-left">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-950/30 border border-slate-200 dark:border-zinc-700/50 mb-2">
              {item.image && <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />}
            </div>
            <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-100 truncate">{item.name}</p>
            {item.price && <p className="text-[9px] text-slate-500 dark:text-zinc-400">{item.price}</p>}
          </button>
        ))}
      </div>
    </section>
  );
}

function ReviewSkeleton({ preferReduced }: { preferReduced: boolean }) {
  const anim = preferReduced ? {} : { animate: { opacity: [0.3, 0.6, 0.3] }, transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const } };
  const base = 'bg-zinc-200 dark:bg-zinc-700 rounded';
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-6">
            <motion.div className={`shrink-0 w-40 h-40 md:w-52 md:h-52 ${base}`} {...anim} style={{ aspectRatio: '1/1' }} />
            <div className="flex-1 space-y-4">
              <motion.div className={`h-8 w-3/4 ${base}`} {...anim} />
              <motion.div className={`h-4 w-1/3 ${base}`} {...anim} />
              <div className="flex gap-4">
                <motion.div className={`h-14 w-40 ${base}`} {...anim} />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-10 space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <motion.div className={`h-5 w-32 ${base}`} {...anim} style={{ animationDelay: `${i * 0.15}s` }} />
              <motion.div className={`h-4 w-full ${base}`} {...anim} style={{ animationDelay: `${i * 0.15}s` }} />
              <motion.div className={`h-4 w-5/6 ${base}`} {...anim} style={{ animationDelay: `${i * 0.15}s` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PublicProductReviewProps {
  slug: string;
  onNavigate: (route: string, param?: string) => void;
}

function parseArrayField(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export default function PublicProductReview({ slug, onNavigate }: PublicProductReviewProps) {
  const [review, setReview] = useState<any>(null);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPros, setShowAllPros] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [priceAlertEmail, setPriceAlertEmail] = useState('');
  const [priceAlertSent, setPriceAlertSent] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/public/product-reviews/slug/${encodeURIComponent(slug)}`, { signal: controller.signal });
        if (res.ok) {
          const found = await res.json();
          if (mountedRef.current) {
            setReview(found || null);
            setAllReviews(found ? [found] : []);
            if (found) {
              const sid = localStorage.getItem('sessionId') || '';
              fetch(`/api/public/wishlist?sessionId=${sid}`).then(r => r.json()).then(w => {
                if (Array.isArray(w)) {
                  const item = w.find((i: any) => i.productId === found.id);
                  if (item) { setInWishlist(true); setWishlistId(item.id); }
                }
              }).catch(() => {});
            }
            // Store in recently viewed
            if (found) {
              try {
                const recent = JSON.parse(localStorage.getItem('dw_recently_viewed') || '[]');
                const filtered = recent.filter((r: any) => r.id !== found.id && r.slug !== found.slug);
                filtered.unshift({ id: found.id, slug: found.slug, name: found.product_name, image: found.product_image, price: found.price });
                localStorage.setItem('dw_recently_viewed', JSON.stringify(filtered.slice(0, 20)));
              } catch (e) { console.error(e) }
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && mountedRef.current) {
          setReview(null);
        }
      }
      if (mountedRef.current) setLoading(false);
    };
    load();
    return () => { mountedRef.current = false; controller.abort(); };
  }, [slug]);

  if (loading) return <ReviewSkeleton preferReduced={prefersReduced} />;
  if (!review) return <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 text-center text-sm text-slate-500 dark:text-zinc-400">Review not found</div>;

  const rating = review.rating || 0;
  const pros: string[] = parseArrayField(review.pros);
  const cons: string[] = parseArrayField(review.cons);
  const features: string[] = parseArrayField(review.key_features);
  const displayPros = showAllPros ? pros : pros.slice(0, 5);
  const specs: any = review.specs || {};
  const gallery: string[] = specs.gallery || [];
  if (review.product_image && !gallery.includes(review.product_image)) {
    gallery.unshift(review.product_image);
  }
  const videoUrl: string = specs.video_url || '';
  const isValidVideoUrl = videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:');
  const cleanSummary = sanitizeHtml(review.review_summary);
  const aiSummaryBadge = cleanSummary ? cleanSummary.length > 150 ? cleanSummary.substring(0, 150) + '...' : cleanSummary : '';
  const activeImage = gallery[activeImageIdx] || review.product_image || '';
  const motionProps = prefersReduced ? { initial: {}, animate: {}, transition: {} } : {};
  const altNames: string[] = review.alternatives || [];
  const compareProducts = [review, ...allReviews.filter((r: any) =>
    r.id !== review.id && altNames.some((alt: string) =>
      r.product_name?.toLowerCase().includes(alt.toLowerCase()) ||
      alt.toLowerCase().includes(r.product_name?.toLowerCase())
    )
  )];
  const reviewFaqs: { q: string; a: string }[] = review.faqs || [];

  // Build schemas with entity enrichment
  const productEntity = (review._entities || []).find((e: any) => e.name.toLowerCase() === (review.product_name || '').toLowerCase());
  const brandEntity = (review._entities || []).find((e: any) => e.name.toLowerCase() === (review.brand || '').toLowerCase());
  const otherEntities = (review._entities || []).filter((e: any) => e !== productEntity && e !== brandEntity);

  // Calculate savings
  const currentPrice = parseFloat((review.price || '0').toString().replace(/[^0-9.]/g, ''));
  const originalPrice = parseFloat((review.original_price || '0').toString().replace(/[^0-9.]/g, ''));
  const hasSavings = originalPrice > 0 && currentPrice > 0 && originalPrice > currentPrice;
  const savingsAmount = hasSavings ? (originalPrice - currentPrice).toFixed(2) : '0';
  const savingsPercent = hasSavings ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  // Availability mapping for schema
  const availabilityMap: Record<string, string> = {
    in_stock: 'https://schema.org/InStock',
    low_stock: 'https://schema.org/LimitedAvailability',
    out_of_stock: 'https://schema.org/OutOfStock',
    limited: 'https://schema.org/LimitedAvailability',
  };

  const schemas: Record<string, any>[] = [{
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: review.product_name,
    ...(productEntity?.sameAs ? { sameAs: productEntity.sameAs } : {}),
    brand: review.brand ? {
      '@type': 'Brand',
      name: review.brand,
      ...(brandEntity?.sameAs ? { sameAs: brandEntity.sameAs } : {}),
    } : undefined,
    image: review.product_image || '',
    description: review.review_summary || '',
    sku: review.asin || review.id,
    ...(review.asin ? { gtin: review.asin } : {}),
    review: {
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: rating, bestRating: 5 },
      author: { '@type': 'Organization', name: 'DawnWire' },
      reviewBody: review.final_verdict || '',
      datePublished: review.created_at || review.createdAt || undefined,
    },
    aggregateRating: rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      reviewCount: review.review_count || 1,
    } : undefined,
    offers: review.price ? {
      '@type': 'Offer',
      price: currentPrice.toString(),
      priceCurrency: 'USD',
      availability: availabilityMap[review.stock_status] || 'https://schema.org/InStock',
      url: review.affiliate_url || `https://www.dawnwire.com/review/${review.slug || review.id}`,
      seller: { '@type': 'Organization', name: 'Amazon' },
      ...(hasSavings ? { priceValidUntil: review.coupon_expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } : {}),
    } : undefined,
  }];

  // Add entity sameAs as additional schemas for AI/LD enrichment
  for (const entity of otherEntities) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': entity.type || 'Thing',
      name: entity.name,
      sameAs: entity.sameAs,
    });
  }

  // VideoObject schema
  if (isValidVideoUrl) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: `${review.product_name} Review Video`,
      description: review.review_summary || `Video review of ${review.product_name}`,
      thumbnailUrl: review.product_image || '',
      contentUrl: videoUrl,
      embedUrl: videoUrl,
      uploadDate: review.created_at || review.createdAt || new Date().toISOString(),
    });
  }

  if (reviewFaqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: reviewFaqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  // Parse price for OG tags
  const ogPrice = review.price ? review.price.toString().replace(/[^0-9.]/g, '') : '';

  return (
    <>
      <SeoHelmet
        title={`${review.product_name} Review${review.brand ? ` by ${review.brand}` : ''}`}
        description={review.review_summary || `Read our in-depth review of ${review.product_name}.${review.best_for ? ` Best for: ${review.best_for}.` : ''}`}
        canonical={`/review/${review.slug || review.id}`}
        ogImage={review.product_image || ''}
        ogType="article"
        jsonLd={schemas}
      />
      {ogPrice && (
        <Head>
          <meta property="product:price:amount" content={ogPrice} />
          <meta property="product:price:currency" content="USD" />
        </Head>
      )}
      {review.created_at && (
        <Head>
          <meta property="article:published_time" content={review.created_at} />
        </Head>
      )}

      {/* Preload hero image */}
      {review.product_image && (
        <link rel="preload" as="image" href={review.product_image} />
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl shadow-sm overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 text-white p-8 md:p-10">
            <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: `${review.product_name} Review` }]} className="text-white/70 mb-4" />
            <div className="flex flex-col md:flex-row gap-6">
              {activeImage && (
                <div className="shrink-0">
                  <ImageZoom
                    src={activeImage}
                    alt={review.product_name}
                    className="w-40 h-40 md:w-52 md:h-52 object-contain rounded-2xl bg-white/10 p-3 shadow-lg"
                    containerClassName="rounded-2xl"
                    aspectRatio="1/1"
                    loading="eager"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight">{review.product_name}</h1>
                  {review.brand && <p className="text-white/70 text-sm mt-1">{review.brand}</p>}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {rating > 0 ? (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-5 h-5 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`} />
                      ))}
                      <span className="ml-2 text-sm font-bold">{rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white/70 italic">Not rated</span>
                  )}
                  {review.price && (
                    <span className="text-2xl font-bold text-white font-mono">{review.price}</span>
                  )}
                  {review.best_for && (
                    <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full">{review.best_for}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                <motion.a
                  href={review.affiliate_url || '#'}
                  target={review.affiliate_url ? '_blank' : undefined}
                  rel={review.affiliate_url ? 'noopener noreferrer sponsored' : undefined}
                  className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-amber-500 text-slate-900 dark:text-white font-bold text-sm px-8 py-4 rounded-lg shadow-lg shrink-0 self-start cursor-pointer"
                  whileHover={prefersReduced ? {} : { scale: 1.05, boxShadow: '0 8px 30px rgba(251,191,36,0.4)' }}
                  whileTap={prefersReduced ? {} : { scale: 0.97 }}
                  animate={!prefersReduced ? { boxShadow: ['0 4px 15px rgba(251,191,36,0.25)', '0 4px 25px rgba(251,191,36,0.5)', '0 4px 15px rgba(251,191,36,0.25)'] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  onClick={(e) => { if (!review.affiliate_url) { e.preventDefault(); onNavigate('review', review.id); } if (review.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: review.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {review.cta_text || 'Buy Now'} <ArrowRight className="w-4 h-4" />
                </motion.a>
                <button
                  onClick={async () => {
                    if (inWishlist && wishlistId) {
                      await fetch(`/api/public/wishlist/${wishlistId}`, { method: 'DELETE' });
                      setInWishlist(false);
                      setWishlistId(null);
                    } else {
                      const sid = localStorage.getItem('sessionId') || '';
                      const res = await fetch('/api/public/wishlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: review.id, sessionId: sid })
                      });
                      const w = await res.json();
                      if (res.ok) { setInWishlist(true); setWishlistId(w.id); }
                    }
                  }}
                  className={`p-4 rounded-lg shadow-lg shrink-0 transition-colors ${inWishlist ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-red-500' : ''}`} />
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-zinc-700/60">
              <div className="relative cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <ImageZoom
                  src={activeImage}
                  alt={review.product_name}
                  className="w-full max-h-[400px] object-contain rounded-xl bg-slate-50 dark:bg-zinc-950/40"
                  containerClassName="rounded-xl"
                />
                <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">🔍 {gallery.length} photos</div>
                {gallery.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setActiveImageIdx(i => Math.max(0, i - 1)); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 dark:text-white p-1.5 rounded-full shadow-md transition-all" aria-label="Previous image"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); setActiveImageIdx(i => Math.min(gallery.length - 1, i + 1)); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-900 dark:text-white p-1.5 rounded-full shadow-md transition-all" aria-label="Next image"><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1" role="tablist" aria-label="Gallery thumbnails">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImageIdx(i); }}
                      role="tab"
                      aria-selected={i === activeImageIdx}
                      className={`shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${i === activeImageIdx ? 'border-[#246BFF]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {lightboxOpen && <ImageLightbox images={gallery} index={activeImageIdx} onClose={() => setLightboxOpen(false)} />}

          <div className="p-6 md:p-10 space-y-10">
            {/* Video */}
            {isValidVideoUrl && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Product Video</h2>
                </div>
                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('&')[0]}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      title="Product video"
                    />
                  ) : (
                    <HlsVideo src={videoUrl} poster={review.product_image || ''} />
                  )}
                </div>
              </section>
            )}

            {/* Review Summary */}
            {cleanSummary && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Summary</h2>
                  {aiSummaryBadge && <span className="ml-auto bg-gradient-to-r from-[#246BFF] to-blue-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">AI Analysis</span>}
                </div>
                <div className="bg-gradient-to-r from-[#246BFF]/5 to-slate-900/5 dark:from-[#246BFF]/10 dark:to-zinc-950/10 rounded-2xl p-6 border-l-4 border-[#246BFF] shadow-sm" style={{ willChange: 'transform' }}>
                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed text-sm md:text-base">{cleanSummary}</p>
                </div>
              </section>
            )}

            {/* Pros & Cons */}
            {(pros.length > 0 || cons.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Pros & Cons</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pros.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/10 rounded-2xl p-6 border border-green-200/60 dark:border-green-900/30 shadow-sm" style={{ willChange: 'transform' }}>
                      <h3 className="font-display font-bold text-green-700 dark:text-green-400 text-base flex items-center gap-2 mb-4">
                        <ThumbsUp className="w-5 h-5" />
                        <span>Pros</span>
                        <span className="ml-auto bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{pros.length}</span>
                      </h3>
                      <ul className="space-y-3">
                        {displayPros.map((pro, i) => (
                          <motion.li
                            key={i}
                            {...motionProps}
                            initial={prefersReduced ? {} : { opacity: 0, x: -10 }}
                            animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 text-sm text-green-800 dark:text-green-200"
                          >
                            <span className="shrink-0 w-5 h-5 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center mt-0.5">
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </span>
                            {pro}
                          </motion.li>
                        ))}
                        {pros.length > 5 && (
                          <button onClick={() => setShowAllPros(!showAllPros)} className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 mt-2 transition-all">
                            {showAllPros ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showAllPros ? 'Show less' : `Show all ${pros.length} pros`}
                          </button>
                        )}
                      </ul>
                    </div>
                  )}
                  {cons.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/10 rounded-2xl p-6 border border-red-200/60 dark:border-red-900/30 shadow-sm" style={{ willChange: 'transform' }}>
                      <h3 className="font-display font-bold text-red-700 dark:text-red-400 text-base flex items-center gap-2 mb-4">
                        <ThumbsDown className="w-5 h-5" />
                        <span>Cons</span>
                        <span className="ml-auto bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{cons.length}</span>
                      </h3>
                      <ul className="space-y-3">
                        {cons.map((con, i) => (
                          <motion.li
                            key={i}
                            {...motionProps}
                            initial={prefersReduced ? {} : { opacity: 0, x: 10 }}
                            animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 text-sm text-red-800 dark:text-red-200"
                          >
                            <span className="shrink-0 w-5 h-5 rounded-full bg-red-200 dark:bg-red-800/50 flex items-center justify-center mt-0.5">
                              <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                            </span>
                            {con}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Key Features */}
            {features.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Key Features</h2>
                  <span className="ml-auto bg-[#246BFF]/10 text-[#246BFF] text-[10px] font-bold px-2.5 py-0.5 rounded-full">{features.length} items</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      {...motionProps}
                      initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
                      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative bg-white dark:bg-zinc-950/30 rounded-2xl p-5 border border-slate-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md hover:border-[#246BFF]/30 transition-all duration-300"
                      style={{ willChange: 'transform' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#246BFF] to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                          {i + 1}
                        </div>
                        <div>
                          <span className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{f}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Final Verdict */}
            {review.final_verdict && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Final Verdict</h2>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/15 dark:to-orange-950/10 rounded-2xl p-6 md:p-8 border border-amber-200/60 dark:border-amber-900/30 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {rating > 0 && (
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-black text-white">{rating.toFixed(1)}</span>
                          <div className="absolute -top-2 -right-2 bg-white dark:bg-zinc-950 rounded-full p-1 shadow-md">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2 uppercase tracking-wider">out of 5</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-slate-800 dark:text-zinc-200 leading-relaxed text-sm md:text-base">
                        {review.final_verdict}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Specs Details */}
            {specs.details && Object.keys(specs.details).length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Technical Specifications</h2>
                </div>
                <SpecsTable specs={specs.details} />
              </section>
            )}

            {/* Trust Badges */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🛡️</span>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Why Buy From Us</h2>
              </div>
              <TrustBadges />
            </section>

            {/* Buying Guide Link */}
            {review.best_for && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📖</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Buying Guide</h2>
                </div>
                <button onClick={() => onNavigate('buyers-guide', review.best_for!.toLowerCase().replace(/\s+/g, '-'))} className="w-full bg-gradient-to-r from-[#246BFF]/10 to-blue-500/10 dark:from-[#246BFF]/20 dark:to-blue-500/20 rounded-2xl p-5 border border-[#246BFF]/20 dark:border-[#246BFF]/30 text-left group hover:shadow-md transition-all">
                  <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 group-hover:text-[#246BFF] transition-colors">View {review.best_for} Buying Guide &rarr;</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Compare top-rated products in this category</p>
                </button>
              </section>
            )}

            {/* Price History & Drop Alert */}
            {review.price && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Price & Deals</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-950/30 rounded-2xl p-5 border border-slate-200 dark:border-zinc-700/50 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Current Price</span>
                      {review.original_price && parseFloat(review.original_price.replace(/[^0-9.]/g, '')) > parseFloat(review.price.replace(/[^0-9.]/g, '')) && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Save {((parseFloat(review.original_price.replace(/[^0-9.]/g, '')) - parseFloat(review.price.replace(/[^0-9.]/g, ''))) / parseFloat(review.original_price.replace(/[^0-9.]/g, '')) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100 font-mono">{review.price}</span>
                      {review.original_price && <span className="text-sm text-slate-500 dark:text-zinc-400 line-through">{review.original_price}</span>}
                    </div>
                    {review.stock_status && (
                      <p className={`text-xs mt-2 font-medium ${review.stock_status === 'out_of_stock' ? 'text-red-500' : review.stock_status === 'low_stock' ? 'text-amber-500' : 'text-green-500'}`}>
                        {review.stock_status === 'out_of_stock' ? '❌ Out of Stock' : review.stock_status === 'low_stock' ? '⚠️ Low Stock' : '✅ In Stock'}
                      </p>
                    )}
                  </div>
                  <div className="bg-white dark:bg-zinc-950/30 rounded-2xl p-5 border border-slate-200 dark:border-zinc-700/50 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block">Price Drop Alert</span>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">Get notified when the price drops</p>
                    {priceAlertSent ? (
                      <p className="text-green-600 dark:text-green-400 text-xs font-bold">✅ You'll be notified!</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={priceAlertEmail}
                          onChange={e => setPriceAlertEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/30 px-3 py-2 text-xs focus:outline-none focus:border-[#246BFF] text-slate-800 dark:text-zinc-100"
                        />
                        <button
                          onClick={async () => {
                            if (!priceAlertEmail.includes('@')) return;
                            try {
                              const currPrice = parseFloat((review.price || '0').replace(/[^0-9.]/g, ''));
                              await fetch('/api/public/price-alerts', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  productId: review.id,
                                  email: priceAlertEmail,
                                  targetPrice: currPrice * 0.9, // 10% drop target
                                  currentPrice: currPrice
                                })
                              });
                              setPriceAlertSent(true);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
                        >
                          Notify
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {review.deal_badge && (
                  <div className="mt-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10 rounded-2xl p-4 border border-red-200/60 dark:border-red-900/30">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      <span className="font-bold text-sm text-red-700 dark:text-red-400">{review.deal_badge}</span>
                      {review.coupon_code && <span className="bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">CODE: {review.coupon_code}</span>}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Video Transcript (placeholder) */}
            {isValidVideoUrl && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📝</span>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Video Transcript</h2>
                </div>
                <div className="bg-white dark:bg-zinc-950/30 rounded-2xl p-5 border border-slate-200 dark:border-zinc-700/50 shadow-sm">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 italic">Transcript is being generated. Check back soon for a detailed breakdown of this product video.</p>
                </div>
              </section>
            )}

            {/* Recently Viewed */}
            <RecentlyViewed onNavigate={onNavigate} />

            {/* FAQ Section */}
            {reviewFaqs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-3">
                  {reviewFaqs.map((faq, i) => (
                    <details key={i} className="group bg-white dark:bg-zinc-950/30 rounded-2xl border border-slate-200 dark:border-zinc-700/50 shadow-sm overflow-hidden">
                      <summary className="flex items-center justify-between gap-3 cursor-pointer p-5 font-semibold text-sm text-slate-800 dark:text-zinc-100 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors list-none">
                        <span>{faq.q}</span>
                        <ChevronDown className="w-4 h-4 shrink-0 text-slate-500 dark:text-zinc-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="px-5 pb-5 text-sm text-slate-500 dark:text-zinc-300 leading-relaxed border-t border-slate-200 dark:border-zinc-700/50 pt-4">
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Compare with alternatives */}
            {compareProducts.length > 1 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-[#246BFF]" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Compare Alternatives</h2>
                  <span className="ml-auto bg-[#246BFF]/10 text-[#246BFF] text-[10px] font-bold px-2.5 py-0.5 rounded-full">{compareProducts.length} products</span>
                </div>
                <CompareTable products={compareProducts} highlightId={review.id} onNavigate={onNavigate} />
              </section>
            )}

            {/* Disclaimer */}
            {review.affiliate_disclaimer && (
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-zinc-700 pt-5 italic text-center">
                {review.affiliate_disclaimer}
              </div>
            )}

            {/* Social Share */}
            <div className="border-t border-slate-200 dark:border-zinc-700 pt-5 flex justify-center">
              <SocialShareButtons
                title={`${review.product_name} Review - DawnWire`}
                description={review.review_summary || `Read our in-depth review of ${review.product_name}`}
                image={review.product_image}
              />
            </div>

            {/* Cross-Sell Carousel */}
            <div className="border-t border-slate-200 dark:border-zinc-700 pt-6">
              <CrossSellCarousel
                products={allReviews}
                currentId={review.id}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom Buy Now bar */}
      <motion.div
        initial={prefersReduced ? {} : { y: 100 }}
        animate={prefersReduced ? {} : { y: 0 }}
        transition={prefersReduced ? {} : { delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-700/60 shadow-2xl backdrop-blur-lg bg-white/95 dark:bg-zinc-950/95 p-3 md:p-4"
        style={{ willChange: prefersReduced ? 'auto' : 'transform' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {review.product_image && <img src={review.product_image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" loading="lazy" />}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">{review.product_name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                {review.brand && <span>{review.brand}</span>}
                {(review.rating || 0) > 0 && <span>&#11088; {(review.rating || 0).toFixed(1)}</span>}
                {hasSavings && <span className="text-emerald-500 font-bold">Save ${savingsAmount} ({savingsPercent}%)</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {review.price && <span className="text-lg font-bold text-slate-900 dark:text-white">{review.price}</span>}
            <motion.a
              href={review.affiliate_url || '#'}
              target={review.affiliate_url ? '_blank' : undefined}
              rel={review.affiliate_url ? 'noopener noreferrer sponsored' : undefined}
              className="inline-flex items-center gap-1.5 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-sm font-bold px-6 py-3 rounded-lg shadow-lg cursor-pointer"
              whileHover={prefersReduced ? {} : { scale: 1.03, boxShadow: '0 4px 20px rgba(36,107,255,0.4)' }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              animate={!prefersReduced ? { boxShadow: ['0 2px 8px rgba(36,107,255,0.2)', '0 2px 16px rgba(36,107,255,0.4)', '0 2px 8px rgba(36,107,255,0.2)'] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={(e) => { if (!review.affiliate_url) { e.preventDefault(); onNavigate('review', review.id); } if (review.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: review.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}
            >
              <ShoppingBag className="w-4 h-4" />
              {review.cta_text || 'Buy Now'}
            </motion.a>
          </div>
        </div>
      </motion.div>

      <div className="h-20" />
    </>
  );
}
