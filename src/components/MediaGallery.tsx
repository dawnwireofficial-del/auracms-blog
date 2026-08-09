import React, { useState } from 'react';
import { Image as ImageIcon, Trash2, Search, Upload, Copy, Check, ExternalLink } from 'lucide-react';
import { MediaItem } from '../types';

interface Props {
  items: MediaItem[];
  onDelete: (id: string) => void;
  onUpload: () => void;
}

export default function MediaGallery({ items, onDelete, onUpload }: Props) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = items.filter(i =>
    i.fileName?.toLowerCase().includes(search.toLowerCase()) ||
    i.url?.toLowerCase().includes(search.toLowerCase())
  );

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) { console.error(e) }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-[#246BFF]" />
          Media Gallery
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search media..."
              className="w-44 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#246BFF]"
            />
          </div>
          <button
            onClick={onUpload}
            className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{items.length === 0 ? 'No media uploaded yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-square bg-white dark:bg-zinc-900 relative">
                <img
                  src={item.url}
                  alt={item.altText || item.fileName || 'Media'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyUrl(item.url, item.id)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-all"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-600" />}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-all"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                  </a>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] text-slate-600 dark:text-zinc-300 truncate">{item.fileName || 'Untitled'}</p>
                {item.size && (
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500">{(item.size / 1024).toFixed(1)} KB</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
