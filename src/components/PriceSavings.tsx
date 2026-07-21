import React from 'react';
import { TrendingDown, DollarSign, Award } from 'lucide-react';

interface PriceSource {
  retailer: string;
  price: string;
  url: string;
  inStock: boolean;
}

interface PriceSavingsProps {
  productName: string;
  price: string;
  priceSources?: PriceSource[];
  affiliateUrl?: string;
}

function parsePrice(p: string): number {
  const cleaned = p.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

export default function PriceSavings({ productName, price, priceSources, affiliateUrl }: PriceSavingsProps) {
  const basePrice = parsePrice(price);
  const sources = priceSources || [];

  if (sources.length < 2 && !affiliateUrl) return null;

  const sorted = [...sources].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  const bestPrice = sorted[0];
  const savings = bestPrice ? basePrice - parsePrice(bestPrice.price) : 0;

  return (
    <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl p-4 md:p-5 my-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-4 w-4 text-green-500" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Best Price Comparison</span>
      </div>

      {savings > 0 && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl p-3 md:p-4 mb-4 flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-700 dark:text-green-300">
              Save {savings >= 1 ? `$${savings.toFixed(0)}` : `$${savings.toFixed(2)}`} — Best deal available
            </p>
            <p className="text-[10px] text-green-600/70 dark:text-green-400/70">
              Lowest price found across {sources.length} retailer{sources.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-2">
          {sorted.map((s, i) => {
            const isBest = i === 0 && savings > 0;
            return (
              <a
                key={s.retailer}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isBest
                    ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 hover:bg-green-100 dark:hover:bg-green-950/30'
                    : 'bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 hover:bg-slate-50/80 dark:hover:bg-zinc-800'
                }`}
                aria-label={`View ${productName} at ${s.retailer} — ${s.price}${!s.inStock ? ' (out of stock)' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className={`h-3.5 w-3.5 ${isBest ? 'text-green-500' : 'text-slate-500'}`} />
                  <span className="font-semibold text-slate-800 dark:text-white text-xs">{s.retailer}</span>
                  {!s.inStock && (
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">Out of stock</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isBest ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                    {s.price}
                  </span>
                  {isBest && (
                    <span className="text-[8px] font-bold uppercase tracking-widest bg-green-500 text-white px-1.5 py-0.5 rounded">Best</span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {affiliateUrl && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700/60">
          <p className="text-[9px] text-slate-500 dark:text-zinc-500 text-center">
            Prices may vary. We may earn a commission on purchases made through our links.
          </p>
        </div>
      )}
    </div>
  );
}
