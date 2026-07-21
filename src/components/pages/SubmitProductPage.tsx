import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';

export default function SubmitProductPage() {
  const [form, setForm] = useState({
    productName: '', companyName: '', website: '', contactName: '', email: '',
    category: '', description: '', audience: '', pricingUrl: '', demoDetails: '',
    affiliateUrl: '', notes: '',
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.contactName, email: form.email, subject: 'Product Review Submission', message: JSON.stringify(form, null, 2) }),
      });
      setSent(true);
    } catch (e) { console.error(e) }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">Submit a Product for Review</h1>
        <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
          Have a SaaS product, AI tool, SEO platform, developer tool, or marketing product you want DawnWire to review?
        </p>
      </div>

      {sent ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-8 text-center">
          <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Submission Received</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">We'll review your product and be in touch if it's a good fit.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-6 md:p-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Product Name *</label>
              <input required id="submit-product-name" name="product_name" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Company Name *</label>
              <input required id="submit-company-name" name="company_name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Product Website *</label>
              <input required type="url" id="submit-website" name="website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Contact Name *</label>
              <input required id="submit-contact-name" name="contact_name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Email *</label>
              <input required type="email" id="submit-email" name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Product Category *</label>
              <select required id="submit-category" name="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white">
                <option value="">Select category</option>
                <option value="ai">AI Tool</option>
                <option value="saas">SaaS Platform</option>
                <option value="seo">SEO Tool</option>
                <option value="marketing">Marketing Software</option>
                <option value="developer">Developer Tool</option>
                <option value="productivity">Productivity</option>
                <option value="hosting">Web Hosting</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Short Product Description *</label>
            <textarea required id="submit-description" name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Target Audience</label>
            <input id="submit-audience" name="audience" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Pricing Page URL</label>
              <input type="url" id="submit-pricing-url" name="pricing_url" value={form.pricingUrl} onChange={e => setForm({ ...form, pricingUrl: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Affiliate Program URL</label>
              <input type="url" id="submit-affiliate-url" name="affiliate_url" value={form.affiliateUrl} onChange={e => setForm({ ...form, affiliateUrl: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block">Additional Notes</label>
            <textarea id="submit-notes" name="notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
          </div>
          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer">
            Submit for Review <Send className="w-4 h-4" />
          </button>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 text-center">
            Submitting a product does not guarantee publication. Reviews are created based on relevance, quality, editorial fit, and usefulness to readers.
          </p>
        </form>
      )}
    </div>
  );
}
