import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES, LangCode } from '../lib/i18n';

interface Props {
  current: LangCode;
  onChange: (lang: LangCode) => void;
  compact?: boolean;
}

export default function LanguageSwitcher({ current, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all ${compact ? '' : 'px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
      >
        <Globe className="h-3.5 w-3.5" />
        {!compact && <span>{currentLang.flag} {currentLang.code.toUpperCase()}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-1.5 w-44 max-h-64 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code as LangCode); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  current === lang.code
                    ? 'bg-[#246BFF]/10 text-[#246BFF] dark:text-blue-300'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                <span className="ml-auto text-[10px] text-slate-400">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
