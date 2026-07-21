import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Search, Calendar, User as UserIcon, Clock, ArrowRight, ArrowLeft,
  MessageSquare, ThumbsUp, Send, Mail, MapPin, Sparkles, AlertCircle,
  Share2, ChevronRight, Check, Heart, ExternalLink, Menu, X, Filter, Bookmark, HelpCircle, Layers,
  Sun, Moon, Star, RefreshCw, ShoppingBag, TrendingUp, DollarSign, Award, BookOpen, Trash2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Post, Category, Comment, AffiliateLink, Page, SiteSettings, User, TopicCluster, ContentUpgrade } from '../types';
import { Head } from 'vike-react/Head';
import SeoHelmet from './SeoHelmet';
import Breadcrumbs from './Breadcrumbs';
import PublicProductReview from './PublicProductReview';
import PublicPortfolio from './PublicPortfolio';
import PublicServices from './PublicServices';
import BuyerGuidePage from './BuyerGuidePage';
import HeroSlider from './HeroSlider';
import ImageZoom from './ImageZoom';
import { trackAffiliateClick, trackPageView } from '../lib/tracker';
import SocialShareButtons from './SocialShareButtons';
import ExitIntentPopup from './ExitIntentPopup';
import SocialProof from './SocialProof';
import ContentUpgradeCTA from './ContentUpgradeCTA';
import ShoppingAssistant from './ShoppingAssistant';
import Header from './Header';
import Footer from './Footer';
import { MotionProvider } from './motion/MotionProvider';

import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AdvertisePage from './pages/AdvertisePage';
import SubmitProductPage from './pages/SubmitProductPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import ArticleListPage from './pages/ArticleListPage';
import ClusterPage from './pages/ClusterPage';
import { EditorialPolicyPage, AffiliateDisclosurePage, PrivacyPage, TermsPage, NewsletterInfoPage } from './pages/ContentPages';
import CategoryLanding from './affiliate/CategoryLanding';
import ProductDetail from './affiliate/ProductDetail';
import ProductList from './affiliate/ProductList';
import DealCard from './affiliate/DealCard';
import ProductCard from './affiliate/ProductCard';
import CustomerAccountPage from './pages/CustomerAccountPage';
import DealsPage from './pages/DealsPage';
import WishlistPage from './pages/WishlistPage';

function SimpleMarkdown({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="markdown-body space-y-5">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white mt-8 mb-4 tracking-tight border-b border-slate-200 dark:border-zinc-700 pb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="font-display text-xl font-semibold text-slate-800 dark:text-zinc-100 mt-6 mb-3 tracking-tight">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed text-slate-800 dark:text-zinc-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-slate-500 dark:text-zinc-400 my-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 text-slate-500 dark:text-zinc-400 my-4">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#246BFF] pl-4 py-1 italic my-6 text-slate-800 dark:text-zinc-200 bg-blue-50 dark:bg-[#246BFF]/5 rounded-xl">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-bold text-slate-800 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[#246BFF]">{children}</code>,
          hr: () => <hr className="my-8 border-slate-200 dark:border-zinc-700" />,
          a: ({ href, children }) => <a href={href} className="text-[#246BFF] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          h1: ({ children }) => <h1 className="font-display text-3xl font-bold text-slate-800 dark:text-white mt-8 mb-4 tracking-tight">{children}</h1>,
          img: ({ src, alt }) => src ? (
            <div className="my-8 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
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

interface PublicPagesProps {
  currentRoute: { name: string; param?: string };
  onNavigate: (route: string, param?: string) => void;
  posts: Post[];
  categories: Category[];
  affiliateLinks: AffiliateLink[];
  pages: Page[];
  settings: SiteSettings | null;
  currentUser: User | null;
  onOpenLogin: () => void;
  routeSpecific?: {
    post: Post | null;
    comments: Comment[];
    clusters: TopicCluster[];
    upgrades: ContentUpgrade[];
    prevArticle: Post | null;
    nextArticle: Post | null;
  };
}

export default function PublicPages({
  currentRoute,
  onNavigate,
  posts,
  categories,
  affiliateLinks,
  pages,
  settings,
  currentUser,
  onOpenLogin,
  routeSpecific
}: PublicPagesProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.body.classList.contains('dark');
    }
    return false;
  });

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const [activeComments, setActiveComments] = useState<Comment[]>(routeSpecific?.comments || []);

  // Content upgrades state
  const [contentUpgrades, setContentUpgrades] = useState<any[]>(routeSpecific?.upgrades || []);

  // Topic clusters state
  const [clusters, setClusters] = useState<any[]>(routeSpecific?.clusters || []);
  const activeCluster = useMemo(() => {
    if (currentRoute.name === 'post' && currentRoute.param) {
      const currentPost = posts.find(p => p.slug === currentRoute.param);
      if (currentPost) {
        return clusters.find(c => c.clusterPostIds?.includes(currentPost.id) || c.pillarPageId === currentPost.id) || null;
      }
    }
    return null;
  }, [clusters, currentRoute.name, currentRoute.param, posts]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Single post comment state
  const [commentContent, setCommentContent] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmittedMsg, setCommentSubmittedMsg] = useState('');

  // Affiliate platform state
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [categoryPage, setCategoryPage] = useState<any>(null);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [homepageData, setHomepageData] = useState<any>(null);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Load affiliate data on route change
  useEffect(() => {
    const name = currentRoute.name;
    const param = currentRoute.param;

    if (name === 'products' || name === 'category' || name === 'product' || name === 'deals' || name === 'categories' || name === 'home' || !name) {
      fetch('/api/public/product-reviews').then(r => r.json()).then(data => setAllProducts(Array.isArray(data?.data) ? data.data : [])).catch(() => {});
    }
    if (name === 'category' || name === 'products' || name === 'home' || !name) {
      fetch('/api/public/brands').then(r => r.json()).then(data => setAllBrands(Array.isArray(data) ? data : [])).catch(() => {});
    }
    if (name === 'category' && param) {
      fetch(`/api/public/categories/${param}`).then(r => r.json()).then(data => setCategoryPage(data)).catch(() => setCategoryPage(null));
    }
    if (name === 'product' && param) {
      fetch(`/api/public/product-reviews/slug/${param}`).then(r => r.json()).then(data => setCurrentProduct(data)).catch(() => {
        fetch('/api/public/product-reviews').then(r => r.json()).then(data => {
          const all = Array.isArray(data?.data) ? data.data : [];
          setCurrentProduct(all.find((p: any) => p.id === param || p.slug === param));
        }).catch(() => setCurrentProduct(null));
      });
    }
    if (name === 'deals') {
      fetch('/api/public/deals').then(r => r.json()).then(data => setDeals(Array.isArray(data) ? data : [])).catch(() => {});
    }
    if (name === 'home' || !name) {
      fetch('/api/public/homepage').then(r => r.json()).then(data => setHomepageData(data)).catch(() => {});
    }
    if (name === 'wishlist') {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) fetch(`/api/public/wishlist?sessionId=${sessionId}`).then(r => r.json()).then(data => setWishlistItems(Array.isArray(data) ? data : [])).catch(() => {});
    }
    if (name === 'recently-viewed') {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) fetch(`/api/public/recently-viewed?sessionId=${sessionId}`).then(r => r.json()).then(data => setRecentlyViewed(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, [currentRoute.name, currentRoute.param]);

  // Track page view on route change + scroll to top
  useEffect(() => {
    const title = currentRoute.param ? `${currentRoute.name}/${currentRoute.param}` : currentRoute.name;
    trackPageView('/' + currentRoute.name + (currentRoute.param ? '/' + currentRoute.param : ''), title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute.name, currentRoute.param]);

  // Scroll listener for sticky header + progress bar
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setScrolled(scrollY > 60);
          const pct = Math.min(100, (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
          const bar = document.getElementById('scroll-progress');
          if (bar) bar.style.transform = `scaleX(${pct / 100})`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode toggle
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Sync dark mode with body class on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark');
      setDarkMode(true);
    } else {
      document.body.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  // Load single post comments
  useEffect(() => {
    if (routeSpecific?.comments) return;
    if (currentRoute.name === 'post' && currentRoute.param) {
      const fetchComments = async () => {
        setCommentsLoading(true);
        try {
          const activePost = posts.find(p => p.slug === currentRoute.param);
          if (activePost) {
            const res = await fetch(`/api/public/comments/post/${activePost.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
              setActiveComments(data);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCommentsLoading(false);
        }
      };
      fetchComments();
    }
  }, [currentRoute, posts]);

  // Load content upgrades for active post
  useEffect(() => {
    if (routeSpecific?.upgrades) return;
    if (currentRoute.name === 'post' && currentRoute.param) {
      const fetchUpgrades = async () => {
        try {
          const res = await fetch('/api/admin/seo/content-upgrades');
          if (res.ok) {
            const all = await res.json();
            const post = posts.find(p => p.slug === currentRoute.param);
            if (post) {
              setContentUpgrades(Array.isArray(all) ? all.filter((u: any) => u.postId === post.id || u.postSlug === post.slug) : []);
            }
          }
        } catch (e) { console.error(e) }
      };
      fetchUpgrades();
    } else {
      setContentUpgrades([]);
    }
  }, [currentRoute, posts]);

  // Fetch topic clusters
  useEffect(() => {
    if (routeSpecific?.clusters) return;
    const fetchClusters = async () => {
      try {
        const res = await fetch('/api/public/topic-clusters');
        if (res.ok) setClusters(await res.json());
      } catch (e) { console.error(e) }
    };
    fetchClusters();
  }, []);

  // Handle Newsletter Submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError('');
    setNewsletterSuccess(false);
    try {
      const res = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterSuccess(true);
        setNewsletterEmail('');
      } else {
        setNewsletterError(data.error || 'Failed to subscribe.');
      }
    } catch (e) {
      setNewsletterError('A server error occurred. Try again later.');
    }
  };

  // Handle Contact Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage
        })
      });
      if (res.ok) {
        setContactSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      }
    } catch (err) {
      alert('Error sending message.');
    } finally {
      setContactSubmitting(false);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    const activePost = posts.find(p => p.slug === currentRoute.param);
    if (!activePost) return;
    const payload = {
      postId: activePost.id,
      parentId: replyToId || undefined,
      content: commentContent,
      name: currentUser ? currentUser.name : commentName,
      email: currentUser ? currentUser.email : commentEmail,
      userId: currentUser ? currentUser.id : undefined
    };
    try {
      const res = await fetch('/api/public/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setCommentContent('');
        setReplyToId(null);
        if (data.status === 'approved') {
          setActiveComments(prev => [data, ...prev]);
          setCommentSubmittedMsg('Comment posted successfully!');
        } else if (data.status === 'pending') {
          setCommentSubmittedMsg('Thank you! Your comment has been submitted and is awaiting approval by moderators.');
        } else if (data.status === 'spam') {
          setCommentSubmittedMsg('Your comment was flagged by our security systems as possible spam.');
        }
        setTimeout(() => setCommentSubmittedMsg(''), 5000);
      } else {
        alert(data.error || 'Failed to submit comment.');
      }
    } catch (e) {
      alert('Error submitting comment.');
    }
  };

  // Like comment
  const handleLikeComment = async (id: string) => {
    try {
      const res = await fetch(`/api/public/comments/${id}/like`, { method: 'POST' });
      if (res.ok) {
        setActiveComments(prev => prev.map(c => c.id === id ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter posts based on routes & active selections
  let filteredPosts = [...posts];
  if (searchTerm) {
    filteredPosts = filteredPosts.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (currentRoute.name === 'posts-by-category' && currentRoute.param) {
    filteredPosts = filteredPosts.filter(p => p.categoryId === currentRoute.param);
  } else if (selectedCategory !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.categoryId === selectedCategory);
  }
  if (selectedTag) {
    filteredPosts = filteredPosts.filter(p => p.tags.includes(selectedTag));
  }
  if (sortBy === 'latest') {
    filteredPosts.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  } else if (sortBy === 'trending') {
    filteredPosts = filteredPosts.filter(p => p.isTrending);
  }

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)));
  const activePost = currentRoute.name === 'post' ? posts.find(p => p.slug === currentRoute.param) : null;
  const activePage = currentRoute.name === 'page' ? pages.find(p => p.slug === currentRoute.param) : null;
  const isHome = currentRoute.name === 'home' || currentRoute.name === 'posts-by-category';

  // Prev/Next for article pagination
  const currentIndex = activePost ? posts.findIndex(p => p.id === activePost.id) : -1;
  const prevArticle = routeSpecific?.prevArticle ?? (currentIndex > 0 ? posts[currentIndex - 1] : null);
  const nextArticle = routeSpecific?.nextArticle ?? (currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null);

  // Render content with affiliate shortcodes
  const renderBodyWithAffiliates = (content: string) => {
    const parts = content.split(/(\[affiliate-card:[\w-]+\])/g);
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

  // Table of Contents
  const generateTOC = (content: string) => {
    const lines = content.split('\n');
    const headers = lines
      .filter(line => line.startsWith('## '))
      .map(line => line.replace('## ', '').trim());
    if (headers.length === 0) return null;
    return (
      <div className="bg-white dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-700 p-6 shadow-lg sticky top-24 backdrop-blur-md" id="table-of-contents">
        <h4 className="font-display font-extrabold text-slate-800 dark:text-white text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-slate-200 dark:border-zinc-700 pb-2.5 flex items-center gap-2">
          <Bookmark className="h-3.5 w-3.5 text-[#246BFF]" /> ON THIS PAGE
        </h4>
        <ul className="space-y-3">
          {headers.map((hdr, index) => (
            <li key={index} className="text-xs">
              <a
                href={`#hdr-${index}`}
                onClick={(e) => {
                  e.preventDefault();
                  const elements = document.getElementsByTagName('h2');
                  for (const el of elements) {
                    if (el.textContent === hdr) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      break;
                    }
                  }
                }}
                className="text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] dark:hover:text-white font-medium transition-all block truncate border-l-2 border-transparent pl-3 hover:border-[#246BFF]"
              >
                {hdr}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <MotionProvider>
      <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 font-sans selection:bg-[#246BFF] selection:text-white transition-colors duration-200`} id="public-layout">

      {/* Dynamic SEO Meta Tags */}
      {(currentRoute.name === 'home' || !currentRoute.name) && (
        <SeoHelmet
          title={settings?.siteName || 'DawnWire'}
          description={settings?.siteTagline || 'Premium technology & affiliate marketing intelligence. Expert insights at the intersection of engineering and business growth.'}
          canonical="/"
          ogType="website"
          siteName={settings?.siteName}
          siteTagline={settings?.siteTagline}
          logoUrl={settings?.logoUrl}
        />
      )}
      {currentRoute.name === 'post' && activePost && (
        <>
          <SeoHelmet
            title={(activePost as any).seoTitle || activePost.title}
            description={(activePost as any).seoDescription || activePost.excerpt || ''}
            canonical={`/post/${activePost.slug}`}
            ogImage={activePost.featuredImage || ''}
            ogType="article"
            siteName={settings?.siteName}
            siteTagline={settings?.siteTagline}
            logoUrl={settings?.logoUrl}
            publishedTime={activePost.publishedAt || activePost.createdAt}
            modifiedTime={activePost.updatedAt || activePost.createdAt}
            jsonLd={[{
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: (activePost as any).seoTitle || activePost.title,
              description: (activePost as any).seoDescription || activePost.excerpt || '',
              image: activePost.featuredImage || '',
              datePublished: activePost.publishedAt || activePost.createdAt,
              dateModified: activePost.updatedAt || activePost.createdAt,
              author: activePost.authorId ? { '@type': 'Person', name: 'Author' } : { '@type': 'Organization', name: settings?.siteName || 'DawnWire' },
              publisher: { '@type': 'Organization', name: settings?.siteName || 'DawnWire', logo: { '@type': 'ImageObject', url: settings?.logoUrl || '/logo.png' } },
              mainEntityOfPage: { '@type': 'WebPage', '@id': typeof window !== 'undefined' ? window.location.origin + '/post/' + activePost.slug : undefined },
            }]}
            breadcrumbs={[
              { name: 'Home', url: '/' },
              { name: activePost.title || '', url: `/post/${activePost.slug}` },
            ]}
          />
          <Head>
            {prevArticle && <link rel="prev" href={`/post/${prevArticle.slug}`} />}
            {nextArticle && <link rel="next" href={`/post/${nextArticle.slug}`} />}
          </Head>
        </>
      )}
      {currentRoute.name === 'page' && activePage && (
        <SeoHelmet
          title={(activePage as any).seoTitle || activePage.title}
          description={(activePage as any).seoDescription || ''}
          canonical={`/page/${activePage.slug}`}
          ogType="article"
          siteName={settings?.siteName}
          siteTagline={settings?.siteTagline}
          logoUrl={settings?.logoUrl}
        />
      )}
      {currentRoute.name === 'contact' && (
        <SeoHelmet
          title="Contact"
          description={`Get in touch with ${settings?.siteName || 'DawnWire'}. Send us a message and we will respond as soon as possible.`}
          canonical="/contact"
          ogType="website"
          siteName={settings?.siteName}
          siteTagline={settings?.siteTagline}
          logoUrl={settings?.logoUrl}
        />
      )}

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#246BFF] via-[#7C3AED] to-[#246BFF] z-[9999] shadow-lg origin-left" id="scroll-progress" style={{ willChange: 'transform', transform: 'scaleX(0)' }} />

      {/* ============ HERO SLIDER ============ */}
      {currentRoute.name === 'posts-by-category' && (
        <HeroSlider posts={posts} settings={settings} onNavigate={onNavigate} />
      )}

      <Header
        scrolled={scrolled}
        isHome={isHome}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onOpenLogin={onOpenLogin}
        settings={settings}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* ============ MAIN CONTENT ============ */}
      <main id="main-content" className={`flex-1 w-full relative z-10 ${isHome ? '' : 'pt-24'}`}>

        <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute.name + '-' + (currentRoute.param || '')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >

        {/* ===== HOMEPAGE CONTENT ===== */}
        {isHome && (
          <HomePage posts={posts} categories={categories} settings={settings} onNavigate={onNavigate} />
        )}

        {/* ===== CATEGORY HEADER (when browsing a category) ===== */}
        {currentRoute.name === 'posts-by-category' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
            <div className="bg-white dark:bg-zinc-950/40 rounded-xl border border-slate-200 dark:border-zinc-700/60 p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-zinc-950 via-[#246BFF]/5 to-transparent opacity-80" />
              <div className="relative z-10 space-y-3">
                <Breadcrumbs
                  items={[
                    { label: 'Home', onClick: () => onNavigate('home') },
                    { label: categories.find(c => c.id === currentRoute.param)?.name || 'Category' },
                  ]}
                />
                <h2 className="text-2xl md:text-3xl font-display font-medium capitalize text-slate-900 dark:text-white">
                  {categories.find(c => c.id === currentRoute.param)?.name || 'Category'}
                </h2>
              </div>
              <button
                onClick={() => onNavigate('home')}
                className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-300 hover:text-[#246BFF] dark:hover:text-white flex items-center gap-1.5 bg-white dark:bg-zinc-950/60 hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-950 px-4 py-2 rounded-lg transition-all border border-slate-200 dark:border-zinc-700 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All Articles
              </button>
            </div>
          </div>
        )}

        {/* ===== SINGLE POST VIEW ===== */}
        {currentRoute.name === 'post' && activePost && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-5xl mx-auto px-4 md:px-6 py-8"
            id="article-view"
          >
            <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 rounded-xl shadow-sm overflow-hidden">
              {/* Product Hero */}
              <div className="flex flex-col lg:flex-row">
                {activePost.featuredImage && (
                  <div className="lg:w-[380px] shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center p-6 md:p-8">
                    <ImageZoom
                      src={activePost.featuredImage}
                      alt={activePost.title}
                      className="w-full h-full object-contain"
                      containerClassName="w-full"
                      aspectRatio="1/1"
                      width={380} height={380}
                      loading="eager"
                    />
                  </div>
                )}
                <div className="flex-1 p-6 md:p-8 lg:p-10 space-y-5">
                  <div>
                    <Breadcrumbs
                      items={[
                        { label: 'Home', onClick: () => onNavigate('home') },
                        { label: categories.find(c => c.id === activePost.categoryId)?.name || 'Articles', onClick: () => onNavigate('home') },
                        { label: activePost.title },
                      ]}
                    />
                  </div>
                  <span className="inline-block bg-[#246BFF]/10 text-[#246BFF] text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-lg border border-[#246BFF]/20">
                    {categories.find(c => c.id === activePost.categoryId)?.name || 'Article'}
                  </span>
                  <h1 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight leading-tight">
                    {activePost.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#246BFF]" />
                      <span className="font-mono text-[10px] uppercase tracking-wider">{new Date(activePost.publishedAt || activePost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#246BFF]" />
                      <span className="font-mono text-[10px] uppercase tracking-wider">{activePost.readingTime || '5'} MIN READ</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-1.5 bg-[#246BFF] hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer" aria-label="Back to articles list">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-zinc-700 hover:border-[#246BFF] text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer" aria-label="Share article URL">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              {affiliateLinks.length > 0 && settings?.affiliateDisclosureText && (
                <div className="mx-6 md:mx-8 lg:mx-10 mb-6 bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] text-slate-500 dark:text-zinc-400 italic leading-relaxed" id="affiliate-disclosure">
                  <strong className="text-slate-800 dark:text-white font-bold not-italic uppercase text-[9px] tracking-wider block mb-1">Affiliate Disclosure:</strong>
                  {settings.affiliateDisclosureText}
                </div>
              )}

              {/* Topic Cluster Banner */}
              {activeCluster && (
                <div className="mx-6 md:mx-8 lg:mx-10 mb-6 bg-gradient-to-r from-[#246BFF]/10 to-blue-50 dark:from-blue-950/20 dark:to-zinc-950/40 border border-[#246BFF]/20 dark:border-blue-800/30 rounded-xl p-4" id="cluster-banner">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#246BFF]/20 p-2 rounded-full shrink-0" aria-hidden="true">
                      <Layers className="h-4 w-4 text-[#246BFF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#246BFF] mb-0.5">Part of our {activeCluster.name} Series</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{activeCluster.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('cluster', activeCluster.slug)}
                      className="shrink-0 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer"
                      aria-label={`View all articles in ${activeCluster.name}`}
                    >
                      View Series
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="px-6 md:px-8 lg:px-10 pb-8">
                <article className="prose max-w-none text-slate-800 dark:text-zinc-200 leading-relaxed font-sans text-sm md:text-base space-y-6 markdown-body" id="active-post-body">
                  {renderBodyWithAffiliates(activePost.content)}
                </article>

                <SocialProof postId={activePost.id} title={activePost.title} />
                {contentUpgrades.map((upgrade: any) => (
                  <ContentUpgradeCTA key={upgrade.id} upgrade={upgrade} postTitle={activePost.title} />
                ))}
              </div>

              {/* Tags */}
              {activePost.tags.length > 0 && (
                <div className="px-6 md:px-8 lg:px-10 pb-6">
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 dark:border-zinc-700/80 pt-6">
                    {activePost.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { setSelectedTag(tag); onNavigate('home'); }}
                        className="bg-white dark:bg-zinc-950/60 hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-950 text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] dark:hover:text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer transition-colors"
                        aria-label={`Filter by tag: ${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mx-6 md:mx-8 lg:mx-10 mb-8 bg-slate-50 dark:bg-zinc-950/60 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-3 border border-slate-200 dark:border-zinc-700" id="share-block">
                <span className="text-slate-500 dark:text-zinc-400 text-center sm:text-left">Found this valuable? Share it with your network:</span>
                <SocialShareButtons
                  title={activePost?.title || 'DawnWire Article'}
                  description={activePost?.excerpt || ''}
                  compact
                />
              </div>

              {/* Prev / Next */}
              <div className="px-6 md:px-8 lg:px-10 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-zinc-700/80 pt-8" id="post-navigation">
                  {posts.length > 1 && (() => {
                    const currentIndex = posts.findIndex(p => p.id === activePost.id);
                    const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
                    const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
                    return (
                      <>
                        {prevPost ? (
                          <button onClick={() => onNavigate('post', prevPost.slug)} className="p-5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-950 hover:border-[#246BFF]/50 cursor-pointer text-left space-y-1.5 transition-all group" aria-label={`Previous article: ${prevPost.title}`}>
                            <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest block">PREVIOUS</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 dark:group-hover:text-[#246BFF] transition-colors capitalize">{prevPost.title}</span>
                          </button>
                        ) : <div />}
                        {nextPost ? (
                          <button onClick={() => onNavigate('post', nextPost.slug)} className="p-5 rounded-xl border border-slate-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-950/40 hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-950 hover:border-[#246BFF]/50 cursor-pointer text-right space-y-1.5 transition-all group" aria-label={`Next article: ${nextPost.title}`}>
                            <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest block">NEXT</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1 dark:group-hover:text-[#246BFF] transition-colors capitalize">{nextPost.title}</span>
                          </button>
                        ) : <div />}
                      </>
                    );
                  })()}
                </div>
              </div>

                {/* Comments */}
                {settings?.enableComments && (
                  <div className="border-t border-slate-200 dark:border-zinc-700/80 pt-12 space-y-8" id="post-comments-panel">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-bold text-slate-800 dark:text-white tracking-tight text-lg flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#246BFF]" />
                        DISCUSSION ({activeComments.length})
                      </h3>
                    </div>

                    {commentSubmittedMsg && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 dark:border-emerald-400/30 rounded-xl p-4 text-xs font-medium">
                        {commentSubmittedMsg}
                      </div>
                    )}

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-700/40 p-6 space-y-4">
                      <h4 className="font-display font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-widest">JOIN THE DISCUSSION</h4>

                      {replyToId && (
                        <div className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-300 text-xs p-3 rounded-lg flex justify-between items-center font-medium border border-slate-200 dark:border-zinc-700">
                          <span>Replying to a comment...</span>
                          <button type="button" onClick={() => setReplyToId(null)} className="text-slate-500 dark:text-zinc-500 hover:text-[#246BFF] dark:hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer" aria-label="Cancel reply">Cancel</button>
                        </div>
                      )}

                      <textarea
                        id="comment-content"
                        name="comment"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-4 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none transition-all font-sans text-slate-800 dark:text-white"
                        required
                      />

                      {!currentUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Your Name</label>
                            <input
                              type="text"
                              value={commentName}
                              onChange={(e) => setCommentName(e.target.value)}
                              placeholder="Alex Smith"
                              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none font-medium text-slate-800 dark:text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Email (private)</label>
                            <input
                              type="email"
                              value={commentEmail}
                              onChange={(e) => setCommentEmail(e.target.value)}
                              placeholder="alex@domain.com"
                              className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none font-medium text-slate-800 dark:text-white"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-[#246BFF] hover:bg-[#246BFF]/90 text-white text-[9px] font-bold uppercase tracking-widest px-5 py-3 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" /> PUBLISH
                      </button>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-6">
                      {commentsLoading ? (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 py-6 text-center animate-pulse">Loading discussions...</p>
                      ) : activeComments.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 py-6 text-center italic">No comments yet. Be the first to share your thoughts.</p>
                      ) : (
                        activeComments.filter(c => !c.parentId).map((parent) => (
                          <div key={parent.id} className="border-b border-slate-200 dark:border-zinc-800 pb-6 space-y-4">
                            <div className="flex gap-4">
                              <div className="bg-[#246BFF]/10 text-[#246BFF] h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 border border-[#246BFF]/20">
                                {parent.name[0]}
                              </div>
                              <div className="space-y-1.5 w-full">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">{parent.name}</span>
                                  <span className="text-[9px] text-slate-500 dark:text-zinc-500 font-mono">{new Date(parent.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-800 dark:text-zinc-300 text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-sans">{parent.content}</p>
                                <div className="flex items-center gap-4 pt-2 text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
                                  <button onClick={() => handleLikeComment(parent.id)} className="hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer" aria-label={`Like comment by ${parent.name}`}>
                                    <Heart className="h-3.5 w-3.5 text-red-600 dark:text-red-400 fill-red-600 dark:fill-red-400" /> {parent.likesCount || 0} LIKES
                                  </button>
                                  <button onClick={() => setReplyToId(parent.id)} className="hover:text-[#246BFF] dark:hover:text-white transition-colors cursor-pointer" aria-label={`Reply to comment by ${parent.name}`}>
                                    REPLY
                                  </button>
                                </div>
                              </div>
                            </div>

                            {activeComments.filter(child => child.parentId === parent.id).map((child) => (
                              <div key={child.id} className="pl-12 flex gap-3 mt-2">
                                <div className="bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold uppercase shrink-0 border border-slate-200 dark:border-zinc-700">
                                  {child.name[0]}
                                </div>
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider">{child.name}</span>
                                    <span className="text-[8px] text-slate-500 dark:text-zinc-500 font-mono">{new Date(child.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-800 dark:text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed font-sans">{child.content}</p>
                                  <button onClick={() => handleLikeComment(child.id)} className="flex items-center gap-1 pt-1.5 text-[8px] font-bold text-slate-500 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer uppercase tracking-widest font-mono" aria-label={`Like reply by ${child.name}`}>
                                    <Heart className="h-3 w-3 text-red-600 dark:text-red-400 fill-red-600 dark:fill-red-400" /> {child.likesCount || 0} LIKES
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
        )}

        {/* ===== STATIC PAGE VIEW ===== */}
        {currentRoute.name === 'page' && activePage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-4xl mx-auto px-4 md:px-6 py-8"
            id="static-page-view"
          >
            <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 p-8 md:p-12 rounded-xl shadow-sm space-y-6">
              <Breadcrumbs
                items={[
                  { label: 'Home', onClick: () => onNavigate('home') },
                  { label: activePage.title },
                ]}
                className="mb-2"
              />
              <h1 className="font-display font-semibold text-slate-900 dark:text-white tracking-tight text-3xl md:text-4xl pb-4 border-b border-slate-200 dark:border-zinc-700/80 capitalize">
                {activePage.title}
              </h1>
              <article className="prose max-w-none text-slate-800 dark:text-zinc-200 leading-relaxed space-y-4 font-sans markdown-body">
                <SimpleMarkdown content={activePage.content} />
              </article>
            </div>
          </motion.div>
        )}

        {/* ===== PRODUCTS LIST VIEW ===== */}
        {currentRoute.name === 'products' && (
          <div className="Container px-4 py-8">
            <ProductList
              products={allProducts}
              categories={categories.filter((c: any) => c.status === 'active')}
              brands={allBrands}
              title="All Products"
              description="Browse our curated selection of top-rated products."
              showFilters
            />
          </div>
        )}

        {/* ===== SEARCH VIEW ===== */}
        {currentRoute.name === 'search' && (
          <div className="Container px-4 py-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-6">
              Search Results{currentRoute.param ? `: "${currentRoute.param}"` : ''}
            </h1>
            {allProducts && allProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allProducts.filter((p: any) => {
                  const q = (currentRoute.param || '').toLowerCase();
                  if (!q) return false;
                  return (p.productName || '').toLowerCase().includes(q)
                    || (p.best_for || '').toLowerCase().includes(q)
                    || (p.brand || '').toLowerCase().includes(q)
                    || (p.reviewSummary || '').toLowerCase().includes(q);
                }).map((p: any) => (
                  <button key={p.id} onClick={() => onNavigate('product', p.slug)} className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-3 hover:shadow-md transition-shadow text-left">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 mb-2">
                      {p.productImage ? <img src={p.productImage} alt={p.productName} className="w-full h-full object-contain p-2" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No img</div>}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 line-clamp-2">{p.productName}</p>
                    <p className="text-xs font-bold text-[#0c5adb] mt-1">${p.price}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-zinc-400">No products found. Try a different search term.</p>
            )}
          </div>
        )}

        {/* ===== BUYER'S GUIDE VIEW ===== */}
        {currentRoute.name === 'buyers-guide' && (
          <BuyerGuidePage category={currentRoute.param || ''} onNavigate={onNavigate} />
        )}

        {/* ===== PRODUCT REVIEW VIEW ===== */}
        {currentRoute.name === 'review' && (
          <PublicProductReview slug={currentRoute.param || ''} onNavigate={onNavigate} />
        )}

        {/* ===== PORTFOLIO VIEW ===== */}
        {currentRoute.name === 'portfolio' && !currentRoute.param && (
          <PortfolioPage onNavigate={onNavigate} />
        )}

        {/* ===== PORTFOLIO DETAIL VIEW ===== */}
        {currentRoute.name === 'portfolio' && currentRoute.param && (
          <PublicPortfolio slug={currentRoute.param || ''} onNavigate={onNavigate} />
        )}

        {/* ===== SERVICES VIEW ===== */}
        {currentRoute.name === 'service' && (
          <PublicServices slug={currentRoute.param || ''} onNavigate={onNavigate} />
        )}

        {/* ===== CONTACT VIEW ===== */}
        {currentRoute.name === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-w-2xl mx-auto px-4 md:px-6 py-8"
            id="contact-view"
          >
            <div className="bg-white dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-700/60 p-8 md:p-10 rounded-xl shadow-sm space-y-6">
              <div className="text-center space-y-2 pb-6 border-b border-slate-200 dark:border-zinc-700">
                <h1 className="font-display font-semibold text-slate-900 dark:text-white tracking-tight text-3xl">Get In Touch</h1>
                <p className="text-[#246BFF] text-xs font-medium uppercase tracking-wider">HAVE A QUESTION? REACH OUT BELOW.</p>
              </div>

              {contactSuccess ? (
                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-700 rounded-xl p-8 text-center space-y-4">
                  <div className="bg-[#246BFF] text-white h-12 w-12 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg">Message Sent</h3>
                  <p className="text-xs max-w-md mx-auto leading-relaxed text-slate-500 dark:text-zinc-400">Your message has been delivered to our editorial team. We will respond as soon as possible.</p>
                  <button onClick={() => setContactSuccess(false)} className="text-[10px] font-bold uppercase tracking-widest text-[#246BFF] border-b border-[#246BFF] hover:text-[#246BFF]/80 hover:border-[#246BFF]/80 transition-all cursor-pointer" aria-label="Send another contact message">Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Name</label>
                      <input
                        type="text"
                        id="contact-name"
                        name="name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none transition-all font-medium text-slate-800 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                      <input
                        type="email"
                        id="contact-email"
                        name="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none transition-all font-medium text-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Subject</label>
                    <input
                      type="text"
                      id="contact-subject"
                      name="subject"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none transition-all font-medium text-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-3 text-xs bg-white dark:bg-zinc-950/60 focus:border-[#246BFF] focus:outline-none transition-all font-sans text-slate-800 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full bg-[#246BFF] hover:bg-[#246BFF]/90 text-white font-bold uppercase tracking-widest text-[9px] py-3.5 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    aria-label="Send contact message"
                  >
                    {contactSubmitting ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> SENDING...</> : 'SEND MESSAGE'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

        <Suspense fallback={<div className="flex items-center justify-center py-20"><RefreshCw className="h-8 w-8 text-[#246BFF] animate-spin" /></div>}>
          {/* ===== ABOUT ===== */}
          {currentRoute.name === 'about' && <AboutPage onNavigate={onNavigate} />}

          {/* ===== SERVICES OVERVIEW ===== */}
          {currentRoute.name === 'services' && <ServicesPage onNavigate={onNavigate} />}

          {/* ===== SERVICE DETAIL ===== */}
          {currentRoute.name === 'service-detail' && <ServiceDetailPage serviceSlug={currentRoute.param || ''} onNavigate={onNavigate} />}

          {/* ===== ADVERTISE ===== */}
          {currentRoute.name === 'advertise' && <AdvertisePage onNavigate={onNavigate} />}

          {/* ===== SUBMIT PRODUCT ===== */}
          {currentRoute.name === 'submit-product' && <SubmitProductPage />}

          {/* ===== CASE STUDIES ===== */}
          {currentRoute.name === 'case-studies' && <CaseStudiesPage onNavigate={onNavigate} />}

          {/* ===== ARTICLES LISTING ===== */}
          {currentRoute.name === 'articles' && <ArticleListPage posts={posts} categories={categories} onNavigate={onNavigate} />}

          {/* ===== EDITORIAL POLICY ===== */}
          {currentRoute.name === 'editorial-policy' && <EditorialPolicyPage />}

          {/* ===== AFFILIATE DISCLOSURE ===== */}
          {currentRoute.name === 'affiliate-disclosure' && <AffiliateDisclosurePage />}

          {/* ===== PRIVACY POLICY ===== */}
          {currentRoute.name === 'privacy' && <PrivacyPage />}

          {/* ===== TERMS OF SERVICE ===== */}
          {currentRoute.name === 'terms' && <TermsPage />}

          {/* ===== NEWSLETTER ===== */}
          {currentRoute.name === 'newsletter' && <NewsletterInfoPage onNavigate={onNavigate} />}

          {/* ===== TOPIC CLUSTER ===== */}
          {currentRoute.name === 'cluster' && currentRoute.param && (
            <ClusterPage slug={currentRoute.param} onNavigate={onNavigate} />
          )}

          {/* ===== CATEGORY LANDING PAGE ===== */}
          {currentRoute.name === 'category' && currentRoute.param && categoryPage && (
            <CategoryLanding
              category={categoryPage}
              allProducts={allProducts}
              allCategories={categories}
              brands={allBrands}
              onNavigate={onNavigate}
            />
          )}

          {/* ===== PRODUCT DETAIL PAGE ===== */}
          {currentRoute.name === 'product' && currentRoute.param && currentProduct && (
            <ProductDetail
              product={currentProduct}
              similarProducts={(allProducts || []).filter((p: any) =>
                p.id !== currentProduct.id &&
                (p.categoryId === currentProduct.categoryId || p.bestFor === currentProduct.bestFor)
              ).slice(0, 5)}
              relatedProducts={(allProducts || []).filter((p: any) =>
                p.id !== currentProduct.id &&
                p.brand === currentProduct.brand
              ).slice(0, 5)}
              onNavigate={onNavigate}
            />
          )}

          {/* ===== ALL CATEGORIES PAGE ===== */}
          {currentRoute.name === 'categories' && (
            <div className="Container px-4 py-8">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-6">All Categories</h1>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(categories || []).filter((c: any) => !c.parentId && c.status === 'active').map((cat: any) => (
                  <button key={cat.id} onClick={() => onNavigate('category', cat.slug)} className="flex flex-col items-center p-6 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-lg hover:border-[#0c5adb]/30 transition-all group">
                    {cat.image && <img src={cat.image} alt={cat.name} className="w-16 h-16 object-contain mb-3 group-hover:scale-110 transition-transform" />}
                    <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{cat.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{(allProducts || []).filter((p: any) => {
                      if (p.categoryId === cat.id) return true;
                      const bf = (p.best_for || '').toLowerCase();
                      const cn = (cat.name || '').toLowerCase();
                      if (!bf) return false;
                      const catWords = cn.split(/\s+/).filter(Boolean);
                      const bestWords = bf.split(/\s+/).filter(Boolean);
                      return catWords.some((w: string) => bestWords.includes(w));
                    }).length} products</span>
                  </button>
                ))}
              </div>
            </div>
          )}


          {/* ===== CUSTOMER ACCOUNT PAGE (Wishlist, History, Comparisons) ===== */}
          {(currentRoute.name === 'wishlist' || currentRoute.name === 'recently-viewed' || currentRoute.name === 'account') && (
            <CustomerAccountPage 
              currentUser={currentUser} 
              onNavigate={onNavigate} 
              onOpenLogin={onOpenLogin} 
            />
          )}

          {/* ===== DEALS PAGE ===== */}
          {currentRoute.name === 'deals' && (
            <DealsPage onNavigate={onNavigate} />
          )}

          {/* ===== WISHLIST PAGE ===== */}
          {currentRoute.name === 'wishlist' && (
            <WishlistPage onNavigate={onNavigate} user={currentUser} />
          )}

          {/* ===== BUYING GUIDES LIST ===== */}
          {currentRoute.name === 'buying-guides' && (
            <div className="Container px-4 py-8">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Buying Guides</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">Expert guides to help you choose the right products.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(categories || []).filter((c: any) => !c.parentId && c.status === 'active').map((cat: any) => (
                  <button key={cat.id} onClick={() => onNavigate('buyers-guide', cat.slug)} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 hover:shadow-md transition-all text-left">
                    <BookOpen className="h-10 w-10 text-[#0c5adb] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{cat.name} Buying Guide</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">How to choose the best {cat.name.toLowerCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </Suspense>

        </motion.div>
        </AnimatePresence>

      </main>

      <Footer onNavigate={onNavigate} settings={settings} />

      <ExitIntentPopup siteName={settings?.siteName} />

      <ShoppingAssistant pageContext={{
        pageType: currentRoute.name,
        pageSlug: currentRoute.param || undefined,
        category: currentRoute.name === 'category' ? currentRoute.param : undefined,
        productSlug: currentRoute.name === 'product' ? currentRoute.param : undefined,
      }} />

    </div>
    </MotionProvider>
  );
}

