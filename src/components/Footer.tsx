import { useState } from 'react';
import { Send, Mail, ArrowRight, Facebook, Twitter, Linkedin, Github, RefreshCw, Instagram, ExternalLink, Shield, Star, TrendingUp, Package } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
  settings: SiteSettings | null;
}

export default function Footer({ onNavigate, settings }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setEmail('');
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  };

  const exploreLinks = [
    { label: 'All Products', route: 'products' },
    { label: "Today's Deals", route: 'deals' },
    { label: 'Best Sellers', route: 'products', params: '?sort=popularity' },
    { label: 'Buying Guides', route: 'guides' },
    { label: 'Categories', route: 'categories' },
    { label: 'Brands', route: 'brands' },
  ];

  const editorLinks = [
    { label: 'Expert Reviews', route: 'reviews' },
    { label: 'Buying Guides', route: 'guides' },
    { label: 'Comparisons', route: 'compare' },
    { label: 'How We Review', route: 'about' },
    { label: 'Editorial Policy', route: 'editorial-policy' },
    { label: 'AI Product Finder', route: 'products' },
  ];

  const accountLinks = [
    { label: 'My Account', route: 'admin' },
    { label: 'Wishlist', route: 'wishlist' },
    { label: 'Recently Viewed', route: 'products' },
    { label: 'Compare Products', route: 'compare' },
    { label: 'Price Alerts', route: 'products' },
  ];

  const legalLinks = [
    { label: 'Affiliate Disclosure', route: 'affiliate-disclosure' },
    { label: 'Privacy Policy', route: 'privacy' },
    { label: 'Terms of Service', route: 'terms' },
    { label: 'Cookie Policy', route: 'privacy' },
    { label: 'Contact Us', route: 'contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61591752300472', label: 'Facebook', color: 'hover:bg-[#1877F2]' },
    { icon: Instagram, href: 'https://www.instagram.com/dawnwire/', label: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]' },
    { icon: Twitter, href: 'https://x.com/dawn_wire_', label: 'X', color: 'hover:bg-black' },
    { icon: Linkedin, href: 'https://linkedin.com/company/dawnwire', label: 'LinkedIn', color: 'hover:bg-[#0A66C2]' },
    { icon: Github, href: 'https://github.com/dawnwireofficial', label: 'GitHub', color: 'hover:bg-[#333]' },
  ];

  return (
    <footer className="bg-[#0B1120] text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#246BFF]/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#FF8A00]/5 blur-3xl" />
      </div>

      {/* Newsletter Bar */}
      <div className="relative z-10 -mb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#246BFF] via-[#164EE8] to-[#0A1F44] rounded-2xl py-8 md:py-10 px-6 md:px-12 shadow-[0_20px_60px_-20px_rgba(36,107,255,0.4)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20 mb-3">
                  <Mail className="h-3 w-3" />
                  Newsletter
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold text-white">
                  Stay Updated with the Best Deals & Expert Picks
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  Join 10,000+ smart shoppers who get our weekly picks.
                </p>
              </div>
              {subscribed ? (
                <div className="bg-white/20 text-white rounded-xl px-6 py-4 text-sm font-bold border border-white/20 shrink-0 flex items-center gap-2">
                  <span className="text-lg">✓</span> You're subscribed!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 shrink-0 w-full md:w-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 md:w-72 px-5 py-3.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#FF8A00] hover:bg-[#e67b00] text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shrink-0 flex items-center gap-2 shadow-[0_6px_20px_-4px_rgba(255,138,0,0.5)] hover:shadow-[0_8px_24px_-4px_rgba(255,138,0,0.6)] hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending...</> : <>Subscribe</>}
                  </button>
                </form>
              )}
            </div>
            <p className="text-[11px] text-white/40 mt-3 text-center md:text-left">No spam. Unsubscribe anytime. We may earn a commission on qualifying purchases.</p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="relative z-10 pt-28 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top: Logo + About + Social */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 mb-12">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img
                  src="/logo-transparent.png"
                  alt="DawnWire"
                  className="h-8 w-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mb-6">
                Independent product reviews, real-time price tracking, and AI-powered buying guides — built to help you shop smarter on Amazon.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <Mail className="h-4 w-4 text-[#246BFF]" />
                <a href="mailto:hello@dawnwire.com" className="text-white text-sm font-medium hover:text-[#246BFF] transition-colors">
                  hello@dawnwire.com
                </a>
              </div>

              {/* Social Links */}
              <div className="flex gap-2">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white ${social.color} transition-all duration-200 hover:scale-110 hover:-translate-y-0.5`}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
                {/* Pinterest */}
                <a
                  href="https://www.pinterest.com/dawnwireofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Pinterest"
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-[#E60023] transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                </a>
              </div>
            </div>

            {/* Link Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Explore */}
              <div>
                <h4 className="text-white font-bold text-sm mb-4">Explore Products</h4>
                <ul className="space-y-2.5">
                  {exploreLinks.map((link, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onNavigate(link.route, (link as any).params)}
                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 group"
                      >
                        <ArrowRight className="h-3 w-3 text-[#246BFF] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editorial */}
              <div>
                <h4 className="text-white font-bold text-sm mb-4">Editorial</h4>
                <ul className="space-y-2.5">
                  {editorLinks.map((link, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onNavigate(link.route)}
                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 group"
                      >
                        <ArrowRight className="h-3 w-3 text-[#246BFF] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Account */}
              <div>
                <h4 className="text-white font-bold text-sm mb-4">Account</h4>
                <ul className="space-y-2.5">
                  {accountLinks.map((link, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onNavigate(link.route)}
                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 group"
                      >
                        <ArrowRight className="h-3 w-3 text-[#246BFF] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-white font-bold text-sm mb-4">Legal</h4>
                <ul className="space-y-2.5">
                  {legalLinks.map((link, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onNavigate(link.route)}
                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1.5 group"
                      >
                        <ArrowRight className="h-3 w-3 text-[#246BFF] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#246BFF]" />
                <span>Independently Reviewed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>Real-Time Amazon Pricing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-emerald-400" />
                <span>Amazon Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span>Expert Buying Guides</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#4F7CFF]" />
                <span>Save More Every Day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-transparent.png"
                alt="DawnWire"
                className="h-6 w-auto opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} DawnWire. All rights reserved.
              </p>
            </div>
            <p className="text-gray-600 text-[11px] text-center md:text-right max-w-md">
              As an Amazon Associate, we earn from qualifying purchases. Product prices and availability are accurate as of the date indicated and are subject to change.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
