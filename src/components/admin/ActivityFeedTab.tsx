import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchRecentActivityEvents, ActivityEvent } from '../../lib/activityTracker';

export const ActivityFeedTab: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFeed = async () => {
    setIsRefreshing(true);
    const data = await fetchRecentActivityEvents(50);
    setEvents(data);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const getEventBadge = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'PRODUCT_SEARCH':
        return { icon: '🔍', title: 'Search', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'WISHLIST_ADD':
        return { icon: '❤️', title: 'Wishlist', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'AFFILIATE_CLICK':
        return { icon: '🛒', title: 'Outbound CTA', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'PRICE_ALERT_CREATED':
        return { icon: '🔔', title: 'Price Alert', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { icon: '👀', title: 'Interaction', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  // Derive Insights
  const searchEvents = events.filter(e => e.type === 'PRODUCT_SEARCH');
  const wishlistEvents = events.filter(e => e.type === 'WISHLIST_ADD');
  const clickEvents = events.filter(e => e.type === 'AFFILIATE_CLICK');
  const alertEvents = events.filter(e => e.type === 'PRICE_ALERT_CREATED');

  return (
    <div className="space-y-8">
      {/* Top Banner & Insight Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚡ Real-Time Admin Activity Feed & User Insights</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live stream of customer searches, wishlist additions, price alert setups, and Amazon affiliate clicks.
          </p>
        </div>

        <button
          onClick={loadFeed}
          disabled={isRefreshing}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-all self-start sm:self-center flex items-center gap-2 disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isRefreshing ? 'Refreshing Feed...' : 'Refresh Activity Feed'}</span>
        </button>
      </div>

      {/* Actionable Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase">Product Searches</span>
            <span className="text-base">🔍</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{searchEvents.length}</div>
          <span className="text-[10px] text-blue-500 font-bold">Search Intent Active</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase">Wishlist Additions</span>
            <span className="text-base">❤️</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{wishlistEvents.length}</div>
          <span className="text-[10px] text-rose-500 font-bold">High Buyer Interest</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase">Affiliate Outbound Clicks</span>
            <span className="text-base">🛒</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{clickEvents.length}</div>
          <span className="text-[10px] text-emerald-500 font-bold">Monetization Conversion</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-black uppercase">Target Price Alerts</span>
            <span className="text-base">🔔</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{alertEvents.length}</div>
          <span className="text-[10px] text-amber-500 font-bold">Price Sensitivity Monitor</span>
        </div>
      </div>

      {/* Main Stream List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live User Stream Log ({events.length} Events)
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No activity logged yet. Perform searches, wishlist additions, or click affiliate buttons to see live events.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt, idx) => {
              const badge = getEventBadge(evt.type);
              const formattedTime = new Date(evt.timestamp).toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                month: 'short',
                day: 'numeric'
              });

              return (
                <motion.div
                  key={evt.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
                      {badge.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          {badge.title}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          {evt.productTitle || evt.details}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {evt.details} • <span className="font-semibold text-slate-600 dark:text-slate-300">{evt.userEmail || 'anonymous'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 self-end sm:self-center">
                    {formattedTime}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
