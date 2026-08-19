import React, { useState, useEffect } from 'react';
import { useAppStore, store } from '../lib/store';
import ExtensionManager from '../components/ExtensionManager';
import AmazonBulkImporter from '../components/AmazonBulkImporter';
import AutoArticlesPanel from '../components/AutoArticlesPanel';
import ArticleGenerator from '../components/ArticleGenerator';
import { ActivityFeedTab } from '../components/admin/ActivityFeedTab';
import { AdminProfileCropModal } from '../components/admin/AdminProfileCropModal';
import { ActivityHeatmapD3 } from '../components/admin/ActivityHeatmapD3';
import { SeoHealthProgressChart } from '../components/admin/SeoHealthProgressChart';
import { TopViewedCategoriesChart } from '../components/admin/TopViewedCategoriesChart';
import { OpenGraphAuditTool } from '../components/admin/OpenGraphAuditTool';
import { Product, CategoryBanner, EditorialReview, BuyingGuide, Post, Comment, AffiliateLink, Page, SiteSettings, NewsletterSubscriber, ContactMessage, ActivityLog, MediaItem, TopicCluster } from '../types';
import { proxyImageUrl } from '../utils/safeRender';
import DashboardAnalytics from '../components/DashboardAnalytics';
import ProductReviewManager from '../components/ProductReviewManager';
import ProductArticlesManager from '../components/ProductArticlesManager';
import TestimonialManager from '../components/TestimonialManager';
import SeoDashboard from '../components/SeoDashboard';
import AnalyticsAlerts from '../components/AnalyticsAlerts';
import AmazonSyncDashboard from '../components/AmazonSyncDashboard';
import AutoImportPanel from '../components/admin/AutoImportPanel';
import WordPressImportTool from '../components/admin/WordPressImportTool';
import MediaGallery from '../components/MediaGallery';
import AdminPosts from '../components/admin/AdminPosts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminComments from '../components/admin/AdminComments';
import AdminAffiliate from '../components/admin/AdminAffiliate';
import AdminPages from '../components/admin/AdminPages';
import AdminSubscribers from '../components/admin/AdminSubscribers';
import AdminDrips from '../components/admin/AdminDrips';
import AdminContact from '../components/admin/AdminContact';
import AdminSettings from '../components/admin/AdminSettings';
import AdminLogs from '../components/admin/AdminLogs';
import AdminBrands from '../components/admin/AdminBrands';
import AdminBannerManager from '../components/admin/AdminBannerManager';
import AdminDeals from '../components/admin/AdminDeals';
import AdminHomepage from '../components/admin/AdminHomepage';
import AdminCategorySections from '../components/admin/AdminCategorySections';

function BannerUploadBtn({ onUrl }: { onUrl: (url: string) => void }) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise(resolve => { reader.onload = resolve; });
      const base64 = (reader.result as string).split(',')[1];
      const token = localStorage.getItem('dawnwire_auth_token');
      const r = await fetch('/api/admin/upload-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name }),
      });
      const data = await r.json();
      if (data.url) onUrl(data.url);
    } catch (e) { console.error('Upload failed', e); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 shrink-0 px-3 py-2.5 rounded-xl border border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center gap-1.5">
        {uploading ? <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
        {uploading ? 'Uploading…' : 'Upload Image'}
      </button>
    </>
  );
}

export const AdminDashboardPage: React.FC = () => {
  const { products, categories, banners, syncLogs, affiliateClicks, seoOpportunities, currentUser } = useAppStore();
  const token = localStorage.getItem('dawnwire_auth_token') || '';

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin')) return true;
    return !!localStorage.getItem('dawnwire_auth_token');
  });
  const [sessionLoading, setSessionLoading] = useState(() => !!localStorage.getItem('dawnwire_auth_token') && !currentUser);

  useEffect(() => {
    if (currentUser) {
      setIsAdminLoggedIn(currentUser.role === 'super_admin' || currentUser.role === 'admin');
      setSessionLoading(false);
    } else {
      const token = localStorage.getItem('dawnwire_auth_token');
      if (!token) {
        setIsAdminLoggedIn(false);
        setSessionLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem('dawnwire_auth_token');
    if (!token || currentUser) {
      setSessionLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      const latest = store.get().currentUser;
      if (!latest || (latest.role !== 'super_admin' && latest.role !== 'admin')) {
        setIsAdminLoggedIn(false);
      }
      setSessionLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const getInitialTab = (): typeof activeTab => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      const valid = ['bulk-import','auto-articles','dashboard','posts','categories','comments','product-review','product-articles','article-generator','testimonials','affiliate','pages','subscribers','drips','alerts','contact','settings','seo-engine','logs','brands','banners','deals','homepage','sections','clusters','amazon-sync','media','auto-import'];
      if (valid.includes(tab)) return tab as typeof activeTab;
    }
    if (tab === 'bulk-import') return 'bulk-import';
    if (tab === 'auto-articles') return 'auto-articles';
    return 'products';
  };
  const [activeTab, setActiveTab] = useState<'products' | 'activity-feed' | 'scraper' | 'auto-articles' | 'reviews' | 'banners' | 'analytics' | 'seo' | 'firebase' | 'profile' | 'extension' | 'bulk-import' | 'dashboard' | 'posts' | 'categories' | 'comments' | 'product-review' | 'product-articles' | 'article-generator' | 'testimonials' | 'affiliate' | 'pages' | 'subscribers' | 'drips' | 'alerts' | 'contact' | 'settings' | 'logs' | 'brands' | 'deals' | 'homepage' | 'sections' | 'clusters' | 'amazon-sync' | 'media' | 'auto-import' | 'wp-import' | 'seo-engine'>(getInitialTab);

  // Form states
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [asinInput, setAsinInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // SEO Utility States
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isBatchSeoRunning, setIsBatchSeoRunning] = useState(false);
  const [batchSeoProgress, setBatchSeoProgress] = useState<{ current: number; total: number } | null>(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [seoSuccessMsg, setSeoSuccessMsg] = useState('');
  const [selectedSeoProduct, setSelectedSeoProduct] = useState<Product | null>(null);

  // Banner / Slider Management States
  const [editingBanner, setEditingBanner] = useState<Partial<CategoryBanner> | null>(null);
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [bannerSuccessMsg, setBannerSuccessMsg] = useState('');

  // Image Gallery State in Product Editor
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');

  const [adminName, setAdminName] = useState(currentUser?.displayName || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminPhoto, setAdminPhoto] = useState(currentUser?.photoURL || '');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminBio, setAdminBio] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Link Importer Plugin States
  const [linkInput, setLinkInput] = useState('');
  const [isExtractingLink, setIsExtractingLink] = useState(false);
  const [extractionStep, setExtractionStep] = useState<'idle' | 'parsing' | 'gemini' | 'enriching' | 'complete'>('idle');
  const [extractedPreview, setExtractedPreview] = useState<Product | null>(null);
  const [extractionSuccessMsg, setExtractionSuccessMsg] = useState('');

  // Filter & Search in Admin
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Associate Tag Global Setting
  const [associateTag, setAssociateTag] = useState('dawnwire-20');
  const [tagUpdatedMsg, setTagUpdatedMsg] = useState('');

  // Sitemap Modal
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [sitemapContent, setSitemapContent] = useState('');

  const [serverClickData, setServerClickData] = useState<{ totalClicks: number; topLinks: { title: string; clicks: number; url: string }[]; dailyClicks: { date: string; clicks: number }[] }>({ totalClicks: 0, topLinks: [], dailyClicks: [] });

  // Editorial Articles (real blog posts) + AI Article Generator
  const [editorialPosts, setEditorialPosts] = useState<any[]>([]);
  const [showArticleGenerator, setShowArticleGenerator] = useState(false);

  // Super Admin Portal — extra panel data (from the sidebar panels)
  const [adminPosts, setAdminPosts] = useState<Post[]>([]);
  const [adminComments, setAdminComments] = useState<Comment[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [adminPages, setAdminPages] = useState<Page[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
  const [adminRefresh, setAdminRefresh] = useState(0);
  const triggerAdminRefresh = () => setAdminRefresh(v => v + 1);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const token = localStorage.getItem('dawnwire_auth_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const get = async (url: string) => {
      try {
        const r = await fetch(url, { headers });
        if (!r.ok) return null;
        const j = await r.json();
        if (Array.isArray(j)) return j;
        if (j && Array.isArray(j.data)) return j.data;
        return j;
      } catch { return null; }
    };
    (async () => {
      const [postsRes, commRes, affRes, pageRes, settingsRes, subRes, msgRes, logRes, mediaRes, clusterRes] = await Promise.all([
        get('/api/admin/posts?limit=500'),
        get('/api/admin/comments'),
        get('/api/admin/affiliate'),
        get('/api/admin/pages'),
        get('/api/public/settings'),
        get('/api/admin/subscribers'),
        get('/api/admin/messages'),
        get('/api/admin/logs'),
        get('/api/admin/media'),
        get('/api/admin/topic-clusters'),
      ]);
      if (Array.isArray(postsRes)) setAdminPosts(postsRes as Post[]);
      if (Array.isArray(commRes)) setAdminComments(commRes as Comment[]);
      if (Array.isArray(affRes)) setAffiliateLinks(affRes as AffiliateLink[]);
      if (Array.isArray(pageRes)) setAdminPages(pageRes as Page[]);
      if (settingsRes && !(settingsRes as any)?.error) setSiteSettings(settingsRes as SiteSettings);
      if (Array.isArray(subRes)) setSubscribers(subRes as NewsletterSubscriber[]);
      if (Array.isArray(msgRes)) setMessages(msgRes as ContactMessage[]);
      if (Array.isArray(logRes)) setLogs(logRes as ActivityLog[]);
      if (Array.isArray(mediaRes)) setMedia(mediaRes as MediaItem[]);
      if (Array.isArray(clusterRes)) setTopicClusters(clusterRes as TopicCluster[]);
    })();
  }, [isAdminLoggedIn, adminRefresh]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const token = localStorage.getItem('dawnwire_auth_token');
    if (!token) return;
    fetch('/api/admin/posts?limit=1000', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        const items = body && Array.isArray(body.data) ? body.data : body && Array.isArray(body) ? body : [];
        setEditorialPosts(items);
      })
      .catch(() => {});
  }, [isAdminLoggedIn]);

  useEffect(() => {
    store.fetchProducts();
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const token = localStorage.getItem('dawnwire_auth_token');
    if (!token) return;
    fetch('/api/admin/analytics/clicks', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data.totalClicks === 'number') {
          setServerClickData(data);
        }
      })
      .catch(() => {});
  }, [isAdminLoggedIn]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await store.loginWithEmailAndPassword(adminEmailInput, adminPasscode);
    if (res.success) {
      setIsAdminLoggedIn(true);
    } else {
      setLoginError(res.error || 'Invalid Administrator email or password.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    store.logout();
  };

  // AI Product Review Generator inside Admin
  const handleGenerateAiMetadata = async () => {
    if (!editingProduct?.title) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/ai/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingProduct.title,
          asin: editingProduct.asin || '',
          category: editingProduct.mainCategory || ''
        })
      });
      const data = await res.json();
      if (data) {
        setEditingProduct({
          ...editingProduct,
          shortDescription: data.shortDescription || editingProduct.shortDescription,
          bestFor: data.bestFor || editingProduct.bestFor,
          pros: data.pros || editingProduct.pros,
          cons: data.cons || editingProduct.cons,
          editorVerdict: data.editorVerdict || editingProduct.editorVerdict
        });
      }
    } catch (e) {
      console.error('AI generation failed', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // AI SEO Meta Generator (Titles, Descriptions, Keywords)
  const handleGenerateAiSeo = async (targetProduct?: Partial<Product>) => {
    const prod = targetProduct || editingProduct;
    if (!prod?.title) return null;
    setIsGeneratingSeo(true);

    try {
      const res = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: prod.title,
          brand: prod.brand || '',
          category: prod.mainCategory || 'Electronics',
          shortDescription: prod.shortDescription || '',
          mainFeatures: prod.mainFeatures || [],
          asin: prod.asin || ''
        })
      });
      const data = await res.json();
      if (data && data.seoTitle) {
        if (targetProduct) {
          return data;
        } else if (editingProduct) {
          setEditingProduct({
            ...editingProduct,
            seoTitle: data.seoTitle,
            metaDescription: data.metaDescription,
            metaKeywords: data.metaKeywords
          });
        }
      }
    } catch (e) {
      console.error('AI SEO generation failed', e);
    } finally {
      setIsGeneratingSeo(false);
    }
    return null;
  };

  // Batch generate Gemini SEO metadata for all products in store
  const handleBatchGenerateSeo = async () => {
    if (products.length === 0) return;
    setIsBatchSeoRunning(true);
    setSeoSuccessMsg('');
    setBatchSeoProgress({ current: 0, total: products.length });

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        const seoData = await handleGenerateAiSeo(p);
        if (seoData) {
          const updated: Product = {
            ...p,
            seoTitle: seoData.seoTitle,
            metaDescription: seoData.metaDescription,
            metaKeywords: seoData.metaKeywords,
            canonicalUrl: p.canonicalUrl || `https://dawnwire.com/products/${p.slug}`
          };
          store.saveProduct(updated);
        }
      } catch (err) {
        console.error(`Error generating batch SEO for ${p.title}`, err);
      }
      setBatchSeoProgress({ current: i + 1, total: products.length });
    }

    setIsBatchSeoRunning(false);
    setSeoSuccessMsg(`Successfully generated and applied Gemini SEO titles, descriptions, and keywords for all ${products.length} products!`);
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title) return;

    const slug = editingProduct.slug || editingProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fullProduct: Product = {
      id: editingProduct.id || 'p-' + Date.now(),
      title: editingProduct.title || 'New Product',
      slug: slug,
      asin: editingProduct.asin || 'B000000000',
      brand: editingProduct.brand || '',
      mainCategory: editingProduct.mainCategory || '',
      subcategory: editingProduct.subcategory || '',
      productType: 'Physical Product',
      shortDescription: editingProduct.shortDescription || '',
      fullDescription: editingProduct.fullDescription || '',
      images: editingProduct.images && editingProduct.images.length ? editingProduct.images.filter(Boolean) : [],
      amazonOriginalUrl: editingProduct.amazonOriginalUrl || '',
      affiliateUrl: editingProduct.affiliateUrl || '',
      amazonMarketplace: 'US',
      associateTrackingId: associateTag,
      currentPrice: Number(editingProduct.currentPrice) || 0,
      referencePrice: Number(editingProduct.referencePrice) || 0,
      currency: 'USD',
      discountPercentage: Number(editingProduct.discountPercentage) || 0,
      isAvailable: editingProduct.stockStatus !== 'out_of_stock',
      isDeal: Boolean(editingProduct.isDeal),
      isPrime: true,
      rating: Number(editingProduct.rating) || 0,
      reviewCount: Number(editingProduct.reviewCount) || 0,
      mainFeatures: Array.isArray(editingProduct.mainFeatures) ? editingProduct.mainFeatures : [],
      specifications: editingProduct.specifications || {},
      pros: Array.isArray(editingProduct.pros) ? editingProduct.pros : [],
      cons: Array.isArray(editingProduct.cons) ? editingProduct.cons : [],
      bestFor: editingProduct.bestFor || '',
      editorVerdict: editingProduct.editorVerdict || '',
      editorScore: Number(editingProduct.editorScore) || 0,
      similarProductIds: [],
      alternativeProductIds: [],
      relatedComparisonIds: [],
      relatedGuideIds: [],
      isFeatured: !!editingProduct.isFeatured,
      isTrending: !!editingProduct.isTrending,
      isBestSeller: false,
      published: editingProduct.status !== 'draft',
      status: editingProduct.status || 'published',
      lastSyncedAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
      seoTitle: editingProduct.seoTitle || '',
      metaDescription: editingProduct.metaDescription || '',
      metaKeywords: Array.isArray(editingProduct.metaKeywords) ? editingProduct.metaKeywords : [],
      canonicalUrl: editingProduct.canonicalUrl || ''
    };

    const result = await store.saveProduct(fullProduct);
    if (result && result.ok) {
      setScrapeSuccessMsg('Product saved successfully!');
    } else if (result) {
      setScrapeSuccessMsg(`Save failed: ${result.error || 'Unknown error'} (status ${result.status || '?'})`);
    }
    setEditingProduct(null);
  };

  const handleSimulateScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asinInput.trim()) return;
    setIsScraping(true);
    setScrapeSuccessMsg('');
    try {
      const res = await fetch('/api/admin/products/import-from-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('dawnwire_auth_token')}` },
        body: JSON.stringify({ asin: asinInput.trim() })
      });
      if (res.ok) {
        setScrapeSuccessMsg(`Successfully imported ASIN ${asinInput.toUpperCase()} from Amazon!`);
        setAsinInput('');
      } else {
        const err = await res.json();
        setScrapeSuccessMsg(`Import failed: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      setScrapeSuccessMsg('Import failed. Check that Amazon PA-API credentials are configured.');
    }
    setIsScraping(false);
  };

  // Amazon Link Product Data Extractor Plugin
  const handleExtractFromLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!linkInput.trim()) return;

    setIsExtractingLink(true);
    setExtractionStep('parsing');
    setExtractionSuccessMsg('');
    setExtractedPreview(null);

    try {
      setTimeout(() => setExtractionStep('gemini'), 500);
      setTimeout(() => setExtractionStep('enriching'), 1200);

      const res = await fetch('/api/ai/extract-product-from-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: linkInput.trim(),
          associateTag: associateTag
        })
      });

      const data = await res.json();
      if (data && (data.title || data.product_name)) {
        const title = data.title || data.product_name || 'Extracted Product';
        const pros = Array.isArray(data.pros) ? data.pros : (typeof data.pros === 'string' && data.pros ? [data.pros] : ['High build quality', 'Top performance']);
        const cons = Array.isArray(data.cons) ? data.cons : (typeof data.cons === 'string' && data.cons ? [data.cons] : ['Higher price than basic models']);
        const mainFeatures = Array.isArray(data.mainFeatures || data.key_features) ? (data.mainFeatures || data.key_features) : [];
        const rawImages = data.images && Array.isArray(data.images) ? data.images : (data.mainImage ? [data.mainImage, ...(data.additionalImages || [])] : []);
        const specs = typeof data.specifications === 'object' && data.specifications !== null ? data.specifications : (typeof data.specs === 'object' && data.specs !== null ? data.specs : {});

        const videoUrl = data.videoUrl || specs.video_url;
        setExtractedPreview({
          ...data,
          title,
          brand: data.brand || 'Generic',
          mainCategory: data.mainCategory || 'Electronics',
          asin: data.asin || 'B000000000',
          images: rawImages.length ? rawImages : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
          currentPrice: Number(data.price || data.currentPrice) || 99.99,
          referencePrice: Number(data.referencePrice || data.listPrice) || 129.99,
          discountPercentage: Number(data.discountPercentage) || 0,
          editorScore: Number(data.editorScore) || 9.0,
          bestFor: data.bestFor || 'Top overall pick',
          shortDescription: data.shortDescription || data.review_summary || 'High quality Amazon product.',
          editorVerdict: data.editorVerdict || data.final_verdict || 'Highly recommended choice for Amazon buyers.',
          pros,
          cons,
          mainFeatures,
          specifications: { video_url: videoUrl, ...specs },
          videoUrl,
          affiliateUrl: data.affiliateUrl || `https://www.amazon.com/dp/${data.asin || ''}?tag=${associateTag}`
        });
        setExtractionStep('complete');
        setExtractionSuccessMsg(`Successfully extracted publish-ready product data for "${title}"!`);
      }
    } catch (err) {
      console.error('Link extraction error:', err);
      setExtractionStep('idle');
    } finally {
      setIsExtractingLink(false);
    }
  };

  // Save extracted product to database via API & Store
  const handlePublishExtractedProduct = async () => {
    if (!extractedPreview) return;
    const token = localStorage.getItem('dawnwire_auth_token');
    
    // Save to local store state immediately
    const fullProductToSave: Product = {
      ...extractedPreview,
      videoUrl: extractedPreview.videoUrl || extractedPreview.specifications?.video_url,
      specifications: { video_url: extractedPreview.videoUrl || extractedPreview.specifications?.video_url, ...(extractedPreview.specifications || {}) }
    };
    store.saveProduct(fullProductToSave);
    try {
      const res = await fetch('/api/admin/products/import-from-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ asin: extractedPreview.asin || linkInput.match(/([A-Z0-9]{10})/i)?.[1] })
      });
      if (res.ok) {
        const result = await res.json();
        setExtractionSuccessMsg(`"${result.product?.product_name || extractedPreview.title}" published live to DawnWire!`);
      } else {
        const err = await res.json();
        setExtractionSuccessMsg(`Publish failed: ${err.error || 'Unknown error'}`);
      }
    } catch {
      setExtractionSuccessMsg('Publish failed. Check API connection.');
    }
    setExtractedPreview(null);
    setLinkInput('');
    setExtractionStep('idle');
  };

  // Bulk Apply Associate Tag
  const handleBulkUpdateTag = () => {
    products.forEach((p) => {
      const updated = {
        ...p,
        associateTrackingId: associateTag,
        affiliateUrl: `https://www.amazon.com/dp/${p.asin}?tag=${associateTag}`
      };
      store.saveProduct(updated);
    });
    setTagUpdatedMsg(`Updated ${products.length} products with Amazon Associate Tag "${associateTag}"!`);
    setTimeout(() => setTagUpdatedMsg(''), 3000);
  };

  // Generate XML Sitemap
  const handleGenerateSitemap = () => {
    const urls = [
      'https://dawnwire.com/',
      'https://dawnwire.com/products',
      'https://dawnwire.com/deals',
      'https://dawnwire.com/compare',
      'https://dawnwire.com/reviews',
      'https://dawnwire.com/guides',
      ...products.map((p) => `https://dawnwire.com/products/${p.slug}`),
      ...categories.map((c) => `https://dawnwire.com/categories/${c.slug}`)
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n')}
</urlset>`;

    setSitemapContent(xml);
    setShowSitemapModal(true);
  };

  // Export Catalog JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dawnwire-catalog-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter products in admin
  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.asin.toLowerCase().includes(productSearch.toLowerCase()) || p.brand.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || p.mainCategory === selectedCategoryFilter;
    return matchesQuery && matchesCat;
  });

  const estimatedCommission = serverClickData.totalClicks * 0.35; // $0.35 avg CPC

  // Save Banner / Slider Handler
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || (!editingBanner.title && !editingBanner.imageOnly)) return;
    if (editingBanner.imageOnly && !editingBanner.desktopImage) return;
    const bannerToSave: CategoryBanner = {
      id: editingBanner.id || 'b-' + Date.now(),
      categoryId: editingBanner.categoryId || 'cat-electronics',
      desktopImage: editingBanner.desktopImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
      mobileImage: editingBanner.mobileImage || editingBanner.desktopImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      title: editingBanner.title || '',
      subtitle: editingBanner.subtitle || '',
      description: editingBanner.description || '',
      badgeText: editingBanner.badgeText || '',
      ctaText: editingBanner.ctaText || '',
      targetUrl: editingBanner.targetUrl || '/products',
      altText: editingBanner.altText || '',
      affiliateUrl: editingBanner.affiliateUrl || '',
      textAlignment: editingBanner.textAlignment || 'left',
      overlayStrength: editingBanner.imageOnly ? 0 : (editingBanner.overlayStrength ?? 45),
      isEnabled: editingBanner.isEnabled !== false,
      imageOnly: editingBanner.imageOnly ?? false,
      order: editingBanner.order || (banners.length + 1),
      impressions: editingBanner.impressions || 0,
      clicks: editingBanner.clicks || 0,
    };
    store.saveBanner(bannerToSave);
    setEditingBanner(null);
    setIsBannerFormOpen(false);
    setBannerSuccessMsg('Banner / Slider saved and published successfully!');
    setTimeout(() => setBannerSuccessMsg(''), 4000);
  };

  // Save Admin Profile Handler
  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateUserProfile({
      displayName: adminName,
      email: adminEmail,
      photoURL: adminPhoto,
    });
    setProfileSuccessMsg('Admin profile information updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // Product Gallery Image Handlers
  const handleAddProductGalleryImage = (url: string) => {
    if (!url || !editingProduct) return;
    const currentImages = editingProduct.images ? [...editingProduct.images] : [];
    if (!currentImages.includes(url)) {
      currentImages.push(url);
      setEditingProduct({ ...editingProduct, images: currentImages });
    }
    setNewGalleryImageUrl('');
  };

  const handleRemoveProductGalleryImage = (indexToRemove: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const currentImages = editingProduct.images.filter((_, idx) => idx !== indexToRemove);
    setEditingProduct({ ...editingProduct, images: currentImages });
  };

  // 0. SESSION LOADING SPINNER
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-semibold">Restoring session…</p>
        </div>
      </div>
    );
  }

  // 1. UNAUTHENTICATED GATE
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 p-8 rounded-3xl shadow-2xl space-y-6 text-center backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-dw-blue/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-dw-orange/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <img src="/logo/dw-mark.png" alt="DawnWire" className="w-16 h-16 mx-auto object-contain" draggable={false} />

          <div>
            <h1 className="text-2xl font-black font-display text-white">DawnWire Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">Super Admin Operations & Catalog Engine Security Gate</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Admin Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-white mb-3"
                required
              />

              <label className="block text-xs font-bold text-slate-400 mb-1">Admin Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-dw-navy to-dw-blue hover:from-dw-blue-700 hover:to-dw-blue-600 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg shadow-dw-blue/25"
            >
              Sign In to Admin Operations
            </button>
          </form>
          </div>

        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      {/* Top Banner */}
      <div className="bg-[#0A1F44] text-white py-8 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              DawnWire Super Admin Control Center
            </div>
            <h1 className="text-2xl font-black font-display">Platform Operations & Catalog Engine</h1>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right text-slate-300 hidden sm:block">
              <div>Role: <strong className="text-amber-400 uppercase">Super Admin</strong></div>
              <div className="text-[11px] font-mono">{currentUser?.email || 'admin@example.com'}</div>
            </div>

            <button
              onClick={handleAdminLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Live Admin Quick Metrics Bar */}
        <div className="max-w-7xl mx-auto mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60">
            <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Active Catalog</span>
            <span className="text-lg font-black text-white">{products.length} Products</span>
          </div>
          <div className="p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60">
            <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Affiliate Clicks (30d)</span>
            <span className="text-lg font-black text-amber-400">{serverClickData.totalClicks} Outbound</span>
          </div>
          <div className="p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60">
            <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Est. Revenue</span>
            <span className="text-lg font-black text-emerald-400">${estimatedCommission.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60">
            <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Amazon Sync</span>
            <span className="text-lg font-black text-emerald-400">ACTIVE (1h interval)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-nowrap gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-extrabold overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'products', label: `Products (${products.length})` },
            { id: 'product-review', label: '🛍️ Product Manager' },
            { id: 'product-articles', label: '📄 Product Articles' },
            { id: 'article-generator', label: '✨ Article Generator' },
            { id: 'auto-articles', label: '⚡ Auto Articles' },
            { id: 'scraper', label: 'Amazon ASIN Scraper' },
            { id: 'reviews', label: `Editorial Articles (${editorialPosts.length})` },
            { id: 'banners', label: `Banners & Sliders (${banners.length})` },
            { id: 'amazon-sync', label: '🔄 Amazon Sync' },
            { id: 'bulk-import', label: '📦 Bulk Import' },
            { id: 'auto-import', label: '🤖 Auto Import' },
            { id: 'wp-import', label: '📥 WP Import' },
            { id: 'activity-feed', label: '⚡ Activity Feed & Insights' },
            { id: 'testimonials', label: '⭐ Testimonials' },
            { id: 'affiliate', label: '🔗 Affiliate Slugs' },
            { id: 'brands', label: '🏷️ Brands' },
            { id: 'deals', label: '🔥 Deals' },
            { id: 'homepage', label: '🏠 Homepage' },
            { id: 'sections', label: '🧩 Sections' },
            { id: 'seo-engine', label: '🧠 SEO Engine' },
            { id: 'seo', label: 'SEO & Sitemap' },
            { id: 'analytics', label: `Affiliate Clicks (${serverClickData.totalClicks})` },
            { id: 'firebase', label: 'Firebase & Backup' },
            { id: 'posts', label: `Posts (${adminPosts.length})` },
            { id: 'categories', label: `Categories (${categories.length})` },
            { id: 'comments', label: `Comments (${adminComments.length})` },
            { id: 'pages', label: `Pages (${adminPages.length})` },
            { id: 'clusters', label: `Clusters (${topicClusters.length})` },
            { id: 'media', label: `Media (${media.length})` },
            { id: 'subscribers', label: `Subscribers (${subscribers.length})` },
            { id: 'drips', label: '✉️ Drips' },
            { id: 'alerts', label: '🔔 Alerts' },
            { id: 'contact', label: `Inquiries (${(messages || []).filter(m => m?.status === 'unread').length})` },
            { id: 'settings', label: '⚙️ Settings' },
            { id: 'logs', label: `Activity Logs (${logs.length})` },
            { id: 'profile', label: '👤 Admin Profile & Settings' },
            { id: 'extension', label: '🔌 Extension Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.id === 'scraper' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Real-time Activity Feed & User Insights */}
        {activeTab === 'activity-feed' && (
          <div className="space-y-6">
            <ActivityHeatmapD3 />
            <ActivityFeedTab />
          </div>
        )}
        {/* Tab 1: Products Management */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black">Catalog Product Management</h2>
                <p className="text-xs text-slate-500">Edit price drops, ASINs, specs, and AI verdicts.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingProduct({ title: '', mainCategory: '', status: 'draft', published: false })}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Add New Product</span>
                </button>
              </div>
            </div>

            {/* Product Search & Filter Bar */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 text-xs">
              <input
                type="text"
                placeholder="Search catalog by title, ASIN, or brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
              />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold outline-none"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Editing Product Form Modal/Card */}
            {editingProduct && (
              <form onSubmit={handleSaveProduct} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-blue-500/50 shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-base text-blue-600 dark:text-blue-400">
                    {editingProduct.id ? `Edit Product (${editingProduct.asin || 'New'})` : 'Create New Product'}
                  </h3>

                  <button
                    type="button"
                    onClick={handleGenerateAiMetadata}
                    disabled={isGeneratingAi || !editingProduct.title}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{isGeneratingAi ? 'Generating AI Review...' : '✨ Auto-Generate AI Verdict & Pros/Cons'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.title || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Amazon ASIN</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.asin || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, asin: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Brand</label>
                    <input
                      type="text"
                      value={editingProduct.brand || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Current Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.currentPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, currentPrice: parseFloat(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Reference List Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.referencePrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, referencePrice: parseFloat(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Main Category</label>
                    <select
                      value={editingProduct.mainCategory || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, mainCategory: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Affiliate Link & URL Update Section */}
                <div className="p-4 bg-amber-500/10 dark:bg-amber-950/30 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <span>🔗 Amazon Affiliate Link & Product URL</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                      Tracking Tag: {associateTag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                    <div>
                      <label className="block text-slate-500 mb-1">
                        Amazon Affiliate Link (User CTA Target)
                      </label>
                      <input
                        type="url"
                        placeholder={`https://www.amazon.com/dp/${editingProduct.asin || 'ASIN'}?tag=${associateTag}`}
                        value={editingProduct.affiliateUrl || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, affiliateUrl: e.target.value })
                        }
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono text-[11px] text-amber-900 dark:text-amber-300 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">
                        Original Amazon Product URL
                      </label>
                      <input
                        type="url"
                        placeholder={`https://www.amazon.com/dp/${editingProduct.asin || 'ASIN'}`}
                        value={editingProduct.amazonOriginalUrl || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, amazonOriginalUrl: e.target.value })
                        }
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Video Stream URL Section */}
                <div className="p-4 bg-dw-blue/10 dark:bg-blue-950/30 rounded-2xl border border-dw-blue/30 space-y-2">
                  <label className="block text-xs font-black text-dw-blue dark:text-blue-300 flex items-center gap-1.5">
                    <span>🎬 Product Video URL (YouTube Review or MP4 Stream)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://m.media-amazon.com/..."
                    value={editingProduct.videoUrl || editingProduct.specifications?.video_url || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        videoUrl: url,
                        specifications: { ...(editingProduct.specifications || {}), video_url: url }
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono text-[11px] text-dw-blue dark:text-blue-300 focus:ring-2 focus:ring-dw-blue"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Paste any YouTube video link or direct MP4/HLS stream URL. It will automatically render an interactive video player on the review page.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">Best For Badge</label>
                    <input
                      type="text"
                      value={editingProduct.bestFor || ''}
                      placeholder="e.g. Best Overall for Professionals"
                      onChange={(e) => setEditingProduct({ ...editingProduct, bestFor: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Editor Benchmark Score (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      max="10"
                      min="0"
                      value={editingProduct.editorScore || 9.0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, editorScore: parseFloat(e.target.value) })}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-bold text-amber-500"
                    />
                  </div>
                </div>

                {/* Product Image Gallery Manager */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        Product Gallery Images ({editingProduct.images?.length || 0})
                      </label>
                      <span className="text-[10px] text-slate-500">Manage high-resolution images or attach instant category presets.</span>
                    </div>
                  </div>

                  {/* Thumbnail Gallery List */}
                  <div className="flex flex-wrap gap-2">
                    {editingProduct.images && editingProduct.images.length > 0 ? (
                      editingProduct.images.map((imgUrl, i) => (
                        <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                          <img src={proxyImageUrl(imgUrl)} alt={`Gallery ${i}`} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => handleRemoveProductGalleryImage(i)}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Image"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 font-italic py-1">No gallery images added yet.</div>
                    )}
                  </div>

                  {/* Add Custom Image URL */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL (e.g. https://images.unsplash.com/...)"
                      value={newGalleryImageUrl}
                      onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddProductGalleryImage(newGalleryImageUrl.trim())}
                      disabled={!newGalleryImageUrl.trim()}
                      className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs disabled:opacity-50"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Category Image Presets */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Category Presets (Click to add to gallery):</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {[
                        { label: '🧴 Eye Serum Bottle', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80' },
                        { label: '✨ Eye Cream Texture', url: 'https://images.unsplash.com/photo-1608248597263-00079996576b?auto=format&fit=crop&w=1000&q=80' },
                        { label: '💧 Skincare Dropper', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80' },
                        { label: '🎧 Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80' },
                        { label: '💻 MacBook Pro', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80' },
                        { label: '📸 Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80' },
                        { label: '⌚ Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddProductGalleryImage(preset.url)}
                          className="bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-lg transition-colors font-medium text-slate-700 dark:text-slate-300"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.shortDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none"
                  />
                </div>

                {/* AI Gemini SEO Utility Section */}
                <div className="p-4 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <span className="text-amber-500">✨</span> Search Engine Optimization (SEO Metadata)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Auto-generate Google search titles, descriptions, and high-intent keywords using Gemini AI.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateAiSeo()}
                      disabled={isGeneratingSeo || !editingProduct.title}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow flex items-center gap-1.5 transition-all"
                    >
                      {isGeneratingSeo ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating SEO...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Auto-Generate AI SEO</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>SEO Meta Title</span>
                        <span className={(editingProduct.seoTitle || '').length > 60 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                          {(editingProduct.seoTitle || '').length} / 60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Optimized Google Title (e.g. Sony WH-1000XM5 Review & Amazon Price Drops | DawnWire)"
                        value={editingProduct.seoTitle || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, seoTitle: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        <span>SEO Meta Description</span>
                        <span className={(editingProduct.metaDescription || '').length > 160 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                          {(editingProduct.metaDescription || '').length} / 160 chars
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Google Search Snippet summary (150-160 chars) highlighting key features, deals, and specs..."
                        value={editingProduct.metaDescription || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, metaDescription: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Target SEO Keywords & Search Tags
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(editingProduct.metaKeywords || []).map((kw, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-xs">
                            <span>#{kw}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingProduct.metaKeywords || []).filter((_, i) => i !== idx);
                                setEditingProduct({ ...editingProduct, metaKeywords: updated });
                              }}
                              className="text-slate-400 hover:text-red-500 ml-1 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add keyword or phrase (e.g. amazon deals)..."
                          value={newKeywordInput}
                          onChange={(e) => setNewKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newKeywordInput.trim()) {
                                const kw = newKeywordInput.trim().toLowerCase();
                                const current = editingProduct.metaKeywords || [];
                                if (!current.includes(kw)) {
                                  setEditingProduct({ ...editingProduct, metaKeywords: [...current, kw] });
                                }
                                setNewKeywordInput('');
                              }
                            }
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newKeywordInput.trim()) {
                              const kw = newKeywordInput.trim().toLowerCase();
                              const current = editingProduct.metaKeywords || [];
                              if (!current.includes(kw)) {
                                setEditingProduct({ ...editingProduct, metaKeywords: [...current, kw] });
                              }
                              setNewKeywordInput('');
                            }
                          }}
                          className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Google Search Result Preview Card */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Google Search Result Snippet Preview</div>
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 truncate hover:underline cursor-pointer">
                        {editingProduct.seoTitle || editingProduct.title || 'Product Title | DawnWire Review'}
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-500 font-mono truncate">
                        https://dawnwire.com › products › {editingProduct.slug || 'product-slug'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {editingProduct.metaDescription || editingProduct.shortDescription || 'Discover full review and benchmark test scores for this product on DawnWire.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isDeal)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isDeal: e.target.checked })}
                      className="rounded text-orange-500"
                    />
                    <span>Mark as Amazon Hot Deal</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <select
                      value={editingProduct.status || (editingProduct.published ? 'published' : 'draft')}
                      onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value, published: e.target.value === 'published' })}
                      className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            )}

            {scrapeSuccessMsg && (
              <div className={scrapeSuccessMsg.includes('failed') || scrapeSuccessMsg.includes('Failed') || scrapeSuccessMsg.includes('Error') || scrapeSuccessMsg.includes('error') ? 'p-4 bg-red-50 text-red-900 rounded-2xl border border-red-200 text-xs font-bold' : 'p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-bold'}>
                {scrapeSuccessMsg}
              </div>
            )}

            {/* Product List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">ASIN</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Score</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-bold flex items-center gap-3">
                        <img src={proxyImageUrl(p.images?.[0] || (p as any).mainImage || (p as any).imageUrl || (p as any).productImage || '')} alt="" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-slate-800 p-1" />
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 line-clamp-1">{p.title}</div>
                          <div className="text-[10px] text-slate-400">{p.brand} {p.isDeal && <span className="text-orange-500 font-black ml-1">[HOT DEAL]</span>}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{p.asin}</td>
                      <td className="p-4">{p.mainCategory}</td>
                      <td className="p-4 font-black">${Number(p.currentPrice).toFixed(2)}</td>
                      <td className="p-4 font-bold text-amber-500">★ {p.editorScore}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => store.deleteProduct(p.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Amazon ASIN Scraper & Sync Engine */}
        {activeTab === 'scraper' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Amazon Product Advertising API & ASIN Sync Engine
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Import product metadata, images, and live prices automatically by entering an Amazon ASIN code.
              </p>
            </div>

            {/* Associate Tag Configurator */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Global Amazon Associate Tracking ID</span>
                <span className="text-[11px] text-slate-500">Appended to all outbound buy buttons on Amazon US.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={associateTag}
                  onChange={(e) => setAssociateTag(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
                />
                <button
                  onClick={handleBulkUpdateTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
                >
                  Bulk Apply Tag
                </button>
              </div>
            </div>

            {tagUpdatedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold">
                {tagUpdatedMsg}
              </div>
            )}

            {/* ASIN Fetcher */}
            <form onSubmit={handleSimulateScrape} className="flex gap-3 max-w-md">
              <input
                type="text"
                placeholder="Enter Amazon ASIN (e.g. B0CHWRXH8B)"
                value={asinInput}
                onChange={(e) => setAsinInput(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono outline-none border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                disabled={isScraping || !asinInput.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors shadow"
              >
                {isScraping ? 'Syncing Amazon...' : 'Fetch ASIN'}
              </button>
            </form>

            {scrapeSuccessMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-bold">
                {scrapeSuccessMsg}
              </div>
            )}

            {/* Sync Logs */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Recent Price Synchronization Logs</h3>
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">Scheduled Price Refresh:</span> {log.productsSynced} ASINs checked, {log.priceUpdates} price updates applied.
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Auto Article Factory */}
        {activeTab === 'auto-articles' && (
          <AutoArticlesPanel token={localStorage.getItem('dawnwire_auth_token') || ''} />
        )}

        {/* Tab 3: Editorial Reviews & Articles */}
        {activeTab === 'reviews' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold">Editorial Reviews & Buyer's Guides</h2>
                <p className="text-xs text-slate-500">AI-generated articles for your products, plus manual generation & management.</p>
              </div>
              <button
                onClick={() => { setShowArticleGenerator(!showArticleGenerator); setActiveTab('reviews'); }}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow transition-colors"
              >
                {showArticleGenerator ? '✕ Close Generator' : '✦ Generate Article (AI)'}
              </button>
            </div>

            {showArticleGenerator && (
              <div className="rounded-2xl border border-blue-500/40 bg-slate-50 dark:bg-slate-800/60 p-4">
                <ArticleGenerator token={localStorage.getItem('dawnwire_auth_token') || ''} />
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase text-slate-400">All Articles ({editorialPosts.length})</h3>
              {editorialPosts.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No articles yet. Click "Generate Article (AI)" above to write one, or use the "⚡ Auto Articles" tab to automate it.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editorialPosts.map((p) => (
                    <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${p.status === 'published' ? 'text-emerald-600 dark:text-emerald-400' : p.status === 'scheduled' ? 'text-dw-blue dark:text-blue-400' : 'text-slate-500 dark:text-slate-300'}`}>
                          {String(p.status || 'draft').toUpperCase()}
                        </span>
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{p.productName || p.product_id ? 'Product Article' : (Array.isArray(p.tags) && p.tags.includes('buying guide') ? 'Buying Guide' : 'Article')}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">{p.title}</h4>
                      {p.excerpt && <p className="text-xs text-slate-500 line-clamp-2">{p.excerpt}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-bold">{p.slug}</span>
                        <div className="flex items-center gap-2">
                          {p.slug && (
                            <a href={`/post/${p.slug}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-500/30">
                              View
                            </a>
                          )}
                          {p.status === 'draft' && (
                            <a href={`/admin?tab=auto-articles`} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600">
                              Publish
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Banners & Sliders CMS */}
        {activeTab === 'banners' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Homepage & Category Promotional Banners & Sliders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage hero slides, sale banners, and affiliate promo deals rendered dynamically across the app.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingBanner({
                    title: '',
                    subtitle: '',
                    description: '',
                    badgeText: '🔥 HOT AMAZON DEAL',
                    ctaText: 'Explore Deals',
                    targetUrl: '/products',
                    desktopImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
                    mobileImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
                    altText: 'Curated Amazon products, comparisons and buying guidance by DawnWire',
                    isEnabled: true,
                    overlayStrength: 45,
                    imageOnly: false,
                    order: banners.length + 1
                  });
                  setIsBannerFormOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow transition-colors flex items-center gap-2"
              >
                <span>➕ Create New Banner / Slider</span>
              </button>
            </div>

            {bannerSuccessMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
                {bannerSuccessMsg}
              </div>
            )}

            {/* Banner / Slider Creator Form */}
            {(isBannerFormOpen || editingBanner) && (
              <form onSubmit={handleSaveBanner} className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-3xl border border-blue-500/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-black text-sm text-blue-600 dark:text-blue-400">
                    {editingBanner?.id ? 'Edit Banner / Slider' : 'New Promotional Banner / Slider'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setEditingBanner(null); setIsBannerFormOpen(false); }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Display Mode Selector */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="block text-slate-500">Display Mode:</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bannerDisplayMode"
                      checked={!editingBanner?.imageOnly}
                      onChange={() => setEditingBanner({ ...editingBanner, imageOnly: false, overlayStrength: 45 })}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Standard Content</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bannerDisplayMode"
                      checked={editingBanner?.imageOnly === true}
                      onChange={() => setEditingBanner({ ...editingBanner, imageOnly: true, overlayStrength: 0 })}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Image Only</span>
                  </label>
                </div>

                {editingBanner?.imageOnly ? (
                  /* Image Only Mode Fields */
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500">Desktop Image URL *</label>
                      <div className="flex gap-2 items-start">
                        <input
                          type="url"
                          required
                          placeholder="https://example.com/banner-3x1.jpg"
                          value={editingBanner?.desktopImage || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, desktopImage: e.target.value, mobileImage: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none font-mono"
                        />
                        <BannerUploadBtn
                          onUrl={(url) => setEditingBanner({ ...editingBanner, desktopImage: url, mobileImage: url })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500">Mobile Image URL (optional)</label>
                      <input
                        type="url"
                        placeholder="Leave blank to use desktop image"
                        value={editingBanner?.mobileImage || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, mobileImage: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500">Click Destination URL</label>
                      <input
                        type="text"
                        placeholder="/products"
                        value={editingBanner?.targetUrl || '/products'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500">Alt Text</label>
                      <input
                        type="text"
                        placeholder="Curated Amazon products, comparisons and buying guidance by DawnWire"
                        value={editingBanner?.altText || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, altText: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                    </div>

                    {/* Live Image-Only Preview with 3:1 aspect ratio */}
                    {editingBanner?.desktopImage && (
                      <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900" style={{ aspectRatio: '3 / 1', maxHeight: '200px' }}>
                        <img
                          src={proxyImageUrl(editingBanner.desktopImage)}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'left center' }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Standard Content Mode Fields */
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                      <div>
                        <label className="block text-slate-500 mb-1">Banner Title / Headline *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Next-Gen Noise Cancellation Audio"
                          value={editingBanner?.title || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Badge Text (e.g. 🔥 PRIME EXCLUSIVE)</label>
                        <input
                          type="text"
                          placeholder="e.g. 25% OFF LIMITED TIME"
                          value={editingBanner?.badgeText || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-orange-500 font-black uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          placeholder="e.g. Shop Amazon Deals"
                          value={editingBanner?.ctaText || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Target Page URL / Affiliate Link</label>
                        <input
                          type="text"
                          placeholder="e.g. /categories/electronics or https://amazon.com/dp/..."
                          value={editingBanner?.targetUrl || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Subtitle / Description</label>
                      <textarea
                        rows={2}
                        placeholder="Short description highlighting the promotion or lab benchmark..."
                        value={editingBanner?.description || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                    </div>

                    {/* Banner Image URL & Quick Presets */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500">Desktop Background Image URL *</label>
                      <div className="flex gap-2 items-start">
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/..."
                          value={editingBanner?.desktopImage || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, desktopImage: e.target.value, mobileImage: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none font-mono"
                        />
                        <BannerUploadBtn
                          onUrl={(url) => setEditingBanner({ ...editingBanner, desktopImage: url, mobileImage: url })}
                        />
                      </div>

                      {/* Preset Banner Images */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-slate-400">Quick Banner Presets:</span>
                        {[
                          { label: '🎧 Audio Hero', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80' },
                          { label: '🤖 Smart Home', url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1600&q=80' },
                          { label: '💻 Workstations', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80' },
                          { label: '🎮 Gaming Gear', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80' }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, desktopImage: preset.url, mobileImage: preset.url })}
                            className="bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-lg font-medium transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Live Standard Preview */}
                      {editingBanner?.desktopImage && (
                        <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 mt-2 flex items-center p-6 text-white bg-slate-900 shadow-inner">
                          <img src={proxyImageUrl(editingBanner.desktopImage)} alt="Preview" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/60" />
                          <div className="relative z-10 space-y-1 max-w-md">
                            {editingBanner.badgeText && (
                              <span className="inline-block px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-black text-[9px] uppercase">
                                {editingBanner.badgeText}
                              </span>
                            )}
                            <h4 className="text-lg font-black">{editingBanner.title || 'Sample Title'}</h4>
                            <p className="text-xs text-slate-200 line-clamp-1">{editingBanner.description || 'Sample description...'}</p>
                            <span className="inline-block px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-extrabold mt-1">
                              {editingBanner.ctaText || 'Shop Deals'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner?.isEnabled !== false}
                      onChange={(e) => setEditingBanner({ ...editingBanner, isEnabled: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Publish Banner as Active</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingBanner(null); setIsBannerFormOpen(false); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs shadow"
                    >
                      Save & Publish Banner
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of Published Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div key={b.id} className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="relative h-32 bg-slate-900 overflow-hidden p-4 flex flex-col justify-end text-white">
                    <img src={proxyImageUrl(b.desktopImage)} alt={b.title} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                    <div className="relative z-10 space-y-1">
                      {b.badgeText && (
                        <span className="inline-block px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-black text-[9px] uppercase">
                          {b.badgeText}
                        </span>
                      )}
                      <h4 className="font-extrabold text-sm line-clamp-1">{b.title}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{b.description || b.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${b.isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className="text-[10px] font-mono text-slate-500">{b.targetUrl}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          store.saveBanner({ ...b, isEnabled: !b.isEnabled });
                        }}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-300"
                      >
                        {b.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingBanner(b);
                          setIsBannerFormOpen(true);
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => store.deleteBanner(b.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Banner Manager (per-placement + category banners) */}
        {activeTab === 'banners' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AdminBannerManager token={token} categories={categories} />
          </div>
        )}

        {/* Tab 5: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <TopViewedCategoriesChart categories={categories} />

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Amazon Affiliate Outbound Click Analytics</h2>
                  <p className="text-xs text-slate-500">Aggregated click data from the last 30 days.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-500">{serverClickData.totalClicks}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Clicks (30d)</div>
                </div>
              </div>

              {(!serverClickData.topLinks || serverClickData.topLinks.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  No outbound clicks recorded yet. Clicks are tracked when users click "Check Price on Amazon" buttons.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Top Clicked Links</div>
                  {serverClickData.topLinks.map((link, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-blue-600 dark:text-blue-400">{link.title}</strong>
                        <span className="text-slate-400 ml-2">({link.clicks} clicks)</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">/go/{link.url}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: SEO & Sitemap */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <OpenGraphAuditTool products={products} />
            <SeoHealthProgressChart products={products} />

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  <span>Search Engine Optimization & AI Meta Tools</span>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Gemini 3.6 Flash
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Generate optimized meta titles, descriptions, keywords, and XML sitemaps for search engine ranking.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBatchGenerateSeo}
                  disabled={isBatchSeoRunning || products.length === 0}
                  className="bg-dw-blue hover:bg-dw-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-2 transition-all"
                >
                  {isBatchSeoRunning ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Batch Generating ({batchSeoProgress?.current}/{batchSeoProgress?.total})...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Auto-Generate SEO for All Products ({products.length})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateSitemap}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-1.5"
                >
                  <span>Generate XML Sitemap</span>
                </button>
              </div>
            </div>

            {seoSuccessMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <span>✅</span>
                <span>{seoSuccessMsg}</span>
              </div>
            )}

            {/* AI SEO Single Product Generator & Live Audit Panel */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🔍 Product SEO Metadata Audit & AI Generator</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Select Catalog Product to Audit / Enhance</label>
                  <select
                    value={selectedSeoProduct?.id || ''}
                    onChange={(e) => {
                      const p = products.find(prod => prod.id === e.target.value);
                      setSelectedSeoProduct(p || null);
                    }}
                    className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none"
                  >
                    <option value="">-- Choose a Product ({products.length} available) --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} {p.seoTitle ? '✓ [SEO Ready]' : '⚠️ [Meta Missing]'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSeoProduct && (
                  <div className="flex items-end gap-2">
                    <button
                      onClick={async () => {
                        if (!selectedSeoProduct) return;
                        const seoRes = await handleGenerateAiSeo(selectedSeoProduct);
                        if (seoRes) {
                          const updated: Product = {
                            ...selectedSeoProduct,
                            seoTitle: seoRes.seoTitle,
                            metaDescription: seoRes.metaDescription,
                            metaKeywords: seoRes.metaKeywords
                          };
                          setSelectedSeoProduct(updated);
                          store.saveProduct(updated);
                          setSeoSuccessMsg(`SEO metadata updated and saved for "${updated.title}"!`);
                        }
                      }}
                      disabled={isGeneratingSeo}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow flex items-center gap-2"
                    >
                      {isGeneratingSeo ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Gemini Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Generate & Apply Gemini SEO Meta</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {selectedSeoProduct && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Google Search Result Preview</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Canonical: https://dawnwire.com/products/{selectedSeoProduct.slug}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                      {selectedSeoProduct.seoTitle || `${selectedSeoProduct.title} Review & Deals | DawnWire`}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-500 font-mono">
                      https://dawnwire.com › products › {selectedSeoProduct.slug}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {selectedSeoProduct.metaDescription || selectedSeoProduct.shortDescription}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Target Keywords ({selectedSeoProduct.metaKeywords?.length || 0}):</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedSeoProduct.metaKeywords || ['tech review', 'amazon price drops']).map((kw, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">High-Intent Keyword Intelligence Opportunities</h3>
              {seoOpportunities.map((seo) => (
                <div key={seo.keyword} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{seo.keyword}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Search Volume: {(seo.searchVolume || 0).toLocaleString()} / mo • Difficulty: {seo.competition}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
                      Estimated CTR: {seo.estimatedCTR}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Tab 7: Firebase & Backup */}
        {activeTab === 'firebase' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-extrabold">Firebase Firestore Database & Data Backup Tools</h2>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Project Provisioned & Active
              </div>
              <p className="text-emerald-800 dark:text-emerald-300">
                Database ID: <code className="font-mono">ai-studio-dawnwire-7393d8c5-f907-4e40-a2e2-fe5cd88ab624</code><br />
                Security Rules: Deployed and enforcing admin roles and public read access.<br />
                Super Admin Email: <code className="font-mono">medicaltradehub@gmail.com</code>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Catalog Data Backup & Export</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleExportJson}
                  className="bg-[#0A1F44] hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                >
                  Download Full Catalog Backup (.json)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Admin Profile & Preferences */}
        {activeTab === 'profile' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Administrator Profile & System Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage super admin avatar image, display name, email, and Amazon Associate tracking configuration.
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in">
                {profileSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveAdminProfile} className="max-w-2xl space-y-6">
              {/* Profile Avatar Card */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600 shadow-xl bg-slate-200 shrink-0">
                  <img src={proxyImageUrl(adminPhoto)} alt={adminName} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setIsCropModalOpen(true)}
                    className="absolute inset-0 bg-slate-950/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                  >
                    <span>📷 Crop</span>
                    <span>Upload</span>
                  </button>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{adminName}</h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{adminTitle}</p>
                      <p className="text-xs text-slate-500 font-mono">{adminEmail}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow transition-colors flex items-center gap-1.5"
                    >
                      <span>📷 Crop & Upload Custom Avatar</span>
                    </button>
                  </div>

                  {/* Preset Avatars */}
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-bold text-slate-400 block w-full sm:w-auto">Choose Avatar Preset:</span>
                    {[
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
                    ].map((imgUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAdminPhoto(imgUrl)}
                        className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-300 hover:border-blue-600 transition-all"
                      >
                        <img src={proxyImageUrl(imgUrl)} alt={`Preset ${i}`} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">Avatar Photo URL</label>
                  <input
                    type="url"
                    value={adminPhoto}
                    onChange={(e) => setAdminPhoto(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Admin Email Address</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Editorial Title / Role</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Administrator Bio / Credentials</label>
                  <textarea
                    rows={3}
                    value={adminBio}
                    onChange={(e) => setAdminBio(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Global Amazon Associate Tracking Tag</label>
                  <input
                    type="text"
                    value={associateTag}
                    onChange={(e) => setAssociateTag(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none font-mono font-extrabold text-amber-500"
                  />
                </div>
              </div>

              {/* Browser Extension API Token */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Browser Extension API Token</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={localStorage.getItem('dawnwire_auth_token') || ''}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-300 dark:border-zinc-600 text-xs font-mono outline-none cursor-pointer select-all"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(localStorage.getItem('dawnwire_auth_token') || '')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Paste this token into the DawnWire Browser Extension popup. Browse Amazon/Walmart/Best Buy to see the import banner.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3 rounded-2xl text-xs shadow-lg shadow-blue-600/20"
                >
                  Save Profile & Preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Dashboard Analytics */}
        {activeTab === 'dashboard' && (
          <DashboardAnalytics token={localStorage.getItem('dawnwire_auth_token') || ''} />
        )}

        {/* Tab: Product Manager (full CRUD catalogue) — includes inline URL importer */}
        {activeTab === 'product-review' && (
          <div className="space-y-6">
            {/* Inline URL Importer — merged from old Link Importer tab */}
            <div className="p-6 bg-gradient-to-br from-slate-900 via-[#0A1F44] to-blue-950 text-white rounded-3xl border border-blue-800/80 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-black">⚡ Quick Import from URL</h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">Paste any Amazon product link — AI extracts prices, specs, pros/cons, gallery, and attaches your affiliate tag.</p>
                </div>
                <div className="p-2 bg-blue-900/40 border border-blue-700/50 rounded-xl text-[10px] font-mono">
                  <span className="text-slate-400">Tag: </span>
                  <span className="text-amber-400 font-bold">{associateTag}</span>
                </div>
              </div>
              <form onSubmit={handleExtractFromLink} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  required
                  placeholder="https://www.amazon.com/dp/B09XS7JWHH"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-blue-500 px-4 py-3 rounded-xl text-xs text-white font-mono outline-none"
                />
                <button
                  type="submit"
                  disabled={isExtractingLink || !linkInput.trim()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {isExtractingLink ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Extracting...</>
                  ) : (
                    <><span>⚡</span> Extract & Import</>
                  )}
                </button>
              </form>
              {extractionSuccessMsg && (
                <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between">
                  <span>🎉 {extractionSuccessMsg}</span>
                  <button onClick={() => setExtractionSuccessMsg('')} className="text-emerald-400 hover:text-white">✕</button>
                </div>
              )}
              {extractedPreview && (
                <div className="mt-4 p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">✨ Extracted</span>
                    <div className="text-sm font-bold mt-0.5">{extractedPreview.title}</div>
                    <div className="text-[11px] text-slate-300">{extractedPreview.brand} • ${Number(extractedPreview.currentPrice || 0).toFixed(2)} • ASIN: {extractedPreview.asin}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditingProduct(extractedPreview); }} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold">✏️ Edit</button>
                    <button onClick={handlePublishExtractedProduct} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold shadow-lg">🚀 Publish</button>
                  </div>
                </div>
              )}
            </div>
            <ProductReviewManager token={token} categories={categories} />
          </div>
        )}

        {/* Tab: Product Articles */}
        {activeTab === 'product-articles' && (
          <ProductArticlesManager token={token} />
        )}

        {/* Tab: Article Generator */}
        {activeTab === 'article-generator' && (
          <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-3xl border border-slate-200/80 dark:border-zinc-700/50 shadow-sm">
            <ArticleGenerator token={token} />
          </div>
        )}

        {/* Tab: Amazon Sync */}
        {activeTab === 'amazon-sync' && (
          <AmazonSyncDashboard token={token} />
        )}

        {/* Tab: Auto Import */}
        {activeTab === 'auto-import' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AutoImportPanel token={token} />
          </div>
        )}

        {/* Tab: WordPress Import */}
        {activeTab === 'wp-import' && (
          <WordPressImportTool token={token} />
        )}

        {/* Tab: Testimonials */}
        {activeTab === 'testimonials' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <TestimonialManager token={token} />
          </div>
        )}

        {/* Tab: Affiliate Slugs */}
        {activeTab === 'affiliate' && (
          <AdminAffiliate token={token} affiliateLinks={affiliateLinks} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Brands */}
        {activeTab === 'brands' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AdminBrands token={token} />
          </div>
        )}

        {/* Tab: Deals */}
        {activeTab === 'deals' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AdminDeals token={token} />
          </div>
        )}

        {/* Tab: Homepage */}
        {activeTab === 'homepage' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AdminHomepage token={token} />
          </div>
        )}

        {/* Tab: Sections */}
        {activeTab === 'sections' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AdminCategorySections token={token} categories={categories} />
          </div>
        )}

        {/* Tab: SEO Engine */}
        {activeTab === 'seo-engine' && (
          <SeoDashboard token={token} baseUrl="" />
        )}

        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <AdminPosts token={token} categories={categories} onRefresh={triggerAdminRefresh} posts={adminPosts} setPosts={setAdminPosts} />
        )}

        {/* Tab: Categories */}
        {activeTab === 'categories' && (
          <AdminCategories token={token} categories={categories} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Comments */}
        {activeTab === 'comments' && (
          <AdminComments token={token} comments={adminComments} posts={adminPosts} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Pages */}
        {activeTab === 'pages' && (
          <AdminPages token={token} pages={adminPages} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Topic Clusters */}
        {activeTab === 'clusters' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Topic Clusters ({topicClusters.length})</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Pillar pages with cluster content for SEO topic authority</span>
            </div>
            <div className="p-4 space-y-4">
              {topicClusters.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 p-8 text-center">No topic clusters created yet. Clusters group a pillar page with related content for SEO topical authority.</p>
              ) : (
                topicClusters.map((cluster) => (
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
                          <span>{(cluster as any).clusterPostIds?.length || 0} cluster posts</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={`/cluster/${cluster.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-3 py-1.5 rounded-lg hover:bg-[#246BFF]/10 transition-all">View</a>
                        <button onClick={async () => {
                          if (!confirm('Delete this topic cluster?')) return;
                          try {
                            const res = await fetch(`/api/admin/topic-clusters/${cluster.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            if (res.ok) setTopicClusters(prev => prev.filter((c) => c.id !== cluster.id));
                          } catch (e) { console.error(e); }
                        }} className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all cursor-pointer">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Media Gallery */}
        {activeTab === 'media' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
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

        {/* Tab: Subscribers */}
        {activeTab === 'subscribers' && (
          <AdminSubscribers token={token} subscribers={subscribers} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Drips */}
        {activeTab === 'drips' && (
          <AdminDrips token={token} subscribers={subscribers} />
        )}

        {/* Tab: Alerts */}
        {activeTab === 'alerts' && (
          <AnalyticsAlerts token={token} />
        )}

        {/* Tab: Inquiries */}
        {activeTab === 'contact' && (
          <AdminContact token={token} messages={messages} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <AdminSettings token={token} settings={siteSettings} onRefresh={triggerAdminRefresh} />
        )}

        {/* Tab: Activity Logs */}
        {activeTab === 'logs' && (
          <AdminLogs token={token} logs={logs} />
        )}
      </div>

        {/* Tab: Extension Settings */}
        {activeTab === 'extension' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <ExtensionManager token={(localStorage.getItem('dawnwire_auth_token') || '').trim()} />
          </div>
        )}

        {/* Tab: Bulk Import */}
        {activeTab === 'bulk-import' && (
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
            <AmazonBulkImporter token={(localStorage.getItem('dawnwire_auth_token') || '').trim()} />
          </div>
        )}

      {/* XML Sitemap Modal */}
      {showSitemapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-2xl w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg">Generated XML Sitemap</h3>
              <button onClick={() => setShowSitemapModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <textarea
              readOnly
              rows={12}
              value={sitemapContent}
              className="w-full bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 outline-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sitemapContent);
                  alert('Sitemap XML copied to clipboard!');
                }}
                className="bg-blue-600 text-white font-extrabold px-6 py-2 rounded-xl text-xs"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Profile Image Crop & Upload Modal */}
      {isCropModalOpen && (
        <AdminProfileCropModal
          currentPhotoUrl={adminPhoto}
          onSave={(croppedUrl) => {
            setAdminPhoto(croppedUrl);
            setProfileSuccessMsg('Custom cropped profile avatar saved and uploaded successfully!');
          }}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};
