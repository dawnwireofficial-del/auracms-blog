import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { AffiliateLink } from '../../types';

interface AdminAffiliateProps {
  token: string;
  affiliateLinks: AffiliateLink[];
  onRefresh: () => void;
}

const makeSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminAffiliate({ token, affiliateLinks, onRefresh }: AdminAffiliateProps) {
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDestUrl, setLinkDestUrl] = useState('');
  const [linkAffUrl, setLinkAffUrl] = useState('');
  const [linkSlug, setLinkSlug] = useState('');
  const [linkButton, setLinkButton] = useState('Buy Now');
  const [linkDisclosure, setLinkDisclosure] = useState('');

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkDestUrl || !linkAffUrl || !linkSlug) return;

    const payload = {
      title: linkTitle,
      destinationUrl: linkDestUrl,
      affiliateUrl: linkAffUrl,
      shortSlug: linkSlug,
      buttonText: linkButton,
      disclosureText: linkDisclosure,
      noFollow: true,
      sponsored: true,
      openInNewTab: true,
      status: 'active'
    };

    const url = editingLink ? `/api/admin/affiliate/${editingLink.id}` : '/api/admin/affiliate';
    const method = editingLink ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCreatingLink(false);
        setEditingLink(null);
        setLinkTitle('');
        setLinkDestUrl('');
        setLinkAffUrl('');
        setLinkSlug('');
        setLinkButton('Buy Now');
        setLinkDisclosure('');
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save affiliate link.');
      }
    } catch (e) {
      alert('Error.');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this affiliate tracker?')) return;
    try {
      const res = await fetch(`/api/admin/affiliate/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Error deleting link.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-workspace-affiliate">
      <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm space-y-4 h-fit">
        <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">
          {editingLink ? 'Edit Cloaked Link' : 'Add Cloaked Link'}
        </h3>
        <form onSubmit={handleSaveLink} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Campaign Title</label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="e.g. Amazon Portable Multi Screen"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Cloaked Short Slug (e.g. /go/[slug])</label>
            <input
              type="text"
              value={linkSlug}
              onChange={(e) => setLinkSlug(makeSlug(e.target.value))}
              placeholder="multi-screen"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Affiliate Destination URL</label>
            <input
              type="url"
              value={linkAffUrl}
              onChange={(e) => setLinkAffUrl(e.target.value)}
              placeholder="https://amazon.com/example-link?tag=id"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Real Destination URL (Reference)</label>
            <input
              type="url"
              value={linkDestUrl}
              onChange={(e) => setLinkDestUrl(e.target.value)}
              placeholder="https://amazon.com/example-link"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Button text</label>
            <input
              type="text"
              value={linkButton}
              onChange={(e) => setLinkButton(e.target.value)}
              placeholder="Buy on Amazon"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
            />
          </div>

          <div className="flex gap-2">
            {editingLink && (
              <button
                type="button"
                onClick={() => {
                  setEditingLink(null);
                  setLinkTitle('');
                  setLinkDestUrl('');
                  setLinkAffUrl('');
                  setLinkSlug('');
                  setLinkButton('Buy Now');
                  onRefresh();
                }}
                className="flex-1 bg-slate-100 text-slate-600 dark:text-zinc-300 text-xs font-semibold py-2.5 rounded-xl br-btn"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold py-2.5 rounded-xl br-btn shadow-sm"
            >
              Save Partner Link
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
              <th className="p-4 pl-6">Campaign Info</th>
              <th className="p-4">Cloaked URL</th>
              <th className="p-4 text-center">Clicks</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {affiliateLinks.map((link) => (
              <tr key={link.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                <td className="p-4 pl-6">
                  <p className="font-bold text-slate-800 dark:text-zinc-100">{link.title}</p>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate block max-w-xs">{link.destinationUrl}</span>
                </td>
                <td className="p-4 font-mono text-[#246BFF] hover:underline">
                  <a href={`/go/${link.shortSlug}`} target="_blank" rel="noopener noreferrer">
                    /go/{link.shortSlug}
                  </a>
                </td>
                <td className="p-4 text-center font-bold text-slate-700 dark:text-zinc-200">{link.clickCount}</td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingLink(link);
                        setLinkTitle(link.title);
                        setLinkDestUrl(link.destinationUrl);
                        setLinkAffUrl(link.affiliateUrl);
                        setLinkSlug(link.shortSlug);
                        setLinkButton(link.buttonText);
                        setLinkDisclosure(link.disclosureText || '');
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 dark:text-zinc-300 rounded br-btn"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded br-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
