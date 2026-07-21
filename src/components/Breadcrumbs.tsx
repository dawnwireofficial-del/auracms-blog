import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 ${className}`}>
      <Home className="w-3 h-3" />
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3 h-3 text-slate-500/50 dark:text-zinc-500" />
          {i === items.length - 1 ? (
            <span className="text-slate-800 dark:text-zinc-200 font-medium truncate max-w-[200px]" title={item.label}>
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-[#246BFF] dark:hover:text-white transition-colors truncate max-w-[150px] cursor-pointer"
              title={item.label}
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
