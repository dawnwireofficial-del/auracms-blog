import React, { useState } from 'react';
import { ArrowRight, Send, Check } from 'lucide-react';

export default function AdvertisePage({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', website: '', interest: '', budget: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, subject: 'Partnership Inquiry' }),
      });
      setSent(true);
    } catch (e) { console.error(e) }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">Advertise With DawnWire</h1>
        <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
          Reach technology-focused readers interested in SaaS, AI tools, SEO, affiliate marketing, software, web development, and digital business growth.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Partnership Options</h2>
            <ul className="space-y-3">
              {[
                'Sponsored articles', 'Product reviews', 'Newsletter sponsorships',
                'Affiliate partnerships', 'Buying guide placement', 'Comparison content', 'Content strategy partnerships',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Our Audience</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Our audience includes founders, marketers, affiliate marketers, SaaS buyers, technology enthusiasts, creators, developers, and business owners looking for useful digital tools and growth strategies.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Why Partner</h2>
            <ul className="space-y-3">
              {[
                'Reach high-intent readers', 'Build trust through useful content',
                'Support SEO visibility', 'Generate qualified interest', 'Educate buyers before they convert',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          {sent ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-8 text-center">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Thank You</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">We'll review your inquiry and get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-6 md:p-8 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Name</label>
                  <input required id="advertise-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Company</label>
                  <input id="advertise-company" name="company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Email</label>
                  <input required type="email" id="advertise-email" name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Website</label>
                  <input id="advertise-website" name="website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Partnership Interest</label>
                <select id="advertise-interest" name="interest" value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white">
                  <option value="">Select an option</option>
                  <option value="sponsored">Sponsored Article</option>
                  <option value="review">Product Review</option>
                  <option value="newsletter">Newsletter Sponsorship</option>
                  <option value="affiliate">Affiliate Partnership</option>
                  <option value="content">Content Strategy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Budget Range</label>
                <select id="advertise-budget" name="budget" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white">
                  <option value="">Select a range</option>
                  <option value="under1k">Under $1,000</option>
                  <option value="1k-5k">$1,000 - $5,000</option>
                  <option value="5k-10k">$5,000 - $10,000</option>
                  <option value="10k+">$10,000+</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Message</label>
                <textarea id="advertise-message" name="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer">
                Partner With DawnWire <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
