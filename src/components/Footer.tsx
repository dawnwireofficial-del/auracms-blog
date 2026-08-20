import { useState } from 'react';
import Link from 'vike-react';
import { Send, Mail, ArrowRight, Facebook, Twitter, Linkedin, Github, RefreshCw, Instagram } from 'lucide-react';
import { SiteSettings } from '../types';
import DigitalHorizon from './motion/DigitalHorizon';

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

  const companyLinks = [
    { label: 'About Us', route: 'about' },
    { label: 'Our Services', route: 'services' },
    { label: 'Portfolio', route: 'portfolio' },
    { label: 'Contact Us', route: 'contact' },
    { label: 'Advertise', route: 'advertise' },
  ];

  const serviceLinks = [
    { label: 'Content Strategy', route: 'services' },
    { label: 'SEO Growth', route: 'services' },
    { label: 'Affiliate Marketing', route: 'services' },
    { label: 'Product Reviews', route: 'products' },
    { label: 'Website Strategy', route: 'services' },
  ];

  const legalLinks = [
    { label: 'Editorial Policy', route: 'editorial-policy' },
    { label: 'Affiliate Disclosure', route: 'affiliate-disclosure' },
    { label: 'Privacy Policy', route: 'privacy' },
    { label: 'Terms of Service', route: 'terms' },
  ];

  return (
    <footer className="bg-[#041424] dark:bg-black relative overflow-hidden">
      <DigitalHorizon />
      {/* Newsletter Bar */}
      <div className="relative z-10 -mb-16">
        <div className="Container">
          <div className="bg-gradient-to-r from-primary2 to-primary3 rounded-[10px] py-6 md:py-10 px-6 md:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-display text-xl md:text-2xl font-bold text-white">
                  Get Deals & Reviews Weekly
                </h3>
                <p className="text-white/70 text-sm font-sans mt-1">
                  Product drops, price alerts, and honest reviews — in your inbox.
                </p>
              </div>
              {subscribed ? (
                <div className="bg-white/20 text-white rounded-full px-6 py-3 text-sm font-semibold border border-white/20 shrink-0">
                  You're subscribed! ✓
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 shrink-0 w-full md:w-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 md:w-64 px-5 py-3 rounded-full text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-white text-primary font-bold px-6 py-3 rounded-full text-sm hover:bg-gray-100 transition-all shrink-0 flex items-center gap-2 font-display uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <><RefreshCw className="h-4 w-4 animate-spin" /> SENDING...</> : <><Send className="h-4 w-4" /> Subscribe</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="pt-28 pb-8">
        <div className="Container">
          <div className="grid grid-cols-12 gap-8">
            {/* About */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <h4 className="font-display text-2xl text-white font-semibold mb-6">
                About DawnWire
              </h4>
              <p className="text-gray-400 font-sans text-sm leading-relaxed mb-5 max-w-xs">
                DawnWire is a technology growth platform covering AI, SEO, affiliate marketing,
                software reviews, web development, and digital business strategy.
              </p>
              <div className="flex items-center gap-2 mb-5">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:hello@dawnwire.com" className="text-white font-display text-base font-medium hover:text-primary transition-colors">
                  hello@dawnwire.com
                </a>
              </div>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61591752300472', label: 'Facebook' },
                  { icon: Instagram, href: 'https://www.instagram.com/dawnwire/', label: 'Instagram' },
                  { icon: Twitter, href: 'https://x.com/dawn_wire_', label: 'X (Twitter)' },
                  { icon: Linkedin, href: 'https://linkedin.com/company/dawnwire', label: 'LinkedIn' },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-primary2 hover:to-primary3 transition-all"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
                {/* Pinterest - custom icon since lucide doesn't have one */}
                <a
                  href="https://www.pinterest.com/dawnwireofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Pinterest"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                </a>
              </div>
            </div>

            {/* Company Links */}
            <div className="col-span-6 md:col-span-3 lg:col-span-2">
              <h4 className="font-display text-xl text-white font-semibold mb-6">
                Company
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link, i) => (
                  <li key={i}>
                    <button
                      onClick={() => onNavigate(link.route)}
                      className="flex items-center gap-2 text-gray-400 font-sans text-sm hover:text-primary transition-all group"
                    >
                      <ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div className="col-span-6 md:col-span-3 lg:col-span-3">
              <h4 className="font-display text-xl text-white font-semibold mb-6">
                Our Services
              </h4>
              <ul className="space-y-3">
                {serviceLinks.map((link, i) => (
                  <li key={i}>
                    <button
                      onClick={() => onNavigate(link.route)}
                      className="flex items-center gap-2 text-gray-400 font-sans text-sm hover:text-primary transition-all group"
                    >
                      <ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-12 lg:col-span-3">
              <h4 className="font-display text-xl text-white font-semibold mb-6">
                Legal
              </h4>
              <ul className="space-y-3">
                {legalLinks.map((link, i) => (
                  <li key={i}>
                    <button
                      onClick={() => onNavigate(link.route)}
                      className="flex items-center gap-2 text-gray-400 font-sans text-sm hover:text-primary transition-all group"
                    >
                      <ArrowRight className="h-3 w-3 text-primary opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="Container">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4">
            <p className="text-gray-500 font-sans text-sm">
              &copy; {new Date().getFullYear()} DawnWire. All rights reserved. Technology growth platform.
            </p>
            <div className="flex items-center gap-6">
              <button onClick={() => onNavigate('privacy')} className="text-gray-500 font-sans text-sm hover:text-primary transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => onNavigate('terms')} className="text-gray-500 font-sans text-sm hover:text-primary transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
