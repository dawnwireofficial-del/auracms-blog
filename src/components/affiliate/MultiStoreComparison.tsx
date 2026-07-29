import React from 'react';
import { ExternalLink, Store } from 'lucide-react';
import { proxyImageUrl } from '../../utils/safeRender';

interface StorePrice {
  storeName: string;
  price: string;
  url: string;
  logo?: string;
}

interface MultiStoreComparisonProps {
  amazonPrice?: string;
  amazonUrl?: string;
  stores?: StorePrice[];
}

export default function MultiStoreComparison({ amazonPrice, amazonUrl, stores }: MultiStoreComparisonProps) {
  if (!stores || stores.length === 0) return null;

  // We want to sort all stores (including Amazon) by price
  const allStores = [...stores];
  if (amazonPrice && amazonUrl) {
    allStores.push({ storeName: 'Amazon', price: amazonPrice, url: amazonUrl });
  }

  const sortedStores = allStores.sort((a, b) => {
    const pA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
    const pB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
    return pA - pB;
  });

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
      <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-3">Compare Prices</h3>
      <div className="space-y-2">
        {sortedStores.map((store, i) => (
          <a
            key={i}
            href={store.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center justify-between p-3 glass-panel rounded-lg hover:border-brand-secondary/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {store.logo ? (
                <img src={proxyImageUrl(store.logo)} alt={store.storeName} className="h-6 w-auto object-contain rounded" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="bg-slate-100 dark:bg-zinc-800 p-1.5 rounded text-slate-400">
                  <Store className="h-4 w-4" />
                </div>
              )}
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-brand-secondary transition-colors">
                {store.storeName}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                ${parseFloat(store.price.replace(/[^0-9.]/g, '') || '0').toFixed(2)}
              </span>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-brand-secondary transition-colors" />
            </div>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">We may earn a commission from these links.</p>
    </div>
  );
}
