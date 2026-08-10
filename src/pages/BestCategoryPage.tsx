import React, { useMemo } from 'react';
import { useAppStore } from '../lib/store';
import { Product } from '../types';
import { AffiliateCTA } from '../components/common/AffiliateCTA';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { proxyImageUrl } from '../utils/safeRender';

interface BestCategoryPageProps {
  categorySlug: string;
}

function toPrice(v: any): number {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export const BestCategoryPage: React.FC<BestCategoryPageProps> = ({ categorySlug }) => {
  const { products, categories } = useAppStore();

  const category = categorySlug === 'all' ? undefined : categories.find((c) => c.slug === categorySlug);
  const displayName = category?.name || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Roundup hub: index of all active categories
  if (categorySlug === 'all' || !category) {
    const activeCats = categories.filter((c: any) => c.status === 'active');
    const withProducts = activeCats
      .map((c) => ({
        cat: c,
        count: products.filter((p: any) => (p.categoryId === c.id || p.category === c.name)).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
        <DisclosureBanner />
        <div className="bg-gradient-to-br from-[#0A1F44] via-[#12307a] to-[#1a3f9e] text-white">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">DawnWire Roundups</p>
            <h1 className="text-3xl sm:text-5xl font-black">Best-of Category Rankings</h1>
            <p className="text-blue-200 text-sm sm:text-base mt-3 max-w-2xl">Expert-ranked best products across every category we cover.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-10">
          {withProducts.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-16">No ranked categories yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {withProducts.map(({ cat, count }) => (
                <a
                  key={cat.id}
                  href={`/best/${cat.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="text-3xl mb-3">🏆</div>
                  <h2 className="text-lg font-extrabold group-hover:text-blue-600 dark:group-hover:text-blue-400">Best {cat.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{count} products ranked</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-blue-600 dark:text-blue-400">View ranking →</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const list = useMemo(() => {
    const catId = category?.id;
    const candidates = products.filter((p: Product) => {
      const c = (p as any).category || p.mainCategory || '';
      const catMatch = catId ? (p as any).categoryId === catId || c === category?.name || String(c).toLowerCase().includes(categorySlug.replace(/-/g, ' ')) : true;
      return catMatch && p.published !== false;
    });
    const scored = candidates.map((p: Product) => ({
      ...p,
      score: toPrice(p.editorScore) || (toPrice(p.rating) * 2) || 0,
    }));
    return scored.sort((a: any, b: any) => b.score - a.score).slice(0, 10);
  }, [products, category, categorySlug]);

  if (!list.length) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Best {displayName}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">No products in this category yet. Check back soon.</p>
        <a href="/products" className="inline-block mt-6 text-blue-600 dark:text-blue-400 font-bold text-sm">Browse all products</a>
      </div>
    );
  }

  const winner = list[0];
  const bestValue = [...list].sort((a: any, b: any) => {
    const av = toPrice(a.currentPrice) || 0, bv = toPrice(b.currentPrice) || 0;
    const ascore = av ? (toPrice(a.editorScore) || toPrice(a.rating) * 2) / av : 0;
    const bscore = bv ? (toPrice(b.editorScore) || toPrice(b.rating) * 2) / bv : 0;
    return bscore - ascore;
  })[0];
  const topRated = [...list].sort((a: any, b: any) => (toPrice(b.rating) || 0) - (toPrice(a.rating) || 0))[0];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <DisclosureBanner />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `Best ${displayName}`,
            itemListElement: list.map((p: any, i: number) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.title,
              url: `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${p.slug}`,
            })),
          }),
        }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1F44] via-[#12307a] to-[#1a3f9e] text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-18">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">DawnWire Roundup · {list.length} tested products</p>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">Best {displayName}</h1>
          <p className="text-blue-200 text-sm sm:text-base mt-3 max-w-2xl">
            We compared the top {displayName.toLowerCase()} products on the market using verified ratings, prices and hands-on analysis to find the winners.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10 space-y-12">
        {/* Winner Podium */}
        <section>
          <h2 className="text-2xl font-extrabold flex items-center gap-2 mb-4">🏆 Our #1 Pick: {winner.title}</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-400/70 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex justify-center">
                {winner.images?.[0] || (winner as any).product_image ? (
                  <img src={proxyImageUrl(winner.images?.[0] || (winner as any).product_image)} alt={winner.title} className="max-h-56 object-contain rounded-2xl" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-56 h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-6xl">🏆</div>
                )}
              </div>
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider">Editor's Choice</span>
                  {winner.brand && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{winner.brand}</span>}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold">{winner.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                  {winner.shortDescription || winner.fullDescription || (winner as any).reviewSummary || ''}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-3xl font-black text-amazon-orange">
                    {toPrice(winner.currentPrice) ? `$${toPrice(winner.currentPrice).toFixed(2)}` : 'Check Price'}
                  </span>
                  {toPrice(winner.referencePrice) > toPrice(winner.currentPrice) && (
                    <span className="text-sm line-through text-slate-400">${toPrice(winner.referencePrice).toFixed(2)}</span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#0A1F44] text-amber-400 px-3 py-1.5 rounded-xl">
                    ★ {toPrice(winner.editorScore) || (toPrice(winner.rating) * 2) || '—'} / 10
                  </span>
                  {toPrice(winner.rating) > 0 && <span className="text-xs font-bold text-slate-500 dark:text-slate-400">★ {toPrice(winner.rating)} ({toPrice(winner.reviewCount)} reviews)</span>}
                </div>
                <AffiliateCTA
                  affiliateUrl={winner.affiliateUrl}
                  productId={winner.id}
                  asin={winner.asin}
                  productTitle={winner.title}
                  productSlug={winner.slug}
                  variant="deal"
                  size="lg"
                  label="Buy Now — Check Price on Amazon"
                  position="roundup_winner"
                  category={displayName}
                  brand={winner.brand}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Other winners row */}
        {list.length > 1 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {list.slice(1, 3).map((p: any, idx: number) => {
              const label = p.id === topRated?.id ? '⭐ Top Rated' : p.id === bestValue?.id ? '💰 Best Value' : idx === 0 ? '🥈 Runner Up' : '🥉 Also Great';
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-wider">{label}</span>
                    {toPrice(p.rating) > 0 && <span className="text-xs font-bold text-amber-500">★ {toPrice(p.rating)}</span>}
                  </div>
                  <h3 className="font-extrabold line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 flex-1">
                    {p.shortDescription || p.fullDescription || ''}
                  </p>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-2xl font-black text-amazon-orange">
                      {toPrice(p.currentPrice) ? `$${toPrice(p.currentPrice).toFixed(2)}` : 'Check Price'}
                    </span>
                    {toPrice(p.referencePrice) > toPrice(p.currentPrice) && (
                      <span className="text-sm line-through text-slate-400">${toPrice(p.referencePrice).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <AffiliateCTA
                      affiliateUrl={p.affiliateUrl}
                      productId={p.id}
                      asin={p.asin}
                      productTitle={p.title}
                      productSlug={p.slug}
                      variant="outline"
                      label="Check Price on Amazon"
                      position="roundup_card"
                      category={displayName}
                      brand={p.brand}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Full comparison table */}
        {list.length > 1 && (
          <section>
            <h2 className="text-2xl font-extrabold mb-4">📊 Full Comparison</h2>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 text-right">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p: any, idx: number) => (
                      <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx < 3 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <a href={`/products/${p.slug}`} className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1 max-w-[240px] block">{p.title}</a>
                        </td>
                        <td className="px-4 py-3 font-black text-amber-600 dark:text-amber-400">
                          {toPrice(p.editorScore) || (toPrice(p.rating) * 2) || '—'}
                        </td>
                        <td className="px-4 py-3">{toPrice(p.rating) ? `★ ${toPrice(p.rating)}` : '—'}</td>
                        <td className="px-4 py-3 font-bold">
                          {toPrice(p.currentPrice) ? `$${toPrice(p.currentPrice).toFixed(2)}` : 'Check'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-2 justify-end">
                            {(p as any).bestFor && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">{p.bestFor}</span>}
                            <a href={`/products/${p.slug}`} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0">Review →</a>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
