import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import { Post, SiteSettings } from '../types';
import OptimizedImage from './OptimizedImage';

interface HeroSliderProps {
  posts: Post[];
  settings: SiteSettings | null;
  onNavigate: (route: string, param?: string) => void;
}

const SLIDES = [
  {
    image: '/hero_banner_tech.jpg',
    tagline: 'Top Tech Deals & Expert Reviews',
    title: 'Discover the Best Premium Tech Gear for Your Setup',
    description: 'In-depth reviews, exclusive Amazon deals, and hands-on testing. Find the perfect gear, backed by data-driven recommendations.',
    cta: 'Shop Now',
    ctaLink: 'products',
    secondaryCta: 'Read Reviews',
    secondaryLink: 'explore',
  },
  {
    image: '/hero_banner_setup.jpg',
    tagline: 'Verified Product Recommendations',
    title: 'Every Product Tested. Every Claim Verified.',
    description: 'We spend hundreds of hours testing tech gadgets so you can make confident purchasing decisions and get the best prices on Amazon.',
    cta: 'Explore Deals',
    ctaLink: 'products',
    secondaryCta: 'Learn More',
    secondaryLink: 'about',
  },
  {
    image: '/hero_banner_tech.jpg',
    tagline: 'Exclusive Affiliate Offers',
    title: 'Curated Picks from Experts — Zero Fluff, Maximum Value',
    description: 'Detailed comparisons, honest pros & cons, and exclusive Amazon deals to help you buy smarter and save big.',
    cta: 'Browse Products',
    ctaLink: 'products',
    secondaryCta: 'View Categories',
    secondaryLink: 'services',
  }
];

export default function HeroSlider({ posts, settings, onNavigate }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const featuredPost = posts.find(p => p.isFeatured) || posts[0];

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = SLIDES[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.97 }),
  };

  return (
    <section className="relative h-[90vh] min-h-[600px] max-h-[800px] overflow-hidden" id="hero-slider" aria-roledescription="carousel" aria-label="Featured slides">
      {/* Slide background */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-zinc-950" />
          <OptimizedImage src={slide.image} alt="" className="w-full h-full object-contain relative z-[1]" width={1440} height={800} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/30 to-transparent z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/30 via-transparent to-transparent z-[2]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="max-w-3xl"
          >
            <div className="bg-zinc-950/60 backdrop-blur-md rounded-xl p-6 md:p-8 space-y-5 border border-white/10 shadow-2xl">
              <span className="inline-block bg-[#246BFF]/80 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                {slide.tagline}
              </span>

              <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15]">
                {slide.title}
              </h1>

              <p className="text-white/90 text-sm md:text-base max-w-2xl leading-relaxed font-sans">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => {
                    if (slide.ctaLink === 'explore') document.getElementById('stories-grid')?.scrollIntoView({ behavior: 'smooth' });
                    else if (slide.ctaLink === 'reviews') onNavigate('home');
                    else if (slide.ctaLink === 'services') onNavigate('services');
                    else if (slide.ctaLink === 'products') onNavigate('products');
                  }}
                  className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-amber-500 text-slate-900 dark:text-white font-bold text-sm px-7 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  {slide.cta} <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (slide.secondaryLink === 'contact') onNavigate('contact');
                    else if (slide.secondaryLink === 'about' || slide.secondaryLink === 'services') onNavigate('services');
                  }}
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold text-sm px-7 py-3.5 rounded-lg hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  {slide.secondaryCta}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Featured post card */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden lg:block absolute right-6 bottom-20 w-80"
          >
            <button
              onClick={() => onNavigate('post', featuredPost.slug)}
              className="text-left w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-all group cursor-pointer"
              aria-label={`Read featured article: ${featuredPost.title}`}
            >
              <p className="text-[9px] font-bold text-[#7C3AED] uppercase tracking-widest mb-2">Featured Story</p>
              <p className="text-white font-display font-bold text-sm leading-snug group-hover:text-[#7C3AED] transition-colors">{featuredPost.title}</p>
              <p className="text-white/50 text-[10px] mt-2 flex items-center gap-1">
                Read Article <ChevronRight className="w-3 h-3" />
              </p>
            </button>
          </motion.div>
        )}
      </div>

      {/* Navigation arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer" aria-label="Previous slide">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer" aria-label="Next slide">
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === current ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
          />
        ))}
      </div>

      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50 dark:bg-zinc-950 z-10" style={{ borderRadius: '50% 50% 0 0' }}></div>
    </section>
  );
}
