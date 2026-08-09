import React, { useState } from 'react';
import { Sparkles, Check, X, Loader2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

interface MetaSuggestion {
  title: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  tags: string[];
  reasoning: string;
}

interface SeoAssistantProps {
  token: string;
  postTitle: string;
  postContent: string;
  currentFocus?: string;
  onApply: (suggestion: MetaSuggestion) => void;
}

export default function SeoAssistant({ token, postTitle, postContent, currentFocus, onApply }: SeoAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<MetaSuggestion | null>(null);
  const [error, setError] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  async function generateSuggestions() {
    if (!postTitle || !postContent) {
      setError('Post title and content are required');
      return;
    }
    setLoading(true);
    setError('');
    setSuggestion(null);
    try {
      const res = await fetch('/api/admin/seo/suggest-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: postTitle, content: postContent, currentFocus }),
      });
      const data = await res.json();
      if (data.success && data.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        setError(data.error || 'Failed to generate suggestions');
      }
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-dw-blue/10 to-dw-orange/10 dark:from-blue-900/20 dark:to-orange-900/20 border border-dashed border-dw-blue/40 dark:border-blue-800 rounded-xl p-4 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-orange-100 dark:hover:from-blue-900/30 dark:hover:to-orange-900/30 transition-all cursor-pointer"
      >
        <Sparkles className="h-4 w-4" />
        Open AI SEO Assistant
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-dw-blue/10 to-dw-orange/10 dark:from-blue-900/15 dark:to-orange-900/15 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI SEO Assistant
        </h4>
        <button
          onClick={() => { setShowPanel(false); setSuggestion(null); setError(''); }}
          className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!suggestion && !loading && (
        <div className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
          Analyzes your post content and suggests optimized SEO metadata — title, description, focus keyword, slug, and tags.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing with AI...
        </div>
      ) : suggestion ? (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <SuggestionRow label="Title" value={suggestion.title} current={postTitle} />
            <SuggestionRow label="Meta Description" value={suggestion.metaDescription} />
            <SuggestionRow label="Focus Keyword" value={suggestion.focusKeyword} current={currentFocus} />
            <SuggestionRow label="Slug" value={suggestion.slug} />
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 w-24 shrink-0 pt-0.5">Tags</span>
              <div className="flex flex-wrap gap-1">
                {suggestion.tags.map((t, i) => (
                  <span key={i} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic">{suggestion.reasoning}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onApply(suggestion)}
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              <Check className="h-3 w-3" />
              Apply All
            </button>
            <button
              onClick={generateSuggestions}
              className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !suggestion && (
        <button
          onClick={generateSuggestions}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate SEO Suggestions
        </button>
      )}
    </div>
  );
}

function SuggestionRow({ label, value, current }: { label: string; value: string; current?: string }) {
  const isBetter = current && current !== value && current.length > 0;
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 w-24 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-700 dark:text-zinc-200 leading-snug">{value}</p>
        {isBetter && (
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
            <ArrowRight className="h-2.5 w-2.5" />
            Was: {current.substring(0, 60)}{current.length > 60 ? '...' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
