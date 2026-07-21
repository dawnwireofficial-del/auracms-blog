import React, { useState } from 'react';
import { Download, FileText, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { trackConversion } from '../lib/tracker';

interface ContentUpgradeCTAProps {
  upgrade: {
    id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    downloadCount: number;
  };
  postTitle: string;
}

export default function ContentUpgradeCTA({ upgrade, postTitle }: ContentUpgradeCTAProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloaded(true);
    trackConversion('content_upgrade_download', 1);
    try {
      await fetch(`/api/public/track/upgrade-download/${upgrade.id}`, { method: 'POST' });
    } catch (e) { console.error(e) }
    window.open(upgrade.fileUrl, '_blank', 'noopener');
  };

  const ext = upgrade.fileType.toLowerCase();
  const isPdf = ext === 'pdf';
  const isCsv = ext === 'csv' || ext === 'xlsx' || ext === 'xls';

  return (
    <div className="my-8 bg-gradient-to-br from-[#246BFF]/5 to-blue-50 dark:from-blue-950/20 dark:to-zinc-950/40 border border-[#246BFF]/20 dark:border-blue-800/30 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row">
        <div className="bg-gradient-to-br from-[#246BFF] to-blue-700 p-5 md:p-6 flex items-center justify-center md:w-28 shrink-0">
          <div className="bg-white/20 p-3 rounded-full" aria-hidden="true">
            <FileText className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="flex-1 p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#246BFF]" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#246BFF]">
              {isPdf ? 'Free PDF Guide' : isCsv ? 'Free Spreadsheet' : 'Free Resource'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-zinc-500">
              &middot; {upgrade.downloadCount.toLocaleString()} downloads
            </span>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-base md:text-lg leading-snug">
            {upgrade.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            {upgrade.description}
          </p>
          <button
            onClick={handleDownload}
            disabled={downloaded}
            className={`inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg transition-all ${
              downloaded
                ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800'
                : 'bg-[#246BFF] hover:bg-[#1A5AD6] text-white shadow-sm hover:shadow-md'
            }`}
            aria-label={downloaded ? 'Resource already downloaded' : `Download ${upgrade.title}`}
          >
            {downloaded ? (
              <><CheckCircle className="h-4 w-4" aria-hidden="true" /> Downloaded</>
            ) : (
              <><Download className="h-4 w-4" aria-hidden="true" /> Download{isPdf ? ' PDF' : ''} <ArrowRight className="h-3 w-3" aria-hidden="true" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
