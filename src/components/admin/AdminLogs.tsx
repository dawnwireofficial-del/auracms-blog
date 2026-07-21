import React from 'react';
import { ActivityLog } from '../../types';

interface AdminLogsProps {
  token: string;
  logs: ActivityLog[];
}

export default function AdminLogs({ token, logs }: AdminLogsProps) {
  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden" id="admin-workspace-logs">
      <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Audit Trail (Security & Publishing Logs)</span>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">Total logged entries: {logs.length}</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 p-8 text-center">No logs generated.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-start text-xs gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-700 dark:text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase">{log.action}</span>
                  {log.userName && <span className="text-slate-400 dark:text-zinc-500 font-medium">by {log.userName}</span>}
                </div>
                <p className="text-slate-600 dark:text-zinc-300 mt-1">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono text-right shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
