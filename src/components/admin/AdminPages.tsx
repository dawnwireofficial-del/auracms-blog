import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Page } from '../../types';

interface AdminPagesProps {
  token: string;
  pages: Page[];
  onRefresh: () => void;
}

const makeSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminPages({ token, pages, onRefresh }: AdminPagesProps) {
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageStatus, setPageStatus] = useState<'draft' | 'published'>('draft');
  const [pageSeoTitle, setPageSeoTitle] = useState('');
  const [pageSeoDescription, setPageSeoDescription] = useState('');

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle || !pageSlug || !pageContent) return;

    const payload = {
      title: pageTitle,
      slug: pageSlug,
      content: pageContent,
      status: pageStatus,
      seoTitle: pageSeoTitle || undefined,
      seoDescription: pageSeoDescription || undefined
    };

    const url = editingPage ? `/api/admin/pages/${editingPage.id}` : '/api/admin/pages';
    const method = editingPage ? 'PUT' : 'POST';

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
        setIsCreatingPage(false);
        setEditingPage(null);
        setPageTitle('');
        setPageSlug('');
        setPageContent('');
        setPageSeoTitle('');
        setPageSeoDescription('');
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save page.');
      }
    } catch (e) {
      alert('Error.');
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('Permanently delete this page?')) return;
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Error.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-workspace-pages">
      <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm space-y-4 h-fit">
        <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">
          {editingPage ? 'Edit Page' : 'Create Static Page'}
        </h3>
        <form onSubmit={handleSavePage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => {
                setPageTitle(e.target.value);
                if (!editingPage) setPageSlug(makeSlug(e.target.value));
              }}
              placeholder="About Us"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Slug</label>
            <input
              type="text"
              value={pageSlug}
              onChange={(e) => setPageSlug(makeSlug(e.target.value))}
              placeholder="about"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Page Content (Markdown)</label>
            <textarea
              value={pageContent}
              onChange={(e) => setPageContent(e.target.value)}
              placeholder="Write your static page content..."
              rows={8}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Status</label>
            <select
              value={pageStatus}
              onChange={(e: any) => setPageStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input bg-white dark:bg-zinc-800/50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <h5 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">SEO Metadata</h5>
            <div className="space-y-2">
              <input
                type="text"
                value={pageSeoTitle}
                onChange={(e) => setPageSeoTitle(e.target.value)}
                placeholder="SEO Title (optional)"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none br-input"
              />
              <textarea
                value={pageSeoDescription}
                onChange={(e) => setPageSeoDescription(e.target.value)}
                placeholder="SEO Description (optional)"
                rows={2}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none br-input"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editingPage && (
              <button
                type="button"
                onClick={() => {
                  setEditingPage(null);
                  setPageTitle('');
                  setPageSlug('');
                  setPageContent('');
                  setPageSeoTitle('');
                  setPageSeoDescription('');
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
              Save Page
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
              <th className="p-4 pl-6">Title</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {pages.map((pg) => (
              <tr key={pg.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                <td className="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-100">{pg.title}</td>
                <td className="p-4 font-mono text-slate-500 dark:text-zinc-400">/page/{pg.slug}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    pg.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pg.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingPage(pg);
                        setPageTitle(pg.title);
                        setPageSlug(pg.slug);
                        setPageContent(pg.content);
                        setPageStatus(pg.status);
                        setPageSeoTitle((pg as any).seoTitle || '');
                        setPageSeoDescription((pg as any).seoDescription || '');
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 dark:text-zinc-300 rounded br-btn"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(pg.id)}
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
