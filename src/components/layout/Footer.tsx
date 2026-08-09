import React, { useState } from 'react';
import { DawnWireLogo } from '../common/SvgIcons';
import { AmbientGlow } from '../visual/AmbientGlow';
import { TechnicalGrid } from '../visual/TechnicalGrid';
import { GradientDivider } from '../visual/GradientDivider';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (response.ok) {
        setSubscribed(true);
        setEmail('');
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      setErrorMessage('Unable to subscribe. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#050B18] text-slate-300 pt-16 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-12 border-t border-blue-500/20 shadow-2xl">
      <TechnicalGrid opacity={0.03} />
      <AmbientGlow color="blue" position="top-right" size="lg" />
      <AmbientGlow color="blue" position="bottom-left" size="xl" />
      <GradientDivider variant="blue-orange" className="absolute top-0 inset-x-0" />
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <DawnWireLogo iconOnly={false} tagline className="text-white" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              DawnWire is an AI-powered product discovery, independent reviews, comparison, and Amazon deals platform. We empower buyers to find the exact right product at the best price.
            </p>

            {/* Newsletter Box */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Get Weekly Price Drops & Buying Guides
              </h4>
              {subscribed ? (
                <div className="p-3 bg-emerald-950/80 text-emerald-300 text-xs rounded-xl border border-emerald-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Thank you! You are subscribed to DawnWire Deal Alerts.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleNewsletter} className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email..."
                      value={email}
                      disabled={isSubmitting}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="bg-slate-900 text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-amber-400 flex-1 min-w-0 placeholder-slate-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>
                  </form>
                  {errorMessage && (
                    <p className="text-[11px] text-red-400 font-medium">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Public Routes */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Products
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
               <li><a href="/products" className="hover:text-amber-400 transition-colors">All Products</a></li>
               <li><a href="/deals" className="hover:text-amber-400 transition-colors text-orange-400 font-bold">Today's Amazon Deals</a></li>
               <li><a href="/products?sort=rating" className="hover:text-amber-400 transition-colors">Best Sellers & Editors' Picks</a></li>
               <li><a href="/deals" className="hover:text-amber-400 transition-colors">Trending Products</a></li>
               <li><a href="/compare" className="hover:text-amber-400 transition-colors">Product Comparisons</a></li>
               <li><a href="/categories" className="hover:text-amber-400 transition-colors">Category Directory</a></li>
               <li><a href="/brands" className="hover:text-amber-400 transition-colors">Featured Brands</a></li>
             </ul>
          </div>

          {/* Col 3: Editorial & Reviews */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Editorial Content
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
               <li><a href="/reviews" className="hover:text-amber-400 transition-colors">Expert Reviews</a></li>
               <li><a href="/guides" className="hover:text-amber-400 transition-colors">Buying Guides</a></li>
               <li><a href="/about" className="hover:text-amber-400 transition-colors">How We Review</a></li>
               <li><a href="/about" className="hover:text-amber-400 transition-colors">Editorial Policy</a></li>
               <li><a href="/about" className="hover:text-amber-400 transition-colors">Corrections Policy</a></li>
               <li><a href="/about" className="hover:text-amber-400 transition-colors">About DawnWire</a></li>
               <li><a href="/contact" className="hover:text-amber-400 transition-colors">Contact Us</a></li>
             </ul>
          </div>

          {/* Col 4: Legal & Account */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Account & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
               <li><a href="/account" className="hover:text-amber-400 transition-colors">User Account</a></li>
               <li><a href="/wishlist" className="hover:text-amber-400 transition-colors">Saved Wishlist</a></li>
               <li><a href="/recently-viewed" className="hover:text-amber-400 transition-colors">Recently Viewed</a></li>
               <li><a href="/affiliate-disclosure" className="hover:text-amber-400 transition-colors">Affiliate Disclosure</a></li>
               <li><a href="/privacy-policy" className="hover:text-amber-400 transition-colors">Privacy Policy</a></li>
               <li><a href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</a></li>
               <li><a href="/admin" className="hover:text-amber-400 transition-colors font-semibold text-slate-300">Admin Dashboard</a></li>
             </ul>
          </div>
        </div>

        {/* Affiliate Footnote */}
        <div className="pt-8 text-xs text-slate-500 leading-relaxed border-b border-slate-800 pb-6">
          <p className="mb-2">
            <strong>Amazon Associate Disclosure:</strong> DawnWire is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Certain content that appears on this site comes from Amazon Services LLC. This content is provided 'as is' and is subject to change or removal at any time.
          </p>
          <p>
            Prices and availability were accurate at the time of publication and are subject to change. Clicking "Check Price on Amazon" or "View Deal on Amazon" transfers you to Amazon to complete purchases securely on Amazon.com.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} DawnWire. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="hover:text-slate-200">Sitemap XML</a>
            <span>•</span>
            <a href="/robots.txt" className="hover:text-slate-200">Robots.txt</a>
            <span>•</span>
            <a href="/llms.txt" className="hover:text-slate-200">llms.txt</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
