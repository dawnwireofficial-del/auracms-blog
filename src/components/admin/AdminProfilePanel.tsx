import React, { useState } from 'react';
import { AdminProfileCropModal } from './AdminProfileCropModal';
import { store } from '../../lib/store';
import { proxyImageUrl } from '../../utils/safeRender';

interface AdminProfilePanelProps {
  user: any;
}

export default function AdminProfilePanel({ user }: AdminProfilePanelProps) {
  const [adminName, setAdminName] = useState(user?.displayName || user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminPhoto, setAdminPhoto] = useState(user?.photoURL || user?.avatar || '');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminBio, setAdminBio] = useState('');
  const [associateTag, setAssociateTag] = useState(localStorage.getItem('dawnwire_associate_tag') || 'dawnwire-20');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateUserProfile({
      displayName: adminName,
      email: adminEmail,
      photoURL: adminPhoto,
    });
    localStorage.setItem('dawnwire_associate_tag', associateTag);
    setProfileSuccessMsg('Profile & preferences saved successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  const presets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  ];

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Administrator Profile & System Preferences</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage super admin avatar image, display name, email, and Amazon Associate tracking configuration.</p>
      </div>

      {profileSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold">{profileSuccessMsg}</div>
      )}

      <form onSubmit={handleSaveAdminProfile} className="max-w-2xl space-y-6">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600 shadow-xl bg-slate-200 shrink-0">
            <img src={proxyImageUrl(adminPhoto)} alt={adminName} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover" />
            <button type="button" onClick={() => setIsCropModalOpen(true)} className="absolute inset-0 bg-slate-950/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
              <span>📷 Crop</span>
              <span>Upload</span>
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{adminName}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{adminTitle || user?.role || 'Super Admin'}</p>
                <p className="text-xs text-slate-500 font-mono">{adminEmail}</p>
              </div>
              <button type="button" onClick={() => setIsCropModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition-colors flex items-center gap-1.5">
                📷 Crop & Upload Custom Avatar
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold text-slate-400 block w-full sm:w-auto">Choose Avatar Preset:</span>
              {presets.map((imgUrl, i) => (
                <button key={i} type="button" onClick={() => setAdminPhoto(imgUrl)} className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-300 hover:border-blue-600 transition-all">
                  <img src={proxyImageUrl(imgUrl)} alt={`Preset ${i}`} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-slate-500 mb-1">Avatar Photo URL</label>
            <input type="url" value={adminPhoto} onChange={(e) => setAdminPhoto(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">Display Name</label>
              <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Admin Email Address</label>
              <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Editorial Title / Role</label>
            <input type="text" value={adminTitle} onChange={(e) => setAdminTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none" />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Administrator Bio / Credentials</label>
            <textarea rows={3} value={adminBio} onChange={(e) => setAdminBio(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs" />
          </div>
          <div>
            <label className="block text-slate-500 mb-1">Global Amazon Associate Tracking Tag</label>
            <input type="text" value={associateTag} onChange={(e) => setAssociateTag(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono font-extrabold text-amber-500" />
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Browser Extension API Token</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={localStorage.getItem('dawnwire_auth_token') || ''}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 text-xs font-mono outline-none cursor-pointer select-all"
            />
            <button type="button" onClick={() => navigator.clipboard.writeText(localStorage.getItem('dawnwire_auth_token') || '')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0">
              Copy
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">Paste this token into the DawnWire Browser Extension popup. Browse Amazon/Walmart/Best Buy to see the import banner.</p>
        </div>

        <div className="pt-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3 rounded-2xl text-xs shadow-lg shadow-blue-600/20">
            Save Profile & Preferences
          </button>
        </div>
      </form>

      {isCropModalOpen && (
        <AdminProfileCropModal
          onSave={(url) => { setAdminPhoto(url); setIsCropModalOpen(false); }}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
}
