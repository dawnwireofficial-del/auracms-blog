import React from 'react';
import { useToasts } from '../../lib/toastStore';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const toasts = useToasts();

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 sm:right-6 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100 backdrop-blur-md'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-100 backdrop-blur-md'
                : 'bg-slate-900/95 border-slate-700 text-slate-100 backdrop-blur-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base shrink-0">
                {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="leading-snug">{t.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
