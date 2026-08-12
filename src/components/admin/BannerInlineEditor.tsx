import React, { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { BANNER_PLACEMENT_MAP } from '../../lib/bannerPlacements';
import { useAppStore } from '../../lib/store';
import BannerEditForm from './BannerEditForm';
import type { BannerPlacement } from '../../types';

interface Props {
  placement: BannerPlacement;
  banner: any;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

/**
 * Frontend inline banner editor — when an admin/super_admin is logged in, every
 * homepage banner slot gains a hover "Edit" affordance. Clicking opens the exact
 * banner editor for THAT slot (image upload with size hint, badge, headline, CTA).
 * Non-admins see the slot untouched.
 */
export default function BannerInlineEditor({ placement, banner, children, className, align = 'right' }: Props) {
  const { currentUser } = useAppStore();
  const [open, setOpen] = useState(false);
  const isAdmin = !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin');
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('dawnwire_auth_token') || '') : '';
  const meta = BANNER_PLACEMENT_MAP[placement];
  const hasImage = !!(banner?.desktopImage || banner?.imageUrl);

  if (!isAdmin) return <>{children}</>;

  return (
    <>
      <div className={`relative group/edit ${className || ''}`}>
        {children}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          title={`Edit banner — ${meta?.label} (${meta?.recommended})`}
          className={`absolute top-3 ${align === 'right' ? 'right-3' : 'left-3'} z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black text-white shadow-lg border border-white/30 transition-all opacity-0 group-hover/edit:opacity-100 hover:scale-105 ${hasImage ? 'bg-[#FF8A00]/95' : 'bg-[#246BFF]/95'} backdrop-blur-md`}
        >
          {hasImage ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {hasImage ? 'Edit Banner' : 'Add Banner'}
          <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/25">{meta?.recommended}</span>
        </button>
      </div>
      {open && (
        <BannerEditForm placement={placement} banner={banner} token={token} onClose={() => setOpen(false)} />
      )}
    </>
  );
}