import React from 'react';
import { motion } from 'motion/react';
import { useMotion } from './MotionProvider';

interface ComparisonScannerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ComparisonScanner({ children, className = '' }: ComparisonScannerProps) {
  const { globalEnabled } = useMotion();

  if (!globalEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Laser Scanning Line Animation */}
      <motion.div
        className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-[#246BFF] to-transparent z-20 pointer-events-none shadow-[0_0_15px_#246BFF]"
        initial={{ left: '0%' }}
        animate={{ left: ['0%', '100%'] }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      {children}
    </div>
  );
}
