import React from 'react';
import { Post, Category } from '../../types';
import ScrollReveal from '../ScrollReveal';
import { StaggerContainer, StaggerItem, HoverScale } from '../ScrollReveal';
import {
  Search,
  Clock,
  User,
  ChevronRight,
  Home,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Tag,
  TrendingUp,
  Sparkles,
  Layers,
  Hash,
  AlertCircle,
} from 'lucide-react';
import OptimizedImage from '../OptimizedImage';

interface ArticleListPageProps {
  posts: Post[];
  categories: Category[];
  onNavigate: (route: string, param?: string) => void;
}

const categoryFallbacks: Record<string, string> = {
  "Gym Equipment's": 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800&h=500',
  Jewelry: 'https://images.unsplash.com/photo-1515562141589-6773d6e4e15a?auto=format&fit=crop&q=80&w=800&h=500',
  'Personal Care': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800&h=500',
  default: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800&h=500',
};

const sampleTags = [
  'AI Tools',
  'Workflow',
  'Productivity',
  'Tech Reviews',
  'Automation',
  'SaaS',
  'Machine Learning',
  'Startups',
];

export default function ArticleListPage({ posts, categories, onNavigate }: ArticleListPageProps) {
  const [activeFilter, setActiveFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const published = posts.filter(p => p.status === 'published');
  const filtered = published.filter(p => {
    if (activeFilter) {
      const cat = categories.find(c => c.id === p.categoryId);
      if (!cat || cat.name.toLowerCase() !== activeFilter.toLowerCase()) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesExcerpt = (p.excerpt || '').toLowerCase().includes(q);
      const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchesTitle && !matchesExcerpt && !matchesTags) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
  );

  const recentPosts = published
    .filter(p => p.slug !== sorted[0]?.slug)
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
    .slice(0, 4);

  const trendingPosts = published
    .filter(p => p.isTrending || p.isFeatured)
    .slice(0, 4);

  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="bg-body-bg dark:bg-zinc-950 min-h-screen">
      <div className="Container py-6 md:py-10">
        {/* Breadcrumb */}
        <ScrollReveal variant="fadeDown">
          <nav className="flex items-center gap-2 text-xs font-sans text-text dark:text-zinc-400 mb-6 md:mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-semibold">Blog</span>
          </nav>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal variant="fadeUp">
          <div className="mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-primary mb-3">
              <Sparkles className="w-3 h-3" />
              Our Latest
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-heading dark:text-white tracking-tight leading-tight">
              Product Reviews &<br />
              <span className="text-primary">Buying Guides</span>
            </h1>
            <p className="font-sans text-text dark:text-zinc-400 text-sm md:text-base mt-3 max-w-2xl leading-relaxed">
              Honest, in-depth reviews of fitness gear, jewelry, personal care, and more — tested and curated for you.
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Filter Pills */}
            <ScrollReveal variant="fadeUp" delay={0.1}>
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={() => { setActiveFilter(''); setSearchQuery(''); }}
                  className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all cursor-pointer ${
                    activeFilter === ''
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-zinc-800 text-text dark:text-zinc-300 hover:text-primary dark:hover:text-primary border border-border dark:border-zinc-700'
                  }`}
                >
                  All
                </button>
                {categories.filter(c => c.status === 'active').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(activeFilter === cat.name.toLowerCase() ? '' : cat.name.toLowerCase())}
                    className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all cursor-pointer ${
                      activeFilter === cat.name.toLowerCase()
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white dark:bg-zinc-800 text-text dark:text-zinc-300 hover:text-primary dark:hover:text-primary border border-border dark:border-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-sans text-text dark:text-zinc-400">
                Showing <span className="font-semibold text-heading dark:text-white">{sorted.length}</span> article{sorted.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Article Grid */}
            {sorted.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800">
                <div className="w-16 h-16 rounded-full bg-body-bg dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-text2 dark:text-zinc-500" />
                </div>
                <p className="font-sans text-sm text-text dark:text-zinc-400">No articles found matching your criteria.</p>
                <button
                  onClick={() => { setActiveFilter(''); setSearchQuery(''); }}
                  className="mt-4 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary2 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <StaggerContainer>
                <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                  {sorted.map(post => {
                    const cat = categories.find(c => c.id === post.categoryId);
                    const catName = cat?.name || '';
                    const fallbackImg = categoryFallbacks[catName] || categoryFallbacks.default;
                    const badge = post.isTrending ? 'Trending' : post.isEditorsPick ? "Editor's Pick" : post.isFeatured ? 'Top Rated' : '';

                    return (
                      <StaggerItem>
                        <HoverScale>
                          <article
                            key={post.id}
                            onClick={() => onNavigate('post', post.slug)}
                            className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-border dark:border-zinc-800 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col"
                          >
                      {/* Image */}
                      <div className="relative h-[200px] md:h-[220px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 shrink-0">
                        {post.featuredImage ? (
                          <OptimizedImage
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            width={400}
                            height={220}
                            loading="lazy"
                          />
                        ) : (
                          <OptimizedImage
                            src={fallbackImg}
                            alt={catName || 'Article'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            width={400}
                            height={220}
                            loading="lazy"
                          />
                        )}
                        {/* Category Badge */}
                        {cat && (
                          <span className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-primary px-2.5 py-1 rounded-full shadow-sm">
                            {cat.name}
                          </span>
                        )}
                        {/* Status Badge */}
                        {badge && (
                          <span className={`absolute top-3 right-3 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                            badge === 'Trending'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                              : badge === "Editor's Pick"
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}>
                            {badge}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 md:p-6 flex flex-col flex-1">
                        {/* Meta */}
                        <div className="flex items-center gap-3 text-[10px] font-sans text-text2 dark:text-zinc-500 uppercase tracking-wider font-semibold mb-3">
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                          {post.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.readingTime} min
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-display font-bold text-sm md:text-base text-heading dark:text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="font-sans text-xs text-text dark:text-zinc-400 leading-relaxed line-clamp-2 flex-1 mb-4">
                          {post.excerpt
                            ? stripHtml(post.excerpt).substring(0, 140)
                            : ''}
                        </p>

                        {/* Author & CTA */}
                        <div className="flex items-center justify-between pt-3 mt-auto border-t border-border dark:border-zinc-800">
                          <div className="flex items-center gap-2 text-[10px] font-sans text-text2 dark:text-zinc-500">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary2 to-primary3 flex items-center justify-center text-white text-[8px] font-bold">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="font-semibold truncate max-w-[100px]">
                              {post.authorId ? `Author` : 'DawnWire'}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-body-bg dark:bg-zinc-800 border border-border dark:border-zinc-700 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                          </article>
                        </HoverScale>
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerContainer>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[300px] xl:w-[340px] shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <ScrollReveal variant="fadeUp" delay={0}>
              {/* Search */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800 p-5">
                <h3 className="font-display font-bold text-xs text-heading dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  Search
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-body-bg dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl px-4 py-3 pl-10 text-xs font-sans text-heading dark:text-white placeholder:text-text2 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                  <Search className="w-4 h-4 text-text2 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fadeUp" delay={0.1}>
              {/* Categories */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800 p-5">
                <h3 className="font-display font-bold text-xs text-heading dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Categories
                </h3>
                <ul className="space-y-1">
                  {categories.filter(c => c.status === 'active').map(cat => {
                    const count = published.filter(p => p.categoryId === cat.id).length;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => setActiveFilter(activeFilter === cat.name.toLowerCase() ? '' : cat.name.toLowerCase())}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                            activeFilter === cat.name.toLowerCase()
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-text dark:text-zinc-400 hover:bg-body-bg dark:hover:bg-zinc-800 hover:text-heading dark:hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${activeFilter === cat.name.toLowerCase() ? 'bg-primary' : 'bg-text2 dark:bg-zinc-600'}`} />
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-semibold text-text2 dark:text-zinc-500">{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </ScrollReveal>

            {recentPosts.length > 0 && (
              <ScrollReveal variant="fadeUp" delay={0.2}>
                {/* Recent Posts */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800 p-5">
                  <h3 className="font-display font-bold text-xs text-heading dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Recent Posts
                  </h3>
                  <ul className="space-y-3">
                    {recentPosts.map(p => (
                      <li key={p.id}>
                        <button
                          onClick={() => onNavigate('post', p.slug)}
                          className="flex gap-3 group/item cursor-pointer w-full text-left"
                        >
                          <div className="w-[60px] h-[60px] rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900">
                            {p.featuredImage ? (
                              <OptimizedImage
                                src={p.featuredImage}
                                alt={p.title}
                                className="w-full h-full object-cover"
                                width={60}
                                height={60}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-text2 dark:text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-semibold text-xs text-heading dark:text-white leading-snug line-clamp-2 group-hover/item:text-primary transition-colors">
                              {p.title}
                            </h4>
                            <p className="text-[10px] font-sans text-text2 dark:text-zinc-500 mt-1">
                              {p.publishedAt ? formatDate(p.publishedAt) : ''} · {p.readingTime || 3} min
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            )}

            {trendingPosts.length > 0 && (
              <ScrollReveal variant="fadeUp" delay={0.3}>
                {/* Trending Posts */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800 p-5">
                  <h3 className="font-display font-bold text-xs text-heading dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    Trending
                  </h3>
                  <ul className="space-y-3">
                    {trendingPosts.map((p, i) => (
                      <li key={p.id}>
                        <button
                          onClick={() => onNavigate('post', p.slug)}
                          className="flex items-start gap-3 group/item cursor-pointer w-full text-left"
                        >
                          <span className="font-display font-bold text-lg text-text2 dark:text-zinc-600 leading-none shrink-0 w-5 text-center">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-semibold text-xs text-heading dark:text-white leading-snug line-clamp-2 group-hover/item:text-primary transition-colors">
                              {p.title}
                            </h4>
                            <p className="text-[10px] font-sans text-text2 dark:text-zinc-500 mt-1">
                              {p.publishedAt ? formatDate(p.publishedAt) : ''}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            )}

            <ScrollReveal variant="fadeUp" delay={0.4}>
              {/* Tags */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border dark:border-zinc-800 p-5">
                <h3 className="font-display font-bold text-xs text-heading dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sampleTags.map(tag => {
                    const count = published.filter(
                      p => p.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
                    ).length;
                    return (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold font-sans text-text dark:text-zinc-300 bg-body-bg dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-border dark:border-zinc-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        {tag}
                        {count > 0 && (
                          <span className="ml-1 text-text2 dark:text-zinc-500">({count})</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
