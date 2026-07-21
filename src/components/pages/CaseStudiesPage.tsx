import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function CaseStudiesPage({ onNavigate }: { onNavigate: (route: string, param?: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
      <h1 className="font-display font-bold text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">Case Studies</h1>
      <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8">
        Examples of how content, SEO, affiliate marketing, and website strategy can support growth.
      </p>
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-zinc-800 rounded-xl p-10 md:p-16">
        <p className="text-slate-500 dark:text-zinc-400 mb-6">
          Case studies are coming soon. To discuss a project, partner with DawnWire.
        </p>
        <button onClick={() => onNavigate('advertise')} className="inline-flex items-center gap-2 bg-[#246BFF] hover:bg-blue-600 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all cursor-pointer">
          Start a Growth Project <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
