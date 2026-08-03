import React from 'react';

interface AmbientGlowProps {
  color?: 'blue' | 'violet' | 'cyan' | 'orange';
  position?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  color = 'blue',
  position = 'center',
  size = 'lg',
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-600/20 via-indigo-600/10 to-transparent',
    violet: 'from-purple-600/20 via-violet-600/10 to-transparent',
    cyan: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    orange: 'from-amber-500/20 via-orange-600/10 to-transparent'
  };

  const positionClasses = {
    'top-left': '-top-20 -left-20',
    'top-right': '-top-20 -right-20',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-left': '-bottom-20 -left-20',
    'bottom-right': '-bottom-20 -right-20'
  };

  const sizeClasses = {
    sm: 'w-64 h-64 blur-2xl',
    md: 'w-96 h-96 blur-3xl',
    lg: 'w-[500px] h-[500px] blur-[100px]',
    xl: 'w-[800px] h-[800px] blur-[140px]'
  };

  return (
    <div
      className={`pointer-events-none absolute rounded-full bg-gradient-radial ${colorClasses[color]} ${positionClasses[position]} ${sizeClasses[size]} ${className}`}
      style={{ willChange: 'transform, opacity' }}
      aria-hidden="true"
    />
  );
};
