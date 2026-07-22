import React from 'react';

interface NoResultsEmptyStateProps {
  query?: string;
  category?: string;
  onReset?: () => void;
  onNavigatePopular?: () => void;
}

export const NoResultsEmptyState: React.FC<NoResultsEmptyStateProps> = ({
  query,
  category,
  onReset,
  onNavigatePopular,
}) => {
  return (
    <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Icon Graphic */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-3xl bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700/80 text-blue-600 dark:text-blue-400 shadow-inner">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m-3-3h6"
          />
        </svg>
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold text-[11px] flex items-center justify-center border-2 border-white dark:border-slate-900">
          ?
        </span>
      </div>

      {/* Text Context */}
      <div className="space-y-2">
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
          No matching products found
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {query ? (
            <>
              We couldn't find any items matching <strong className="text-slate-800 dark:text-slate-200">"{query}"</strong>
              {category && category !== 'all' && (
                <> in <span className="text-blue-600 dark:text-blue-400 capitalize">{category}</span></>
              )}.
            </>
          ) : (
            <>There are no products matching your current category or filter criteria.</>
          )}
        </p>
      </div>

      {/* Suggestions */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 text-left text-xs space-y-2">
        <div className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>💡 Try these search tips:</span>
        </div>
        <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-1 pl-1">
          <li>Check for spelling errors or typos</li>
          <li>Try broader keywords (e.g. "Headphones" instead of "Wireless Noise Canceling")</li>
          <li>Switch category to "All Categories" to search across the entire catalog</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onReset && (
          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset Search & Filters</span>
          </button>
        )}
        {onNavigatePopular && (
          <button
            onClick={onNavigatePopular}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all"
          >
            Browse Popular Tech →
          </button>
        )}
      </div>
    </div>
  );
};

interface EmptyWishlistStateProps {
  onBrowseProducts?: () => void;
}

export const EmptyWishlistState: React.FC<EmptyWishlistStateProps> = ({ onBrowseProducts }) => {
  return (
    <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Heart Illustration */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 border-2 border-dashed border-rose-200 dark:border-rose-900 text-rose-500 shadow-sm">
        <svg className="w-12 h-12 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-md">
          ★
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Your Wishlist is Empty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          You haven't saved any product reviews or Amazon deal alerts yet. Click the <span className="text-rose-500 font-bold">♥ Heart</span> button on any product card to bookmark it for quick access.
        </p>
      </div>

      {/* Features bullet list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center gap-2.5">
          <span className="text-base">🔔</span>
          <div className="text-[11px]">
            <strong className="block text-slate-800 dark:text-slate-200">Price Drop Alerts</strong>
            <span className="text-slate-400">Track historic lows</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center gap-2.5">
          <span className="text-base">⚖️</span>
          <div className="text-[11px]">
            <strong className="block text-slate-800 dark:text-slate-200">Side-by-Side Compare</strong>
            <span className="text-slate-400">Compare specs & ratings</span>
          </div>
        </div>
      </div>

      {/* Call to action */}
      {onBrowseProducts && (
        <button
          onClick={onBrowseProducts}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all"
        >
          Explore Top-Rated Tech Products →
        </button>
      )}
    </div>
  );
};
