import React from 'react';
import { useReducedMotion } from './useReducedMotion';

interface CategoryOrbProps {
  label: string;
  iconUrl?: string;
  href: string;
  color?: string;
  delay?: number;
}

export default function CategoryOrb({
  label,
  iconUrl,
  href,
  color = '#00d2ff',
  delay = 0
}: CategoryOrbProps) {
  const prefersReducedMotion = useReducedMotion();
  const animationStyle = prefersReducedMotion 
    ? {} 
    : { animation: `float 6s ease-in-out infinite`, animationDelay: `${delay}s` };

  return (
    <a 
      href={href}
      className="group flex flex-col items-center gap-3 no-underline transition-transform hover:scale-105"
      style={animationStyle}
    >
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01))`,
          boxShadow: `0 8px 32px 0 rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.1)`,
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Glow effect on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
          style={{ boxShadow: `inset 0 0 20px ${color}` }}
        />
        
        {iconUrl ? (
          <img src={iconUrl} alt={label} className="w-10 h-10 object-contain z-10 drop-shadow-lg" loading="lazy" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-accent z-10" />
        )}
      </div>
      <span className="font-display font-medium text-sm text-center text-heading dark:text-gray-200">
        {label}
      </span>
    </a>
  );
}
