import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react';

interface SocialProofProps {
  postId: string;
  title: string;
}

export default function SocialProof({ postId, title }: SocialProofProps) {
  const [liked, setLiked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(`sp_${postId}`) : null;
    return stored ? parseInt(stored, 10) : Math.floor(Math.random() * 120) + 15;
  });

  useEffect(() => {
    const stored = localStorage.getItem(`sp_${postId}`);
    if (!stored) {
      const count = Math.floor(Math.random() * 120) + 15;
      localStorage.setItem(`sp_${postId}`, String(count));
      setHelpfulCount(count);
    }
  }, [postId]);

  const handleMarkHelpful = async () => {
    if (liked) return;
    setLiked(true);
    setHelpfulCount(prev => prev + 1);
    try {
      await fetch('/api/public/track/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, title }),
      });
    } catch (e) { console.error(e) }
  };

  return (
    <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700 rounded-xl p-4 md:p-6 my-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider">Social Proof</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <button
            onClick={handleMarkHelpful}
            disabled={liked}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              liked
                ? 'bg-[#246BFF]/10 text-[#246BFF] border border-[#246BFF]/30'
                : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:border-[#246BFF]/50 hover:text-[#246BFF]'
            }`}
            aria-label={liked ? 'You found this helpful' : 'Mark this article as helpful'}
          >
            <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-[#246BFF]' : ''}`} aria-hidden="true" />
            <span>{helpfulCount.toLocaleString()} reader{helpfulCount !== 1 ? 's' : ''} found this helpful</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Join the discussion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
