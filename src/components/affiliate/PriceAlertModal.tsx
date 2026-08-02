import React, { useState } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';

interface PriceAlertModalProps {
  productId: string;
  currentPrice: number;
  productName: string;
}

type AlertDir = 'price_drop' | 'price_increase';

export default function PriceAlertModal({ productId, currentPrice, productName }: PriceAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [alertType, setAlertType] = useState<AlertDir>('price_drop');
  const [targetPrice, setTargetPrice] = useState<number>(currentPrice * 0.9); // Default to 10% off
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const isIncrease = alertType === 'price_increase';
  const targetValid = isIncrease ? targetPrice > currentPrice : targetPrice > 0 && targetPrice < currentPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !targetValid) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/public/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email, targetPrice, currentPrice, alertType })
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-3 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
        title="Price Alert"
      >
        <Bell className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-brand-secondary/20">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-secondary/10 p-2 rounded-xl">
                <Bell className="h-6 w-6 text-brand-secondary" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Price Alert</h2>
            </div>
            
            {status === 'success' ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">Alert Set Successfully!</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  We'll email {email} if the price {isIncrease ? 'rises to' : 'drops to'} ${targetPrice}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Current price for <strong>{productName}</strong> is ${currentPrice}. We'll email you when it crosses your target.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Alert Me When</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setAlertType('price_drop'); setTargetPrice(currentPrice * 0.9); }}
                      className={`text-xs font-semibold rounded-lg px-3 py-2 border transition-colors ${alertType === 'price_drop' ? 'bg-brand-secondary/15 border-brand-secondary text-brand-secondary' : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                    >
                      Price drops
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAlertType('price_increase'); setTargetPrice(Math.round(currentPrice * 1.1 * 100) / 100); }}
                      className={`text-xs font-semibold rounded-lg px-3 py-2 border transition-colors ${alertType === 'price_increase' ? 'bg-brand-secondary/15 border-brand-secondary text-brand-secondary' : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                    >
                      Price rises
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-sm glass-panel border border-brand-secondary/20 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white/50 dark:bg-zinc-800/50"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    {isIncrease ? 'Target Price Above Which To Notify ($)' : 'Target Price Below Which To Notify ($)'}
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="0.01"
                    step="0.01"
                    value={targetPrice}
                    onChange={e => setTargetPrice(parseFloat(e.target.value))}
                    className="w-full text-sm glass-panel border border-brand-secondary/20 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white/50 dark:bg-zinc-800/50"
                  />
                  {!targetValid && targetPrice > 0 && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {isIncrease ? 'Target must be above the current price.' : 'Target must be below the current price.'}
                    </p>
                  )}
                </div>
                {status === 'error' && <p className="text-xs text-red-500 font-medium">Failed to set alert. Please try again.</p>}
                <button 
                  type="submit" 
                  disabled={status === 'loading' || !targetValid}
                  className="w-full bg-brand-secondary hover:bg-brand-accent text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {status === 'loading' ? 'Setting Alert...' : 'Set Alert'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
