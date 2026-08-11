import React from 'react';

export type DwBadgeType =
  | 'best-overall'
  | 'editors-choice'
  | 'best-value'
  | 'trending'
  | 'ai-recommended'
  | 'expert-reviewed'
  | 'popular-deal';

interface DwBadgeProps {
  type: DwBadgeType;
  className?: string;
}

const BADGE_META: Record<DwBadgeType, { icon: string; label: string }> = {
  'best-overall': { icon: '🏆', label: 'DW Best Overall' },
  'editors-choice': { icon: '⭐', label: "Editor's Choice" },
  'best-value': { icon: '💰', label: 'Best Value' },
  'trending': { icon: '🔥', label: 'Trending' },
  'ai-recommended': { icon: '🧠', label: 'AI Recommended' },
  'expert-reviewed': { icon: '✓', label: 'Expert Reviewed' },
  'popular-deal': { icon: '⚡', label: 'Popular Deal' },
};

export const DwBadge: React.FC<DwBadgeProps> = ({ type, className = '' }) => {
  const meta = BADGE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#246BFF] text-white font-black text-[11px] px-2.5 py-1 rounded-lg shadow-md border-l-2 border-[#FF8A00] ${className}`}
    >
      <span className="text-dw-orange">{meta.icon}</span>
      {meta.label}
    </span>
  );
};
