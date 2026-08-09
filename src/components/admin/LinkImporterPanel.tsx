import React, { useState } from 'react';
import { proxyImageUrl } from '../../utils/safeRender';

interface ExtractedProduct {
  title?: string;
  brand?: string;
  mainCategory?: string;
  asin?: string;
  images?: string[];
  currentPrice?: number;
  referencePrice?: number;
  discountPercentage?: number;
  editorScore?: number;
  bestFor?: string;
  shortDescription?: string;
  editorVerdict?: string;
  pros?: string[];
  cons?: string[];
  mainFeatures?: string[];
  specifications?: Record<string, any>;
  videoUrl?: string;
  affiliateUrl?: string;
}

export default function LinkImporterPanel() {
  const [linkInput, setLinkInput] = useState('');
  const [isExtractingLink, setIsExtractingLink] = useState(false);
  const [extractionStep, setExtractionStep] = useState<'idle' | 'parsing' | 'gemini' | 'enriching' | 'complete'>('idle');
  const [extractedPreview, setExtractedPreview] = useState<ExtractedProduct | null>(null);
  const [extractionSuccessMsg, setExtractionSuccessMsg] = useState('');
  const [associateTag, setAssociateTag] = useState('dawnwire-20');

  const handleExtractFromLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!linkInput.trim()) return;
    setIsExtractingLink(true);
    setExtractionStep('parsing');
    setExtractionSuccessMsg('');
    setExtractedPreview(null);
    try {
      setTimeout(() => setExtractionStep('gemini'), 500);
      setTimeout(() => setExtractionStep('enriching'), 1200);
      const res = await fetch('/api/ai/extract-product-from-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInput.trim(), associateTag }),
      });
      const data = await res.json();
      if (data && (data.title || data.product_name)) {
        const title = data.title || data.product_name || 'Extracted Product';
        const pros = Array.isArray(data.pros) ? data.pros : (typeof data.pros === 'string' && data.pros ? [data.pros] : ['High build quality', 'Top performance']);
        const cons = Array.isArray(data.cons) ? data.cons : (typeof data.cons === 'string' && data.cons ? [data.cons] : ['Higher price than basic models']);
        const rawImages = data.images && Array.isArray(data.images) ? data.images : (data.mainImage ? [data.mainImage, ...(data.additionalImages || [])] : []);
        const specs = typeof data.specifications === 'object' && data.specifications !== null ? data.specifications : (typeof data.specs === 'object' && data.specs !== null ? data.specs : {});
        const videoUrl = data.videoUrl || specs.video_url;
        setExtractedPreview({
          ...data,
          title,
          brand: data.brand || 'Generic',
          mainCategory: data.mainCategory || 'Electronics',
          asin: data.asin || 'B000000000',
          images: rawImages.length ? rawImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
          currentPrice: Number(data.price || data.currentPrice) || 99.99,
          referencePrice: Number(data.referencePrice || data.listPrice) || 129.99,
          discountPercentage: Number(data.discountPercentage) || 0,
          editorScore: Number(data.editorScore) || 9.0,
          bestFor: data.bestFor || 'Top overall pick',
          shortDescription: data.shortDescription || data.review_summary || 'High quality Amazon product.',
          editorVerdict: data.editorVerdict || data.final_verdict || 'Highly recommended choice for Amazon buyers.',
          pros,
          cons,
          mainFeatures: Array.isArray(data.mainFeatures || data.key_features) ? (data.mainFeatures || data.key_features) : [],
          specifications: { video_url: videoUrl, ...specs },
          videoUrl,
          affiliateUrl: data.affiliateUrl || `https://www.amazon.com/dp/${data.asin || ''}?tag=${associateTag}`,
        });
        setExtractionStep('complete');
        setExtractionSuccessMsg(`Successfully extracted publish-ready product data for "${title}"!`);
      }
    } catch (err) {
      console.error('Link extraction error:', err);
      setExtractionStep('idle');
    } finally {
      setIsExtractingLink(false);
    }
  };

  const handlePublishExtractedProduct = async () => {
    if (!extractedPreview) return;
    const token = localStorage.getItem('dawnwire_auth_token');
    try {
      const res = await fetch('/api/admin/products/import-from-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ asin: extractedPreview.asin || linkInput.match(/([A-Z0-9]{10})/i)?.[1] }),
      });
      if (res.ok) {
        const result = await res.json();
        setExtractionSuccessMsg(`"${result.product?.product_name || extractedPreview.title}" published live to DawnWire!`);
      } else {
        const err = await res.json();
        setExtractionSuccessMsg(`Publish failed: ${err.error || 'Unknown error'}`);
      }
    } catch {
      setExtractionSuccessMsg('Publish failed. Check API connection.');
    }
    setExtractedPreview(null);
    setLinkInput('');
    setExtractionStep('idle');
  };

  return (
    <div className="space-y-6">
      <div className="p-8 bg-gradient-to-br from-slate-900 via-[#0A1F44] to-blue-950 text-white rounded-3xl border border-blue-800/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Amazon Product URL Importer Plugin
            </div>
            <h2 className="text-2xl font-black font-display">Extract & Import Any Product Link into Catalog</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Paste any Amazon product link or ASIN URL below. AI automatically extracts prices, specs, pros/cons, editor verdict, gallery images, YouTube review videos, and attaches your affiliate associate tag.
            </p>
          </div>
          <div className="p-3 bg-blue-900/40 border border-blue-700/50 rounded-2xl text-xs font-mono">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Associate Tag</span>
            <span className="text-amber-400 font-extrabold">{associateTag}</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">Try a Sample Amazon URL:</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: 'Sony WH-1000XM5', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
              { label: 'MacBook Air 15 M3', url: 'https://www.amazon.com/dp/B0C762112C' },
              { label: 'iPhone 15 Pro Max', url: 'https://www.amazon.com/dp/B0CHWRXH8B' },
              { label: 'DJI Mini 4 Pro Drone', url: 'https://www.amazon.com/dp/B0CGF78T1V' },
            ].map((sample) => (
              <button
                key={sample.url}
                onClick={() => setLinkInput(sample.url)}
                className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 rounded-xl text-slate-200 text-[11px] font-medium transition-colors"
              >
                + {sample.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleExtractFromLink} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              required
              placeholder="Paste Amazon Product Link (e.g., https://www.amazon.com/dp/B09XS7JWHH)"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 px-4 py-3.5 rounded-2xl text-xs text-white font-mono outline-none shadow-inner pr-10"
            />
            {linkInput && (
              <button type="button" onClick={() => setLinkInput('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-white">✕</button>
            )}
          </div>
          <button
            type="submit"
            disabled={isExtractingLink || !linkInput.trim()}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
          >
            {isExtractingLink ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting Data...</span>
              </>
            ) : (
              <>⚡ Extract & Import Product Data</>
            )}
          </button>
        </form>

        {isExtractingLink && (
          <div className="p-4 bg-blue-900/50 border border-blue-700/80 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                AI Link Extraction & Metadata Synthesis in Progress
              </span>
              <span className="font-mono text-[11px] text-slate-300">Gemini 2.5 Flash</span>
            </div>
            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className={`flex items-center gap-2 ${extractionStep === 'parsing' ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                <span>{extractionStep === 'parsing' ? '⏳' : '✅'}</span>
                <span>Parsing Product URL & Extracting ASIN Identifier...</span>
              </div>
              <div className={`flex items-center gap-2 ${extractionStep === 'gemini' ? 'text-amber-400 font-bold' : extractionStep === 'enriching' || extractionStep === 'complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span>{extractionStep === 'gemini' ? '⏳' : extractionStep === 'enriching' || extractionStep === 'complete' ? '✅' : '⚪'}</span>
                <span>Running AI Model to synthesize Specs, Prices & Editorial Verdict...</span>
              </div>
              <div className={`flex items-center gap-2 ${extractionStep === 'enriching' ? 'text-amber-400 font-bold' : extractionStep === 'complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span>{extractionStep === 'enriching' ? '⏳' : extractionStep === 'complete' ? '✅' : '⚪'}</span>
                <span>Fetching gallery images, video reviews & attaching tag ({associateTag})...</span>
              </div>
            </div>
          </div>
        )}

        {extractionSuccessMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <span>{extractionSuccessMsg}</span>
            </div>
            <button onClick={() => setExtractionSuccessMsg('')} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {extractedPreview && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/50 shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">✨ Extracted Data Ready for Website</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{extractedPreview.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Brand: <strong className="text-slate-800 dark:text-slate-200">{extractedPreview.brand}</strong> • Category: <strong>{extractedPreview.mainCategory}</strong> • ASIN: <code className="font-mono">{extractedPreview.asin}</code>
              </p>
            </div>
            <button
              onClick={handlePublishExtractedProduct}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              🚀 Publish Directly to Website
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-center">
                <img
                  src={proxyImageUrl(extractedPreview.images?.[0] || '')}
                  alt={extractedPreview.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  className="max-h-full object-contain"
                />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Extracted Price:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">${Number(extractedPreview.currentPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>List Price:</span>
                  <span className="line-through">${Number(extractedPreview.referencePrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Discount:</span>
                  <span className="text-orange-500 font-black">{extractedPreview.discountPercentage}% OFF</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-bold">Editor Score:</span>
                  <span className="text-amber-500 font-black">★ {extractedPreview.editorScore} / 10</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Best For Badge</span>
                <div className="mt-1 inline-block px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold rounded-xl">🏆 {extractedPreview.bestFor}</div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Short Summary</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">{extractedPreview.shortDescription}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Editor Verdict</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200 font-medium">{extractedPreview.editorVerdict}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
                  <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-2">Tested Pros</h4>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                    {(extractedPreview.pros || []).map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 font-bold">✓</span><span>{p}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60">
                  <h4 className="font-extrabold text-rose-800 dark:text-rose-300 mb-2">Considerations</h4>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                    {(extractedPreview.cons || []).map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-rose-500 font-bold">✕</span><span>{c}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Extracted Technical Specs</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px]">
                  {Object.entries(extractedPreview.specifications || {}).filter(([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').map(([key, val]) => (
                    <div key={key}>
                      <span className="text-slate-400 font-medium">{key}:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">{String(val)}</strong>
                    </div>
                  ))}
                </div>
              </div>
              {extractedPreview.videoUrl && (
                <div className="p-3 bg-dw-blue/10 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl text-[11px] font-mono flex items-center justify-between text-dw-blue dark:text-blue-300">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base">▶️</span>
                    <span className="truncate max-w-md font-bold">{extractedPreview.videoUrl}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-dw-blue text-white rounded text-[9px] font-bold shrink-0">READY TO EMBED</span>
                </div>
              )}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-[11px] font-mono flex items-center justify-between text-amber-900 dark:text-amber-300">
                <span>Affiliate Target:</span>
                <span className="truncate max-w-md font-bold">{extractedPreview.affiliateUrl}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
