import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, BookOpen, FolderOpen, MessageSquare, Link2, 
  Settings as SettingsIcon, LogOut, Mail, List, Eye, 
  Image as ImageIcon, FileText, Search, Star, ShoppingBag, Layers, Timer,
  Bell, RefreshCw
} from 'lucide-react';

import { Post, Category, Comment, AffiliateLink, Page, SiteSettings, User, ContactMessage, NewsletterSubscriber, ActivityLog, MediaItem } from '../types';
import SeoDashboard from './SeoDashboard';
import DashboardAnalytics from './DashboardAnalytics';
import AnalyticsAlerts from './AnalyticsAlerts';
import AmazonSyncDashboard from './AmazonSyncDashboard';
import ProductReviewManager from './ProductReviewManager';
import MediaGallery from './MediaGallery';
import TestimonialManager from './TestimonialManager';
import AdminPosts from './admin/AdminPosts';
import AdminCategories from './admin/AdminCategories';
import AdminComments from './admin/AdminComments';
import AdminAffiliate from './admin/AdminAffiliate';
import AdminPages from './admin/AdminPages';
import AdminBrands from './admin/AdminBrands';
import AdminBanners from './admin/AdminBanners';
import AdminDeals from './admin/AdminDeals';
import AdminHomepage from './admin/AdminHomepage';
import AdminCategorySections from './admin/AdminCategorySections';
import AdminSubscribers from './admin/AdminSubscribers';
import AdminDrips from './admin/AdminDrips';
import AdminContact from './admin/AdminContact';
import AdminSettings from './admin/AdminSettings';
import AdminLogs from './admin/AdminLogs';

interface AdminPanelProps {
  token: string;
  user: User;
  onLogout: () => void;
}

export default function AdminPanel({ token, user, onLogout }: AdminPanelProps) {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'posts' | 'categories' | 'comments' | 'products' | 'testimonials' | 'affiliate' | 'pages' | 'subscribers' | 'drips' | 'alerts' | 'contact' | 'settings' | 'logs' | 'seo' | 'ai' | 'clusters' | 'media' | 'brands' | 'banners' | 'deals' | 'homepage' | 'sections' | 'amazon-sync'>('dashboard');
  
  // Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [topicClusters, setTopicClusters] = useState<any[]>([]);

  const [authExpired, setAuthExpired] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Admin Data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setAuthExpired(false);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Helper to check 401
        const handleFetch = async (url: string, opts?: any) => {
          const r = await fetch(url, opts);
          if (r.status === 401) {
            setAuthExpired(true);
            return null;
          }
          return r.json();
        };

        // Parallel fetching
        const [
          postsRes, catRes, commRes, affRes, pagesRes, 
          settingsRes, subRes, msgRes, logsRes, mediaRes, clustersRes
        ] = await Promise.all([
          handleFetch('/api/admin/posts', { headers }),
          handleFetch('/api/public/categories'),
          handleFetch('/api/admin/comments', { headers }),
          handleFetch('/api/admin/affiliate', { headers }),
          handleFetch('/api/admin/pages', { headers }),
          handleFetch('/api/public/settings'),
          handleFetch('/api/admin/subscribers', { headers }),
          handleFetch('/api/admin/messages', { headers }),
          handleFetch('/api/admin/logs', { headers }),
          handleFetch('/api/admin/media', { headers }),
          handleFetch('/api/admin/topic-clusters', { headers }),
        ]);

        if (Array.isArray(postsRes)) setPosts(postsRes);
        else if (postsRes?.data) setPosts(postsRes.data);
        else setPosts([]);

        if (Array.isArray(catRes)) setCategories(catRes);
        else setCategories([]);

        if (Array.isArray(commRes)) setComments(commRes);
        else if (commRes?.data) setComments(commRes.data);
        else setComments([]);

        if (Array.isArray(affRes)) setAffiliateLinks(affRes);
        else if (affRes?.data) setAffiliateLinks(affRes.data);
        else setAffiliateLinks([]);

        if (Array.isArray(pagesRes)) setPages(pagesRes);
        else if (pagesRes?.data) setPages(pagesRes.data);
        else setPages([]);

        if (settingsRes && !settingsRes.error) setSettings(settingsRes);

        if (Array.isArray(subRes)) setSubscribers(subRes);
        else if (subRes?.data) setSubscribers(subRes.data);
        else setSubscribers([]);

        if (Array.isArray(msgRes)) setMessages(msgRes);
        else if (msgRes?.data) setMessages(msgRes.data);
        else setMessages([]);

        if (Array.isArray(logsRes)) setLogs(logsRes);
        else if (logsRes?.data) setLogs(logsRes.data);
        else setLogs([]);

        if (Array.isArray(mediaRes)) setMedia(mediaRes);
        else if (mediaRes?.data) setMedia(mediaRes.data);
        else setMedia([]);

        if (Array.isArray(clustersRes)) setTopicClusters(clustersRes);
        else if (clustersRes?.data) setTopicClusters(clustersRes.data);
        else setTopicClusters([]);

      } catch (e) {
        console.error('Failed to load administrative records', e);
      }
    };
    fetchData();
  }, [token, refreshTrigger]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen bg-[#f1f3fe] dark:bg-zinc-900 flex" id="admin-panel-container">
      {/* 1. SIDEBAR — Dataflow-inspired design */}
      <aside className="w-64 bg-[#1E293B] text-slate-300 flex flex-col shrink-0 border-r border-white/10" id="admin-sidebar">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary2 to-primary3 p-2 rounded-xl text-white font-display font-bold shadow-lg">DW</div>
          <div>
            <h1 className="font-display font-bold text-white tracking-tight leading-none text-sm">DawnWire</h1>
            <span className="text-[10px] text-slate-400 font-medium">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar" id="admin-nav-links" aria-label="Admin panel navigation">
          {[
            { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'posts', icon: BookOpen, label: `Posts (${posts.length})` },
            { key: 'categories', icon: FolderOpen, label: `Categories (${categories.length})` },
            { key: 'comments', icon: MessageSquare, label: `Comments (${comments.length})` },
            { key: 'products', icon: ShoppingBag, label: 'Products' },
            { key: 'testimonials', icon: Star, label: 'Testimonials' },
            { key: 'affiliate', icon: Link2, label: 'Affiliate Slugs' },
            { key: 'pages', icon: FileText, label: `Pages (${pages.length})` },
            { key: 'subscribers', icon: Mail, label: `Subscribers (${subscribers.length})` },
            { key: 'drips', icon: Timer, label: 'Drips' },
            { key: 'alerts', icon: Bell, label: 'Alerts' },
            { key: 'contact', icon: Mail, label: `Inquiries (${(messages || []).filter(m => m?.status === 'unread').length})` },
            { key: 'settings', icon: SettingsIcon, label: 'Settings' },
            { key: 'seo', icon: Search, label: 'SEO Engine' },
            { key: 'logs', icon: List, label: 'Activity Logs' },
            { key: 'brands', icon: Star, label: 'Brands' },
            { key: 'banners', icon: Eye, label: 'Banners' },
            { key: 'deals', icon: Timer, label: 'Deals' },
            { key: 'homepage', icon: BookOpen, label: 'Homepage' },
            { key: 'sections', icon: LayoutDashboard, label: 'Sections' },
            { key: 'amazon-sync', icon: RefreshCw, label: 'Amazon Sync' },
            { key: 'media', icon: ImageIcon, label: `Media (${media.length})` },
            { key: 'clusters', icon: Layers, label: 'Clusters' },
          ].map(item => (
            <              motion.button
              key={item.key}
              onClick={() => { setActiveMenu(item.key as any); }}
              aria-current={activeMenu === item.key ? 'true' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative overflow-hidden ${
                activeMenu === item.key
                  ? 'bg-[#334155] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-[#334155]/50 hover:text-white'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {activeMenu === item.key && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#246BFF] rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* User box */}
        <div className="p-3 border-t border-white/10 bg-[#1E293B]/80">
          <div className="flex items-center gap-2.5 px-1">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full border border-slate-600 object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
              <span className="text-[10px] text-primary font-medium capitalize">{user.role.replace('_', ' ')}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-700/50 rounded-lg transition-all shrink-0"
              id="sidebar-logout-btn"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0" id="admin-main-content">
        {/* Header bar — Dataflow-inspired */}
        <header className="bg-white dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700/50 h-16 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-display font-bold text-heading dark:text-zinc-100 capitalize tracking-tight text-lg" id="header-menu-title">
              {activeMenu === 'seo' ? 'SEO Engine' : activeMenu.replace('_', ' ')}
            </h2>
            <span className="text-[10px] text-text uppercase tracking-wider font-medium hidden sm:block">Administration Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-slate-100 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 hover:text-slate-900 px-3.5 py-2 rounded-xl br-btn font-medium transition-all flex items-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              View Public Website
            </a>
          </div>
        </header>

        {/* Main interactive area */}
        <div className="flex-1 overflow-y-auto p-8" id="admin-workspace">
          {authExpired && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Session Expired</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">Your admin authentication token has expired. Please log in again to manage records.</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
              >
                Log In Again
              </button>
            </div>
          )}
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
          {/* A: DASHBOARD VIEW */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-8" id="admin-workspace-dashboard">
              <DashboardAnalytics token={token} />
            </div>
          )}

          {/* B: POSTS VIEW */}
          {activeMenu === 'posts' && (
            <AdminPosts token={token} categories={categories} onRefresh={triggerRefresh} posts={posts} setPosts={setPosts} />
          )}

          {/* C: CATEGORIES VIEW */}
          {activeMenu === 'categories' && (
            <AdminCategories token={token} categories={categories} onRefresh={triggerRefresh} />
          )}

          {/* D: COMMENTS MODERATION */}
          {activeMenu === 'comments' && (
            <AdminComments token={token} comments={comments} posts={posts} onRefresh={triggerRefresh} />
          )}

          {/* E: PRODUCT REVIEWS */}
          {activeMenu === 'products' && (
            <div id="admin-workspace-products">
              <ProductReviewManager token={token} categories={categories} />
            </div>
          )}

          {/* E0: AMAZON SYNC */}
          {activeMenu === 'amazon-sync' && (
            <div id="admin-workspace-amazon-sync">
              <AmazonSyncDashboard token={token} />
            </div>
          )}

          {/* E1: TESTIMONIALS */}
          {activeMenu === 'testimonials' && (
            <div id="admin-workspace-testimonials">
              <TestimonialManager token={token} />
            </div>
          )}

          {/* E2: AFFILIATE SLUGS */}
          {activeMenu === 'affiliate' && (
            <AdminAffiliate token={token} affiliateLinks={affiliateLinks} onRefresh={triggerRefresh} />
          )}

          {/* F: STATIC PAGES VIEW */}
          {activeMenu === 'pages' && (
            <AdminPages token={token} pages={pages} onRefresh={triggerRefresh} />
          )}

          {/* F2: DRIPS VIEW */}
          {activeMenu === 'drips' && (
            <AdminDrips token={token} subscribers={subscribers} />
          )}

          {/* G: SUBSCRIBERS VIEW */}
          {activeMenu === 'subscribers' && (
            <AdminSubscribers token={token} subscribers={subscribers} onRefresh={triggerRefresh} />
          )}

          {/* G: ALERTS VIEW */}
          {activeMenu === 'alerts' && (
            <div id="admin-workspace-alerts">
              <AnalyticsAlerts token={token} />
            </div>
          )}

          {/* H: INQUIRIES VIEW */}
          {activeMenu === 'contact' && (
            <AdminContact token={token} messages={messages} onRefresh={triggerRefresh} />
          )}

          {/* I: GLOBAL SETTINGS VIEW */}
          {activeMenu === 'settings' && (
            <AdminSettings token={token} settings={settings} onRefresh={triggerRefresh} />
          )}

          {/* I: SEO ENGINE VIEW */}
          {activeMenu === 'seo' && (
            <SeoDashboard token={token} baseUrl="" />
          )}

          {/* BRANDS VIEW */}
          {activeMenu === 'brands' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <AdminBrands token={token} />
            </div>
          )}

          {/* BANNERS VIEW */}
          {activeMenu === 'banners' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <AdminBanners token={token} categories={categories} />
            </div>
          )}

          {/* DEALS VIEW */}
          {activeMenu === 'deals' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <AdminDeals token={token} />
            </div>
          )}

          {/* HOMEPAGE VIEW */}
          {activeMenu === 'homepage' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <AdminHomepage token={token} />
            </div>
          )}

          {/* SECTIONS VIEW */}
          {activeMenu === 'sections' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <AdminCategorySections token={token} categories={categories} />
            </div>
          )}

          {/* MEDIA GALLERY VIEW */}
          {activeMenu === 'media' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6" id="admin-workspace-media">
              <MediaGallery
                items={media}
                onDelete={async (id) => {
                  await fetch(`/api/admin/media/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                  setMedia(prev => prev.filter(m => m.id !== id));
                }}
                onUpload={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const base64 = e.target?.result as string;
                      if (!base64) return;
                      fetch('/api/admin/upload-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ base64, fileName: file.name }),
                      }).then(r => r.json()).then((newItem) => {
                        if (newItem.id) setMedia(prev => [newItem, ...prev]);
                      }).catch(console.error);
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
              />
            </div>
          )}

          {/* J: TOPIC CLUSTERS VIEW */}
          {activeMenu === 'clusters' && (
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden" id="admin-workspace-clusters">
              <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Topic Clusters ({topicClusters.length})</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Pillar pages with cluster content for SEO topic authority</span>
              </div>
              <div className="p-4 space-y-4">
                {topicClusters.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 p-8 text-center">No topic clusters created yet. Clusters group a pillar page with related content for SEO topical authority.</p>
                ) : (
                  topicClusters.map((cluster: any) => (
                    <div key={cluster.id} className="border border-slate-200 dark:border-zinc-700 rounded-xl p-4 hover:border-[#246BFF]/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm">{cluster.name}</h4>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${cluster.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 dark:text-zinc-400'}`}>
                              {cluster.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{cluster.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 dark:text-zinc-500">
                            <span className="font-medium">Pillar: {cluster.pillarPageTitle}</span>
                            <span>{cluster.clusterPostIds?.length || 0} cluster posts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`/cluster/${cluster.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-3 py-1.5 rounded-lg hover:bg-[#246BFF]/10 transition-all"
                            aria-label={`View ${cluster.name} cluster page`}
                          >
                            View
                          </a>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this topic cluster?')) return;
                              try {
                                const res = await fetch(`/api/admin/topic-clusters/${cluster.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                if (res.ok) setTopicClusters(prev => prev.filter((c: any) => c.id !== cluster.id));
                              } catch (e) { console.error(e) }
                            }}
                            className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
                            aria-label={`Delete ${cluster.name} cluster`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* K: ACTIVITY LOGS VIEW */}
          {activeMenu === 'logs' && (
            <AdminLogs token={token} logs={logs} />
          )}

          </motion.div>
        </div>
      </main>
    </div>
  );
}
