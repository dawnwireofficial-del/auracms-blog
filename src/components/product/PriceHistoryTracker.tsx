import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Product } from '../../types';
import { getProductPriceHistory, createPriceAlert, PricePoint } from '../../lib/priceTrackerService';
import { useAppStore } from '../../lib/store';

interface PriceHistoryTrackerProps {
  product: Product;
}

export const PriceHistoryTracker: React.FC<PriceHistoryTrackerProps> = ({ product }) => {
  const { currentUser } = useAppStore();
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Target price alert modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const currentPrice: number = typeof product.currentPrice === 'number' ? product.currentPrice : parseFloat(String(product.price || '0')) || 100;
  const [targetPrice, setTargetPrice] = useState<number>(Math.round(currentPrice * 0.85));
  const [userEmail, setUserEmail] = useState<string>(currentUser?.email || '');
  const [alertStatus, setAlertStatus] = useState<{ type: 'idle' | 'submitting' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await getProductPriceHistory(product.id, currentPrice);
      setHistory(data);
      setIsLoading(false);
    };
    loadHistory();
  }, [product.id, currentPrice]);

  const prices = history.map(h => h.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : currentPrice;

  const handleSetAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userEmail.includes('@')) {
      setAlertStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (targetPrice >= currentPrice) {
      setAlertStatus({ type: 'error', message: 'Target price must be lower than the current price.' });
      return;
    }

    setAlertStatus({ type: 'submitting', message: 'Registering price drop monitor...' });

    const result = await createPriceAlert({
      userId: currentUser?.uid || 'guest-user',
      userEmail,
      productId: product.id,
      productTitle: product.title,
      targetPrice: Number(targetPrice),
      initialPrice: currentPrice
    });

    setAlertStatus({ type: 'success', message: result.message });
    setTimeout(() => {
      setIsAlertModalOpen(false);
      setAlertStatus({ type: 'idle', message: '' });
    }, 2800);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📉</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              6-Month Price History & Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historical Amazon price tracking data for {product.title}
          </p>
        </div>

        <button
          onClick={() => setIsAlertModalOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 self-start sm:self-center"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          <span>Set Target Price Alert</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Price</span>
          <span className="text-base font-black text-slate-900 dark:text-slate-100">${currentPrice.toFixed(2)}</span>
        </div>
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">All-Time Low</span>
          <span className="text-base font-black text-emerald-700 dark:text-emerald-300">${minPrice.toFixed(2)}</span>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">6-Month High</span>
          <span className="text-base font-black text-slate-900 dark:text-slate-100">${maxPrice.toFixed(2)}</span>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">6-Month Average</span>
          <span className="text-base font-black text-slate-900 dark:text-slate-100">${avgPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-60 w-full pt-2">
        {isLoading ? (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Amazon Price']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Price Alert Modal */}
      <AnimatePresence>
        {isAlertModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔔</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Set Price Drop Notification
                  </h3>
                </div>
                <button
                  onClick={() => setIsAlertModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                We continuously scan Amazon US price updates. Enter your target price and email to get notified instantly.
              </p>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs flex justify-between items-center">
                <span className="text-slate-500">Current Amazon Price:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">${currentPrice.toFixed(2)}</span>
              </div>

              {/* Preset buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.9, 0.8, 0.7].map((pct) => {
                    const priceVal = Math.round(currentPrice * pct);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTargetPrice(priceVal)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          targetPrice === priceVal
                            ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        -{Math.round((1 - pct) * 100)}% (${priceVal})
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSetAlertSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Target Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                {alertStatus.message && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    alertStatus.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : alertStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {alertStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={alertStatus.type === 'submitting'}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {alertStatus.type === 'submitting' ? 'Activating Alert...' : 'Activate Email Alert'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
