import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, Settings, TrendingUp, Award, Mail } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MilestoneProgress {
  current: number;
  nextMilestone: number;
  label: string;
}

interface AlertConfig {
  dailyDigest: boolean;
  weeklyDigest: boolean;
  trafficSpikeThreshold: number;
  milestones: boolean;
  adminEmail: string;
}

export default function AnalyticsAlerts({ token }: { token: string }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const [cRes, mRes] = await Promise.all([
      fetch('/api/admin/analytics/alerts/config', { headers }),
      fetch('/api/admin/analytics/alerts/milestones', { headers }),
    ]);
    if (cRes.ok) setConfig(await cRes.json());
    if (mRes.ok) setMilestones(await mRes.json());
    setLoading(false);
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    await fetch('/api/admin/analytics/alerts/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
    setSaving(false);
  }

  async function runAlerts() {
    setResult('Running...');
    const res = await fetch('/api/admin/analytics/alerts/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const lines = [
        ...data.milestones.map((m: string) => `🏆 ${m}`),
        ...data.trafficSpikes.map((s: string) => `⚠️ ${s}`),
        data.digest ? `📧 ${data.digest}` : null,
      ];
      setResult(lines.filter(Boolean).join('\n') || 'No alerts triggered.');
    } else {
      setResult('Failed to run alerts.');
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#246BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#246BFF]" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Analytics Alerts</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={runAlerts} className="px-4 py-2 rounded-xl bg-[#246BFF] text-white text-xs font-semibold hover:bg-[#1a5ae0] transition-all flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Check Now
          </button>
          <button onClick={load} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300 whitespace-pre-line">
          {result}
        </div>
      )}

      {/* Settings */}
      {config && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-700 pb-3">
            <Settings className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Alert Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 cursor-pointer">
              <input type="checkbox" checked={config.dailyDigest} onChange={e => setConfig({ ...config, dailyDigest: e.target.checked })} className="rounded text-[#246BFF]" />
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Daily Digest</div>
                <div className="text-[10px] text-slate-400">Send daily stats summary email</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 cursor-pointer">
              <input type="checkbox" checked={config.weeklyDigest} onChange={e => setConfig({ ...config, weeklyDigest: e.target.checked })} className="rounded text-[#246BFF]" />
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Weekly Digest</div>
                <div className="text-[10px] text-slate-400">Send weekly milestone/trends email</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 cursor-pointer">
              <input type="checkbox" checked={config.milestones} onChange={e => setConfig({ ...config, milestones: e.target.checked })} className="rounded text-[#246BFF]" />
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Milestone Alerts</div>
                <div className="text-[10px] text-slate-400">Notify at 100, 500, 1K, 5K, 10K+</div>
              </div>
            </label>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1 block">Traffic Spike Threshold (%)</label>
              <input
                type="number"
                value={config.trafficSpikeThreshold}
                onChange={e => setConfig({ ...config, trafficSpikeThreshold: parseInt(e.target.value) || 200 })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-1.5 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input"
                min={50}
                max={1000}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1 block">Admin Email</label>
            <input
              type="email"
              value={config.adminEmail}
              onChange={e => setConfig({ ...config, adminEmail: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input font-mono"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#246BFF] text-white text-xs font-semibold hover:bg-[#1a5ae0] transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Milestone Progress */}
      {milestones.length > 0 && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-700 pb-3">
            <Award className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Milestone Progress</h3>
          </div>

          <div className="space-y-3">
            {milestones.map(m => {
              const pct = Math.min((m.current / m.nextMilestone) * 100, 100);
              return (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-zinc-300 font-medium">{m.label}</span>
                    <span className="text-slate-400">{m.current.toLocaleString()} / {m.nextMilestone.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#246BFF] to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {milestones.length > 0 && (
            <div className="pt-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={milestones}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="current" fill="#246BFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
