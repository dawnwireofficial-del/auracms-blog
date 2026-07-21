import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiVerdictCardProps {
  verdict: string;
}

export default function AiVerdictCard({ verdict }: AiVerdictCardProps) {
  if (!verdict) return null;

  return (
    <div className="mt-4 p-4 glass-panel rounded-xl shadow-lg border border-[#246BFF]/30 bg-gradient-to-r from-[#246BFF]/5 to-transparent relative overflow-hidden">
      <div className="absolute -right-4 -top-4 bg-[#246BFF]/10 w-24 h-24 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="bg-[#246BFF]/20 p-2 rounded-lg shrink-0">
          <Sparkles className="h-5 w-5 text-[#246BFF]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            AI Verdict
            <span className="bg-[#246BFF] text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider">Beta</span>
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
            {verdict}
          </p>
        </div>
      </div>
    </div>
  );
}
