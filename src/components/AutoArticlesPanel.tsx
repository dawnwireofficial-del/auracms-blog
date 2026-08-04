import React, { useEffect, useState } from 'react';
import {
  Sparkles, Loader2, Play, Settings2, Check, X, Package, Image as ImageIcon,
  Eye, RefreshCw, Zap, FileText, Cloud,
} from 'lucide-react';
import { proxyImageUrl } from '../utils/safeRender';

type ImageProvider = 'auto' | 'gemini' | 'cloudflare';

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  withArticle: number;
  missingArticle: number;
  postCount: number;
  publishedPosts: number;
  draftPosts: number;
  dailyLimit: number;
  generatedToday: number;
  config: Config;
}

interface Config {
  enabled: boolean;
  intervalMinutes: number;
  batchSize: number;
  dailyLimit: number;
  status: 'published' | 'draft';
  withImage: boolean;
  minScore: number;
  imageModel: string;
  imageApiKey: string;
  imageProvider: ImageProvider;
  imageAccountId: string;
  imageApiKeySet?: boolean;
}

interface ImageTestResult {
  ok?: boolean;
  message?: string;
  error?: string;
}

interface RunResult {
  productId: string;
  productName?: string;
  productImage?: string;
  postId?: string;
  slug?: string;
  title?: string;
  status?: string;
  featuredImage?: string;
  image?: { generated: boolean; source: string; fallback: string };
  skipped?: string;
  error?: string;
}

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

export default function AutoArticlesPanel({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cfg, setCfg] = useState<Config | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Run-now form
  const [runLimit, setRunLimit] = useState(5);
  const [runStatus, setRunStatus] = useState<'published' | 'draft'>('published');
  const [runWithImage, setRunWithImage] = useState(true);
  const [runOnlyMissing, setRunOnlyMissing] = useState(true);
  const [runMinScore, setRunMinScore] = useState(6);

  // Image-generation API key
  const [keyInput, setKeyInput] = useState('');
  const [accountIdInput, setAccountIdInput] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyTest, setKeyTest] = useState<ImageTestResult | null>(null);

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/seo/auto-articles/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
      if (data.config) {
        setCfg(data.config);
        setRunLimit(data.config.batchSize || 5);
        setRunStatus(data.config.status || 'published');
        setRunWithImage(data.config.withImage !== false);
        setRunMinScore(data.config.minScore ?? 6);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { loadStats(); }, []);

  async function testImageKey() {
    setKeyTest(null);
    setTestingKey(true);
    try {
      const res = await fetch('/api/admin/seo/auto-articles/test-image-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: keyInput, provider: cfg?.imageProvider, accountId: accountIdInput }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Test failed');
      setKeyTest(body);
    } catch (e: any) {
      setKeyTest({ ok: false, error: e.message });
    }
    setTestingKey(false);
  }

  async function saveConfig() {
    if (!cfg) return;
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo/auto-articles/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...cfg, imageApiKey: keyInput, imageAccountId: accountIdInput }),
      });
      if (!res.ok) throw new Error('Failed to save config');
      setMsg('Auto-article settings saved.');
      setKeyInput('');
      setAccountIdInput('');
      setKeyTest(null);
      loadStats();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function runNow() {
    setMsg(null);
    setError(null);
    setRunning(true);
    try {
      const res = await fetch('/api/admin/seo/auto-articles/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          limit: runLimit,
          status: runStatus,
          withImage: runWithImage,
          onlyMissing: runOnlyMissing,
          minScore: runMinScore,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Run failed');
      setResults(body.results || []);
      setMsg(`Run complete — processed ${body.processed} product${body.processed === 1 ? '' : 's'}.`);
      loadStats();
    } catch (e: any) {
      setError(e.message);
    }
    setRunning(false);
  }

  const ok = stats ? stats.missingArticle : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Auto Article Factory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI writes an SEO article + a design image for every published product — automatically. Image provider: Cloudflare Workers AI or Gemini.
          </p>
        </div>
        <button onClick={loadStats} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {!stats ? (
        <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading stats...
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Products', value: stats.totalProducts, color: 'text-slate-900 dark:text-slate-100' },
              { label: 'Published', value: stats.publishedProducts, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Have Article', value: stats.withArticle, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Missing Article', value: ok, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Posts Published', value: stats.publishedPosts, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: `Generated Today`, value: `${stats.generatedToday}/${stats.dailyLimit}`, color: 'text-violet-600 dark:text-violet-400' },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{s.label}</div>
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Image Generation API Key */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-violet-500" /> Image Generation
            </h3>
            <div>
              <label className={labelCls}>Provider</label>
              <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                {([
                  { id: 'auto', label: 'Auto', hint: 'Cloudflare → Gemini' },
                  { id: 'cloudflare', label: 'Cloudflare', hint: 'Workers AI (free)' },
                  { id: 'gemini', label: 'Gemini', hint: 'Image model / Imagen' },
                ] as { id: ImageProvider; label: string; hint: string }[]).map((p) => (
                  <button key={p.id} onClick={() => setCfg({ ...cfg!, imageProvider: p.id })}
                    title={p.hint}
                    className={`flex-1 px-4 py-2 text-xs font-bold capitalize ${cfg?.imageProvider === p.id ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <Cloud className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-orange-500" />
              <b>Cloudflare</b> — free Workers AI image generation (Flux 1 Schnell). Paste your Cloudflare API token (<code className="font-mono">cfut_...</code>) and your Account ID (from <code className="font-mono">dash.cloudflare.com</code>, the hex string before <code className="font-mono">/ai/</code>).
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setKeyTest(null); }}
                placeholder={cfg?.imageApiKeySet ? '•••••••••• (a key is saved) — paste a new key to replace it' : cfg?.imageProvider === 'cloudflare' ? 'Paste your Cloudflare API token (cfut_...)' : 'Paste your Gemini image-generation API key'}
                autoComplete="off"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={accountIdInput}
                onChange={(e) => { setAccountIdInput(e.target.value); setKeyTest(null); }}
                placeholder={cfg?.imageAccountId ? `Cloudflare Account ID (saved: ${cfg.imageAccountId.substring(0, 8)}…)` : 'Cloudflare Account ID (required for Cloudflare provider)'}
                autoComplete="off"
                className={inputCls}
              />
              <button
                onClick={testImageKey}
                disabled={testingKey}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50"
              >
                {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {testingKey ? 'Testing...' : 'Test Key'}
              </button>
              <button
                onClick={saveConfig}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
            </div>
            {cfg?.imageApiKeySet && !keyInput && (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> Image generation API key is configured.
              </div>
            )}
            {keyTest && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 ${keyTest.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'}`}>
                {keyTest.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                <span>{keyTest.ok ? (keyTest.message || 'API key is valid.') : (keyTest.error || 'Key rejected.')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Run Now */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-500" /> Generate Now
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Batch Size</label>
                  <input type="number" min={1} max={20} value={runLimit} onChange={(e) => setRunLimit(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Editor Score</label>
                  <input type="number" min={0} max={10} value={runMinScore} onChange={(e) => setRunMinScore(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Publish Status</label>
                <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                  {(['published', 'draft'] as const).map((s) => (
                    <button key={s} onClick={() => setRunStatus(s)}
                      className={`flex-1 px-4 py-2 text-xs font-bold capitalize ${runStatus === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>
                      {s === 'published' ? 'Publish Now' : 'Save Draft'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={runWithImage} onChange={(e) => setRunWithImage(e.target.checked)} className="accent-blue-600" />
                  Generate AI design image (uses product photo as reference)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={runOnlyMissing} onChange={(e) => setRunOnlyMissing(e.target.checked)} className="accent-blue-600" />
                  Only products without an article
                </label>
              </div>
              <button
                onClick={runNow}
                disabled={running}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-extrabold rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {running ? 'Generating Articles...' : `Generate ${runLimit} Articles`}
              </button>
            </div>

            {/* Auto-schedule */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-blue-500" /> Auto-Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When enabled, the server automatically generates articles in the background on an interval, up to the daily limit.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Automatic generation</span>
                  <button onClick={() => { setCfg({ ...cfg!, enabled: !cfg!.enabled }); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${cfg?.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg?.enabled ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Interval (minutes)</label>
                    <input type="number" min={5} value={cfg?.intervalMinutes || 30} onChange={(e) => setCfg({ ...cfg!, intervalMinutes: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Daily Limit</label>
                    <input type="number" min={1} value={cfg?.dailyLimit || 50} onChange={(e) => setCfg({ ...cfg!, dailyLimit: Number(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={cfg?.withImage !== false} onChange={(e) => setCfg({ ...cfg!, withImage: e.target.checked })} className="accent-blue-600" />
                  Generate design images
                </label>
              </div>
              <button onClick={saveConfig} className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                <Check className="w-4 h-4" /> Save Schedule Settings
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" /> Last Run Results
              </h3>
              {results.length > 0 && <span className="text-xs text-slate-400">{results.length} products</span>}
            </div>
            {results.length === 0 ? (
              <div className="px-5 py-14 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                <Package className="w-8 h-8 opacity-40" />
                No runs yet. Hit "Generate Now" to create articles automatically.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r, i) => (
                  <div key={r.productId + '-' + i} className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {r.productImage ? (
                        <img src={proxyImageUrl(r.productImage)} alt="" className="w-12 h-12 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Package className="w-5 h-5" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">{r.productName}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {r.error && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">FAILED · {r.error}</span>}
                          {r.skipped && <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[10px] font-bold">{r.skipped}</span>}
                          {r.title && !r.error && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓ {r.status === 'published' ? 'PUBLISHED' : 'DRAFT'}</span>
                          )}
                          {r.image?.source && !r.error && <span className="text-[10px] text-slate-400 font-bold">image: {r.image.source}{r.image.fallback === 'product' ? ' (product photo)' : ''}</span>}
                        </div>
                      </div>
                    </div>
                    {r.featuredImage ? (
                      <img src={proxyImageUrl(r.featuredImage)} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5" /></div>
                    )}
                    <div className="flex items-center gap-2">
                      {r.slug && (
                        <a href={`/post/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-500/30">
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
