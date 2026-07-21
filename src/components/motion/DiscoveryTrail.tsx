import React from 'react';
import { motion } from 'motion/react';
import { useMotion } from './MotionProvider';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

interface DiscoveryTrailProps {
  currentProductTitle: string;
  categoryName?: string;
  similarProductsCount?: number;
  onNavigate: (route: string, param?: string) => void;
  className?: string;
}

export default function DiscoveryTrail({
  currentProductTitle,
  categoryName = 'Technology',
  similarProductsCount = 5,
  onNavigate,
  className = '',
}: DiscoveryTrailProps) {
  const { globalEnabled } = useMotion();

  return (
    <div className={`relative p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden ${className}`}>
      {/* Background Pulse Glow */}
      {globalEnabled && (
        <motion.div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[#246BFF]/20 to-cyan-500/20 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Discovery Trail Network
        </div>

        <h4 className="font-display font-bold text-lg text-white">
          Interconnected Products & Guides
        </h4>

        {/* Visual Node Graph Path */}
        <div className="flex flex-wrap items-center gap-3 py-2 text-xs">
          <span className="bg-[#246BFF]/20 text-[#246BFF] border border-[#246BFF]/40 px-3 py-1.5 rounded-lg font-bold truncate max-w-[150px]">
            {currentProductTitle}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <button
            onClick={() => onNavigate('categories')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            {categoryName}
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg font-bold">
            {similarProductsCount} Similar Alternatives
          </span>
        </div>
      </div>
    </div>
  );
}
