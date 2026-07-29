import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { toast } from '../../lib/toastStore';
import { proxyImageUrl } from '../../utils/safeRender';

interface PriceAlertModalProps {
  product: Product;
  onClose: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ product, onClose }) => {
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState<number>(
    product.currentPrice ? Math.floor(product.currentPrice * 0.9) : 100
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Save locally
      const existingAlerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
      existingAlerts.push({
        productId: product.id,
        productTitle: product.title,
        email,
        targetPrice,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('priceAlerts', JSON.stringify(existingAlerts));

      toast.success(`Price alert set for ${product.title}! We will email ${email} when price drops below $${targetPrice}.`);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
              Set Price Drop Alert
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Never miss a deal on this Amazon product.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <img
            src={proxyImageUrl(product.images[0])}
            alt=""
            className="w-12 h-12 object-contain bg-white dark:bg-slate-900 p-1 rounded-xl"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {product.title}
            </p>
            <p className="text-xs text-slate-500">
              Current Price:{' '}
              <span className="font-black text-slate-900 dark:text-slate-100">
                ${Number(product.currentPrice).toFixed(2) || 'N/A'}
              </span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">
              Your Notification Email
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">
              Target Alert Price ($ USD)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={targetPrice}
              onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-black text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Suggested: 10% below current price (${(Number(product.currentPrice) ? Number(product.currentPrice) * 0.9 : 0).toFixed(2)})
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : '🔔 Activate Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
