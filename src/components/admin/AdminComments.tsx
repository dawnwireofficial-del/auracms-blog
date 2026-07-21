import React from 'react';
import { Check, AlertTriangle, Trash2 } from 'lucide-react';
import { Comment, Post } from '../../types';

interface AdminCommentsProps {
  token: string;
  comments: Comment[];
  posts: Post[];
  onRefresh: () => void;
}

export default function AdminComments({ token, comments, posts, onRefresh }: AdminCommentsProps) {
  const handleModerateComment = async (id: string, status: 'approved' | 'pending' | 'spam') => {
    try {
      const res = await fetch(`/api/admin/comments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Moderation error.');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Permanently delete comment?')) return;
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (e) {
      alert('Deletion error.');
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden animate-none" id="admin-workspace-comments">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
            <th className="p-4 pl-6">Author Details</th>
            <th className="p-4">Comment Text</th>
            <th className="p-4">Linked Post</th>
            <th className="p-4">Status</th>
            <th className="p-4 pr-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {comments.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-zinc-500">No reader comments submitted yet.</td>
            </tr>
          ) : (
            comments.map((comm) => (
              <tr key={comm.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                <td className="p-4 pl-6">
                  <p className="font-bold text-slate-800 dark:text-zinc-100">{comm.name}</p>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{comm.email}</span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5 block">{new Date(comm.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="p-4 text-slate-600 dark:text-zinc-300 max-w-sm leading-relaxed whitespace-pre-wrap">{comm.content}</td>
                <td className="p-4 text-slate-500 dark:text-zinc-400 truncate max-w-[150px]">
                  {posts.find(p => p.id === comm.postId)?.title || comm.postId}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    comm.status === 'approved' ? 'bg-green-100 text-green-700' :
                    comm.status === 'spam' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {comm.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {comm.status !== 'approved' && (
                      <button
                        onClick={() => handleModerateComment(comm.id, 'approved')}
                        title="Approve Comment"
                        className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg br-btn"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {comm.status !== 'spam' && (
                      <button
                        onClick={() => handleModerateComment(comm.id, 'spam')}
                        title="Flag as Spam"
                        className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg br-btn"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comm.id)}
                      title="Delete Permanently"
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg br-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
