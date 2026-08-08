import React, { useState } from 'react';
import { Send, Check, Mail, MapPin } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export default function ContactPage({ onNavigate }: ContactPageProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(data?.error || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('A server error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
      <nav className="flex items-center gap-2 text-sm text-slate-400 font-sans mb-6">
        <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">Home</button>
        <span>/</span>
        <span className="text-slate-500 font-semibold">Contact Us</span>
      </nav>
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">Contact DawnWire</h1>
        <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed">
          Questions about our reviews, partnerships, or a product you'd like us to cover? Send us a message and we'll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-12">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1">Email</h3>
              <a href="mailto:hello@dawnwire.com" className="text-sm text-slate-500 dark:text-zinc-400 hover:text-primary transition-colors">hello@dawnwire.com</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-blue-900/40 flex items-center justify-center text-primary dark:text-blue-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white mb-1">Response Time</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">We typically respond within 1–2 business days.</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Looking to partner or advertise? Head to the <button onClick={() => onNavigate('advertise')} className="text-primary hover:underline font-semibold">Advertise</button> page, or{' '}
            <button onClick={() => onNavigate('submit-product')} className="text-primary hover:underline font-semibold">submit a product</button> for review.
          </div>
        </div>

        <div className="md:col-span-3">
          {sent ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-8 text-center">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">Message Sent</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Thank you for reaching out. We'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-6 md:p-8 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block" htmlFor="contact-name">Name *</label>
                  <input required id="contact-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block" htmlFor="contact-email">Email *</label>
                  <input required type="email" id="contact-email" name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block" htmlFor="contact-subject">Subject</label>
                <input id="contact-subject" name="subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1 block" htmlFor="contact-message">Message *</label>
                <textarea required id="contact-message" name="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white" />
              </div>
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}