import React, { useState, useEffect } from 'react';
import { Clock, Flame, Tag, Zap } from 'lucide-react';
import { ProductReview } from '../../types';
import DealEnergyStream from '../motion/DealEnergyStream';

interface DealCardProps {
  product: ProductReview & { deal?: { salePrice: number; regularPrice: number; discountPercentage: number; endDate: string; dealType: string } };
}

function Countdown({ endDate }: { endDate: string }) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return setTime('Expired');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return <span className="text-[10px] font-mono font-bold text-red-500">{time}</span>;
}

export default function DealCard({ product }: DealCardProps) {
  const deal = (product as any).deal;
  const salePrice = deal?.salePrice || parseFloat(String(product.price || product.currentPrice || '0'));
  const regularPrice = deal?.regularPrice || parseFloat(String(product.originalPrice || product.referencePrice || '0'));
  const rawDiscount = regularPrice > salePrice ? Math.round((1 - salePrice / regularPrice) * 100) : 0;
  const discount = deal?.discountPercentage || (rawDiscount > 0 && rawDiscount <= 40 ? rawDiscount : 0);
  const endDate = deal?.endDate;
  const isFlash = deal?.dealType === 'flash';

  const handleClick = () => {
    fetch('/api/public/track/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id, pageUrl: window.location.pathname, pageType: 'deal',
        ctaPosition: 'deal_card', deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        sessionId: localStorage.getItem('sessionId'),
      }),
    }).catch(() => {});
  };

  return (
    <div className={`relative glass-panel rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden group border ${isFlash ? 'border-red-500/50' : 'border-brand-secondary/20 hover:border-brand-secondary/40'}`}>
      <DealEnergyStream />
      {/* Deal type badge */}
      <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${isFlash ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
        {isFlash ? <Zap className="h-2.5 w-2.5" /> : <Tag className="h-2.5 w-2.5" />}
        {isFlash ? 'Flash Deal' : discount > 0 ? `-${discount}%` : 'Deal'}
      </div>
      {/* Image */}
      <div className="aspect-square bg-white/5 flex items-center justify-center relative overflow-hidden">
        {product.productImage ? (
          <img src={product.productImage} alt={product.productName} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-zinc-600"><Flame className="h-10 w-10" /></div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-brand-secondary uppercase">{product.brand}</p>
        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 mt-0.5 line-clamp-2 leading-tight">{product.productName}</p>
        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-red-600">${salePrice.toFixed(2)}</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500 line-through">${regularPrice.toFixed(2)}</span>
        </div>
        {/* Countdown */}
        {endDate && (
          <div className="flex items-center gap-1 mt-1.5 text-amber-600">
            <Clock className="h-3 w-3" />
            <Countdown endDate={endDate} />
          </div>
        )}
        {/* CTA */}
        <a
          href={product.affiliateUrl || '#'}
          target="_blank" rel="sponsored noopener noreferrer"
          onClick={handleClick}
          className={`mt-3 block text-center text-white text-[10px] font-bold py-2.5 rounded-lg transition-all hover:-translate-y-0.5 ${isFlash ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-brand-secondary hover:bg-brand-accent shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:shadow-[0_0_20px_rgba(0,210,255,0.5)]'}`}
        >
          {isFlash ? 'Grab Deal →' : product.ctaText || 'View Deal'}
        </a>
      </div>
    </div>
  );
}
