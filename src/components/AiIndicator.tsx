import React from 'react';

interface AiIndicatorProps {
  status?: 'idle' | 'thinking' | 'speaking';
}

export default function AiIndicator({ status = 'idle' }: AiIndicatorProps) {
  return (
    <div className="relative flex items-center justify-center w-12 h-12 rounded-full glass-effect">
      {/* Outer Glow */}
      <div 
        className={`absolute inset-0 rounded-full transition-opacity duration-500 ${
          status === 'thinking' ? 'animate-glow-pulse opacity-100' : 'opacity-0'
        }`}
        style={{ boxShadow: '0 0 15px rgba(0,210,255,0.6)' }}
      />
      
      {/* Core Orb */}
      <div 
        className={`w-6 h-6 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent transition-transform duration-700 ${
          status === 'thinking' ? 'scale-110' : 'scale-100'
        }`}
      />
      
      {/* Pulse Rings */}
      {status === 'speaking' && (
        <>
          <div className="absolute inset-0 rounded-full border border-brand-secondary animate-ping opacity-75" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full border border-brand-accent animate-ping opacity-50" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }} />
        </>
      )}
    </div>
  );
}
