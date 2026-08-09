import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, ThumbsUp, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { sanitizeHtml } from '../../lib/sanitize';
import { proxyImageUrl } from '../../utils/safeRender';

interface Review {
  name: string;
  avatar?: string;
  rating: number;
  title?: string;
  date?: string;
  body?: string;
  verified?: boolean;
  images?: string[];
}

interface ReviewStats {
  total: number;
  average: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

interface Props {
  reviews?: Review[];
  reviewStats?: ReviewStats;
  reviewHighlights?: string;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-zinc-600'}`}
        />
      ))}
    </div>
  );
}

export default function CustomerReviews({ reviews, reviewStats, reviewHighlights }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  if (!reviews || reviews.length === 0) return null;

  const displayReviews = showAll ? reviews : reviews.slice(0, 5);
  const averageRating = reviewStats?.average || reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
  const totalReviews = reviewStats?.total || reviews.length;

  const toggleExpand = (idx: number) => {
    const next = new Set(expandedReviews);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setExpandedReviews(next);
  };

  const maxDist = Math.max(...Object.values(reviewStats?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Customer Reviews</h3>
        <span className="text-xs text-slate-400 dark:text-zinc-500">({totalReviews.toLocaleString()})</span>
      </div>

      {reviewHighlights && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Customers say</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{sanitizeHtml(reviewHighlights)}</p>
        </div>
      )}

      {(reviewStats || reviews.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 p-5">
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-4xl font-bold text-slate-800 dark:text-zinc-100">{averageRating.toFixed(1)}</span>
            <StarRating rating={averageRating} size="md" />
            <span className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{totalReviews.toLocaleString()} reviews</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviewStats?.distribution?.[star as keyof typeof reviewStats.distribution] || 0;
              const pct = maxDist > 0 ? (count / maxDist) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-right text-slate-500 dark:text-zinc-400">{star}</span>
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-slate-400 dark:text-zinc-500">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayReviews.map((review, idx) => {
          const isExpanded = expandedReviews.has(idx);
          const isLong = (review.body || '').length > 300;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 p-4 hover:border-slate-200 dark:hover:border-zinc-600 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dw-blue to-dw-orange flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {review.avatar ? (
                    <img src={proxyImageUrl(review.avatar)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    (review.name || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">{review.name}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} />
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">{review.date}</span>
                  </div>
                  {review.title && (
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-200 mt-1.5">{review.title}</p>
                  )}
                  <div className="mt-1">
                    <p className={`text-xs text-slate-600 dark:text-zinc-300 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                      {sanitizeHtml(review.body)}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-[#246BFF] hover:underline"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {review.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden hover:opacity-80 transition-opacity">
                          <img src={proxyImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length > 5 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-all"
          >
            {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showAll ? 'Show fewer' : `Show all ${reviews.length} reviews`}
          </button>
        </div>
      )}

      {totalReviews > reviews.length && (
        <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500">
          Showing {reviews.length} of {totalReviews.toLocaleString()} total reviews. Install the DawnWire extension to import more.
        </p>
      )}
    </div>
  );
}
