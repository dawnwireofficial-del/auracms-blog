import React, { useRef, useState } from 'react';

interface WpItem {
  postId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  postDate: string;
  categories: string[];
  content: string;
  excerpt: string;
  images: string[];
}

interface ImportStats {
  imported: number;
  skipped: number;
  failed: number;
  warnings: number;
}

interface ImportLogEntry {
  kind: 'ok' | 'skip' | 'warn' | 'err';
  title: string;
  detail: string;
}

function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'item';
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
}

function extractImages(html: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  const urls: string[] = [];
  div.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    if (src && src.startsWith('http') && !src.startsWith('data:')) urls.push(src);
  });
  return urls.filter((u, i) => urls.indexOf(u) === i).slice(0, 8);
}

function extractPrice(html: string): string {
  const text = stripHtml(html);
  const patterns = [
    /list\s*price[:\s]*\$?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /price[:\s]*\$?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) return m[1].replace(/,/g, '');
  }
  return '';
}

function extractOrignalPrice(html: string): string {
  const text = stripHtml(html);
  const m = text.match(/(?:was|original\s*price|strike|compare)[:\s]*\$?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  return m ? m[1].replace(/,/g, '') : '';
}

function extractFeatures(html: string): string[] {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  const features: string[] = [];
  div.querySelectorAll('li, .feature, .bullet').forEach((el) => {
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (txt && txt.length <= 200 && features.length < 8) features.push(txt);
  });
  return features;
}

export default function WordPressImportTool({ token }: { token: string }) {
  const [xmlInput, setXmlInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedItems, setParsedItems] = useState<WpItem[]>([]);
  const [previewCategories, setPreviewCategories] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats>({ imported: 0, skipped: 0, failed: 0, warnings: 0 });
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const [statusMap, setStatusMap] = useState<'published' | 'draft'>('published');
  const [dedup, setDedup] = useState<'skip' | 'suffix'>('skip');

  const fileRef = useRef<HTMLInputElement>(null);

  const parseXml = (xml: string): { items: WpItem[]; cats: string[] } => {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const items: WpItem[] = [];
    const cats = new Set<string>();
    doc.querySelectorAll('channel > category').forEach((c) => {
      const name = (c.textContent || '').trim();
      if (name) cats.add(name);
    });
    doc.querySelectorAll('item').forEach((item) => {
      const text = (sel: string) => (item.querySelector(sel)?.textContent || '').trim();
      const type = text('wp\\:post_type') || text('post_type') || 'post';
      const status = text('wp\\:status') || text('status') || 'publish';
      if (type !== 'post') return;
      let categories: string[] = [];
      item.querySelectorAll('category').forEach((c) => {
        if (c.getAttribute('domain') === 'category') {
          const name = (c.textContent || '').trim();
          if (name) categories.push(name);
        }
      });
      const content = text('content\\:encoded');
      const excerpt = text('excerpt\\:encoded') || text('description');
      const postId = text('wp\\:post_id');
      const slugRaw = text('wp\\:post_name') || '';
      const title = text('title') || 'Untitled';
      items.push({
        postId,
        title,
        slug: slugRaw || slugify(title),
        type,
        status,
        postDate: text('wp\\:post_date') || '',
        categories,
        content,
        excerpt,
        images: extractImages(content),
      });
    });
    items.forEach((i) => i.categories.forEach((c) => cats.add(c)));
    return { items, cats: Array.from(cats) };
  };

  const handleParse = () => {
    if (!xmlInput.trim()) return;
    setIsParsing(true);
    setLogs([]);
    setStats({ imported: 0, skipped: 0, failed: 0, warnings: 0 });
    setProgress(0);
    try {
      const { items, cats } = parseXml(xmlInput);
      setParsedItems(items);
      setPreviewCategories(cats);
    } catch (e: any) {
      setLogs((prev) => [...prev, { kind: 'err', title: 'Parse failed', detail: e.message || String(e) }]);
      setParsedItems([]);
    }
    setIsParsing(false);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    setXmlInput(text);
    const { items, cats } = parseXml(text);
    setParsedItems(items);
    setPreviewCategories(cats);
    setLogs([]);
    setStats({ imported: 0, skipped: 0, failed: 0, warnings: 0 });
    setProgress(0);
  };

  const handleImport = async () => {
    if (parsedItems.length === 0) return;
    setIsImporting(true);
    setLogs([]);
    setStats({ imported: 0, skipped: 0, failed: 0, warnings: 0 });
    setProgress(0);

    const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const log = (entry: ImportLogEntry) => setLogs((prev) => [...prev, entry]);

    try {
      // 1) Resolve existing categories + products for dedup
      let existingCats: string[] = [];
      let existingTitles = new Set<string>();
      try {
        const catRes = await fetch('/api/public/categories');
        const catData = await catRes.json();
        existingCats = (Array.isArray(catData) ? catData : []).map((c: any) => c?.slug || slugify(c?.name || ''));
      } catch { /* ignore */ }
      try {
        const prodRes = await fetch('/api/admin/seo/product-reviews?limit=1000&light=1', { headers: { Authorization: `Bearer ${token}` } });
        const prodData = await prodRes.json();
        const prods = Array.isArray(prodData.data) ? prodData.data : Array.isArray(prodData) ? prodData : [];
        prods.forEach((p: any) => {
          const t = p?.product_name || p?.title || '';
          if (t) existingTitles.add(t.toLowerCase());
        });
      } catch { /* ignore */ }

      const seenTitles = new Set<string>();
      let imported = 0, skipped = 0, failed = 0, warnings = 0;

      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        const lower = item.title.toLowerCase();

        // Title dedup
        if (existingTitles.has(lower) || seenTitles.has(lower)) {
          if (dedup === 'skip') {
            skipped++;
            log({ kind: 'skip', title: item.title, detail: 'Duplicate title already in catalog' });
            setProgress(((i + 1) / parsedItems.length) * 100);
            continue;
          }
        }
        seenTitles.add(lower);

        // 2) Upsert category (skip if slug exists)
        if (item.categories.length > 0) {
          const mainCat = item.categories[0];
          const catSlug = slugify(mainCat);
          if (!existingCats.includes(catSlug)) {
            try {
              const catRes = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ name: mainCat, slug: catSlug, description: mainCat, status: 'active' }),
              });
              const catBody = await catRes.json();
              if (catRes.ok && catBody?.id) existingCats.push(catSlug);
              else if (!catBody?.id && catBody?.error?.includes('already') === false) warnings++;
            } catch {
              warnings++;
              log({ kind: 'warn', title: 'Category', detail: `Failed to create "${mainCat}"` });
            }
          }
        }

        // 3) Create product
        const payload = {
          title: item.title,
          mainCategory: item.categories[0] || '',
          images: item.images,
          price: extractPrice(item.content),
          originalPrice: extractOrignalPrice(item.content),
          review_summary: stripHtml(item.excerpt) || stripHtml(item.content).replace(/\s+/g, ' ').slice(0, 400),
          key_features: extractFeatures(item.content),
          asin: '',
          status: item.status === 'publish' ? statusMap : 'draft',
        };
        try {
          const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload),
          });
          const body = await res.json();
          if (res.ok && body?.id) {
            imported++;
            log({ kind: 'ok', title: item.title, detail: `Imported (${statusMap})` });
          } else {
            failed++;
            log({ kind: 'err', title: item.title, detail: body?.error || `HTTP ${res.status}` });
          }
        } catch (e: any) {
          failed++;
          log({ kind: 'err', title: item.title, detail: e.message || String(e) });
        }
        setProgress(((i + 1) / parsedItems.length) * 100);
      }

      setStats({ imported, skipped, failed, warnings });
    } catch (e: any) {
      log({ kind: 'err', title: 'Import halted', detail: e.message || String(e) });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">WordPress Import</h2>
        <p className="text-xs text-slate-500 mt-1">Paste your WordPress export (WXR/XML) or upload a file. Products and categories are parsed client-side and upserted to DawnWire.</p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">1. Load WordPress export file</span>
            <span className="text-[11px] text-slate-500">Tools → Export → All content (WXR format)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xml,.wxr,application/xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer"
            >
              Choose File
            </button>
          </div>
        </div>
        {fileName && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Loaded: {fileName}</span>
        )}
        <textarea
          value={xmlInput}
          onChange={(e) => { setXmlInput(e.target.value); setFileName(''); }}
          placeholder={'Paste WXR XML here…'}
          rows={8}
          className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#246BFF]/40"
        />
        <button
          onClick={handleParse}
          disabled={isParsing || !xmlInput.trim()}
          className="text-xs font-bold bg-[#246BFF] disabled:opacity-50 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
        >
          {isParsing ? 'Parsing…' : 'Parse XML'}
        </button>
      </div>

      {previewCategories.length + parsedItems.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">2. Preview & configure</span>
              <span className="text-[11px] text-slate-500">{parsedItems.length} products · {previewCategories.length} categories</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                Status
                <select
                  value={statusMap}
                  onChange={(e) => setStatusMap(e.target.value as any)}
                  className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                Duplicates
                <select
                  value={dedup}
                  onChange={(e) => setDedup(e.target.value as any)}
                  className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5"
                >
                  <option value="skip">Skip</option>
                  <option value="suffix">Import with -2 suffix</option>
                </select>
              </label>
            </div>
          </div>
          {parsedItems.length > 0 && (
            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {parsedItems.slice(0, 12).map((it) => (
                <div key={it.postId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {it.images[0] && (
                      <img
                        src={it.images[0]}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-lg object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{it.title}</p>
                      <p className="text-[10px] text-slate-400">{it.categories.join(', ') || 'No category'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{it.status === 'publish' ? 'Published' : it.status}</span>
                </div>
              ))}
              {parsedItems.length > 12 && (
                <p className="text-[10px] text-slate-400 text-center py-2">… and {parsedItems.length - 12} more</p>
              )}
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={isImporting || parsedItems.length === 0}
            className="text-xs font-bold bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
          >
            {isImporting ? `Importing… ${progress.toFixed(0)}%` : `Import ${parsedItems.length} Products`}
          </button>
        </div>
      )}

      {(isImporting || stats.imported + stats.skipped + stats.failed > 0) && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">3. Results</span>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#246BFF] to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{stats.imported}</p>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Imported</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{stats.skipped}</p>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Skipped</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800/50">
              <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{stats.failed}</p>
              <p className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Failed</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">{stats.warnings}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Warnings</p>
            </div>
          </div>
          {logs.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {logs.slice(-60).map((l, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-1.5">
                  <span className={`text-[10px] font-black uppercase shrink-0 mt-0.5 ${
                    l.kind === 'ok' ? 'text-emerald-600 dark:text-emerald-400'
                    : l.kind === 'skip' ? 'text-amber-600 dark:text-amber-400'
                    : l.kind === 'err' ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {l.kind}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate">{l.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{l.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}