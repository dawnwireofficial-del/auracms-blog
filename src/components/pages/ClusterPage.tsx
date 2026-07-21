import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Layers, ChevronRight } from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import OptimizedImage from '../OptimizedImage';

interface ClusterPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  readingTime?: number;
  publishedAt?: string;
}

interface ClusterData {
  id: string;
  name: string;
  slug: string;
  description: string;
  pillarPageId: string;
  pillarPageSlug: string;
  pillarPageTitle: string;
  clusterPosts: ClusterPost[];
  status: string;
}

interface ClusterPageProps {
  slug: string;
  onNavigate: (route: string, param?: string) => void;
}

export default function ClusterPage({ slug, onNavigate }: ClusterPageProps) {
  const [cluster, setCluster] = useState<ClusterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/topic-cluster/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCluster(data);
        }
      } catch (e) { console.error(e) } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-[#246BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-zinc-100">Topic Cluster Not Found</h2>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">The cluster you're looking for doesn't exist.</p>
        <button onClick={() => onNavigate('home')} className="mt-6 text-[#246BFF] text-sm font-bold hover:underline">Back to Home</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-4 md:px-6 py-8"
    >
      {/* Breadcrumb */}
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: () => onNavigate('home') },
          { label: cluster.name },
        ]}
        className="mb-6"
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-zinc-950 rounded-xl p-8 md:p-12 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#246BFF]/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-[#7C3AED]" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C3AED]">Topic Cluster</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-4">
            {cluster.name}
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl leading-relaxed mb-6">
            {cluster.description}
          </p>
          <button
            onClick={() => onNavigate('post', cluster.pillarPageSlug)}
            className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-amber-500 text-slate-900 font-bold text-sm px-6 py-3 rounded-lg transition-all shadow-lg cursor-pointer"
            aria-label={`Read pillar article: ${cluster.pillarPageTitle}`}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Start with the Guide
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Pillar page card */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-lg text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#246BFF]" aria-hidden="true" />
          Pillar Article
        </h2>
        <button
          onClick={() => onNavigate('post', cluster.pillarPageSlug)}
          className="w-full text-left bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700 rounded-xl p-5 md:p-6 hover:border-[#246BFF]/50 transition-all group cursor-pointer"
          aria-label={`Read ${cluster.pillarPageTitle}`}
        >
          <div className="flex items-start gap-4">
            <div className="bg-[#246BFF]/10 p-3 rounded-xl shrink-0">
              <BookOpen className="h-6 w-6 text-[#246BFF]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-base md:text-lg group-hover:text-[#246BFF] transition-colors">
                {cluster.pillarPageTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                Pillar page <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[#246BFF] shrink-0 opacity-0 group-hover:opacity-100 transition-all" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* Cluster content */}
      {cluster.clusterPosts.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#246BFF]" aria-hidden="true" />
            Cluster Content ({cluster.clusterPosts.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cluster.clusterPosts.map((post, i) => (
              <motion.button
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                onClick={() => onNavigate('post', post.slug)}
                className="text-left bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden hover:border-[#246BFF]/50 transition-all group cursor-pointer"
                aria-label={`Read cluster article: ${post.title}`}
              >
                {post.featuredImage && (
                  <OptimizedImage
                    src={post.featuredImage}
                    alt=""
                    className="w-full h-36 object-cover"
                    width={400}
                    height={144}
                    loading="lazy"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm leading-snug group-hover:text-[#246BFF] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-zinc-400">
                    {post.readingTime && (
                      <span>{post.readingTime} min read</span>
                    )}
                    {post.publishedAt && (
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: cluster.name,
          description: cluster.description,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: cluster.clusterPosts.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${window.location.origin}/post/${p.slug}`,
              name: p.title,
            })),
          },
        }),
      }} />
    </motion.div>
  );
}
