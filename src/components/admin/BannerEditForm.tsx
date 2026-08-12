import React, { useState, useRef } from 'react';
import { Upload, X, Trash2, ImageIcon } from 'lucide-react';
import { BANNER_PLACEMENT_MAP } from '../../lib/bannerPlacements';
import { useAppStore, store } from '../../lib/store';
import { proxyImageUrl } from '../../utils/safeRender';
import type { BannerPlacement, CategoryBanner } from '../../types';

interface Props {
  placement: BannerPlacement;
  banner: CategoryBanner | null;
  token: string;
  onClose: () => void;
}

export default function BannerEditForm({ placement, banner, token, onClose }: Props) {
  const meta = BANNER_PLACEMENT_MAP[placement];
  const [desktopImage, setDesktopImage] = useState(banner?.desktopImage || '');
  const [badgeText, setBadgeText] = useState(banner?.badgeText || '');
  const [title, setTitle] = useState(banner?.title || banner?.heading || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [ctaText, setCtaText] = useState(banner?.ctaText || '');
  const [ctaLink, setCtaLink] = useState(banner?.targetUrl || banner?.ctaLink || '');
  const [isActive, setIsActive] = useState(banner?.isEnabled ?? banner?.isActive ?? true);
  const [uploading, setUploading] = useState(false);
  const [fileDims, setFileDims] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileDims(null);
    try {
      const objectUrl = URL.createObjectURL(file);
      const probe = new Image();
      await new Promise<void>((resolve) => {
        probe.onload = () => resolve();
        probe.onerror = () => resolve();
        probe.src = objectUrl;
      });
      const actual = probe.naturalWidth && probe.naturalHeight
        ? `${probe.naturalWidth}×${probe.naturalHeight}px`
        : 'unknown size';
      const rec = /(\d+)\s*[×x]\s*(\d+)/.exec(meta.recommended);
      const mismatch = rec
        ? (Math.abs(probe.naturalWidth - Number(rec[1])) / Number(rec[1])) > 0.35
        : false;
      setFileDims(`${actual}${mismatch ? ' — far from recommended, image may crop' : ''}`);
      URL.revokeObjectURL(objectUrl);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise<void>((resolve) => { reader.onload = () => resolve(); });
      const base64 = (reader.result as string).split(',')[1];
      const r = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name }),
      });
      const data = await r.json();
      if (data.url) setDesktopImage(data.url);
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await store.saveBanner({
        id: banner?.id || `tmp-${placement}-${Date.now()}`,
        categoryId: banner?.categoryId || '',
        desktopImage,
        mobileImage: banner?.mobileImage || desktopImage,
        title: title || (banner?.heading || ''),
        heading: title || (banner?.heading || ''),
        subtitle,
        badgeText,
        ctaText: ctaText || 'Shop Now',
        ctaLink: ctaLink || '/deals',
        targetUrl: ctaLink || '/deals',
        altText: title || 'Banner',
        sortOrder: banner?.sortOrder ?? 0,
        order: banner?.order ?? banner?.sortOrder ?? 0,
        isActive,
        isEnabled: isActive,
        placement,
      } as CategoryBanner);
      await store.fetchBanners();
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!banner?.id || !confirm('Delete this banner? The slot will fall back to its auto-generated design.')) return;
    await store.deleteBanner(banner.id);
    await store.fetchBanners();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl z-10">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{meta.label}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Recommended image: <span className="font-bold text-[#246BFF]">{meta.recommended}</span> · aspect {meta.aspect}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image preview + upload */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1.5">Banner Image</label>
            <div className={`relative rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 ${meta.aspect} flex items-center justify-center`}>
              {desktopImage ? (
                <img src={proxyImageUrl(desktopImage)} alt="" referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="#eef2f7"/><text x="200" y="104" fill="#94a3b8" font-size="18" font-family="sans-serif" text-anchor="middle">No image</text></svg>'); }} />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-[11px] font-semibold">{meta.recommended}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0c5adb] px-3 py-1.5 rounded-lg border border-[#0c5adb]/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50">
                <Upload className="h-3.5 w-3.5" /> {uploading ? 'Uploading…' : 'Upload image'}
              </button>
              <input
                value={desktopImage}
                onChange={(e) => setDesktopImage(e.target.value)}
                placeholder="or paste image URL…"
                className="flex-1 min-w-0 text-[11px] border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
              />
            </div>
            {fileDims && (
              <p className={`text-[10px] mt-1.5 font-semibold ${fileDims.includes('far') ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                Uploaded: {fileDims}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Badge / Tag (optional)</label>
              <input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="e.g. Limited Time"
                className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Active</label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 h-[34px]">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300 text-[#0c5adb]" />
                Show this banner
              </label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Headline</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner headline"
              className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Short supporting line"
              className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Button Text</label>
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Shop Now"
                className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Button Link</label>
              <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/deals or https://…"
                className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 rounded-b-2xl">
          {banner?.id && !banner.id.startsWith('tmp-') ? (
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[11px] font-bold text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="bg-[#246BFF] hover:bg-[#164EE8] text-white text-[11px] font-bold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60">
              {saving ? 'Saving…' : banner?.id && !banner.id.startsWith('tmp-') ? 'Save Changes' : 'Create Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
