import React, { useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Target } from 'lucide-react';

interface SeoScoreCheckerProps {
  title: string;
  description: string;
  focusKeyword: string;
  content: string;
  slug: string;
}

interface SeoCheckResult {
  score: number;
  checks: { label: string; passed: boolean; critical: boolean }[];
}

function analyze(title: string, description: string, kw: string, content: string, slug: string): SeoCheckResult {
  const t = (title || '').toLowerCase();
  const d = (description || '').toLowerCase();
  const c = (content || '').toLowerCase();
  const keyword = (kw || '').toLowerCase().trim();
  const s = (slug || '').toLowerCase();
  const words = c.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const headings = (c.match(/#{1,3}\s.+?(?:\n|$)/g) || []).map(h => h.toLowerCase());
  const sentences = c.split(/[.!?]+\s/).filter(Boolean);
  const avgSent = sentences.length > 0 ? Math.round(wc / sentences.length) : 0;

  const checks: { label: string; passed: boolean; critical: boolean }[] = [];

  const add = (label: string, pass: boolean, crit: boolean) => checks.push({ label, passed: pass, critical: crit });

  add('Focus keyword in SEO title', keyword ? t.includes(keyword) : true, true);
  add('Focus keyword in meta description', keyword ? d.includes(keyword) : true, false);
  add('Focus keyword in first 200 chars', keyword ? c.substring(0, 200).includes(keyword) : true, false);
  add('Focus keyword in URL slug', keyword ? s.replace(/-/g, ' ').includes(keyword) : true, false);
  add('Focus keyword in H1/H2', keyword ? headings.some(h => h.includes(keyword)) : true, false);
  add('SEO title length (30-60 chars)', t.length >= 30 && t.length <= 60, false);
  add('Meta description length (120-160 chars)', d.length >= 120 && d.length <= 160, false);
  add('Minimum 300 words', wc >= 300, true);
  add('Heading structure (has H1/H2)', headings.length > 0, false);
  add('Readable sentences (<25 words avg)', avgSent <= 25, false);

  const passed = checks.filter(c => c.passed).length;
  const score = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;

  return { score, checks };
}

export default function SeoScoreChecker({ title, description, focusKeyword, content, slug }: SeoScoreCheckerProps) {
  const result = useMemo(() => analyze(title, description, focusKeyword, content, slug), [title, description, focusKeyword, content, slug]);

  const scoreColor = result.score >= 80 ? 'text-green-600' : result.score >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = result.score >= 80 ? 'bg-green-50 border-green-200' : result.score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className={`rounded-lg border p-3 mt-2 ${scoreBg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">SEO Score</span>
        </div>
        <span className={`text-lg font-black ${scoreColor}`}>{result.score}%</span>
      </div>
      <div className="w-full bg-white rounded-full h-1.5 mb-3 border border-slate-200">
        <div
          className={`h-full rounded-full transition-all ${result.score >= 80 ? 'bg-green-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${result.score}%` }}
        />
      </div>
      <div className="space-y-1">
        {result.checks.map((check, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            {check.passed ? (
              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
            ) : check.critical ? (
              <XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
            )}
            <span className={check.passed ? 'text-green-700' : check.critical ? 'text-red-700' : 'text-amber-700'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
