import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, ChevronDown, Sparkles, ShoppingBag, Star, ThumbsUp, ThumbsDown, RefreshCw, ExternalLink, BarChart3, Copy, Check, Trash2 } from 'lucide-react';
import AiIndicator from './AiIndicator';
import NeuralOrb from './motion/NeuralOrb';

interface ProductCard {
  id: string;
  slug: string;
  productName?: string;
  product_name?: string;
  brand?: string;
  productImage?: string;
  product_image?: string;
  price?: string;
  originalPrice?: string;
  original_price?: string;
  rating?: number;
  bestFor?: string;
  best_for?: string;
  keyFeatures?: string[];
  key_features?: string[];
  pros?: string[];
  cons?: string[];
  affiliateUrl?: string;
  affiliate_url?: string;
  discountPercentage?: number;
  discount_percentage?: number;
  stockStatus?: string;
  stock_status?: string;
  dealBadge?: string;
  deal_badge?: string;
  reason?: string;
  reviewSummary?: string;
  review_summary?: string;
  finalVerdict?: string;
  final_verdict?: string;
  specs?: Record<string, string>;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCard[];
  productCards?: ProductCard[];
  comparisonData?: { products: ProductCard[]; total: number };
  timestamp: number;
}

const SUGGESTIONS = [
  'Find a product for me',
  'Compare two products',
  'Show today\'s deals',
  'Products under $50',
  'Best-rated products',
  'Editor\'s picks',
  'Help me choose',
  'Show alternatives',
];

interface Props {
  pageContext?: { pageType?: string; pageSlug?: string; category?: string; productSlug?: string };
}

export default function ShoppingAssistant({ pageContext }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileFull, setIsMobileFull] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;

  const getSessionId = useCallback(() => {
    let sid = sessionStorage.getItem('dawnwire_chat_session');
    if (!sid) {
      sid = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('dawnwire_chat_session', sid);
    }
    return sid;
  }, []);

  useEffect(() => {
    setSessionId(getSessionId());
  }, [getSessionId]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen for 'open-chat' custom event from product pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.productSlug) {
        pageContextRef.current = { ...pageContextRef.current, productSlug: detail.productSlug };
      }
      setIsOpen(true);
    };
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileFull(e.matches && isOpen);
    };
    mq.addEventListener('change', handler as any);
    if (mq.matches && isOpen) setIsMobileFull(true);
    return () => mq.removeEventListener('change', handler as any);
  }, [isOpen]);

  const normalizeProduct = (p: any): ProductCard => ({
    ...p,
    productName: p.productName || p.product_name || '',
    productImage: p.productImage || p.product_image || '',
    originalPrice: p.originalPrice || p.original_price || '',
    bestFor: p.bestFor || p.best_for || '',
    keyFeatures: p.keyFeatures || p.key_features || [],
    pros: p.pros || [],
    cons: p.cons || [],
    affiliateUrl: p.affiliateUrl || p.affiliate_url || '',
    discountPercentage: p.discountPercentage || p.discount_percentage || 0,
    stockStatus: p.stockStatus || p.stock_status || '',
    dealBadge: p.dealBadge || p.deal_badge || '',
    reviewSummary: p.reviewSummary || p.review_summary || '',
    finalVerdict: p.finalVerdict || p.final_verdict || '',
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const msgText = text.trim();
    setInput('');
    setShowSuggestions(false);

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: msgText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: msgText,
          context: pageContextRef.current || undefined,
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '',
        products: data.products || data.productCards || [],
        productCards: data.productCards || [],
        comparisonData: data.comparisonData,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setShowFeedback(assistantMsg.id);

      // Track chat interaction
      try {
        if (data.productCards?.length || data.products?.length) {
          const categoryIds = [...(data.products || []), ...(data.productCards || [])]
            .map((p: any) => p.categoryId || p.category_id)
            .filter(Boolean);
          fetch('/api/public/track/affiliate-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageUrl: window.location.pathname,
              pageType: 'chat',
              ctaPosition: 'chat_recommendation',
              deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
              sessionId,
            }),
          }).catch(() => {});
        }
      } catch {}
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
  };

  const handleSuggestion = (suggestion: string) => sendMessage(suggestion);

  const clearChat = async () => {
    setMessages([]);
    setShowSuggestions(true);
    setShowFeedback(null);
    try {
      await fetch('/api/public/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {}
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br />')
      .replace(/^- (.*)/gm, '<span class="block ml-2">• $1</span>');
  };

  const handleAffiliateClick = (product: ProductCard) => {
    try {
      fetch('/api/public/track/affiliate-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id || product.slug,
          pageUrl: window.location.pathname,
          pageType: 'chat',
          ctaPosition: 'chat_product_card',
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
          sessionId,
        }),
      }).catch(() => {});
    } catch {}
    if (product.affiliateUrl) window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-zinc-600'}`} />
    ));
  };

  const ProductCardComp = ({ product }: { product: ProductCard }) => {
    const p = normalizeProduct(product);
    const img = p.productImage || 'https://placehold.co/200x200/e2e8f0/94a3b8?text=No+Image';
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden shrink-0 w-[240px] snap-start">
        <div className="h-32 bg-slate-50 dark:bg-zinc-900 flex items-center justify-center p-2">
          <img src={img} alt={p.productName} className="max-h-full max-w-full object-contain" loading="lazy" />
        </div>
        <div className="p-3 space-y-1.5">
          <div className="flex items-center gap-1">{renderStars(p.rating)}</div>
          <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-tight">{p.productName}</p>
          {p.brand && <p className="text-[10px] text-slate-400">{p.brand}</p>}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">${p.price}</span>
            {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
              <span className="text-[10px] text-slate-400 line-through">${p.originalPrice}</span>
            )}
          </div>
          {p.bestFor && <p className="text-[9px] text-[#246BFF] font-medium">{p.bestFor}</p>}
          {p.reason && <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2">{p.reason}</p>}
          <div className="pt-1.5 flex gap-1.5">
            <button onClick={() => { if (p.slug) window.location.href = `/product/${p.slug}`; }}
              className="flex-1 text-[10px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-2 py-1.5 rounded-lg hover:bg-[#246BFF]/10 transition-all">Details</button>
            <button onClick={() => handleAffiliateClick(p)}
              className="flex-1 text-[10px] font-bold text-white bg-[#FF9900] px-2 py-1.5 rounded-lg hover:bg-[#FF9900]/90 transition-all">Buy</button>
          </div>
        </div>
      </div>
    );
  };

  const ComparisonView = ({ comparison, onClose }: { comparison: any; onClose: () => void }) => {
    const products = comparison.products || [];
    if (!products.length) return null;
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden mt-2">
        <div className="p-2 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300">Product Comparison</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead><tr className="border-b border-slate-100 dark:border-zinc-700">
              <th className="p-2 text-left text-slate-400 font-medium w-20">Feature</th>
              {products.map((p: any, i: number) => <th key={i} className="p-2 text-left font-bold text-slate-700 dark:text-zinc-200 min-w-[100px]">{(p.product_name || p.productName || '').substring(0, 20)}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700/50">
              <tr><td className="p-2 text-slate-400">Price</td>{products.map((p: any, i: number) => <td key={i} className="p-2 font-bold text-slate-800 dark:text-zinc-100">{p.price || '—'}</td>)}</tr>
              <tr><td className="p-2 text-slate-400">Rating</td>{products.map((p: any, i: number) => <td key={i} className="p-2">{p.rating ? `${'★'.repeat(Math.round(p.rating))} ${p.rating}/5` : '—'}</td>)}</tr>
              <tr><td className="p-2 text-slate-400">Best For</td>{products.map((p: any, i: number) => <td key={i} className="p-2">{p.bestFor || p.best_for || '—'}</td>)}</tr>
              {products.some((p: any) => p.pros && p.pros.length > 0) && (
                <tr><td className="p-2 text-slate-400">Pros</td>{products.map((p: any, i: number) => <td key={i} className="p-2 text-[9px] text-green-600">{(p.pros || []).slice(0, 3).join(' • ') || '—'}</td>)}</tr>
              )}
              {products.some((p: any) => p.cons && p.cons.length > 0) && (
                <tr><td className="p-2 text-slate-400">Cons</td>{products.map((p: any, i: number) => <td key={i} className="p-2 text-[9px] text-red-500">{(p.cons || []).slice(0, 3).join(' • ') || '—'}</td>)}</tr>
              )}
              {products.some((p: any) => p.key_features && p.key_features.length > 0) && (
                <tr><td className="p-2 text-slate-400">Features</td>{products.map((p: any, i: number) => <td key={i} className="p-2 text-[9px]">{(p.key_features || []).slice(0, 3).join(' • ') || '—'}</td>)}</tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-2 flex gap-2">
          {products.map((p: any, i: number) => (
            <button key={i} onClick={() => handleAffiliateClick(normalizeProduct(p))}
              className="flex-1 text-[10px] font-bold text-white bg-[#FF9900] px-2 py-1.5 rounded-lg hover:bg-[#FF9900]/90 transition-all">Buy {i + 1}</button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center p-2 rounded-full glass-dark-effect shadow-[0_0_20px_rgba(0,210,255,0.3)] border border-brand-secondary/30"
          aria-label="Open AI Shopping Assistant">
          <div className="w-16 h-16 flex items-center justify-center relative">
            <NeuralOrb size="medium" state={loading ? 'processing' : 'idle'} />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,1)] border border-black" />
          </div>
        </button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed z-50 flex flex-col bg-white dark:bg-zinc-900 shadow-2xl
              ${isMobileFull ? 'inset-0 rounded-none' : 'bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] rounded-2xl border border-slate-200 dark:border-zinc-700'}`}>

            {/* Header */}
            <div className="shrink-0 bg-gradient-to-r from-[#246BFF] to-[#7C3AED] text-white p-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Shopping Assistant</h3>
                  <p className="text-[10px] text-white/70">Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-all" title="Clear chat">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#246BFF]/5 to-[#7C3AED]/5 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800">
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-1 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#246BFF]" /> Hello! 👋
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                      I'm your AI shopping assistant. I can help you find products, compare options, discover deals, and answer questions about products on DawnWire. What are you looking for today?
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">DawnWire may earn a commission from qualifying purchases.</div>
                  {showSuggestions && (
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => handleSuggestion(s)}
                          className="text-[10px] text-[#246BFF] bg-[#246BFF]/5 px-2.5 py-1.5 rounded-full hover:bg-[#246BFF]/10 transition-all font-medium border border-[#246BFF]/10">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#246BFF] text-white rounded-2xl rounded-br-md px-4 py-2.5' : ''}`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="bg-slate-50 dark:bg-zinc-800/80 rounded-2xl rounded-bl-md px-4 py-2.5 border border-slate-100 dark:border-zinc-700/50">
                        <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                        {msg.comparisonData && (
                          <ComparisonView comparison={msg.comparisonData} onClose={() => {}} />
                        )}
                        {(msg.productCards?.length || msg.products?.length) && (
                          <div className="mt-3">
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                              {[...(msg.productCards || []), ...(msg.products || [])].slice(0, 8).map((p, i) => (
                                <ProductCardComp key={i} product={p} />
                              ))}
                            </div>
                            <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-2 leading-tight">
                              Prices and availability may change on Amazon. Please check Amazon for the latest information.
                            </div>
                          </div>
                        )}
                        {/* Feedback */}
                        {showFeedback === msg.id && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-zinc-700">
                            <span className="text-[10px] text-slate-400">Was this helpful?</span>
                            <button className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition-all">
                              <ThumbsUp className="h-3 w-3 text-slate-400 hover:text-green-500" />
                            </button>
                            <button className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded transition-all">
                              <ThumbsDown className="h-3 w-3 text-slate-400 hover:text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-zinc-800/80 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-100 dark:border-zinc-700/50">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-[#246BFF] animate-spin" />
                      <span className="text-xs text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-100 dark:border-zinc-700 p-3 bg-slate-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(input); }}
                  placeholder="Ask me about products..."
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#246BFF]/30 focus:border-[#246BFF] outline-none text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 disabled:opacity-50"
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="p-2.5 bg-[#246BFF] text-white rounded-xl hover:bg-[#246BFF]/90 disabled:opacity-30 transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
