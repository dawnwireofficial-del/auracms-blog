import React from 'react';
import { motion } from 'motion/react';
import { useMotion } from './MotionProvider';

export type SearchPulseState = 'idle' | 'focused' | 'typing' | 'searching' | 'success' | 'no_results';

interface SearchPulseProps {
  state: SearchPulseState;
  children: React.ReactNode;
  className?: string;
}

export default function SearchPulse({ state, children, className = '' }: SearchPulseProps) {
  const { globalEnabled } = useMotion();

  if (!globalEnabled) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Background Animated Border / Pulse Glow */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl pointer-events-none z-0 overflow-hidden"
        initial={false}
        animate={{
          opacity: state === 'idle' ? 0.3 : 0.9,
        }}
      >
        {/* Focused & Cyan signal */}
        {state === 'focused' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-[#246BFF] to-cyan-500 rounded-2xl"
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 100%' }}
          />
        )}

        {/* Searching Progress Signal */}
        {state === 'searching' && (
          <motion.div
            className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm"
            animate={{
              x: ['-100%', '300%'],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Success Confirmation Pulse */}
        {state === 'success' && (
          <motion.div
            className="absolute inset-0 bg-emerald-500/30 rounded-2xl"
            initial={{ scale: 0.9, opacity: 1 }}
            animate={{ scale: 1.03, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* Discovery Scan Animation for No Results */}
        {state === 'no_results' && (
          <motion.div
            className="absolute inset-0 bg-amber-500/20 rounded-2xl border border-amber-500/50"
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Subtle Idle Border Highlight */}
        {state === 'idle' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </motion.div>

      {/* Input container children */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
