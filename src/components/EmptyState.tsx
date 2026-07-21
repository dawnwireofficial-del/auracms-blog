import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-slate-400 dark:text-zinc-500" />}
      </div>
      <h3 className="font-display font-bold text-slate-900 dark:text-white text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-zinc-400 text-center max-w-xs mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
