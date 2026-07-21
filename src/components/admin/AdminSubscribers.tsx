import React, { useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { NewsletterSubscriber } from '../../types';

interface AdminSubscribersProps {
  token: string;
  subscribers: NewsletterSubscriber[];
  onRefresh: () => void;
}

export default function AdminSubscribers({ token, subscribers, onRefresh }: AdminSubscribersProps) {
  const [showNewsletterComposer, setShowNewsletterComposer] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterHtml, setNewsletterHtml] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<string | null>(null);

  return (
    <div className="space-y-6" id="admin-workspace-subscribers">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{subscribers.length} subscriber(s)</p>
        <button
          onClick={() => { setShowNewsletterComposer(true); setNewsletterResult(null); }}
          className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-4 py-2.5 rounded-xl br-btn transition-all shadow-sm flex items-center gap-1.5"
          disabled={subscribers.length === 0}
        >
          <Send className="h-3.5 w-3.5" />
          Send Newsletter
        </button>
      </div>

      {showNewsletterComposer && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700/50 pb-3">
            <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">Compose Newsletter Broadcast</h3>
            <button onClick={() => setShowNewsletterComposer(false)} className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:text-zinc-300 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Subject Line</label>
            <input
              type="text"
              value={newsletterSubject}
              onChange={(e) => setNewsletterSubject(e.target.value)}
              placeholder="Weekly Digest: Top Engineering Insights"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">HTML Content</label>
            <textarea
              value={newsletterHtml}
              onChange={(e) => setNewsletterHtml(e.target.value)}
              placeholder="<h1>Your newsletter HTML here...</h1>"
              rows={10}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!newsletterSubject.trim() || !newsletterHtml.trim()) {
                  alert('Subject and content are required.');
                  return;
                }
                setNewsletterSending(true);
                setNewsletterResult(null);
                try {
                  const res = await fetch('/api/admin/newsletter/send', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ subject: newsletterSubject, html: newsletterHtml })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setNewsletterResult(`Sent to ${data.sent} of ${data.total} subscribers. ${data.failed > 0 ? `${data.failed} failed.` : ''}`);
                    setNewsletterSubject('');
                    setNewsletterHtml('');
                  } else {
                    setNewsletterResult(data.error || 'Failed to send.');
                  }
                } catch (e) {
                  setNewsletterResult('Network error.');
                } finally {
                  setNewsletterSending(false);
                }
              }}
              disabled={newsletterSending}
              className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-5 py-2.5 rounded-xl br-btn transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {newsletterSending ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button
              onClick={() => setShowNewsletterComposer(false)}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:text-zinc-200 font-medium px-3 py-2"
            >
              Cancel
            </button>
          </div>
          {newsletterResult && (
            <p className="text-xs text-green-600 font-medium bg-green-50 p-2.5 rounded-lg">{newsletterResult}</p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
              <th className="p-4 pl-6">Subscriber Email</th>
              <th className="p-4">Subscribed Date</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 dark:text-zinc-500">No active newsletter subscribers yet.</td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                  <td className="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-100">{sub.email}</td>
                  <td className="p-4 text-slate-500 dark:text-zinc-400">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={async () => {
                        if (confirm('Unsubscribe this reader?')) {
                          const res = await fetch(`/api/admin/subscribers/${sub.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) onRefresh();
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded br-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
