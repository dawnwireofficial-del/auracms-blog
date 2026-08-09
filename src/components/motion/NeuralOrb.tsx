import React from 'react';
import { motion } from 'motion/react';
import { useMotion } from './MotionProvider';

export type NeuralOrbState = 'idle' | 'listening' | 'processing' | 'answering' | 'error';

interface NeuralOrbProps {
  state?: NeuralOrbState;
  size?: 'compact' | 'medium' | 'large';
  className?: string;
}

export default function NeuralOrb({
  state = 'idle',
  size = 'medium',
  className = '',
}: NeuralOrbProps) {
  const { globalEnabled } = useMotion();

  const dimensions = {
    compact: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-32 h-32 md:w-40 md:h-40',
  }[size];

  if (!globalEnabled) {
    return (
      <div className={`relative ${dimensions} rounded-full bg-gradient-to-br from-[#246BFF] to-cyan-400 ${className}`} />
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${dimensions} ${className}`}>
      {/* Outer Glow / Breathing Layer */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#246BFF]/40 via-cyan-400/30 to-purple-600/40 blur-md"
        animate={{
          scale: state === 'listening' ? [1, 1.25, 1] : state === 'processing' ? [0.95, 1.1, 0.95] : [1, 1.08, 1],
          opacity: state === 'error' ? 0.4 : [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: state === 'processing' ? 1.5 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating Nodes Core for Processing */}
      {state === 'processing' && (
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-400/40 border-t-[#246BFF]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Concentric Waves for Listening */}
      {state === 'listening' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/60"
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-[#246BFF]/60"
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </>
      )}

      {/* Outward Data Pulses for Answering */}
      {state === 'answering' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/40 to-[#246BFF]/40 blur-sm"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/60 animate-pulse" />
      )}

      {/* Main Core Orb */}
      <motion.div
        className="w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-[#0A1F44] via-[#246BFF] to-[#FF8A00] shadow-lg shadow-[#246BFF]/40 flex items-center justify-center relative overflow-hidden"
        animate={{
          scale: state === 'idle' ? [0.95, 1, 0.95] : 1,
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="absolute inset-0 bg-white/20 blur-xs rounded-full translate-x-1 -translate-y-1" />
      </motion.div>
    </div>
  );
}
