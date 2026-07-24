import React, { useState, useRef, useEffect } from 'react';
import { HeroChatbotIllustration } from '../common/SvgIcons';
import { Product, ChatMessage } from '../../types';
import { AffiliateCTA } from '../common/AffiliateCTA';
import { store } from '../../lib/store';
import { toast } from '../../lib/toastStore';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialContextProduct?: Product;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
  initialContextProduct
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: initialContextProduct
        ? `Hello! I see you're looking at **${initialContextProduct.title}**. What would you like to know about its performance, alternative options, or Amazon deal status?`
        : "Hi! I'm the DawnWire AI Shopping Assistant. Tell me what product you are looking for, your budget, or key features, and I'll find top-rated Amazon deals and expert benchmarks for you!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentPrompt = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Call server API route `/api/ai/chat`
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          contextProductId: initialContextProduct?.id,
          chatHistory: messages.slice(-6)
        })
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: data.text || "I found several products matching your criteria. Here are our top recommendations:",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: data.recommendedProducts || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      toast.error('AI chat network error. Using local recommendation engine.');
      // Fallback matching from local store if offline
      const allProducts = store.get().products;
      const keywords = currentPrompt.toLowerCase().split(' ');
      const matches = allProducts.filter((p) =>
        keywords.some((k) => p.title.toLowerCase().includes(k) || p.mainCategory.toLowerCase().includes(k) || p.shortDescription.toLowerCase().includes(k))
      ).slice(0, 3);

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: matches.length > 0
          ? `Based on your request for "${currentPrompt}", here are top independent recommendations from DawnWire:`
          : `I explored our products for "${currentPrompt}". Here are our top-rated editor choices on Amazon:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProducts: matches.length > 0 ? matches : allProducts.slice(0, 3)
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-[#0A1F44] text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/80 p-1 flex items-center justify-center border border-amber-400/40">
              <HeroChatbotIllustration className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">DawnWire AI Assistant</h3>
              <p className="text-[11px] text-blue-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Powered by Gemini • Live Amazon Data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Affiliate Disclosure Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/80 p-2.5 px-4 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>Affiliate Notice:</strong> Recommendations include direct Amazon links. DawnWire earns a commission if you complete a purchase.
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span className="block text-[10px] text-slate-400 mt-1 text-right">
                  {msg.timestamp}
                </span>
              </div>

              {/* Recommended Product Cards in Chat */}
              {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                <div className="w-full mt-3 space-y-2.5">
                  {msg.recommendedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex gap-3 items-center"
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.title}
                        className="w-16 h-16 object-contain rounded-lg bg-slate-50 dark:bg-slate-900 p-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{prod.brand}</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{prod.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {prod.currentPrice ? `$${Number(prod.currentPrice).toFixed(2)}` : 'Check Price'}
                          </span>
                          <span className="text-[10px] text-amber-500 font-bold">★ {prod.rating || 4.7}</span>
                        </div>
                      </div>
                      <AffiliateCTA
                        affiliateUrl={prod.affiliateUrl}
                        productId={prod.id}
                        asin={prod.asin}
                        productTitle={prod.title}
                        label="Check Price"
                        size="sm"
                        position="chatbot_card"
                        className="shrink-0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-2xl w-28 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px] font-semibold text-slate-700 dark:text-slate-300 no-scrollbar">
          <button
            onClick={() => setInputText('What are today’s best deals under $100?')}
            className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500"
          >
            Deals under $100
          </button>
          <button
            onClick={() => setInputText('Recommend the best noise-canceling headphones')}
            className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500"
          >
            Best ANC Headphones
          </button>
          <button
            onClick={() => setInputText('Compare Roborock S8 vs iRobot Roomba')}
            className="shrink-0 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-500"
          >
            Compare Robot Mops
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI about products, deals, or comparisons..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-transparent focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors font-bold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7M3 12h18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
