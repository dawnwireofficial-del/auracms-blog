import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Product } from '../../types';
import { AffiliateCTA } from '../common/AffiliateCTA';

interface AIProductFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIProductFinderModal: React.FC<AIProductFinderModalProps> = ({ isOpen, onClose }) => {
  const { categories, products } = useAppStore();
  const [step, setStep] = useState(1);

  // Form State
  const [selectedCat, setSelectedCat] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [budgetRange, setBudgetRange] = useState<'under_100' | '100_300' | '300_1000' | 'above_1000'>('300_1000');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'professional'>('intermediate');
  const [requiredFeatures, setRequiredFeatures] = useState<string[]>([]);
  const [matchedResults, setMatchedResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Execute match
      setIsSearching(true);
      setTimeout(() => {
        let filtered = [...products];

        if (selectedCat) {
          filtered = filtered.filter((p) => p.mainCategory.toLowerCase().includes(selectedCat.toLowerCase()));
        }

        if (budgetRange === 'under_100') {
          filtered = filtered.filter((p) => (p.currentPrice || 0) <= 100);
        } else if (budgetRange === '100_300') {
          filtered = filtered.filter((p) => (p.currentPrice || 0) >= 100 && (p.currentPrice || 0) <= 300);
        } else if (budgetRange === '300_1000') {
          filtered = filtered.filter((p) => (p.currentPrice || 0) >= 300 && (p.currentPrice || 0) <= 1000);
        } else if (budgetRange === 'above_1000') {
          filtered = filtered.filter((p) => (p.currentPrice || 0) >= 1000);
        }

        if (filtered.length < 3) {
          filtered = products.slice(0, 4);
        }

        setMatchedResults(filtered.slice(0, 4));
        setIsSearching(false);
        setStep(4); // Results Step
      }, 800);
    }
  };

  const toggleFeature = (feat: string) => {
    if (requiredFeatures.includes(feat)) {
      setRequiredFeatures(requiredFeatures.filter((f) => f !== feat));
    } else {
      setRequiredFeatures([...requiredFeatures, feat]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#0A1F44] text-white p-6 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 p-2 text-amber-400 flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-extrabold text-base">DawnWire AI Product Finder</h3>
              <p className="text-xs text-blue-200">Interactive Quiz • Matches 3-5 Ideal Amazon Products</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-blue-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        {step <= 3 && (
          <div className="bg-slate-100 dark:bg-slate-800 h-1.5 w-full">
            <div
              className="bg-orange-500 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Quiz Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Step 1: What category are you shopping for?
              </h4>
              <p className="text-xs text-slate-500">
                Select your primary area of interest:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.slug)}
                    className={`p-3.5 rounded-2xl text-left border text-xs font-bold transition-all ${
                      selectedCat === cat.slug
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-700 dark:text-blue-300 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-sm mb-1">{cat.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal line-clamp-1">{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Step 2: Intended Use & Target Budget
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Describe how you plan to use this product:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Daily airplane commuting, high-volume espresso making, gaming..."
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select your maximum budget:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {[
                    { id: 'under_100', label: 'Under $100' },
                    { id: '100_300', label: '$100 - $300' },
                    { id: '300_1000', label: '$300 - $1,000' },
                    { id: 'above_1000', label: '$1,000+' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBudgetRange(b.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        budgetRange === b.id
                          ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Step 3: User Experience & Must-Have Features
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Experience level:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {['beginner', 'intermediate', 'professional'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSkillLevel(lvl as any)}
                      className={`p-3 rounded-xl border capitalize transition-all ${
                        skillLevel === lvl
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select key required features:
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Noise Cancelation', 'Battery 20h+', 'Dual Motors', 'Touchscreen', '4K Resolution', 'Self-Empty Dock', 'Compact Travel'].map((feat) => (
                    <button
                      key={feat}
                      onClick={() => toggleFeature(feat)}
                      className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                        requiredFeatures.includes(feat)
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {feat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  AI Matches Found ({matchedResults.length})
                </h4>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  Refine Preferences
                </button>
              </div>

              <div className="space-y-3">
                {matchedResults.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center"
                  >
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-20 h-20 object-contain rounded-xl bg-white dark:bg-slate-900 p-2 shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{prod.brand} • {prod.bestFor}</span>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{prod.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                        <strong>Why matched:</strong> Rated {prod.editorScore}/10 with {prod.pros[0]}
                      </p>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
                        {prod.currentPrice ? `$${prod.currentPrice.toFixed(2)}` : 'Check Price'}
                      </div>
                    </div>
                    <AffiliateCTA
                      affiliateUrl={prod.affiliateUrl}
                      productId={prod.id}
                      asin={prod.asin}
                      productTitle={prod.title}
                      label="Check Price on Amazon"
                      size="sm"
                      position="ai_finder_result"
                      className="shrink-0 w-full sm:w-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {step > 1 && step <= 3 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline"
            >
              &larr; Back
            </button>
          )}

          <div className="ml-auto">
            {step <= 3 && (
              <button
                onClick={handleNextStep}
                disabled={isSearching}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-md"
              >
                {isSearching ? 'Analyzing Specs...' : step === 3 ? 'Find Matches' : 'Next Step'}
              </button>
            )}
            {step === 4 && (
              <button
                onClick={onClose}
                className="bg-[#0A1F44] text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                Close Finder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
