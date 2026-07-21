import { useState } from 'react';
import Link from 'vike-react';
import { Send, Mail, ArrowRight, Facebook, Twitter, Linkedin, Github, RefreshCw } from 'lucide-react';
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
                  { icon: Facebook, href: '#' },
                  { icon: Twitter, href: '#' },
                  { icon: Linkedin, href: '#' },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-primary2 hover:to-primary3 transition-all"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
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
