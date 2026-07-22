import crypto from 'crypto';
import { Pool } from 'pg';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, getSupabaseAdmin } from '../lib/supabase';
import {
  User, Post, Category, Tag, Comment, AffiliateLink,
  Page, SiteSettings, MediaItem, ContactMessage,
  NewsletterSubscriber, ActivityLog, TopicCluster,
  Brand, CategoryBanner, CategorySection, Deal,
  HomepageSection, HomepageHeroSlide, WishlistItem,
  RecentlyViewed, SavedComparison, AffiliateClick,
  SearchLog, PriceAlert, ExtendedProductReview
} from '../../src/types';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function mapRow<T>(row: Record<string, any> | undefined | null): T | null {
  if (!row) return null;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  return result as unknown as T;
}

function mapRows<T>(rows: any[]): T[] {
  return rows.map(row => mapRow<T>(row)!);
}

export class SupabaseDatabase {
  private initPromise: Promise<void>;
  private client!: SupabaseClient;

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    try {
      this.client = await getSupabaseAdmin();
    } catch {
      this.client = getSupabase();
    }
  }

  private async ready(): Promise<SupabaseClient> {
    await this.initPromise;
    return this.client;
  }

  async log(action: string, details: string, userId?: string, userName?: string) {
    try {
      const sb = await this.ready();
      await sb.from('activity_logs').insert({
        user_id: userId || null,
        user_name: userName || null,
        action,
        details,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to write activity log:', e);
    }
  }

  async getUsers(): Promise<User[]> {
    const sb = await this.ready();
    const { data } = await sb.from('users').select('*').order('created_at', { ascending: false });
    return mapRows<User>(data || []);
  }

  async getUserById(id: string): Promise<User | null> {
    const sb = await this.ready();
    const { data } = await sb.from('users').select('*').eq('id', id).maybeSingle();
    return data ? mapRow<User>(data) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const sb = await this.ready();
    const { data } = await sb.from('users').select('*').ilike('email', email).maybeSingle();
    return data ? mapRow<User>(data) : null;
  }

  async verifyPassword(userId: string, pw: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email: user.email, password: pw });
      if (!error) return true;
    } catch {}
    // Fallback: verify via pgcrypto (works for users seeded directly in auth.users)
    if (process.env.SUPABASE_DB_URL) {
      try {
        const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
        const result = await pool.query('SELECT (encrypted_password = crypt($1, encrypted_password)) AS match FROM auth.users WHERE email = $2', [pw, user.email]);
        await pool.end().catch(() => {});
        if (result.rows[0]?.match === true) return true;
      } catch {}
    }
    // Fallback 2: direct REST API call with anon key
    try {
      const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: process.env.SUPABASE_ANON_KEY || '' },
        body: JSON.stringify({ email: user.email, password: pw }),
      });
      if (res.ok) return true;
    } catch {}
    return false;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>, pw: string): Promise<User> {
    const sb = await this.ready();
    const { data: authData, error: authError } = await sb.auth.signUp({
      email: user.email,
      password: pw,
      options: { data: { name: user.name } }
    });
    if (authError || !authData.user) throw new Error(authError?.message || 'Failed to create auth user');
    const authId = authData.user.id;

    const { data, error } = await sb.from('users').insert({
      id: authId, name: user.name, email: user.email, role: user.role,
      avatar: user.avatar || null, bio: user.bio || null,
      status: user.status || 'active', created_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('User Registered', `Registered user: ${user.name} (${user.email})`);
    return mapRow<User>(data)!;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'email'>>, pw?: string): Promise<User | null> {
    const sb = await this.ready();
    const snake: Record<string, any> = {};
    if (updates.name !== undefined) snake.name = updates.name;
    if (updates.role !== undefined) snake.role = updates.role;
    if (updates.avatar !== undefined) snake.avatar = updates.avatar;
    if (updates.bio !== undefined) snake.bio = updates.bio;
    if (updates.status !== undefined) snake.status = updates.status;

    if (pw) {
      const { error: pwError } = await sb.auth.updateUser({ password: pw });
      if (pwError) throw new Error(pwError.message);
    }

    const { data, error } = await sb.from('users').update(snake).eq('id', id).select().single();
    if (error) return null;
    this.log('Profile Updated', `Updated user details for ID: ${id}`);
    return mapRow<User>(data);
  }

  async getPosts(): Promise<Post[]> {
    const sb = await this.ready();
    const { data } = await sb.from('posts').select('*').order('created_at', { ascending: false }).limit(500);
    return mapRows<Post>(data || []);
  }

  async getPostById(id: string): Promise<Post | null> {
    const sb = await this.ready();
    const { data } = await sb.from('posts').select('*').eq('id', id).maybeSingle();
    return data ? mapRow<Post>(data) : null;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const sb = await this.ready();
    const { data } = await sb.from('posts').select('*').eq('slug', slug).maybeSingle();
    return data ? mapRow<Post>(data) : null;
  }

  async createPost(post: Partial<Post> & { title: string; slug: string; content: string }, authorId: string): Promise<Post> {
    const sb = await this.ready();
    const wordCount = post.content ? post.content.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const payload: Record<string, any> = {
      title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content,
      featured_image: post.featuredImage || null, author_id: authorId, category_id: post.categoryId || null,
      tags: post.tags || [], status: post.status || 'draft', visibility: post.visibility || 'public',
      is_featured: !!post.isFeatured, is_trending: !!post.isTrending, is_editors_pick: !!post.isEditorsPick,
      allow_comments: post.allowComments !== false, seo_title: post.seoTitle || null,
      seo_description: post.seoDescription || null, seo_keywords: post.seoKeywords || null,
      published_at: post.status === 'published' ? new Date().toISOString() : null,
      reading_time: readingTime, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };

    let { data, error } = await sb.from('posts').insert(payload).select().single();
    if (error) {
      console.warn('[Supabase Insert Post Warn, retrying with core columns]:', error.message);
      const corePayload = {
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        content: payload.content,
        featured_image: payload.featured_image,
        author_id: payload.author_id,
        category_id: payload.category_id,
        tags: payload.tags,
        status: payload.status,
        published_at: payload.published_at,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
      };
      const res = await sb.from('posts').insert(corePayload).select().single();
      if (res.error) throw new Error(res.error.message);
      data = res.data;
    }
    this.log('Post Created', `Created article: "${data.title}"`);
    return mapRow<Post>(data)!;
  }

  async updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'authorId'>>): Promise<Post | null> {
    const sb = await this.ready();
    const existing = await this.getPostById(id);
    if (!existing) return null;

    let readingTime = existing.readingTime;
    const content = updates.content ?? existing.content;
    if (content) {
      const wordCount = content.split(/\s+/).length;
      readingTime = Math.max(1, Math.round(wordCount / 200));
    }

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.excerpt !== undefined) payload.excerpt = updates.excerpt;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.featuredImage !== undefined) payload.featured_image = updates.featuredImage;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;
    if (updates.isFeatured !== undefined) payload.is_featured = !!updates.isFeatured;
    if (updates.isTrending !== undefined) payload.is_trending = !!updates.isTrending;
    if (updates.isEditorsPick !== undefined) payload.is_editors_pick = !!updates.isEditorsPick;
    if (updates.allowComments !== undefined) payload.allow_comments = !!updates.allowComments;
    if (updates.seoTitle !== undefined) payload.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) payload.seo_description = updates.seoDescription;
    if (updates.seoKeywords !== undefined) payload.seo_keywords = updates.seoKeywords;
    if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;
    if (updates.status === 'published' && existing.status !== 'published') {
      payload.published_at = new Date().toISOString();
    }
    payload.reading_time = readingTime;
    payload.updated_at = new Date().toISOString();

    let { data, error } = await sb.from('posts').update(payload).eq('id', id).select().single();
    if (error) {
      console.warn('[Supabase Update Post Warn, retrying with core columns]:', error.message);
      delete payload['is_editors_pick'];
      delete payload['is_trending'];
      delete payload['is_featured'];
      delete payload['reading_time'];
      delete payload['visibility'];
      delete payload['allow_comments'];
      delete payload['seo_title'];
      delete payload['seo_description'];
      delete payload['seo_keywords'];
      const res = await sb.from('posts').update(payload).eq('id', id).select().single();
      if (res.error) return null;
      data = res.data;
    }
    this.log('Post Updated', `Updated article: "${data.title}"`);
    return mapRow<Post>(data);
  }

  async deletePost(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('posts').delete().eq('id', id);
    if (error) return false;
    this.log('Post Deleted', `Deleted article ID: ${id}`);
    return true;
  }

  async getCategories(): Promise<Category[]> {
    const sb = await this.ready();
    const { data } = await sb.from('categories').select('*').order('name');
    return mapRows<Category>(data || []);
  }

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const sb = await this.ready();
    const { data, error } = await sb.from('categories').insert({
      name: cat.name, slug: cat.slug, description: cat.description || null,
      image: cat.image || null, parent_id: cat.parentId || null, status: cat.status || 'active'
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Category Created', `Created category: "${data.name}"`);
    return mapRow<Category>(data)!;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.parentId !== undefined) payload.parent_id = updates.parentId;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await sb.from('categories').update(payload).eq('id', id).select().single();
    if (error) return null;
    this.log('Category Updated', `Updated category: "${data.name}"`);
    return mapRow<Category>(data);
  }

  async deleteCategory(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) return false;
    this.log('Category Deleted', `Deleted category ID: ${id}`);
    return true;
  }

  async getTags(): Promise<Tag[]> {
    const sb = await this.ready();
    const { data } = await sb.from('tags').select('*').order('name');
    return mapRows<Tag>(data || []);
  }

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const sb = await this.ready();
    const { data, error } = await sb.from('tags').insert({ name: tag.name, slug: tag.slug }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<Tag>(data)!;
  }

  async deleteTag(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('tags').delete().eq('id', id);
    return !error;
  }

  async getComments(): Promise<Comment[]> {
    const sb = await this.ready();
    const { data } = await sb.from('comments').select('*').order('created_at', { ascending: false });
    return mapRows<Comment>(data || []);
  }

  async createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount' | 'status'>): Promise<Comment> {
    const sb = await this.ready();
    const { data, error } = await sb.from('comments').insert({
      post_id: comment.postId, parent_id: comment.parentId || null,
      name: comment.name, email: comment.email, user_id: comment.userId || null,
      content: comment.content, status: 'approved', likes_count: 0, liked_by: [],
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Comment Submitted', `Author: "${data.name}" on post: "${data.post_id}"`);
    return mapRow<Comment>(data)!;
  }

  async updateCommentStatus(id: string, status: 'approved' | 'pending' | 'spam'): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('comments').update({ status }).eq('id', id);
    if (error) return false;
    this.log('Comment Moderated', `Set comment status to "${status}" for ID: ${id}`);
    return true;
  }

  async likeComment(id: string, userIdOrIp: string): Promise<boolean> {
    const sb = await this.ready();
    const { data: comment } = await sb.from('comments').select('liked_by, likes_count').eq('id', id).single();
    if (!comment) return false;

    const likedBy: string[] = comment.liked_by || [];
    let likesCount = comment.likes_count || 0;

    if (likedBy.includes(userIdOrIp)) {
      const idx = likedBy.indexOf(userIdOrIp);
      likedBy.splice(idx, 1);
      likesCount = Math.max(0, likesCount - 1);
    } else {
      likedBy.push(userIdOrIp);
      likesCount += 1;
    }

    const { error } = await sb.from('comments').update({ liked_by: likedBy, likes_count: likesCount }).eq('id', id);
    return !error;
  }

  async deleteComment(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('comments').delete().eq('id', id);
    if (error) return false;
    this.log('Comment Deleted', `Removed comment ID: ${id}`);
    return true;
  }

  async getAffiliateLinks(): Promise<AffiliateLink[]> {
    const sb = await this.ready();
    const { data } = await sb.from('affiliate_links').select('*').order('created_at', { ascending: false });
    return mapRows<AffiliateLink>(data || []);
  }

  async getAffiliateBySlug(slug: string): Promise<AffiliateLink | null> {
    const sb = await this.ready();
    const { data } = await sb.from('affiliate_links').select('*').eq('short_slug', slug).maybeSingle();
    return data ? mapRow<AffiliateLink>(data) : null;
  }

  async createAffiliateLink(link: Omit<AffiliateLink, 'id' | 'createdAt' | 'clickCount'>): Promise<AffiliateLink> {
    const sb = await this.ready();
    const payload = {
      title: link.title, destination_url: link.destinationUrl, affiliate_url: link.affiliateUrl,
      short_slug: link.shortSlug, category_id: link.categoryId || null, post_id: link.postId || null,
      button_text: link.buttonText || 'Buy Now', disclosure_text: link.disclosureText || null,
      no_follow: link.noFollow !== false, sponsored: link.sponsored !== false,
      open_in_new_tab: link.openInNewTab !== false, status: link.status || 'active',
      click_count: 0, created_at: new Date().toISOString()
    };

    const { data, error } = await sb.from('affiliate_links').insert(payload).select().single();
    if (error) throw new Error(error.message);
    this.log('Affiliate Link Created', `Created link: "${data.title}" with slug: /go/${data.short_slug}`);
    return mapRow<AffiliateLink>(data)!;
  }

  async updateAffiliateLink(id: string, updates: Partial<Omit<AffiliateLink, 'id' | 'createdAt' | 'clickCount'>>): Promise<AffiliateLink | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.destinationUrl !== undefined) payload.destination_url = updates.destinationUrl;
    if (updates.affiliateUrl !== undefined) payload.affiliate_url = updates.affiliateUrl;
    if (updates.shortSlug !== undefined) payload.short_slug = updates.shortSlug;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.postId !== undefined) payload.post_id = updates.postId;
    if (updates.buttonText !== undefined) payload.button_text = updates.buttonText;
    if (updates.disclosureText !== undefined) payload.disclosure_text = updates.disclosureText;
    if (updates.noFollow !== undefined) payload.no_follow = updates.noFollow;
    if (updates.sponsored !== undefined) payload.sponsored = updates.sponsored;
    if (updates.openInNewTab !== undefined) payload.open_in_new_tab = updates.openInNewTab;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await sb.from('affiliate_links').update(payload).eq('id', id).select().single();
    if (error) return null;
    this.log('Affiliate Link Updated', `Updated link: "${data.title}"`);
    return mapRow<AffiliateLink>(data);
  }

  async deleteAffiliateLink(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('affiliate_links').delete().eq('id', id);
    if (error) return false;
    this.log('Affiliate Link Deleted', `Deleted link ID: ${id}`);
    return true;
  }

  async trackAffiliateClick(slug: string): Promise<string | null> {
    const link = await this.getAffiliateBySlug(slug);
    if (!link) return null;
    const sb = await this.ready();
    await sb.from('affiliate_links').update({ click_count: link.clickCount + 1 }).eq('id', link.id);
    this.log('Affiliate Redirect', `Click registered on "/go/${slug}" redirecting to "${link.affiliateUrl}"`);
    return link.affiliateUrl;
  }

  async getPages(): Promise<Page[]> {
    const sb = await this.ready();
    const { data } = await sb.from('pages').select('*');
    return mapRows<Page>(data || []);
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    const sb = await this.ready();
    const { data } = await sb.from('pages').select('*').eq('slug', slug).maybeSingle();
    return data ? mapRow<Page>(data) : null;
  }

  async createPage(page: Omit<Page, 'id'>): Promise<Page> {
    const sb = await this.ready();
    const { data, error } = await sb.from('pages').insert({
      title: page.title, slug: page.slug, content: page.content,
      featured_image: page.featuredImage || null, status: page.status || 'draft',
      seo_title: page.seoTitle || null, seo_description: page.seoDescription || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Page Created', `Created static page: "${data.title}"`);
    return mapRow<Page>(data)!;
  }

  async updatePage(id: string, updates: Partial<Page>): Promise<Page | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.featuredImage !== undefined) payload.featured_image = updates.featuredImage;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.seoTitle !== undefined) payload.seo_title = updates.seoTitle;
    if (updates.seoDescription !== undefined) payload.seo_description = updates.seoDescription;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await sb.from('pages').update(payload).eq('id', id).select().single();
    if (error) return null;
    this.log('Page Updated', `Updated page: "${data.title}"`);
    return mapRow<Page>(data);
  }

  async deletePage(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('pages').delete().eq('id', id);
    if (error) return false;
    this.log('Page Deleted', `Deleted page ID: ${id}`);
    return true;
  }

  async getSettings(): Promise<SiteSettings | null> {
    const sb = await this.ready();
    const { data } = await sb.from('settings').select('*').limit(1).maybeSingle();
    if (!data) return null;
    const row = mapRow<any>(data)!;
    return {
      siteName: row.siteName || 'DawnWire', siteTagline: row.siteTagline || '',
      logoUrl: row.logoUrl || '', faviconUrl: row.faviconUrl || '',
      defaultLanguage: row.defaultLanguage || 'en', postsPerPage: row.postsPerPage || 6,
      enableComments: row.enableComments !== false, allowGuestComments: row.allowGuestComments !== false,
      requireCommentApproval: !!row.requireCommentApproval, affiliateDisclosureText: row.affiliateDisclosureText || '',
      primaryColor: row.primaryColor || '#0f172a', secondaryColor: row.secondaryColor || '#3b82f6',
      headerMenu: row.headerMenu || [], footerColumns: row.footerColumns || [], socialLinks: row.socialLinks || [],
      analyticsGaId: row.analyticsGaId || 'G-QKMK9H7MFT', analyticsGtmId: row.analyticsGtmId || '',
      metaPixelId: row.metaPixelId || '', searchConsoleVerification: row.searchConsoleVerification || '',
      customHeadScripts: row.customHeadScripts || '', customFooterScripts: row.customFooterScripts || '',
      robotsTxt: (row.robotsTxt || '').replace(/Disallow:\s*\/(review|products)\/?/gi, '').trim(),
    };
  }

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.siteName !== undefined) payload.site_name = updates.siteName;
    if (updates.siteTagline !== undefined) payload.site_tagline = updates.siteTagline;
    if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
    if (updates.faviconUrl !== undefined) payload.favicon_url = updates.faviconUrl;
    if (updates.defaultLanguage !== undefined) payload.default_language = updates.defaultLanguage;
    if (updates.postsPerPage !== undefined) payload.posts_per_page = updates.postsPerPage;
    if (updates.enableComments !== undefined) payload.enable_comments = updates.enableComments;
    if (updates.allowGuestComments !== undefined) payload.allow_guest_comments = updates.allowGuestComments;
    if (updates.requireCommentApproval !== undefined) payload.require_comment_approval = updates.requireCommentApproval;
    if (updates.affiliateDisclosureText !== undefined) payload.affiliate_disclosure_text = updates.affiliateDisclosureText;
    if (updates.primaryColor !== undefined) payload.primary_color = updates.primaryColor;
    if (updates.secondaryColor !== undefined) payload.secondary_color = updates.secondaryColor;
    if (updates.headerMenu !== undefined) payload.header_menu = updates.headerMenu;
    if (updates.footerColumns !== undefined) payload.footer_columns = updates.footerColumns;
    if (updates.socialLinks !== undefined) payload.social_links = updates.socialLinks;
    if (updates.analyticsGaId !== undefined) payload.analytics_ga_id = updates.analyticsGaId;
    if (updates.analyticsGtmId !== undefined) payload.analytics_gtm_id = updates.analyticsGtmId;
    if (updates.metaPixelId !== undefined) payload.meta_pixel_id = updates.metaPixelId;
    if (updates.searchConsoleVerification !== undefined) payload.search_console_verification = updates.searchConsoleVerification;
    if (updates.customHeadScripts !== undefined) payload.custom_head_scripts = updates.customHeadScripts;
    if (updates.customFooterScripts !== undefined) payload.custom_footer_scripts = updates.customFooterScripts;
    if (updates.robotsTxt !== undefined) payload.robots_txt = updates.robotsTxt;

    const { data: existing } = await sb.from('settings').select('id').limit(1).maybeSingle();
    if (existing) {
      const { error } = await sb.from('settings').update(payload).eq('id', existing.id);
      if (error) throw new Error(error.message);
      this.log('Settings Changed', 'Updated site configuration parameters.');
    } else {
      payload.id = crypto.randomUUID();
      payload.site_name = payload.site_name || 'DawnWire';
      const { error } = await sb.from('settings').insert(payload);
      if (error) throw new Error(error.message);
    }
    return this.getSettings();
  }

  async getMedia(): Promise<MediaItem[]> {
    const sb = await this.ready();
    const { data } = await sb.from('media').select('*').order('created_at', { ascending: false });
    return mapRows<MediaItem>(data || []);
  }

  async uploadMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem> {
    const sb = await this.ready();
    const { data, error } = await sb.from('media').insert({
      file_name: item.fileName, url: item.url, mime_type: item.mimeType,
      size: item.size, alt_text: item.altText || null, created_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Media Uploaded', `Uploaded asset file: "${data.file_name}"`);
    return mapRow<MediaItem>(data)!;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('media').delete().eq('id', id);
    return !error;
  }

  async getMessages(): Promise<ContactMessage[]> {
    const sb = await this.ready();
    const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false });
    return mapRows<ContactMessage>(data || []);
  }

  async submitMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<ContactMessage> {
    const sb = await this.ready();
    const { data, error } = await sb.from('messages').insert({
      name: msg.name, email: msg.email, subject: msg.subject, message: msg.message,
      status: 'unread', created_at: new Date().toISOString()
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Message Received', `Inquiry from: ${data.name} (${data.subject})`);
    return mapRow<ContactMessage>(data)!;
  }

  async markMessageRead(id: string, status: 'read' | 'unread'): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('messages').update({ status }).eq('id', id);
    return !error;
  }

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const sb = await this.ready();
    const { data } = await sb.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    return mapRows<NewsletterSubscriber>(data || []);
  }

  async addNewsletterSubscriber(email: string): Promise<NewsletterSubscriber | null> {
    const sb = await this.ready();
    const { data: existing } = await sb.from('newsletter_subscribers').select('id').ilike('email', email).maybeSingle();
    if (existing) return null;
    const { data, error } = await sb.from('newsletter_subscribers').insert({ email, created_at: new Date().toISOString(), drip_step: 0 }).select().single();
    if (error) return null;
    this.log('Newsletter Opt-In', `New subscriber: ${email}`);
    return mapRow<NewsletterSubscriber>(data);
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('newsletter_subscribers').delete().eq('id', id);
    return !error;
  }

  async updateSubscriberDripProgress(id: string, dripStep: number, dripLastSentAt: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('newsletter_subscribers').update({ drip_step: dripStep, drip_last_sent_at: dripLastSentAt }).eq('id', id);
    return !error;
  }

  async getSubscribersDueForDrip(): Promise<NewsletterSubscriber[]> {
    const sb = await this.ready();
    const { data } = await sb.from('newsletter_subscribers').select('*').lt('drip_step', 5).or('drip_step.is.null,drip_step.lt.5');
    const subs = mapRows<NewsletterSubscriber>(data || []);
    const now = Date.now();
    const delays: Record<number, number> = { 1: 0, 2: 2, 3: 5, 4: 10, 5: 21 };
    return subs.filter(s => {
      const step = s.dripStep || 0;
      const nextStep = step + 1;
      const delayDays = delays[nextStep] || 0;
      if (delayDays === 0) return step === 0;
      if (!s.dripLastSentAt) return false;
      return (now - new Date(s.dripLastSentAt).getTime()) >= (delayDays * 24 * 60 * 60 * 1000);
    });
  }

  async getLogs(): Promise<ActivityLog[]> {
    const sb = await this.ready();
    const { data } = await sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
    return mapRows<ActivityLog>(data || []);
  }

  async getContentUpgrades(): Promise<any[]> {
    const sb = await this.ready();
    const { data } = await sb.from('content_upgrades').select('*').order('created_at', { ascending: false });
    return mapRows<any>(data || []);
  }

  async createContentUpgrade(data: any): Promise<any> {
    const sb = await this.ready();
    const payload = {
      id: crypto.randomUUID(),
      title: data.title, description: data.description, file_url: data.fileUrl,
      file_type: data.fileType, post_id: data.postId, post_slug: data.postSlug,
      download_count: 0, status: data.status || 'active', created_at: new Date().toISOString(),
    };
    const { error } = await sb.from('content_upgrades').insert(payload);
    if (error) throw new Error(error.message);
    return payload;
  }

  async updateContentUpgrade(id: string, updates: any): Promise<any> {
    const sb = await this.ready();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.fileUrl !== undefined) payload.file_url = updates.fileUrl;
    if (updates.fileType !== undefined) payload.file_type = updates.fileType;
    if (updates.postId !== undefined) payload.post_id = updates.postId;
    if (updates.postSlug !== undefined) payload.post_slug = updates.postSlug;
    if (updates.status !== undefined) payload.status = updates.status;
    const { error } = await sb.from('content_upgrades').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    return { ...updates, id };
  }

  async deleteContentUpgrade(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('content_upgrades').delete().eq('id', id);
    return !error;
  }

  async trackUpgradeDownload(id: string): Promise<boolean> {
    const sb = await this.ready();
    await sb.rpc('increment_upgrade_downloads', { upgrade_id: id });
    return true;
  }

  // Topic Clusters
  async getTopicClusters(): Promise<TopicCluster[]> {
    const sb = await this.ready();
    const { data } = await sb.from('topic_clusters').select('*').order('name');
    return (data || []).map(r => mapRow<TopicCluster>(r)!).filter(Boolean);
  }

  async createTopicCluster(data: Omit<TopicCluster, 'id' | 'createdAt' | 'updatedAt'>): Promise<TopicCluster> {
    const sb = await this.ready();
    const { data: result, error } = await sb.from('topic_clusters').insert({
      name: data.name, slug: data.slug, description: data.description,
      pillar_page_id: data.pillarPageId, pillar_page_slug: data.pillarPageSlug,
      pillar_page_title: data.pillarPageTitle,
      cluster_post_ids: data.clusterPostIds || [],
      status: data.status || 'active'
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Topic Cluster Created', `Created cluster: "${result.name}"`);
    return mapRow<TopicCluster>(result)!;
  }

  async updateTopicCluster(id: string, updates: Partial<TopicCluster>): Promise<TopicCluster | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.pillarPageId !== undefined) payload.pillar_page_id = updates.pillarPageId;
    if (updates.pillarPageSlug !== undefined) payload.pillar_page_slug = updates.pillarPageSlug;
    if (updates.pillarPageTitle !== undefined) payload.pillar_page_title = updates.pillarPageTitle;
    if (updates.clusterPostIds !== undefined) payload.cluster_post_ids = updates.clusterPostIds;
    if (updates.status !== undefined) payload.status = updates.status;
    const { data, error } = await sb.from('topic_clusters').update(payload).eq('id', id).select().single();
    if (error) return null;
    this.log('Topic Cluster Updated', `Updated cluster: "${data.name}"`);
    return mapRow<TopicCluster>(data);
  }

  async deleteTopicCluster(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('topic_clusters').delete().eq('id', id);
    if (error) return false;
    this.log('Topic Cluster Deleted', `Deleted cluster ID: ${id}`);
    return true;
  }

  // ====== Brands ======
  async getBrands(): Promise<Brand[]> {
    const sb = await this.ready();
    const { data } = await sb.from('brands').select('*').order('name');
    return mapRows<Brand>(data || []);
  }
  async getBrand(id: string): Promise<Brand | null> {
    const sb = await this.ready();
    const { data } = await sb.from('brands').select('*').eq('id', id).maybeSingle();
    return data ? mapRow<Brand>(data) : null;
  }
  async createBrand(input: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brand> {
    const sb = await this.ready();
    const { data, error } = await sb.from('brands').insert({ name: input.name, slug: input.slug, logo: input.logo, description: input.description, website: input.website, featured: input.featured, status: input.status || 'active' }).select().single();
    if (error) throw new Error(error.message);
    this.log('Brand Created', `Created brand: "${data.name}"`);
    return mapRow<Brand>(data)!;
  }
  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand | null> {
    const sb = await this.ready();
    const u = updates as any;
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (u.name !== undefined) payload.name = u.name;
    if (u.slug !== undefined) payload.slug = u.slug;
    if (u.logo !== undefined) payload.logo = u.logo;
    if (u.description !== undefined) payload.description = u.description;
    if (u.website !== undefined) payload.website = u.website;
    if (u.featured !== undefined) payload.featured = u.featured;
    if (u.status !== undefined) payload.status = u.status;
    const { data, error } = await sb.from('brands').update(payload).eq('id', id).select().single();
    if (error) return null;
    this.log('Brand Updated', `Updated brand: "${data.name}"`);
    return mapRow<Brand>(data);
  }
  async deleteBrand(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('brands').delete().eq('id', id);
    return !error;
  }

  // ====== Category Banners ======
  async getCategoryBanners(categoryId?: string): Promise<CategoryBanner[]> {
    const sb = await this.ready();
    let q = sb.from('category_banners').select('*');
    if (categoryId) q = q.eq('category_id', categoryId);
    const { data } = await q.order('sort_order').order('created_at', { ascending: false });
    return mapRows<CategoryBanner>(data || []);
  }
  async createCategoryBanner(input: Omit<CategoryBanner, 'id'>): Promise<CategoryBanner> {
    const sb = await this.ready();
    const inp = input as any;
    const { data, error } = await sb.from('category_banners').insert({
      category_id: inp.categoryId, desktop_image: inp.desktopImage, mobile_image: inp.mobileImage,
      heading: inp.heading, description: inp.description, cta_text: inp.ctaText,
      cta_link: inp.ctaLink, alt_text: inp.altText, sort_order: inp.sortOrder || 0,
      start_date: inp.startDate, end_date: inp.endDate, is_active: inp.isActive ?? true,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<CategoryBanner>(data)!;
  }
  async updateCategoryBanner(id: string, updates: Partial<CategoryBanner>): Promise<CategoryBanner | null> {
    const sb = await this.ready();
    const u = updates as any;
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (u.desktopImage !== undefined) payload.desktop_image = u.desktopImage;
    if (u.mobileImage !== undefined) payload.mobile_image = u.mobileImage;
    if (u.heading !== undefined) payload.heading = u.heading;
    if (u.description !== undefined) payload.description = u.description;
    if (u.ctaText !== undefined) payload.cta_text = u.ctaText;
    if (u.ctaLink !== undefined) payload.cta_link = u.ctaLink;
    if (u.altText !== undefined) payload.alt_text = u.altText;
    if (u.sortOrder !== undefined) payload.sort_order = u.sortOrder;
    if (u.startDate !== undefined) payload.start_date = u.startDate;
    if (u.endDate !== undefined) payload.end_date = u.endDate;
    if (u.isActive !== undefined) payload.is_active = u.isActive;
    if (u.isArchived !== undefined) payload.is_archived = u.isArchived;
    const { data, error } = await sb.from('category_banners').update(payload).eq('id', id).select().single();
    if (error) return null;
    return mapRow<CategoryBanner>(data);
  }
  async deleteCategoryBanner(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('category_banners').delete().eq('id', id);
    return !error;
  }

  // ====== Category Sections ======
  async getCategorySections(categoryId?: string): Promise<CategorySection[]> {
    const sb = await this.ready();
    let q = sb.from('category_sections').select('*');
    if (categoryId) q = q.eq('category_id', categoryId);
    const { data } = await q.order('sort_order');
    return mapRows<CategorySection>(data || []);
  }
  async createCategorySection(input: Omit<CategorySection, 'id'>): Promise<CategorySection> {
    const sb = await this.ready();
    const inp = input as any;
    const { data, error } = await sb.from('category_sections').insert({
      category_id: inp.categoryId, section_type: inp.sectionType,
      title: inp.title, subtitle: inp.subtitle, sort_order: inp.sortOrder || 0,
      settings: inp.settings || {}, is_active: inp.isActive ?? true,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<CategorySection>(data)!;
  }
  async updateCategorySection(id: string, updates: Partial<CategorySection>): Promise<CategorySection | null> {
    const sb = await this.ready();
    const u = updates as any;
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (u.sectionType !== undefined) payload.section_type = u.sectionType;
    if (u.title !== undefined) payload.title = u.title;
    if (u.subtitle !== undefined) payload.subtitle = u.subtitle;
    if (u.sortOrder !== undefined) payload.sort_order = u.sortOrder;
    if (u.settings !== undefined) payload.settings = u.settings;
    if (u.isActive !== undefined) payload.is_active = u.isActive;
    const { data, error } = await sb.from('category_sections').update(payload).eq('id', id).select().single();
    if (error) return null;
    return mapRow<CategorySection>(data);
  }
  async deleteCategorySection(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('category_sections').delete().eq('id', id);
    return !error;
  }

  // ====== Deals ======
  async getDeals(categoryId?: string, status?: string): Promise<Deal[]> {
    const sb = await this.ready();
    let q = sb.from('deals').select('*, product_reviews!inner(*)');
    if (categoryId) q = q.eq('category_id', categoryId);
    if (status) q = q.eq('status', status);
    else q = q.in('status', ['active', 'scheduled']);
    const { data } = await q.order('created_at', { ascending: false });
    return (data || []).map(r => ({ ...mapRow<Deal>(r), product: mapRow<any>(r.product_reviews) })) as any;
  }
  async createDeal(input: Omit<Deal, 'id'>): Promise<Deal> {
    const sb = await this.ready();
    const inp = input as any;
    const { data, error } = await sb.from('deals').insert({
      product_id: inp.productId, sale_price: inp.salePrice, regular_price: inp.regularPrice,
      discount_percentage: inp.discountPercentage, start_date: inp.startDate, end_date: inp.endDate,
      is_featured: inp.isFeatured ?? false, deal_type: inp.dealType || 'daily',
      category_id: inp.categoryId, status: inp.status || 'active',
    }).select().single();
    if (error) throw new Error(error.message);
    this.log('Deal Created', `Deal for product ${data.product_id}`);
    return mapRow<Deal>(data)!;
  }
  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    const sb = await this.ready();
    const u = updates as any;
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (u.salePrice !== undefined) payload.sale_price = u.salePrice;
    if (u.regularPrice !== undefined) payload.regular_price = u.regularPrice;
    if (u.discountPercentage !== undefined) payload.discount_percentage = u.discountPercentage;
    if (u.startDate !== undefined) payload.start_date = u.startDate;
    if (u.endDate !== undefined) payload.end_date = u.endDate;
    if (u.isFeatured !== undefined) payload.is_featured = u.isFeatured;
    if (u.dealType !== undefined) payload.deal_type = u.dealType;
    if (u.status !== undefined) payload.status = u.status;
    const { data, error } = await sb.from('deals').update(payload).eq('id', id).select().single();
    if (error) return null;
    return mapRow<Deal>(data);
  }
  async deleteDeal(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('deals').delete().eq('id', id);
    return !error;
  }

  // ====== Homepage Sections ======
  async getHomepageSections(): Promise<HomepageSection[]> {
    const sb = await this.ready();
    const { data } = await sb.from('homepage_sections').select('*').order('sort_order');
    return mapRows<HomepageSection>(data || []);
  }
  async createHomepageSection(input: Omit<HomepageSection, 'id'>): Promise<HomepageSection> {
    const sb = await this.ready();
    const { data, error } = await sb.from('homepage_sections').insert({
      section_type: input.sectionType, title: input.title, subtitle: input.subtitle,
      sort_order: input.sortOrder || 0, settings: input.settings || {}, is_active: input.isActive ?? true,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<HomepageSection>(data)!;
  }
  async updateHomepageSection(id: string, updates: Partial<HomepageSection>): Promise<HomepageSection | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.sectionType !== undefined) payload.section_type = updates.sectionType;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.subtitle !== undefined) payload.subtitle = updates.subtitle;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.settings !== undefined) payload.settings = updates.settings;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { data, error } = await sb.from('homepage_sections').update(payload).eq('id', id).select().single();
    if (error) return null;
    return mapRow<HomepageSection>(data);
  }
  async deleteHomepageSection(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('homepage_sections').delete().eq('id', id);
    return !error;
  }

  // ====== Homepage Hero Slides ======
  async getHomepageHeroSlides(): Promise<HomepageHeroSlide[]> {
    const sb = await this.ready();
    const { data } = await sb.from('homepage_hero_slides').select('*').order('sort_order');
    return mapRows<HomepageHeroSlide>(data || []);
  }
  async createHomepageHeroSlide(input: Omit<HomepageHeroSlide, 'id'>): Promise<HomepageHeroSlide> {
    const sb = await this.ready();
    const { data, error } = await sb.from('homepage_hero_slides').insert({
      desktop_image: input.desktopImage, mobile_image: input.mobileImage,
      heading: input.heading, description: input.description, cta_text: input.ctaText,
      cta_link: input.ctaLink, alt_text: input.altText, sort_order: input.sortOrder || 0, is_active: input.isActive ?? true,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<HomepageHeroSlide>(data)!;
  }
  async updateHomepageHeroSlide(id: string, updates: Partial<HomepageHeroSlide>): Promise<HomepageHeroSlide | null> {
    const sb = await this.ready();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.desktopImage !== undefined) payload.desktop_image = updates.desktopImage;
    if (updates.mobileImage !== undefined) payload.mobile_image = updates.mobileImage;
    if (updates.heading !== undefined) payload.heading = updates.heading;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.ctaText !== undefined) payload.cta_text = updates.ctaText;
    if (updates.ctaLink !== undefined) payload.cta_link = updates.ctaLink;
    if (updates.altText !== undefined) payload.alt_text = updates.altText;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    const { data, error } = await sb.from('homepage_hero_slides').update(payload).eq('id', id).select().single();
    if (error) return null;
    return mapRow<HomepageHeroSlide>(data);
  }
  async deleteHomepageHeroSlide(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('homepage_hero_slides').delete().eq('id', id);
    return !error;
  }

  // ====== Wishlist ======
  async getWishlist(userId?: string, sessionId?: string): Promise<WishlistItem[]> {
    const sb = await this.ready();
    let q = sb.from('wishlist_items').select('*, product_reviews(*)');
    if (userId) q = q.eq('user_id', userId);
    else if (sessionId) q = q.eq('session_id', sessionId);
    else return [];
    const { data } = await q.order('created_at', { ascending: false });
    return (data || []).map(r => ({
      ...mapRow<WishlistItem>(r),
      product: r.product_reviews ? mapRow<any>(r.product_reviews) : null
    })) as any;
  }
  async addWishlistItem(input: Omit<WishlistItem, 'id' | 'createdAt'>): Promise<WishlistItem> {
    const sb = await this.ready();
    const { data, error } = await sb.from('wishlist_items').insert({
      user_id: input.userId, session_id: input.sessionId, product_id: input.productId,
    }).select().single();
    if (error && error.code === '23505') throw new Error('Already in wishlist');
    if (error) throw new Error(error.message);
    return mapRow<WishlistItem>(data)!;
  }
  async removeWishlistItem(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('wishlist_items').delete().eq('id', id);
    return !error;
  }

  // ====== Recently Viewed ======
  async getRecentlyViewed(userId?: string, sessionId?: string, limit = 20): Promise<RecentlyViewed[]> {
    const sb = await this.ready();
    let q = sb.from('recently_viewed').select('*, product_reviews!inner(*)');
    if (userId) q = q.eq('user_id', userId);
    else if (sessionId) q = q.eq('session_id', sessionId);
    else return [];
    const { data } = await q.order('viewed_at', { ascending: false }).limit(limit);
    return (data || []).map(r => ({ ...mapRow<RecentlyViewed>(r), product: mapRow<any>(r.product_reviews) })) as any;
  }
  async addRecentlyViewed(input: Omit<RecentlyViewed, 'id'>): Promise<void> {
    const sb = await this.ready();
    // Deduplicate: delete existing entry for same user/session + product
    if (input.userId) await sb.from('recently_viewed').delete().eq('user_id', input.userId).eq('product_id', input.productId);
    else if (input.sessionId) await sb.from('recently_viewed').delete().eq('session_id', input.sessionId).eq('product_id', input.productId);
    await sb.from('recently_viewed').insert({
      user_id: input.userId, session_id: input.sessionId, product_id: input.productId,
    });
  }

  // ====== Saved Comparisons ======
  async getSavedComparisons(userId?: string, sessionId?: string): Promise<SavedComparison[]> {
    const sb = await this.ready();
    let q = sb.from('saved_comparisons').select('*');
    if (userId) q = q.eq('user_id', userId);
    else if (sessionId) q = q.eq('session_id', sessionId);
    else return [];
    const { data } = await q.order('updated_at', { ascending: false });
    return mapRows<SavedComparison>(data || []);
  }
  async saveComparison(input: Omit<SavedComparison, 'id'>): Promise<SavedComparison> {
    const sb = await this.ready();
    const { data, error } = await sb.from('saved_comparisons').insert({
      user_id: input.userId, session_id: input.sessionId, name: input.name || 'My Comparison',
      product_ids: input.productIds,
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<SavedComparison>(data)!;
  }
  async deleteSavedComparison(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('saved_comparisons').delete().eq('id', id);
    return !error;
  }

  // ====== Affiliate Click Tracking ======
  async logAffiliateClick(input: Omit<AffiliateClick, 'id' | 'createdAt'>): Promise<void> {
    const sb = await this.ready();
    await sb.from('affiliate_clicks').insert({
      product_id: input.productId, category_id: input.categoryId, page_url: input.pageUrl,
      page_type: input.pageType, banner_id: input.bannerId, section_type: input.sectionType,
      cta_position: input.ctaPosition, device_type: input.deviceType,
      session_id: input.sessionId, user_id: input.userId, campaign: input.campaign,
      article_id: input.articleId,
    });
    if (input.productId) {
      const { data: cur } = await sb.from('product_reviews').select('click_count').eq('id', input.productId).maybeSingle();
      if (cur) await sb.from('product_reviews').update({ click_count: (cur.click_count || 0) + 1 }).eq('id', input.productId);
    }
  }

  // ====== Search Logs ======
  async logSearch(input: Omit<SearchLog, 'id' | 'createdAt'>): Promise<void> {
    const sb = await this.ready();
    await sb.from('search_logs').insert({
      query: input.query, category_id: input.categoryId, results_count: input.resultsCount,
      has_results: input.hasResults, session_id: input.sessionId, user_id: input.userId,
      clicked_product_id: input.clickedProductId,
    });
  }
  async getSearchAnalytics(days = 30): Promise<any> {
    const sb = await this.ready();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data: popular } = await sb.from('search_logs').select('query, count(*)').gte('created_at', since).not('query', 'eq', '').order('count', { ascending: false }).limit(50);
    const { data: noresults } = await sb.from('search_logs').select('query, count(*)').eq('has_results', false).gte('created_at', since).not('query', 'eq', '').order('count', { ascending: false }).limit(50);
    return { popularSearches: popular || [], noResultSearches: noresults || [] };
  }

  // ====== Price Alerts ======
  async getPriceAlerts(userId?: string, sessionId?: string): Promise<PriceAlert[]> {
    const sb = await this.ready();
    let q = sb.from('price_alerts').select('*, product_reviews!inner(*)');
    if (userId) q = q.eq('user_id', userId);
    else if (sessionId) q = q.eq('session_id', sessionId);
    else return [];
    const { data } = await q.order('created_at', { ascending: false });
    return (data || []).map(r => ({ ...mapRow<PriceAlert>(r), product: mapRow<any>(r.product_reviews) })) as any;
  }
  async createPriceAlert(input: Omit<PriceAlert, 'id'>): Promise<PriceAlert> {
    const sb = await this.ready();
    const { data, error } = await sb.from('price_alerts').insert({
      user_id: input.userId, session_id: input.sessionId, product_id: input.productId,
      target_price: input.targetPrice, alert_type: input.alertType || 'price_drop',
    }).select().single();
    if (error) throw new Error(error.message);
    return mapRow<PriceAlert>(data)!;
  }
  async deletePriceAlert(id: string): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('price_alerts').delete().eq('id', id);
    return !error;
  }

  // ====== Amazon Sync ======
  async getAmazonSyncStatus(productId: string): Promise<any> {
    const sb = await this.ready();
    const { data } = await sb.from('amazon_sync_status').select('*').eq('product_id', productId).maybeSingle();
    return data ? mapRow<any>(data) : null;
  }
  async listAmazonSyncStatus(limit = 500, offset = 0, filter?: Record<string, any>): Promise<{ data: any[]; total: number }> {
    const sb = await this.ready();
    let q = sb.from('amazon_sync_status').select('*', { count: 'exact', head: false });
    if (filter?.sync_status) q = q.eq('sync_status', filter.sync_status);
    if (filter?.marketplace_code) q = q.eq('marketplace_code', filter.marketplace_code);
    if (filter?.asin) q = q.eq('asin', filter.asin);
    if (filter?.is_available !== undefined) q = q.eq('is_available', filter.is_available);
    if (filter?.is_deal !== undefined) q = q.eq('is_deal', filter.is_deal);
    if (filter?.asin_flagged !== undefined) q = q.eq('asin_flagged', filter.asin_flagged);
    if (filter?.search) q = q.or(`product_reviews.product_name.ilike.%${filter.search}%,asin.ilike.%${filter.search}%`);
    const { data, count, error } = await q.order('priority', { ascending: false }).order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) return { data: [], total: 0 };
    return { data: (data || []).map(r => mapRow<any>(r)), total: count || 0 };
  }
  async updateAmazonSyncStatus(productId: string, updates: Record<string, any>): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('amazon_sync_status').update(updates).eq('product_id', productId);
    return !error;
  }
  async bulkCreateAmazonSyncStatus(entries: { productId: string; asin: string; marketplaceCode: string; partnerTag: string; priority?: number }[]): Promise<number> {
    const sb = await this.ready();
    let created = 0;
    for (const e of entries) {
      const { error } = await sb.from('amazon_sync_status').upsert({
        product_id: e.productId,
        asin: e.asin,
        marketplace_code: e.marketplaceCode,
        partner_tag: e.partnerTag,
        priority: e.priority || 0,
        sync_status: 'pending',
      }, { onConflict: 'product_id,asin', ignoreDuplicates: false });
      if (!error) created++;
    }
    return created;
  }
  async getAmazonPriceHistory(productId: string, limit = 20): Promise<any[]> {
    const sb = await this.ready();
    const { data } = await sb.from('amazon_price_history').select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(limit);
    return (data || []).map(r => mapRow<any>(r));
  }
  async getAmazonSyncLogs(productId?: string, batchId?: string, limit = 50): Promise<any[]> {
    const sb = await this.ready();
    let q = sb.from('amazon_sync_logs').select('*');
    if (productId) q = q.eq('product_id', productId);
    if (batchId) q = q.eq('batch_id', batchId);
    const { data } = await q.order('created_at', { ascending: false }).limit(limit);
    return (data || []).map(r => mapRow<any>(r));
  }
  async getAmazonMarketplaces(): Promise<any[]> {
    const sb = await this.ready();
    const { data } = await sb.from('amazon_marketplaces').select('*').order('name');
    return (data || []).map(r => mapRow<any>(r));
  }
  async getAmazonApiCredentials(marketplaceCode?: string): Promise<any[]> {
    const sb = await this.ready();
    let q = sb.from('amazon_api_credentials').select('*');
    if (marketplaceCode) q = q.eq('marketplace_code', marketplaceCode);
    const { data } = await q.order('marketplace_code');
    return (data || []).map(r => mapRow<any>(r));
  }
  async upsertAmazonApiCredential(input: { marketplaceCode: string; accessKey: string; secretKey: string; partnerTag: string; isActive?: boolean }): Promise<boolean> {
    const sb = await this.ready();
    const { error } = await sb.from('amazon_api_credentials').upsert({
      marketplace_code: input.marketplaceCode,
      access_key: input.accessKey,
      secret_key: input.secretKey,
      partner_tag: input.partnerTag,
      is_active: input.isActive !== false,
    }, { onConflict: 'marketplace_code' });
    return !error;
  }
  async getAmazonSyncSettings(): Promise<any> {
    const sb = await this.ready();
    const { data } = await sb.from('amazon_sync_settings').select('*').limit(1).maybeSingle();
    return data ? mapRow<any>(data) : null;
  }
  async updateAmazonSyncSettings(updates: Record<string, any>): Promise<boolean> {
    const sb = await this.ready();
    const { data: existing } = await sb.from('amazon_sync_settings').select('id').limit(1).maybeSingle();
    if (existing) {
      updates.updated_at = new Date().toISOString();
      const { error } = await sb.from('amazon_sync_settings').update(updates).eq('id', existing.id);
      return !error;
    }
    const { error } = await sb.from('amazon_sync_settings').insert({ ...updates, id: crypto.randomUUID() });
    return !error;
  }
  async getAmazonApiUsage(days = 7): Promise<any[]> {
    const sb = await this.ready();
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const { data } = await sb.from('amazon_api_usage').select('*').gte('date', since).order('date', { ascending: false });
    return (data || []).map(r => mapRow<any>(r));
  }

  // ====== Click Analytics ======
  async getClickAnalytics(days = 30, groupBy: 'product' | 'category' | 'page' = 'product'): Promise<any[]> {
    const sb = await this.ready();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    let q = sb.from('affiliate_clicks').select('*').gte('created_at', since);
    const { data } = await q;
    const rows = data || [];
    const grouped: Record<string, any> = {};
    for (const r of rows) {
      const key = groupBy === 'product' ? r.product_id : groupBy === 'category' ? r.category_id : r.page_url;
      if (!key) continue;
      if (!grouped[key]) grouped[key] = { key, count: 0, uniqueSessions: new Set() };
      grouped[key].count++;
      if (r.session_id) grouped[key].uniqueSessions.add(r.session_id);
    }
    return Object.values(grouped).map((g: any) => ({ key: g.key, count: g.count, uniqueSessions: g.uniqueSessions.size })).sort((a: any, b: any) => b.count - a.count);
  }
}
