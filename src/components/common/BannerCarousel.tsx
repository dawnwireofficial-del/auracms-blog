import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryBanner } from '../../types';
import { proxyImageUrl } from '../../utils/safeRender';

interface BannerCarouselProps {
  banners: CategoryBanner[];
  autoPlayInterval?: number;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  autoPlayInterval = 5000,
}) => {
  const activeBanners = banners.filter((b) => b.isEnabled !== false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [activeBanners.length, autoPlayInterval]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5 }}
          className="relative min-h-[300px] md:min-h-[380px] flex items-center"
        >
          {/* Background Images */}
          <div className="absolute inset-0 z-0">
            <picture>
              <source media="(max-width: 640px)" srcSet={current.mobileImage || current.desktopImage} />
              <img
                src={proxyImageUrl(current.desktopImage)}
                alt={current.title}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                className="w-full h-full object-cover object-center"
              />
            </picture>
            {/* Dark Overlay gradient based on overlayStrength */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"
              style={{ opacity: (current.overlayStrength ?? 50) / 100 }}
            />
          </div>

          {/* Banner Content Container */}
          <div className="relative z-10 p-6 md:p-12 max-w-2xl text-white space-y-4">
            {current.badgeText && (
              <span className="inline-block px-3.5 py-1 rounded-full bg-orange-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg">
                {current.badgeText}
              </span>
            )}

            <h2 className="text-2xl sm:text-4xl font-black font-display leading-tight">
              {current.title}
            </h2>

            {current.description && (
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-lg leading-relaxed font-medium">
                {current.description}
              </p>
            )}

            {current.ctaText && (
              <div className="pt-2">
                <a
                  href={current.targetUrl || current.affiliateUrl || '#'}
                  target={current.affiliateUrl ? '_blank' : '_self'}
                  rel={current.affiliateUrl ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
                >
                  <span>{current.ctaText}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Nav Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous Slide"
          >
            ❮
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next Slide"
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-orange-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
