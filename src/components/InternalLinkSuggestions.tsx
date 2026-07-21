import React, { useMemo } from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import { Post } from '../types';

interface InternalLinkSuggestionsProps {
  posts: Post[];
  currentPostTitle: string;
  currentPostContent: string;
}

export default function InternalLinkSuggestions({ posts, currentPostTitle, currentPostContent }: InternalLinkSuggestionsProps) {
  const suggestions = useMemo(() => {
    const titleWords = (currentPostTitle || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentWords = new Set((currentPostContent || '').toLowerCase().split(/\s+/).filter(w => w.length > 4));
    
    return posts
      .filter(p => p.title !== currentPostTitle && p.status === 'published')
      .map(p => {
        const pTitle = (p.title || '').toLowerCase();
        const pContent = (p.content || '').toLowerCase();
        const matchedTitleWords = titleWords.filter(w => pTitle.includes(w)).length;
        const contentOverlap = [...contentWords].filter(w => pContent.includes(w)).length;
        const score = matchedTitleWords * 3 + contentOverlap;
        return { post: p, score, matchReason: matchedTitleWords > 0 ? 'Related topic' : contentOverlap > 5 ? 'Content overlap' : null };
      })
      .filter(s => s.score > 2 && s.matchReason)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [posts, currentPostTitle, currentPostContent]);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Internal Links</span>
      </div>
      <div className="space-y-1">
        {suggestions.map(s => (
          <a
            key={s.post.id}
            href={`/post/${s.post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 group"
          >
            <span className="truncate flex-1">{s.post.title}</span>
            <span className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{s.matchReason}</span>
              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-[#246BFF] transition-all" />
            </span>
          </a>
        ))}
      </div>
      <p className="text-[9px] text-slate-400 mt-2">Link to these related articles within your content for better SEO.</p>
    </div>
  );
}
