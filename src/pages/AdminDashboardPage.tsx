import React, { useState } from 'react';
import { useAppStore, store } from '../lib/store';
import { ActivityFeedTab } from '../components/admin/ActivityFeedTab';
import { AdminProfileCropModal } from '../components/admin/AdminProfileCropModal';
import { ActivityHeatmapD3 } from '../components/admin/ActivityHeatmapD3';
import { SeoHealthProgressChart } from '../components/admin/SeoHealthProgressChart';
import { TopViewedCategoriesChart } from '../components/admin/TopViewedCategoriesChart';
import { OpenGraphAuditTool } from '../components/admin/OpenGraphAuditTool';
import { Product, CategoryBanner, EditorialReview, BuyingGuide } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { products, categories, banners, reviews, buyingGuides, syncLogs, affiliateClicks, seoOpportunities, currentUser } = useAppStore();

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return (
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'admin' ||
      currentUser?.email === 'medicaltradehub@gmail.com' ||
      localStorage.getItem('dawnwire_admin_session') === 'true'
    );
  });
  const [adminPasscode, setAdminPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'products' | 'activity-feed' | 'link-importer' | 'scraper' | 'reviews' | 'banners' | 'analytics' | 'seo' | 'firebase' | 'profile'>('products');

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

  // Admin Profile States
  const [adminName, setAdminName] = useState(currentUser?.displayName || 'DawnWire Admin');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || 'medicaltradehub@gmail.com');
  const [adminPhoto, setAdminPhoto] = useState(currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
  const [adminTitle, setAdminTitle] = useState('Chief Editorial Lead & Product Architect');
  const [adminBio, setAdminBio] = useState('Managing DawnWire affiliate product intelligence, Amazon API sync engines, and editorial lab benchmarks.');
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

  // Passcode authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode === 'dawnwire2026' || adminPasscode === 'admin' || adminPasscode === 'admin123') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('dawnwire_admin_session', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Administrator Passcode. Try "dawnwire2026" or "admin123".');
    }
  };

  const handleGoogleAdminLogin = async () => {
    await store.loginWithGoogle();
    setIsAdminLoggedIn(true);
    localStorage.setItem('dawnwire_admin_session', 'true');
  };

  const handleGithubAdminLogin = async () => {
    await store.loginWithGithub();
    setIsAdminLoggedIn(true);
    localStorage.setItem('dawnwire_admin_session', 'true');
  };

  const handleFacebookAdminLogin = async () => {
    await store.loginWithFacebook();
    setIsAdminLoggedIn(true);
    localStorage.setItem('dawnwire_admin_session', 'true');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('dawnwire_admin_session');
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
          asin: editingProduct.asin || 'B000000000',
          category: editingProduct.mainCategory || 'Electronics'
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
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title) return;

    const slug = editingProduct.slug || editingProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fullProduct: Product = {
      id: editingProduct.id || 'p-' + Date.now(),
      title: editingProduct.title || 'New Product',
      slug: slug,
      asin: editingProduct.asin || 'B000000000',
      brand: editingProduct.brand || 'Generic',
      mainCategory: editingProduct.mainCategory || 'Electronics',
      subcategory: editingProduct.subcategory || 'General',
      productType: 'Physical Product',
      shortDescription: editingProduct.shortDescription || 'High-performance model.',
      fullDescription: editingProduct.fullDescription || 'Full expert review and specifications for this model.',
      images: editingProduct.images && editingProduct.images.length ? editingProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      amazonOriginalUrl: editingProduct.amazonOriginalUrl || `https://www.amazon.com/dp/${editingProduct.asin}`,
      affiliateUrl: editingProduct.affiliateUrl || `https://www.amazon.com/dp/${editingProduct.asin}?tag=${associateTag}`,
      amazonMarketplace: 'US',
      associateTrackingId: associateTag,
      currentPrice: Number(editingProduct.currentPrice) || 99.99,
      referencePrice: Number(editingProduct.referencePrice) || 129.99,
      currency: 'USD',
      discountPercentage: Number(editingProduct.discountPercentage) || 0,
      isAvailable: true,
      isDeal: Boolean(editingProduct.isDeal),
      isPrime: true,
      rating: Number(editingProduct.rating) || 4.5,
      reviewCount: Number(editingProduct.reviewCount) || 120,
      mainFeatures: editingProduct.mainFeatures || ['Independent Benchmarking', 'Amazon Price Drops', 'Top Buyer Ratings'],
      specifications: editingProduct.specifications || { Warranty: '1 Year' },
      pros: editingProduct.pros || ['Great build quality', 'Excellent price-to-performance'],
      cons: editingProduct.cons || ['Slightly higher price than basic alternatives'],
      bestFor: editingProduct.bestFor || 'Top overall value pick',
      editorVerdict: editingProduct.editorVerdict || 'Solid choice for buyers seeking top performance on Amazon.',
      editorScore: Number(editingProduct.editorScore) || 9.0,
      similarProductIds: [],
      alternativeProductIds: [],
      relatedComparisonIds: [],
      relatedGuideIds: [],
      isFeatured: true,
      isTrending: true,
      isBestSeller: false,
      published: true,
      lastSyncedAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
      seoTitle: editingProduct.seoTitle || `${editingProduct.title} Review, Specs & Best Amazon Deals | DawnWire`,
      metaDescription: editingProduct.metaDescription || `In-depth review and benchmark analysis for ${editingProduct.title}. Compare price drops, specs, pros, cons, and editor rating on DawnWire.`,
      metaKeywords: editingProduct.metaKeywords && editingProduct.metaKeywords.length > 0
        ? editingProduct.metaKeywords
        : [editingProduct.title.toLowerCase(), `${editingProduct.title.toLowerCase()} review`, 'amazon price drops', 'dawnwire tech review'],
      canonicalUrl: editingProduct.canonicalUrl || `https://dawnwire.com/products/${slug}`
    };

    store.saveProduct(fullProduct);
    setEditingProduct(null);
  };

  // ASIN Scraper Simulator
  const handleSimulateScrape = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asinInput.trim()) return;

    setIsScraping(true);
    setScrapeSuccessMsg('');

    setTimeout(() => {
      setIsScraping(false);
      setScrapeSuccessMsg(`Successfully scraped ASIN ${asinInput.toUpperCase()} from Amazon US! Data imported into catalog.`);
      setEditingProduct({
        asin: asinInput.toUpperCase(),
        title: `Amazon Scraped Item (${asinInput.toUpperCase()})`,
        brand: 'Amazon Brand',
        mainCategory: 'Electronics',
        subcategory: 'Smart Devices',
        currentPrice: 149.99,
        referencePrice: 199.99,
        editorScore: 9.3,
        rating: 4.7,
        reviewCount: 420,
        isDeal: true,
        discountPercentage: 25,
        affiliateUrl: `https://www.amazon.com/dp/${asinInput.toUpperCase()}?tag=${associateTag}`,
        images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800'],
        shortDescription: 'Auto-synchronized directly from Amazon Product Advertising API.',
        bestFor: 'Automated price tracking pick',
        pros: ['Direct Amazon import', 'Synced price drops', 'Verified Prime item'],
        cons: ['High demand product']
      });
      setAsinInput('');
    }, 1200);
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
      if (data && data.title) {
        setExtractedPreview(data);
        setExtractionStep('complete');
        setExtractionSuccessMsg(`Successfully extracted publish-ready product data for "${data.title}"!`);
      }
    } catch (err) {
      console.error('Link extraction error:', err);
      setExtractionStep('idle');
    } finally {
      setIsExtractingLink(false);
    }
  };

  // Save extracted product directly to catalog
  const handlePublishExtractedProduct = () => {
    if (!extractedPreview) return;
    store.saveProduct(extractedPreview);
    setExtractionSuccessMsg(`🚀 "${extractedPreview.title}" published live to DawnWire website catalog!`);
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

  // Calculate total potential affiliate revenue
  const totalClickValue = affiliateClicks.length * 120.00;
  const estimatedCommission = totalClickValue * 0.045; // 4.5% avg Amazon commission

  // Save Banner / Slider Handler
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title) return;
    const bannerToSave: CategoryBanner = {
      id: editingBanner.id || 'b-' + Date.now(),
      categoryId: editingBanner.categoryId || 'cat-electronics',
      desktopImage: editingBanner.desktopImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
      mobileImage: editingBanner.mobileImage || editingBanner.desktopImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      title: editingBanner.title,
      subtitle: editingBanner.subtitle || '',
      description: editingBanner.description || '',
      badgeText: editingBanner.badgeText || 'SPECIAL PROMO',
      ctaText: editingBanner.ctaText || 'Explore Deals',
      targetUrl: editingBanner.targetUrl || '/categories',
      affiliateUrl: editingBanner.affiliateUrl || '',
      textAlignment: editingBanner.textAlignment || 'left',
      overlayStrength: editingBanner.overlayStrength ?? 45,
      isEnabled: editingBanner.isEnabled !== false,
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

  // 1. UNAUTHENTICATED GATE
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 p-8 rounded-3xl shadow-2xl space-y-6 text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

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
              <label className="block text-xs font-bold text-slate-400 mb-1">Administrator Passcode</label>
              <input
                type="password"
                placeholder="Enter passcode (e.g. dawnwire2026)"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20"
            >
              Sign In to Admin Operations
            </button>
          </form>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <span className="relative bg-slate-800 px-3 text-[10px] font-extrabold uppercase text-slate-500">OR</span>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleGoogleAdminLogin}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-600 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/></svg>
              <span>Sign in with Google</span>
            </button>

            <button
              onClick={handleGithubAdminLogin}
              className="w-full bg-slate-950 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>Sign in with GitHub</span>
            </button>

            <button
              onClick={handleFacebookAdminLogin}
              className="w-full bg-[#1877F2] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Sign in with Facebook</span>
            </button>

            <button
              onClick={() => {
                setIsAdminLoggedIn(true);
                localStorage.setItem('dawnwire_admin_session', 'true');
              }}
              className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-extrabold py-2.5 rounded-xl text-xs border border-emerald-500/30 transition-colors"
            >
              ⚡ Instant 1-Click Demo Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
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
              <div className="text-[11px] font-mono">{currentUser?.email || 'medicaltradehub@gmail.com'}</div>
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
            <span className="text-slate-400 block text-[10px] uppercase font-extrabold">Affiliate Clicks</span>
            <span className="text-lg font-black text-amber-400">{affiliateClicks.length} Outbound</span>
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
        <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-extrabold">
          {[
            { id: 'products', label: `Products (${products.length})` },
            { id: 'activity-feed', label: '⚡ Activity Feed & User Insights' },
            { id: 'link-importer', label: '⚡ Link Importer Plugin' },
            { id: 'scraper', label: 'Amazon ASIN Scraper' },
            { id: 'reviews', label: `Editorial Articles (${reviews.length})` },
            { id: 'banners', label: `Banners & Sliders (${banners.length})` },
            { id: 'analytics', label: `Affiliate Clicks (${affiliateClicks.length})` },
            { id: 'seo', label: 'SEO & Sitemap' },
            { id: 'firebase', label: 'Firebase & Backup' },
            { id: 'profile', label: '👤 Admin Profile & Settings' }
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
              {tab.id === 'link-importer' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
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

        {/* Tab: Amazon Product Link Data Extractor Plugin */}
        {activeTab === 'link-importer' && (
          <div className="space-y-6">
            <div className="p-8 bg-gradient-to-br from-slate-900 via-[#0A1F44] to-blue-950 text-white rounded-3xl border border-blue-800/80 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Amazon Product URL Importer Plugin
                  </div>
                  <h2 className="text-2xl font-black font-display">Extract & Import Any Product Link into Catalog</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Paste any Amazon product link or ASIN URL below. Gemini 2.5 Flash will automatically extract prices, specs, pros/cons, editor verdict, gallery images, YouTube review videos, and attach your affiliate associate tag.
                  </p>
                </div>

                <div className="p-3 bg-blue-900/40 border border-blue-700/50 rounded-2xl text-xs font-mono">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Associate Tag</span>
                  <span className="text-amber-400 font-extrabold">{associateTag}</span>
                </div>
              </div>

              {/* Sample Quick Links */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Try a Sample Amazon URL:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: 'Sony WH-1000XM5', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
                    { label: 'MacBook Air 15 M3', url: 'https://www.amazon.com/dp/B0C762112C' },
                    { label: 'iPhone 15 Pro Max', url: 'https://www.amazon.com/dp/B0CHWRXH8B' },
                    { label: 'DJI Mini 4 Pro Drone', url: 'https://www.amazon.com/dp/B0CGF78T1V' }
                  ].map((sample) => (
                    <button
                      key={sample.url}
                      onClick={() => setLinkInput(sample.url)}
                      className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/60 rounded-xl text-slate-200 text-[11px] font-medium transition-colors"
                    >
                      + {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input Form */}
              <form onSubmit={handleExtractFromLink} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="url"
                    required
                    placeholder="Paste Amazon Product Link (e.g., https://www.amazon.com/dp/B09XS7JWHH)"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 px-4 py-3.5 rounded-2xl text-xs text-white font-mono outline-none shadow-inner pr-10"
                  />
                  {linkInput && (
                    <button
                      type="button"
                      onClick={() => setLinkInput('')}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isExtractingLink || !linkInput.trim()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {isExtractingLink ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Extracting Data...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>⚡ Extract & Import Product Data</span>
                    </>
                  )}
                </button>
              </form>

              {/* Extraction Animated Progress Status */}
              {isExtractingLink && (
                <div className="p-4 bg-blue-900/50 border border-blue-700/80 rounded-2xl space-y-3 text-xs animate-in fade-in duration-300">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                      AI Link Extraction & Metadata Synthesis in Progress
                    </span>
                    <span className="font-mono text-[11px] text-slate-300">Gemini 2.5 Flash</span>
                  </div>

                  <div className="space-y-1.5 text-slate-300 text-[11px]">
                    <div className={`flex items-center gap-2 ${extractionStep === 'parsing' ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                      <span>{extractionStep === 'parsing' ? '⏳' : '✅'}</span>
                      <span>Parsing Product URL & Extracting ASIN Identifier...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${extractionStep === 'gemini' ? 'text-amber-400 font-bold' : extractionStep === 'enriching' || extractionStep === 'complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span>{extractionStep === 'gemini' ? '⏳' : extractionStep === 'enriching' || extractionStep === 'complete' ? '✅' : '⚪'}</span>
                      <span>Running Gemini AI Model to synthesize Specs, Prices & Editorial Verdict...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${extractionStep === 'enriching' ? 'text-amber-400 font-bold' : extractionStep === 'complete' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span>{extractionStep === 'enriching' ? '⏳' : extractionStep === 'complete' ? '✅' : '⚪'}</span>
                      <span>Fetching gallery images, video reviews & attaching tag ({associateTag})...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {extractionSuccessMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎉</span>
                    <span>{extractionSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => setExtractionSuccessMsg('')}
                    className="text-emerald-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Product Data Card & Preview */}
            {extractedPreview && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/50 shadow-2xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                      ✨ Extracted Data Ready for Website
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                      {extractedPreview.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Brand: <strong className="text-slate-800 dark:text-slate-200">{extractedPreview.brand}</strong> • Category: <strong>{extractedPreview.mainCategory}</strong> • ASIN: <code className="font-mono">{extractedPreview.asin}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingProduct(extractedPreview);
                        setActiveTab('products');
                      }}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                    >
                      ✏️ Edit in Form
                    </button>
                    <button
                      onClick={handlePublishExtractedProduct}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                      <span>🚀 Publish Directly to Website</span>
                    </button>
                  </div>
                </div>

                {/* Extracted Data Summary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Image & Pricing */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-center">
                      <img
                        src={extractedPreview.images[0]}
                        alt={extractedPreview.title}
                        className="max-h-full object-contain"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Extracted Price:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">${extractedPreview.currentPrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>List Price:</span>
                        <span className="line-through">${extractedPreview.referencePrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Discount:</span>
                        <span className="text-orange-500 font-black">{extractedPreview.discountPercentage}% OFF</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 font-bold">Editor Score:</span>
                        <span className="text-amber-500 font-black">★ {extractedPreview.editorScore} / 10</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Editorial Overview & Specs */}
                  <div className="lg:col-span-2 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Best For Badge</span>
                      <div className="mt-1 inline-block px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold rounded-xl">
                        🏆 {extractedPreview.bestFor}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Short Summary</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        {extractedPreview.shortDescription}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Editor Verdict</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200 font-medium">
                        {extractedPreview.editorVerdict}
                      </p>
                    </div>

                    {/* Key Features & Pros/Cons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60">
                        <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-2">Tested Pros</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                          {extractedPreview.pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/60">
                        <h4 className="font-extrabold text-rose-800 dark:text-rose-300 mb-2">Considerations</h4>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                          {extractedPreview.cons.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">✕</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Extracted Specifications */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Extracted Technical Specs</span>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px]">
                        {Object.entries(extractedPreview.specifications || {}).map(([key, val]) => (
                          <div key={key}>
                            <span className="text-slate-400 font-medium">{key}:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">{val}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Affiliate Link Verification */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-[11px] font-mono flex items-center justify-between text-amber-900 dark:text-amber-300">
                      <span>Affiliate Target:</span>
                      <span className="truncate max-w-md font-bold">{extractedPreview.affiliateUrl}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  onClick={() => setEditingProduct({ title: '', mainCategory: 'Electronics', currentPrice: 99 })}
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
                      value={editingProduct.mainCategory || 'Electronics'}
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
                      <span className="text-[10px] text-slate-500">Manage high-resolution images or attach instant tech presets.</span>
                    </div>
                  </div>

                  {/* Thumbnail Gallery List */}
                  <div className="flex flex-wrap gap-2">
                    {editingProduct.images && editingProduct.images.length > 0 ? (
                      editingProduct.images.map((imgUrl, i) => (
                        <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                          <img src={imgUrl} alt={`Gallery ${i}`} className="w-full h-full object-contain" />
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

                  {/* Quick Tech Image Presets */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block">Quick Tech Presets (Click to add to gallery):</span>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {[
                        { label: '🎧 Sony Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80' },
                        { label: '💻 MacBook Pro', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80' },
                        { label: '📸 Mirrorless Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80' },
                        { label: '⌚ Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80' },
                        { label: '🤖 Robot Vacuum', url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1000&q=80' },
                        { label: '🎮 Pro Controller', url: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=1000&q=80' }
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
                <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl space-y-4">
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

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isDeal)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isDeal: e.target.checked })}
                      className="rounded text-orange-500"
                    />
                    <span>Mark as Amazon Hot Deal</span>
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
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-contain rounded-lg bg-slate-100 dark:bg-slate-800 p-1" />
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 line-clamp-1">{p.title}</div>
                          <div className="text-[10px] text-slate-400">{p.brand} {p.isDeal && <span className="text-orange-500 font-black ml-1">[HOT DEAL]</span>}</div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{p.asin}</td>
                      <td className="p-4">{p.mainCategory}</td>
                      <td className="p-4 font-black">${p.currentPrice?.toFixed(2)}</td>
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

        {/* Tab 3: Editorial Reviews & Articles */}
        {activeTab === 'reviews' && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold">Editorial Reviews & Buyer's Guides</h2>
                <p className="text-xs text-slate-500">Manage independent lab reviews and category roundups.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase text-slate-400">Published Editorial Reviews ({reviews.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{r.productName}</span>
                      <span className="font-extrabold text-amber-500">★ {r.overallScore} / 10</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{r.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{r.verdict}</p>
                    <div className="text-[10px] text-slate-400 font-bold pt-1">By {r.authorName} • Updated {r.lastUpdated}</div>
                  </div>
                ))}
              </div>
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
                    targetUrl: '/categories/electronics',
                    desktopImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80',
                    mobileImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
                    isEnabled: true,
                    overlayStrength: 45,
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
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={editingBanner?.desktopImage || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, desktopImage: e.target.value, mobileImage: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none font-mono"
                  />

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

                  {/* Live Banner Preview */}
                  {editingBanner?.desktopImage && (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 mt-2 flex items-center p-6 text-white bg-slate-900 shadow-inner">
                      <img src={editingBanner.desktopImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
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
                    <img src={b.desktopImage} alt={b.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
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

        {/* Tab 5: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <TopViewedCategoriesChart categories={categories} />

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-extrabold">Real-Time Amazon Affiliate Outbound Click Analytics</h2>
                <p className="text-xs text-slate-500">Every outbound button click is logged for conversion rate optimization.</p>
              </div>

              {(affiliateClicks || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                  No outbound clicks logged in current session yet. Click any "Check Price on Amazon" button in the preview to test!
                </div>
              ) : (
                <div className="space-y-2">
                  {affiliateClicks.map((click) => (
                    <div key={click.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-blue-600 dark:text-blue-400">{click.productTitle}</strong>
                        <span className="text-slate-400 ml-2">ASIN: {click.asin} ({click.ctaText})</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{click.timestamp}</span>
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
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center gap-2 transition-all"
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
                    <p className="text-xs text-slate-500 mt-0.5">Search Volume: {seo.searchVolume.toLocaleString()} / mo • Difficulty: {seo.competition}</p>
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
                  <img src={adminPhoto} alt={adminName} className="w-full h-full object-cover" />
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
                        <img src={imgUrl} alt={`Preset ${i}`} className="w-full h-full object-cover" />
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
      </div>

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
