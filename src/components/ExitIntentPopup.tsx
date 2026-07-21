import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface ExitIntentPopupProps {
  delay?: number;
  siteName?: string;
}

export default function ExitIntentPopup({ delay = 8000, siteName = 'DawnWire' }: ExitIntentPopupProps) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dismissed, setDismissed] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || dismissed) return;

    const timer = setTimeout(() => {
      if (!dismissed && !firedRef.current) {
        firedRef.current = true;
        setShow(true);
      }
    }, delay);

    const handleMouseLeave = (e: MouseEvent) => {
      if (firedRef.current || dismissed) return;
      if (e.clientY <= 0) {
        firedRef.current = true;
        clearTimeout(timer);
        setShow(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timer);
    };
  }, [delay, dismissed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => { setShow(false); setDismissed(true); }, 2500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="exit-popup-title" aria-describedby="exit-popup-desc">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShow(false); setDismissed(true); }} aria-hidden="true" />
      <div className="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-700/60 max-w-lg w-full overflow-hidden">
        <button
          onClick={() => { setShow(false); setDismissed(true); }}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 dark:hover:text-white p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-lg transition-all z-10"
          aria-label="Close subscription popup"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="bg-gradient-to-br from-[#246BFF] to-blue-700 p-6 md:p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Exclusive Content</span>
          </div>
          <h3 id="exit-popup-title" className="font-display font-bold text-xl md:text-2xl tracking-tight leading-tight">
            Don't Miss Our Best Content
          </h3>
          <p id="exit-popup-desc" className="text-white/80 text-sm mt-2 max-w-md">
            Get expert buying guides, product comparisons, and exclusive deals delivered to your inbox.
          </p>
        </div>

        <div className="p-6 md:p-8">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="bg-green-100 dark:bg-green-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-lg">You're In!</h4>
              <p className="text-slate-500 text-sm mt-1">Check your inbox for a confirmation email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="exit-popup-email" className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    id="exit-popup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    className="w-full br-input border border-slate-200 dark:border-zinc-700 p-3 pl-10 text-sm bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white"
                  />
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#246BFF] hover:bg-[#1A5AD6] text-white font-semibold text-sm py-3 br-btn transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === 'loading' ? 'Subscribing...' : (
                  <>Subscribe <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center">
                No spam, ever. Unsubscribe anytime. Read our <a href="/privacy" className="underline text-[#246BFF]" target="_blank">Privacy Policy</a>.
              </p>
              {status === 'error' && (
                <p className="text-red-500 text-xs text-center font-semibold">Something went wrong. Try again.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
