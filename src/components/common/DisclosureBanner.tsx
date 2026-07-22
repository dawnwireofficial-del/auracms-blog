import React from 'react';

export const DisclosureBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Affiliate Disclosure:</span> DawnWire is a reader-supported discovery platform. When you buy through links on our site, we may earn an Amazon affiliate commission at no extra cost to you.
      </p>
    );
  }

  return (
    <div className="w-full bg-slate-100/80 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700/60 py-2.5 px-4 text-xs text-slate-600 dark:text-slate-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>DawnWire Editorial Transparency:</strong> Products are independently evaluated by our research team. Clicking "Check Price on Amazon" redirects to Amazon where you complete purchases securely.
          </span>
        </div>
        <a href="/affiliate-disclosure" className="underline hover:text-blue-600 dark:hover:text-blue-400 shrink-0 font-medium">
          Learn More
        </a>
      </div>
    </div>
  );
};
