import React, { useState } from 'react';
import { DawnWireLogo } from '../common/SvgIcons';

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
    <footer className="relative overflow-hidden bg-gradient-to-b from-white to-[#F4F8FF] text-slate-600 pt-14 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10">
      {/* Light texture + soft glows */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(36,107,255,0.10) 1px, transparent 0)', backgroundSize: '26px 26px' }}
      />
      <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-[#246BFF]/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#FF8A00]/10 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#E2E8F0]">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <DawnWireLogo iconOnly={false} className="w-[184px] h-[156px]" />
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              DawnWire is an AI-powered product discovery, independent reviews, comparison, and Amazon deals platform. We empower buyers to find the exact right product at the best price.
            </p>

            {/* Newsletter Box */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Get Weekly Price Drops & Buying Guides
              </h4>
              {subscribed ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
                      className="bg-white text-sm text-slate-800 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#FF8A00] flex-1 min-w-0 placeholder-slate-400 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#FF8A00] hover:bg-[#e67b00] text-white font-black px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
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
                    <p className="text-[11px] text-red-500 font-medium">{errorMessage}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Public Routes */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Explore Products
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="/products" className="hover:text-[#246BFF] transition-colors">All Products</a></li>
              <li><a href="/deals" className="hover:text-[#246BFF] transition-colors text-[#FF6A00] font-bold">Today&apos;s Amazon Deals</a></li>
              <li><a href="/products?sort=rating" className="hover:text-[#246BFF] transition-colors">Best Sellers & Editors&apos; Picks</a></li>
              <li><a href="/deals" className="hover:text-[#246BFF] transition-colors">Trending Products</a></li>
              <li><a href="/compare" className="hover:text-[#246BFF] transition-colors">Product Comparisons</a></li>
              <li><a href="/categories" className="hover:text-[#246BFF] transition-colors">Category Directory</a></li>
              <li><a href="/brands" className="hover:text-[#246BFF] transition-colors">Featured Brands</a></li>
            </ul>
          </div>

          {/* Col 3: Editorial & Reviews */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Editorial Content
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="/reviews" className="hover:text-[#246BFF] transition-colors">Expert Reviews</a></li>
              <li><a href="/guides" className="hover:text-[#246BFF] transition-colors">Buying Guides</a></li>
              <li><a href="/about" className="hover:text-[#246BFF] transition-colors">How We Review</a></li>
              <li><a href="/about" className="hover:text-[#246BFF] transition-colors">Editorial Policy</a></li>
              <li><a href="/about" className="hover:text-[#246BFF] transition-colors">Corrections Policy</a></li>
              <li><a href="/about" className="hover:text-[#246BFF] transition-colors">About DawnWire</a></li>
              <li><a href="/contact" className="hover:text-[#246BFF] transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Account */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Account & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="/account" className="hover:text-[#246BFF] transition-colors">User Account</a></li>
              <li><a href="/wishlist" className="hover:text-[#246BFF] transition-colors">Saved Wishlist</a></li>
              <li><a href="/recently-viewed" className="hover:text-[#246BFF] transition-colors">Recently Viewed</a></li>
              <li><a href="/affiliate-disclosure" className="hover:text-[#246BFF] transition-colors">Affiliate Disclosure</a></li>
              <li><a href="/privacy-policy" className="hover:text-[#246BFF] transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-[#246BFF] transition-colors">Terms of Service</a></li>
              <li><a href="/admin" className="hover:text-[#246BFF] transition-colors font-semibold text-slate-700">Admin Dashboard</a></li>
            </ul>
          </div>
        </div>

        {/* Affiliate Footnote */}
        <div className="pt-8 text-xs text-slate-500 leading-relaxed border-b border-[#E2E8F0] pb-6">
          <p className="mb-2">
            <strong className="text-slate-700">Amazon Associate Disclosure:</strong> DawnWire is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Certain content that appears on this site comes from Amazon Services LLC. This content is provided &apos;as is&apos; and is subject to change or removal at any time.
          </p>
          <p>
            Prices and availability were accurate at the time of publication and are subject to change. Clicking &quot;Check Price on Amazon&quot; or &quot;View Deal on Amazon&quot; transfers you to Amazon to complete purchases securely on Amazon.com.
          </p>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3 py-6">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Follow Us</span>
          <div className="flex gap-2">
            {[
              { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591752300472', color: 'hover:bg-blue-600', icon: (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              )},
              { name: 'Instagram', href: 'https://www.instagram.com/dawnwire/', color: 'hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500', icon: (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              )},
              { name: 'Pinterest', href: 'https://www.pinterest.com/dawnwireofficial/', color: 'hover:bg-red-600', icon: (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
              )},
              { name: 'X', href: 'https://x.com/dawnwire', color: 'hover:bg-black hover:text-white', icon: (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              )},
            ].map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" title={s.name}
                className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 ${s.color} hover:text-white transition-all`}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} DawnWire. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="hover:text-[#246BFF] transition-colors">Sitemap XML</a>
            <span>•</span>
            <a href="/robots.txt" className="hover:text-[#246BFF] transition-colors">Robots.txt</a>
            <span>•</span>
            <a href="/llms.txt" className="hover:text-[#246BFF] transition-colors">llms.txt</a>
          </div>
        </div>
      </div>
    </footer>
  );
};