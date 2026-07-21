import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Clock } from 'lucide-react';
import { ProductReview } from '../../types';

export default function AdminDeals({ token }: { token: string }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductReview[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  const load = async () => {
    const [d, p] = await Promise.all([
      fetch(`/api/admin/deals?status=${filterStatus}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/public/product-reviews').then(r => r.json()),
    ]);
    setDeals(d || []);
    setProducts(p.data || []);
  };
  useEffect(() => { load(); }, [filterStatus]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: any = {};
    const fd = new FormData(form);
    for (const [key, val] of fd.entries()) data[key] = val;
    data.salePrice = parseFloat(data.salePrice);
    data.regularPrice = parseFloat(data.regularPrice);
    data.discountPercentage = parseInt(data.discountPercentage) || 0;
    if (edit) await fetch(`/api/admin/deals/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    else await fetch('/api/admin/deals', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    setShowForm(false); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this deal?')) return;
    await fetch(`/api/admin/deals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.productName || 'Unknown product';

  const timeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / 86400000);
    return `${days}d remaining`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Deals Manager</h3>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 focus:outline-none">
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
          <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Deal</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Product</label>
              <select name="productId" defaultValue={edit?.productId} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 focus:outline-none">
                <option value="">Select product...</option>
                {products.filter(p => p.status === 'published').map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Deal Type</label>
              <select name="dealType" defaultValue={edit?.dealType || 'daily'} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 focus:outline-none">
                <option value="daily">Daily Deal</option>
                <option value="weekly">Weekly Deal</option>
                <option value="monthly">Monthly Deal</option>
                <option value="clearance">Clearance</option>
                <option value="flash">Flash Sale</option>
              </select>
            </div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Sale Price</label><input name="salePrice" type="number" step="0.01" defaultValue={edit?.salePrice} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Regular Price</label><input name="regularPrice" type="number" step="0.01" defaultValue={edit?.regularPrice} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Discount %</label><input name="discountPercentage" type="number" defaultValue={edit?.discountPercentage || 0} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Start Date</label><input name="startDate" type="datetime-local" defaultValue={edit?.startDate || ''} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">End Date</label><input name="endDate" type="datetime-local" defaultValue={edit?.endDate || ''} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isFeatured" type="checkbox" defaultChecked={edit?.isFeatured} className="rounded border-slate-300 text-[#0c5adb]" /> Featured Deal</label>
            <select name="status" defaultValue={edit?.status || 'active'} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900">
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{edit ? 'Update' : 'Create'} Deal</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-zinc-700 text-left">
            <th className="py-2 font-semibold text-slate-500">Product</th>
            <th className="py-2 font-semibold text-slate-500">Type</th>
            <th className="py-2 font-semibold text-slate-500">Price</th>
            <th className="py-2 font-semibold text-slate-500">Discount</th>
            <th className="py-2 font-semibold text-slate-500">Status</th>
            <th className="py-2 font-semibold text-slate-500">Time</th>
            <th className="py-2 font-semibold text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(d => (
            <tr key={d.id} className="border-b border-slate-100 dark:border-zinc-800">
              <td className="py-2 font-medium text-slate-700 dark:text-zinc-200">{getProductName(d.productId)}</td>
              <td className="py-2 text-slate-500 capitalize">{d.dealType}</td>
              <td className="py-2">${parseFloat(d.salePrice).toFixed(2)} <span className="text-slate-400 line-through">${parseFloat(d.regularPrice).toFixed(2)}</span></td>
              <td className="py-2 text-red-500 font-bold">-{d.discountPercentage}%</td>
              <td className="py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : d.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span></td>
              <td className="py-2 text-[10px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" />{timeLeft(d.endDate)}</td>
              <td className="py-2">
                <button onClick={() => { setEdit(d); setShowForm(true); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(d.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </td>
            </tr>
          ))}
          {deals.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-slate-400">No deals found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
