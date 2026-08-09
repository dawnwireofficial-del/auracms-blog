import React from 'react';

interface GradientDividerProps {
  variant?: 'blue' | 'cyan-blue' | 'blue-orange' | 'subtle';
  className?: string;
}

export const GradientDivider: React.FC<GradientDividerProps> = ({
  variant = 'blue',
  className = ''
}) => {
  const gradientClasses = {
    'blue': 'from-transparent via-blue-500/40 to-transparent',
    'cyan-blue': 'from-transparent via-cyan-400/40 to-transparent',
    'blue-orange': 'from-transparent via-dw-blue/50 to-transparent',
    'subtle': 'from-transparent via-slate-700/50 to-transparent'
  };

  return (
    <div
      className={`relative w-full h-[1px] bg-gradient-to-r ${gradientClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};
