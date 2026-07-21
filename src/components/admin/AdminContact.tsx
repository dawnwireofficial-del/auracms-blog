import React from 'react';
import { ContactMessage } from '../../types';

interface AdminContactProps {
  token: string;
  messages: ContactMessage[];
  onRefresh: () => void;
}

export default function AdminContact({ token, messages, onRefresh }: AdminContactProps) {
  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden" id="admin-workspace-contact">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
            <th className="p-4 pl-6">Sender</th>
            <th className="p-4">Subject</th>
            <th className="p-4">Message Details</th>
            <th className="p-4">Status</th>
            <th className="p-4 pr-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {messages.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-zinc-500">No contact messages received.</td>
            </tr>
          ) : (
            messages.map((msg) => (
              <tr key={msg.id} className={`hover:bg-slate-50 dark:bg-zinc-900/50 ${msg.status === 'unread' ? 'bg-blue-50/20' : ''}`}>
                <td className="p-4 pl-6">
                  <p className="font-bold text-slate-800 dark:text-zinc-100">{msg.name}</p>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{msg.email}</span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mt-0.5">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="p-4 font-semibold text-slate-800 dark:text-zinc-100">{msg.subject}</td>
                <td className="p-4 text-slate-600 dark:text-zinc-300 max-w-sm whitespace-pre-wrap leading-relaxed">{msg.message}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    msg.status === 'read' ? 'bg-slate-100 text-slate-600 dark:text-zinc-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {msg.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {msg.status === 'unread' ? (
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/messages/${msg.id}/read`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'read' })
                          });
                          onRefresh();
                        }}
                        className="text-xs bg-blue-50 text-[#246BFF] hover:bg-blue-100 px-2.5 py-1.5 rounded-lg br-btn font-medium"
                      >
                        Mark Read
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/messages/${msg.id}/read`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: 'unread' })
                          });
                          onRefresh();
                        }}
                        className="text-xs text-slate-500 dark:text-zinc-400 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg br-btn"
                      >
                        Mark Unread
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
