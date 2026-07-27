import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  if (!items.length) return null;
  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 mb-4 overflow-x-auto whitespace-nowrap">
      <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0">
        <Home className="w-3.5 h-3.5" />
      </a>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3 h-3 shrink-0 text-slate-300 dark:text-zinc-600" />
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-slate-600 dark:text-zinc-300 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
