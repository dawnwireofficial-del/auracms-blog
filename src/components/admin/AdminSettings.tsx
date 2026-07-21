import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';

interface AdminSettingsProps {
  token: string;
  settings: SiteSettings | null;
  onRefresh: () => void;
}

export default function AdminSettings({ token, settings, onRefresh }: AdminSettingsProps) {
  const [siteName, setSiteName] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteDisclosure, setSiteDisclosure] = useState('');
  const [siteRobotsTxt, setSiteRobotsTxt] = useState('');
  const [analyticsGaId, setAnalyticsGaId] = useState('');
  const [analyticsGtmId, setAnalyticsGtmId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [searchConsoleVerification, setSearchConsoleVerification] = useState('');
  const [customHeadScripts, setCustomHeadScripts] = useState('');
  const [customFooterScripts, setCustomFooterScripts] = useState('');

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName);
      setSiteTagline(settings.siteTagline || '');
      setSiteDisclosure(settings.affiliateDisclosureText || '');
      setSiteRobotsTxt((settings as any).robotsTxt || '');
      setAnalyticsGaId((settings as any).analyticsGaId || '');
      setAnalyticsGtmId((settings as any).analyticsGtmId || '');
      setMetaPixelId((settings as any).metaPixelId || '');
      setSearchConsoleVerification((settings as any).searchConsoleVerification || '');
      setCustomHeadScripts((settings as any).customHeadScripts || '');
      setCustomFooterScripts((settings as any).customFooterScripts || '');
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteName,
          siteTagline,
          affiliateDisclosureText: siteDisclosure,
          robotsTxt: siteRobotsTxt,
          analyticsGaId,
          analyticsGtmId,
          metaPixelId,
          searchConsoleVerification,
          customHeadScripts,
          customFooterScripts
        })
      });
      if (res.ok) {
        alert('Site configuration updated successfully.');
        onRefresh();
      }
    } catch (e) {
      alert('Error.');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm max-w-2xl" id="admin-workspace-settings">
      <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 mb-6 text-sm">Global Website & SEO Configuration</h3>
      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Site Brand Title</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Site Marketing Tagline</label>
          <input
            type="text"
            value={siteTagline}
            onChange={(e) => setSiteTagline(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Global Affiliate Disclosure notice</label>
          <textarea
            value={siteDisclosure}
            onChange={(e) => setSiteDisclosure(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Custom robots.txt Rules</label>
          <textarea
            value={siteRobotsTxt}
            onChange={(e) => setSiteRobotsTxt(e.target.value)}
            rows={4}
            placeholder="Disallow: /private&#10;Allow: /public"
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs"
          />
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">These rules will be appended to the default robots.txt. One rule per line.</p>
        </div>

        <div className="border-t border-slate-100 dark:border-zinc-700/50 pt-4 mt-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider">Analytics & Conversion Tracking</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Google Analytics 4 ID</label>
              <input type="text" value={analyticsGaId} onChange={(e) => setAnalyticsGaId(e.target.value)}
                placeholder="G-XXXXXXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Google Tag Manager ID</label>
              <input type="text" value={analyticsGtmId} onChange={(e) => setAnalyticsGtmId(e.target.value)}
                placeholder="GTM-XXXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Meta Pixel ID</label>
              <input type="text" value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="1234567890" className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Google Search Console Verification</label>
              <input type="text" value={searchConsoleVerification} onChange={(e) => setSearchConsoleVerification(e.target.value)}
                placeholder="verification_token" className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Custom Head Scripts (injected before &lt;/head&gt;)</label>
            <textarea value={customHeadScripts} onChange={(e) => setCustomHeadScripts(e.target.value)}
              rows={3} placeholder="&lt;script&gt;console.log('head script')&lt;/script&gt;"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Custom Footer Scripts (injected before &lt;/body&gt;)</label>
            <textarea value={customFooterScripts} onChange={(e) => setCustomFooterScripts(e.target.value)}
              rows={3} placeholder="&lt;script&gt;console.log('footer script')&lt;/script&gt;"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none br-input font-mono text-xs" />
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-zinc-700/50 pt-4 mt-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-2">Browser Extension API Token</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={token}
              onClick={(e) => { (e.target as HTMLInputElement).select(); navigator.clipboard.writeText(token); }}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-xs font-mono focus:outline-none br-input bg-slate-50 dark:bg-zinc-900 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(token); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-zinc-300 text-xs font-semibold px-4 py-3 rounded-xl br-btn transition-colors shrink-0"
            >
              Copy
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">This token is used by the DawnWire Browser Extension to authenticate API requests. Click to copy, then paste into the extension settings.</p>
        </div>

        <button
          type="submit"
          className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-5 py-3 rounded-xl br-btn shadow-sm transition-all"
        >
          Save Platform Settings
        </button>
      </form>
    </div>
  );
}
