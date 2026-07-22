import React from 'react';
import { useAppStore } from '../lib/store';
import { AffiliateCTA } from '../components/common/AffiliateCTA';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { ReadingProgressBar } from '../components/common/ReadingProgressBar';

export const ReviewsPage: React.FC = () => {
  const { reviews } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <ReadingProgressBar />
      <DisclosureBanner />
      <div className="bg-[#0A1F44] text-white py-12 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">Expert Editorial Reviews</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            In-depth testing, hands-on benchmarks, and honest verdicts from DawnWire editors.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{rev.productName}</span>
              <span className="text-amber-500 font-extrabold bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl">★ {rev.overallScore} / 10</span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{rev.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rev.verdict}</p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">By {rev.authorName}</span>
              <a href={`/reviews/${rev.slug}`} className="text-xs font-bold text-blue-600 hover:underline">Read Full Review &rarr;</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BuyingGuidesPage: React.FC = () => {
  const { buyingGuides } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <ReadingProgressBar />
      <DisclosureBanner />
      <div className="bg-[#0A1F44] text-white py-12 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">Buyer’s Guides & Best-Of Roundups</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Comprehensive purchasing advice to help you choose the best product for your specific budget and use case.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        {buyingGuides.map((guide) => (
          <div key={guide.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{guide.category}</span>
                <span>•</span>
                <span>{guide.readTimeMinutes} min read</span>
                <span>•</span>
                <span>Updated {guide.lastUpdated}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{guide.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{guide.excerpt}</p>
            </div>

            <a href={`/guides/${guide.slug}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs shrink-0 transition-colors">
              Read Guide &rarr;
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
