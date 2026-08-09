import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const TAGLINES = [
  'Loading insights...',
  'Preparing your experience...',
  'Almost ready...',
  'Gathering the latest...',
  'Just a moment...',
];

export default function LoaderAnimation() {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % TAGLINES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6" id="app-global-loader">
      <div className="text-center space-y-8">
        {/* Animated mascot/logo */}
        <div className="relative h-20 w-20 mx-auto">
          {/* Outer ring with gradient animation */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 80 80" fill="none">
            <defs>
              <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#246BFF" />
                <stop offset="50%" stopColor="#FF8A00" />
                <stop offset="100%" stopColor="#246BFF" />
              </linearGradient>
              <linearGradient id="loader-gradient-reverse" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF8A00" />
                <stop offset="50%" stopColor="#246BFF" />
                <stop offset="100%" stopColor="#FF8A00" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="36" stroke="url(#loader-gradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="180" strokeDashoffset="60" />
            <circle cx="40" cy="40" r="28" stroke="url(#loader-gradient-reverse)" strokeWidth="2" strokeLinecap="round" strokeDasharray="140" strokeDashoffset="100" className="animate-[spin_4s_linear_infinite_reverse]" />
          </svg>

          {/* Center logo with pulse */}
          <div className="absolute inset-2 bg-white dark:bg-zinc-950 rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite] overflow-hidden">
            <img src="/logo/dw-mark.png" alt="DawnWire" className="w-8 h-8 object-contain" draggable={false} />
          </div>
        </div>

        {/* Animated mascot character */}
        <svg className="mx-auto w-16 h-16" viewBox="0 0 64 64" fill="none">
          {/* Robot/mascot head */}
          <circle cx="32" cy="28" r="14" className="animate-[bounce_2s_ease-in-out_infinite]" fill="url(#loader-gradient)" opacity="0.15" />
          <circle cx="32" cy="28" r="12" fill="currentColor" className="text-[#246BFF] dark:text-blue-400" opacity="0.3" />
          {/* Eyes */}
          <circle cx="27" cy="25" r="2" className="fill-white dark:fill-zinc-200 animate-[pulse_2s_ease-in-out_infinite]" />
          <circle cx="37" cy="25" r="2" className="fill-white dark:fill-zinc-200 animate-[pulse_2s_ease-in-out_infinite]" />
          {/* Eye pupils */}
          <circle cx="27" cy="25" r="1" className="fill-slate-900 dark:fill-black" />
          <circle cx="37" cy="25" r="1" className="fill-slate-900 dark:fill-black" />
          {/* Smile */}
          <path d="M26 32 Q32 37 38 32" stroke="currentColor" className="text-[#246BFF] dark:text-blue-300" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Waving hand */}
          <g className="animate-[wave_2s_ease-in-out_infinite] origin-bottom">
            <rect x="44" y="26" width="3" height="8" rx="1.5" className="fill-[#246BFF] dark:fill-blue-400" />
            <circle cx="45.5" cy="25" r="2.5" className="fill-[#246BFF] dark:fill-blue-400" />
          </g>
        </svg>

        {/* Text section */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-slate-800 dark:text-white tracking-tight text-sm">Loading DawnWire</h2>
          {/* Animated tagline */}
          <div className="h-4 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-slate-500 text-[10px] uppercase tracking-wider"
              >
                {TAGLINES[taglineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full animate-[loader-progress_2s_ease-in-out_infinite]" style={{
              background: 'linear-gradient(90deg, #246BFF, #FF8A00, #246BFF)',
              backgroundSize: '200% 100%',
              width: '60%',
              animation: 'loader-progress 2s ease-in-out infinite, gradient-shift 3s linear infinite',
            }} />
          </div>
        </div>

        {/* Subtle background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#246BFF]/20 rounded-full animate-[float_4s_ease-in-out_infinite]" />
          <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-[#FF8A00]/20 rounded-full animate-[float_5s_ease-in-out_infinite]" />
          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-[#246BFF]/20 rounded-full animate-[float_3s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
