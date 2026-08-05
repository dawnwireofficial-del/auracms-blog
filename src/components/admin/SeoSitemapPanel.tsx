import React, { useEffect, useState } from 'react';
import { OpenGraphAuditTool } from './OpenGraphAuditTool';
import { SeoHealthProgressChart } from './SeoHealthProgressChart';

export default function SeoSitemapPanel({ token }: { token: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/seo/product-reviews?limit=1000', { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
        setProducts(items.map((p: any) => ({
          id: p.id,
          title: p.product_name || p.title || 'Product',
          slug: p.slug || p.id,
          asin: p.asin || p.specs?.asin || '',
          brand: p.brand || '',
          seoTitle: p.seo_title || p.seoTitle || '',
          metaDescription: p.seo_description || p.short_description || p.review_summary || '',
          metaKeywords: p.seo_keywords || [],
          mainCategory: p.category_id || '',
        })));
      } catch { /* best effort */ }
    })();
  }, [token]);

  const handleGenerateSitemap = () => {
    const urls = [
      'https://dawnwire.com/',
      'https://dawnwire.com/products',
      'https://dawnwire.com/deals',
      'https://dawnwire.com/reviews',
      'https://dawnwire.com/guides',
      'https://dawnwire.com/best',
      ...products.map((p: any) => `https://dawnwire.com/products/${p.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n')}
</urlset>`;
    const dataStr = 'data:text/xml;charset=utf-8,' + encodeURIComponent(xml);
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'sitemap.xml');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMsg(`Generated sitemap with ${urls.length} URLs.`);
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Search Engine Optimization & Sitemap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Open Graph audit, SEO health, XML sitemap generation, and AI meta tools.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleGenerateSitemap} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5">
            Generate XML Sitemap
          </button>
          <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl text-xs shadow">
            View Live Sitemap
          </a>
          <a href="/robots.txt" target="_blank" rel="noreferrer" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-xl text-xs shadow">
            robots.txt
          </a>
        </div>
      </div>

      {msg && <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold">{msg}</div>}

      <OpenGraphAuditTool products={products} />
      <SeoHealthProgressChart products={products} />

      <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <strong>Need AI meta generation?</strong> Use the <strong>SEO Engine</strong> tab for the full AI optimizer, per-product meta generation, bulk SEO, and keyword insights.
      </div>
    </div>
  );
}
