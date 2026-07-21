import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Calendar, Tag } from 'lucide-react';
import { PortfolioProject } from '../types';
import SeoHelmet from './SeoHelmet';
import Breadcrumbs from './Breadcrumbs';

interface PublicPortfolioProps {
  slug: string;
  onNavigate: (route: string, param?: string) => void;
}

export default function PublicPortfolio({ slug, onNavigate }: PublicPortfolioProps) {
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [allProjects, setAllProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/public/portfolio');
        if (res.ok) {
          const list = await res.json();
          setAllProjects(list);
          setProject(list.find((p: any) => p.slug === slug || p.id === slug) || list[0] || null);
        }
      } catch (e) { console.error(e) }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-slate-500">Loading project...</div>;
  if (!project && allProjects.length === 0) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-slate-500">No portfolio projects found</div>;

  const p = project || allProjects[0];
  const techs = p.toolsUsed || [];

  return (
    <>
      <SeoHelmet
        title={p.title}
        description={p.shortDescription || `${p.title} — ${p.client ? `Client: ${p.client}` : ''} ${p.industry ? `Industry: ${p.industry}` : ''}`}
        canonical={`/portfolio/${p.slug || p.id}`}
        ogImage={p.image || ''}
        ogType="article"
      />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl shadow-sm overflow-hidden">
          {/* Header image */}
          {p.image && (
            <div className="h-64 md:h-80 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8 md:p-10 space-y-6">
            <Breadcrumbs items={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: p.title }]} />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white tracking-tight">{p.title}</h1>
                {p.client && <p className="text-[#246BFF] text-sm font-medium">Client: {p.client}</p>}
                {p.industry && (
                  <span className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700">
                    <Tag className="w-3 h-3" /> {p.industry}
                  </span>
                )}
              </div>
              {p.websiteUrl && (
                <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#246BFF] hover:bg-[#246BFF]/90 text-white text-xs font-bold px-5 py-3 rounded-lg transition-all shrink-0">
                  <ExternalLink className="w-4 h-4" /> View Project
                </a>
              )}
            </div>

            {p.shortDescription && (
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">About This Project</h2>
                <p className="text-slate-800 dark:text-zinc-300 leading-relaxed text-sm">{p.shortDescription}</p>
              </div>
            )}

            {techs.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-3">Technologies Used</h2>
                <div className="flex flex-wrap gap-2">
                  {techs.map((t, i) => (
                    <span key={i} className="bg-[#246BFF]/10 text-[#246BFF] text-xs font-bold px-3 py-1.5 rounded-full border border-[#246BFF]/20">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other projects */}
        {allProjects.length > 1 && (
          <div className="mt-12">
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-6">More Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProjects.filter(x => x.id !== p.id).slice(0, 3).map(proj => (
                <button key={proj.id} onClick={() => onNavigate('portfolio', proj.slug || proj.id)}
                  className="text-left bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">{proj.title}</h3>
                  {proj.industry && <p className="text-[10px] text-slate-500 mt-1">{proj.industry}</p>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
