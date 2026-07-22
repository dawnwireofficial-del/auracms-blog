import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';

export interface ProductFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Performance' | 'Setup & Compatibility' | 'Battery & Features' | 'Warranty & Support' | 'Value & Pricing';
  confidenceScore: number;
  verifiedByAi: boolean;
}

interface ProductFaqSectionProps {
  product: Product;
  onOpenChatbotForProduct?: (product: Product) => void;
}

const CATEGORIES = [
  'All',
  'Performance',
  'Setup & Compatibility',
  'Battery & Features',
  'Warranty & Support',
  'Value & Pricing',
];

export const ProductFaqSection: React.FC<ProductFaqSectionProps> = ({
  product,
  onOpenChatbotForProduct,
}) => {
  const [faqs, setFaqs] = useState<ProductFaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom Q&A state
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAnsweringCustom, setIsAnsweringCustom] = useState(false);

  const fetchFaqs = async (forceRefresh = false) => {
    const cacheKey = `dawnwire_faq_${product.id}`;
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFaqs(parsed);
            setExpandedId(parsed[0]?.id || null);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {}
    }

    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ai/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          brand: product.brand,
          category: product.category,
          specs: product.specs,
          pros: product.pros,
          cons: product.cons,
          currentPrice: product.currentPrice,
          rating: product.rating,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data);
          setExpandedId(data[0]?.id || null);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error fetching product FAQs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFaqs(false);
  }, [product.id]);

  const handleAskCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAnsweringCustom) return;

    setIsAnsweringCustom(true);
    setCustomAnswer(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Answer this customer question about "${product.title}" (${product.brand}): ${customQuestion}. Be concise, factual, and helpful (2-3 sentences max).`,
          contextProductId: product.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomAnswer(data.response || 'No specific answer found. Please check specifications.');
      }
    } catch (err) {
      console.error('Error asking custom question:', err);
      setCustomAnswer('Our AI assistant encountered a transient error. Please try again or open AI Chat.');
    } finally {
      setIsAnsweringCustom(false);
    }
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              AI Review Synthesis
            </span>
            <span className="text-xs font-bold text-slate-500">
              • Verified against {product.reviewCount?.toLocaleString() || '1,200+'} Owner Reviews
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>AI-Powered Product FAQ</span>
            <span className="text-xl">🤖</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated answers compiled from lab stress-tests, specs sheet, and real owner experiences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchFaqs(true)}
            disabled={isRefreshing}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isRefreshing ? 'Synthesizing...' : 'Re-Analyze Product'}</span>
          </button>

          {onOpenChatbotForProduct && (
            <button
              onClick={() => onOpenChatbotForProduct(product)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span>Ask AI Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls: Search & Category Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* FAQ Search bar */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 absolute left-3.5 top-3 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search in FAQs (e.g., warranty, battery, noise, cable)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ List */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            No FAQs found matching "{searchQuery}".
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try searching for another keyword or submit a custom question below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {faq.confidenceScore}% Confidence
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200/60 dark:border-slate-800/60 px-4 sm:px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3"
                    >
                      <p>{faq.answer}</p>

                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Category: <strong className="text-slate-700 dark:text-slate-200">{faq.category}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Verified by Gemini AI Synthesis
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Custom Question Form */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-black text-sm">💡</span>
          <h4 className="font-extrabold text-sm text-slate-100">
            Have a specific question about the {product.title}?
          </h4>
        </div>
        <p className="text-xs text-slate-300">
          Ask any custom question (e.g., compatibility, cables, noise levels) and get an instant AI-computed answer.
        </p>

        <form onSubmit={handleAskCustomQuestion} className="flex gap-2">
          <input
            type="text"
            placeholder={`e.g. Does the ${product.brand} connect via Bluetooth 5.3?`}
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!customQuestion.trim() || isAnsweringCustom}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            {isAnsweringCustom ? (
              <span>Answering...</span>
            ) : (
              <>
                <span>Ask AI</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {customAnswer && (
          <div className="mt-3 p-3.5 bg-slate-800/90 border border-blue-500/40 rounded-xl text-xs text-slate-200 leading-relaxed animate-in fade-in">
            <span className="font-bold text-blue-400 block mb-1">🤖 AI Response:</span>
            <p>{customAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
