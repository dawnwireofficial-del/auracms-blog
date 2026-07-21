import React from 'react';
import { motion } from 'motion/react';
import { useMotion } from './MotionProvider';

interface WireLoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WireLoader({
  label = 'Loading data stream...',
  size = 'md',
  className = '',
}: WireLoaderProps) {
  const { globalEnabled } = useMotion();

  const height = {
    sm: 'h-12',
    md: 'h-24',
    lg: 'h-40',
  }[size];

  if (!globalEnabled) {
    return (
      <div className={`flex flex-col items-center justify-center py-6 text-slate-400 ${className}`}>
        <div className="w-6 h-6 border-2 border-[#246BFF] border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">{label}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${height} ${className}`}>
      <div className="relative w-48 h-12 flex items-center justify-center">
        {/* Connected Wire Background Line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 dark:bg-zinc-800 rounded-full" />

        {/* Dynamic Traveling Data Pulse */}
        <motion.div
          className="absolute h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent rounded-full shadow-[0_0_10px_#00F0FF]"
          style={{ width: '40px' }}
          animate={{ x: [-80, 80] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* DawnWire Connected Nodes */}
        <div className="relative z-10 flex justify-between w-full px-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-[#246BFF] border-2 border-slate-900 shadow-[0_0_8px_#246BFF]"
              animate={{
                scale: [1, 1.25, 1],
                backgroundColor: ['#246BFF', '#00F0FF', '#246BFF'],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
      {label && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2 font-medium">{label}</p>}
    </div>
  );
}
