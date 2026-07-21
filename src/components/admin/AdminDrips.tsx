import React, { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import { NewsletterSubscriber } from '../../types';

interface AdminDripsProps {
  token: string;
  subscribers: NewsletterSubscriber[];
}

export default function AdminDrips({ token, subscribers }: AdminDripsProps) {
  const [dripProcessing, setDripProcessing] = useState(false);
  const [dripResult, setDripResult] = useState<string | null>(null);

  return (
    <div className="space-y-6" id="admin-workspace-drips">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">Email Drip Campaigns</h3>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Automated email sequences sent to new subscribers</p>
        </div>
        <button
          onClick={async () => {
            setDripProcessing(true);
            setDripResult(null);
            try {
              const res = await fetch('/api/admin/drip/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (res.ok) setDripResult(`Processed: ${data.processed}, Sent: ${data.sent}, Failed: ${data.failed}`);
              else setDripResult(data.error || 'Failed');
            } catch { setDripResult('Network error'); }
            setDripProcessing(false);
          }}
          disabled={dripProcessing}
          className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl br-btn transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          aria-label="Process pending drip emails"
        >
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          {dripProcessing ? 'Processing...' : 'Process Drips Now'}
        </button>
      </div>

      {dripResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium p-3 rounded-xl">
          {dripResult}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
        <h4 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-xs mb-4 uppercase tracking-wider">Drip Sequence</h4>
        <div className="space-y-3">
          {[
            { step: 1, subject: 'Welcome Email', desc: 'Sent immediately after subscription', delay: '0 days' },
            { step: 2, subject: 'Top Articles', desc: 'Popular content recommendations', delay: '2 days' },
            { step: 3, subject: 'Tool Recommendations', desc: 'Curated tools and resources', delay: '5 days' },
            { step: 4, subject: 'Member Deals', desc: 'Exclusive offers and discounts', delay: '10 days' },
            { step: 5, subject: 'Re-engagement', desc: 'Win-back inactive subscribers', delay: '21 days' },
          ].map((email, i) => (
            <div key={email.step} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                i === 0 ? 'bg-green-500' : i < 3 ? 'bg-[#246BFF]' : 'bg-amber-500'
              }`}>{email.step}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{email.subject}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">{email.desc}</p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono whitespace-nowrap">{email.delay}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
        <h4 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-xs mb-4 uppercase tracking-wider">Subscriber Progress</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
                <th className="p-3 pl-4">Email</th>
                <th className="p-3">Drip Step</th>
                <th className="p-3">Last Sent</th>
                <th className="p-3">Next Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-zinc-500">No subscribers yet.</td>
                </tr>
              ) : (
                subscribers.map(sub => {
                  const step = sub.dripStep || 0;
                  const nextStep = step >= 5 ? null : step + 1;
                  const delayDays = [0, 0, 2, 5, 10, 21];
                  const due = nextStep && sub.dripLastSentAt
                    ? (Date.now() - new Date(sub.dripLastSentAt).getTime()) >= (delayDays[nextStep] * 24 * 60 * 60 * 1000)
                    : nextStep === 1 && step === 0;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                      <td className="p-3 pl-4 font-medium text-slate-800 dark:text-zinc-100">{sub.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          step === 0 ? 'bg-slate-100 text-slate-500 dark:text-zinc-400' :
                          step >= 5 ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {step >= 5 ? <><Check className="w-2.5 h-2.5" /> Complete</> : `Step ${step}/5`}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-zinc-400">
                        {sub.dripLastSentAt ? new Date(sub.dripLastSentAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        {nextStep ? (
                          <span className={`text-[10px] ${due ? 'text-green-600 font-semibold' : 'text-slate-400 dark:text-zinc-500'}`}>
                            {due ? 'Ready' : `Step ${nextStep} in ${delayDays[nextStep]}d`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 font-semibold">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
