import React, { useState, useEffect } from 'react';
import { Product } from '../../types';

interface OpenGraphAuditToolProps {
  products?: Product[];
}

export const OpenGraphAuditTool: React.FC<OpenGraphAuditToolProps> = ({ products = [] }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'p1'
  );
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // OG Fields State
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogType, setOgType] = useState<'article' | 'product'>('product');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Sync state when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setOgTitle(`${selectedProduct.title} - Full Review & Amazon Deals | DawnWire`);
      setOgDescription(
        `Read our independent benchmark review for ${selectedProduct.title}. Editor Score: ${selectedProduct.editorScore}/100. Best deal price: $${selectedProduct.currentPrice}.`
      );
      setOgImage(
        selectedProduct.images?.[0] ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
      );
    }
  }, [selectedProductId, selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        No products available to audit Open Graph meta tags.
      </div>
    );
  }

  // Audit Calculations
  const titleLength = ogTitle.length;
  const isTitleOptimal = titleLength >= 35 && titleLength <= 65;

  const descLength = ogDescription.length;
  const isDescOptimal = descLength >= 110 && descLength <= 160;

  const isImageValid = ogImage.startsWith('http://') || ogImage.startsWith('https://');

  const overallScore = Math.round(
    (isTitleOptimal ? 35 : 15) + (isDescOptimal ? 35 : 15) + (isImageValid ? 30 : 0)
  );

  const formattedHtmlTags = `<!-- Open Graph / Facebook / LinkedIn Meta Tags -->
<meta property="og:type" content="${ogType}" />
<meta property="og:url" content="https://dawnwire.com/products/${selectedProduct.id}" />
<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
<meta property="og:description" content="${ogDescription.replace(/"/g, '&quot;')}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:site_name" content="DawnWire Tech Reviews" />

<!-- Twitter / X Card Meta Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@DawnWireTech" />
<meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}" />
<meta name="twitter:description" content="${ogDescription.replace(/"/g, '&quot;')}" />
<meta name="twitter:image" content="${ogImage}" />

<!-- Schema.org Product Structured Data -->
<script type="application/ld+json">
${JSON.stringify(
  {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: selectedProduct.title,
    image: [ogImage],
    description: ogDescription,
    brand: { '@type': 'Brand', name: selectedProduct.brand },
    offers: {
      '@type': 'Offer',
      url: `https://dawnwire.com/products/${selectedProduct.id}`,
      priceCurrency: 'USD',
      price: selectedProduct.currentPrice,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: selectedProduct.rating,
      reviewCount: selectedProduct.reviewCount,
    },
  },
  null,
  2
)}
</script>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SEO & Social Tool
            </span>
            <span className="text-xs font-bold text-slate-500">• Open Graph & Card Auditor</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Social Preview & Open Graph Generator</span>
            <span>🌐</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit and generate rich social snippet previews for Twitter, Facebook, and LinkedIn.
          </p>
        </div>

        {/* Product Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-500 px-2">Audit Product:</span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none max-w-xs truncate cursor-pointer"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} - {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Generator Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Tag Form & Audit Score */}
        <div className="lg:col-span-6 space-y-5">
          {/* Audit Health Score */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                OG Metadata Audit Score
              </span>
              <span
                className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  overallScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {overallScore}/100 Grade
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  overallScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>

            {/* Audit Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <span className={isTitleOptimal ? 'text-emerald-500' : 'text-amber-500'}>
                  {isTitleOptimal ? '✓' : '⚠️'}
                </span>
                <span className="text-slate-600 dark:text-slate-300">Title ({titleLength} chars)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={isDescOptimal ? 'text-emerald-500' : 'text-amber-500'}>
                  {isDescOptimal ? '✓' : '⚠️'}
                </span>
                <span className="text-slate-600 dark:text-slate-300">Desc ({descLength} chars)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={isImageValid ? 'text-emerald-500' : 'text-red-500'}>
                  {isImageValid ? '✓' : '✕'}
                </span>
                <span className="text-slate-600 dark:text-slate-300">Image Asset</span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4 text-xs">
            {/* OG Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  og:title (Recommended: 40 - 60 chars)
                </label>
                <span className={`font-mono text-[10px] ${isTitleOptimal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {titleLength} chars
                </span>
              </div>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OG Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">
                  og:description (Recommended: 120 - 155 chars)
                </label>
                <span className={`font-mono text-[10px] ${isDescOptimal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {descLength} chars
                </span>
              </div>
              <textarea
                rows={3}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OG Image URL */}
            <div>
              <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                og:image URL (High resolution image banner)
              </label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-[11px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image Selector Thumbnails */}
            {selectedProduct.images && selectedProduct.images.length > 1 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">
                  Select Alternate Product Image for Banner:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOgImage(img)}
                      className={`w-12 h-12 rounded-xl border-2 p-0.5 overflow-hidden bg-slate-100 dark:bg-slate-800 ${
                        ogImage === img ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Selector */}
            <div className="flex items-center gap-4 pt-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">og:type:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOgType('product')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${
                    ogType === 'product' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  product
                </button>
                <button
                  type="button"
                  onClick={() => setOgType('article')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs ${
                    ogType === 'article' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  article
                </button>
              </div>
            </div>
          </div>

          {/* Action Copy Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => copyToClipboard(formattedHtmlTags, 'tags')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copiedStatus === 'tags' ? '✓ Copied HTML Tags!' : 'Copy Open Graph HTML Tags'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Live Social Media Card Previews */}
        <div className="lg:col-span-6 space-y-6">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>👁️ Live Social Platform Preview Cards</span>
          </div>

          {/* X / Twitter Large Image Card Preview */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">
              X (Twitter) Large Image Summary Card
            </span>
            <div className="bg-black text-white rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="relative aspect-[1.91/1] bg-slate-900 overflow-hidden border-b border-slate-800 flex items-center justify-center p-4">
                <img src={ogImage} alt="" className="max-h-full max-w-full object-contain" />
                <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md text-[10px] font-mono px-2 py-0.5 rounded text-slate-300">
                  dawnwire.com
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="text-[11px] text-slate-400 font-mono">dawnwire.com</div>
                <div className="font-extrabold text-sm text-slate-100 line-clamp-1">{ogTitle}</div>
                <div className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ogDescription}</div>
              </div>
            </div>
          </div>

          {/* Facebook / LinkedIn Card Preview */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block">
              Facebook / LinkedIn Share Preview Card
            </span>
            <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
              <div className="p-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  DW
                </div>
                <div>
                  <strong className="block text-xs font-bold">DawnWire Tech Reviews</strong>
                  <span className="text-[10px] text-slate-400">Just now • 🌐</span>
                </div>
              </div>
              <div className="aspect-[1.91/1] bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                <img src={ogImage} alt="" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 space-y-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  DAWNWIRE.COM
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                  {ogTitle}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {ogDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
