import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calendar, Clock, ArrowLeft, Share2, ExternalLink } from 'lucide-react';
import { Post, AffiliateLink, Category } from '../types';
import SeoHelmet from '../components/SeoHelmet';
import Breadcrumbs from '../components/Breadcrumbs';
import ImageZoom from '../components/ImageZoom';
import SocialShareButtons from '../components/SocialShareButtons';
import { trackAffiliateClick } from '../lib/tracker';
import { proxyImageUrl } from '../utils/safeRender';
import { AmbientGlow } from '../components/visual/AmbientGlow';
import { TechnicalGrid } from '../components/visual/TechnicalGrid';
import { GradientDivider } from '../components/visual/GradientDivider';

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="markdown-body space-y-5">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4 tracking-tight border-b border-slate-200 dark:border-blue-500/20 pb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="font-display text-xl font-semibold text-slate-800 dark:text-zinc-100 mt-6 mb-3 tracking-tight">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed text-slate-800 dark:text-zinc-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-slate-500 dark:text-zinc-400 my-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 text-slate-500 dark:text-zinc-400 my-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic my-6 text-slate-800 dark:text-zinc-200 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-bold text-slate-800 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="font-mono text-sm bg-zinc-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-400 border border-blue-500/20">{children}</code>,
          hr: () => <hr className="my-8 border-slate-200 dark:border-blue-500/20" />,
          a: ({ href, children }) => <a href={href} className="text-blue-500 hover:underline font-semibold" target="_blank" rel="noopener noreferrer">{children}</a>,
          h1: ({ children }) => <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-white mt-8 mb-4 tracking-tight">{children}</h2>,
          img: ({ src, alt }) => src ? (
            <div className="my-8 rounded-xl overflow-hidden bg-zinc-100 dark:bg-[#030712] border border-blue-500/20">
              <ImageZoom src={src} alt={alt || ''} className="w-full object-contain" width={800} height={450} loading="lazy" />
            </div>
          ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface PostDetailPageProps {
  slug: string;
}

export default function PostDetailPage({ slug }: PostDetailPageProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const [postRes, catRes, linkRes, relatedRes] = await Promise.all([
          fetch(`/api/public/posts/slug/${slug}`),
          fetch('/api/public/categories'),
          fetch('/api/public/affiliate'),
          fetch('/api/public/posts?limit=12'),
        ]);
        const postData = await postRes.json().catch(() => null);
        if (!postRes.ok || !postData || typeof postData.id !== 'string') {
          if (active) { setNotFound(true); setLoading(false); }
          return;
        }
        const catBody = await catRes.json().catch(() => ([]));
        const linkBody = await linkRes.json().catch(() => ([]));
        const cats = Array.isArray(catBody) ? catBody : [];
        const links = Array.isArray(linkBody) ? linkBody : [];
        const relatedBody = await relatedRes.json().catch(() => ({ data: [] }));
        const all = Array.isArray(relatedBody.data) ? relatedBody.data : Array.isArray(relatedBody) ? relatedBody : [];
        if (active) {
          setPost(postData);
          setCategories(cats);
          setAffiliateLinks(links);
          setRelated(all.filter((p: Post) => p.id !== postData.id).slice(0, 3));
          setLoading(false);
        }
      } catch {
        if (active) { setNotFound(true); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [slug]);

  const renderBodyWithAffiliates = (content?: string) => {
    const body = (content || '').trim();
    if (!body) return null;
    const parts = body.split(/(\[affiliate-card:[\w-]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[affiliate-card:([\w-]+)\]/);
      if (match) {
        const shortSlug = match[1];
        const link = affiliateLinks.find(l => l.shortSlug === shortSlug);
        if (link) {
          return (
            <div key={index} className="my-8 bg-slate-900 dark:bg-zinc-950 text-white rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden border border-slate-200 dark:border-zinc-700/20 dark:border-zinc-700/50">
              <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-br from-[#246BFF]/10 to-transparent rounded-full blur-2xl"></div>
              <div className="space-y-2 relative z-10">
                <span className="bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">EXPERT RECOMMENDATION</span>
                <h4 className="font-display font-bold text-white text-lg tracking-tight">{link.title}</h4>
                <p className="text-zinc-400 text-xs max-w-lg leading-relaxed">This exclusive partner solution has been thoroughly vetted and analyzed by our senior engineering research panel.</p>
              </div>
              <div className="shrink-0 text-right space-y-1 relative z-10 w-full md:w-auto">
                <a
                  href={`/go/${link.shortSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAffiliateClick(link.shortSlug, link.title)}
                  className="inline-block bg-white hover:bg-zinc-200 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg shadow-md transition-all text-center w-full md:w-auto"
                >
                  {link.buttonText || 'Acquire Solution'}
                </a>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block text-center md:text-right">Sponsored Affiliate Partner</p>
              </div>
            </div>
          );
        }
      }
      return <div key={index}><SimpleMarkdown content={part} /></div>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm font-bold">Loading article...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Article Not Found</h1>
          <p className="text-sm text-slate-500">The article you're looking for doesn't exist or isn't published yet.</p>
          <a href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">Back to Home</a>
        </div>
      </div>
    );
  }

  const cat = categories.find(c => c.id === post.categoryId);
  const postTags = Array.isArray(post.tags) ? post.tags : [];
  const pubDate = post.publishedAt || post.createdAt || '';
  const readableDate = pubDate ? (() => { try { return new Date(pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } })() : '';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-zinc-200 pb-20">
      <SeoHelmet
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt || ''}
        canonical={`/post/${post.slug}`}
        ogImage={post.featuredImage || ''}
        ogType="article"
        publishedTime={post.publishedAt || post.createdAt}
        modifiedTime={post.updatedAt || post.createdAt}
        jsonLd={[{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt || '',
          image: post.featuredImage || '',
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt || post.createdAt,
          publisher: { '@type': 'Organization', name: 'DawnWire' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': (typeof window !== 'undefined' ? window.location.origin : '') + '/post/' + post.slug },
        }]}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: post.title || '', url: `/post/${post.slug}` },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-300 hover:text-[#246BFF] mb-6 cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          {post.featuredImage && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-6 md:p-10">
              <ImageZoom src={post.featuredImage} alt={post.title} className="w-full object-contain" containerClassName="w-full" aspectRatio="16/9" width={800} height={450} loading="eager" />
            </div>
          )}

          <div className="p-6 md:p-10 space-y-5">
            <div>
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: cat?.name || 'Articles', href: '/' }, { label: post.title }]} />
            </div>
            {cat && (
              <span className="inline-block bg-[#246BFF]/10 text-[#246BFF] text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg border border-[#246BFF]/20">
                {cat.name}
              </span>
            )}
            <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="font-mono text-[10px] uppercase tracking-wider">{readableDate}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#246BFF]" />
                <span className="font-mono text-[10px] uppercase tracking-wider">{post.readingTime || '5'} MIN READ</span>
              </div>
            </div>
            {post.excerpt && (
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed border-l-2 border-[#246BFF]/40 pl-4">{post.excerpt}</p>
            )}
          </div>

          <div className="px-6 md:px-10 pb-8">
            <article className="prose max-w-none text-slate-800 dark:text-zinc-200 leading-relaxed font-sans text-sm md:text-base space-y-6 markdown-body">
              {renderBodyWithAffiliates(post.content) || (
                <p className="text-sm text-slate-500 dark:text-zinc-400">Full article content is temporarily unavailable — please check back soon.</p>
              )}
            </article>
          </div>

          {postTags.length > 0 && (
            <div className="px-6 md:px-10 pb-6">
              <div className="flex flex-wrap gap-2 border-t border-slate-200 dark:border-zinc-700/80 pt-6">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-white dark:bg-slate-800 text-slate-500 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mx-6 md:mx-10 mb-8 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-3 border border-slate-200 dark:border-zinc-700">
            <span className="text-slate-500 dark:text-zinc-400 text-center sm:text-left">Found this valuable? Share it with your network:</span>
            <SocialShareButtons title={post.title} description={post.excerpt || ''} compact />
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <a key={p.id} href={`/post/${p.slug}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all group">
                  {p.featuredImage && (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img src={proxyImageUrl(p.featuredImage)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#246BFF] transition-colors">{p.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Read article</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
