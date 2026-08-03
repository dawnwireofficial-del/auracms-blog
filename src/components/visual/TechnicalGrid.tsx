import React from 'react';

interface TechnicalGridProps {
  opacity?: number;
  patternSize?: number;
  className?: string;
}

export const TechnicalGrid: React.FC<TechnicalGridProps> = ({
  opacity = 0.04,
  patternSize = 40,
  className = ''
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        style={{ opacity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="technical-grid-pattern"
            width={patternSize}
            height={patternSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${patternSize} 0 L 0 0 0 ${patternSize}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-300 dark:text-cyan-400"
            />
            <circle
              cx="0"
              cy="0"
              r="1.5"
              className="fill-blue-500/60 dark:fill-cyan-300/80"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#technical-grid-pattern)" />
      </svg>
    </div>
  );
};
