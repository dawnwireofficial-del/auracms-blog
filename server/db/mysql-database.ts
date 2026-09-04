/**
 * MySQLDatabase — mirrors the SupabaseDatabase method surface (server/db.ts).
 * Built on the SBQuery adapter in ./mysql-adapter.
 */
import crypto from 'crypto';
import { createSupabaseClient } from './mysql-adapter';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function mapRow<T>(row: Record<string, any> | undefined | null): T | null {
  if (!row) return null;
  const out: Record<string, any> = { ...row };
  for (const k of Object.keys(row)) out[snakeToCamel(k)] = (out as any)[k];
  return out as unknown as T;
}

function mapRows<T>(rows: any[]): T[] {
  return (rows || []).map(r => mapRow<T>(r)!).filter(Boolean);
}

function nowIso() { return new Date().toISOString(); }
function newId() { return crypto.randomUUID(); }

export class MySQLDatabase {
  private sb() { return createSupabaseClient(); }

  private async list(table: string, build: (q: any) => any): Promise<any[]> {
    const { data, error } = await build(this.sb().from(table));
    if (error) throw new Error(error.message);
    return mapRows(data || []);
  }
  private async one(table: string, build: (q: any) => any): Promise<any | null> {
    const { data, error } = await build(this.sb().from(table));
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return mapRow(data);
  }

  async log(action: string, details: string, userId?: string, userName?: string) {
    try {
      await this.sb().from('activity_logs').insert({
        id: newId(), user_id: userId || null, user_name: userName || null,
        action, details, created_at: nowIso(),
      });
    } catch (e) { console.error('Failed to write activity log:', e); }
  }

  // ================= users =================
  async getUsers() { return this.list('users', q => q.select('*').order('created_at', { ascending: false })); }
  async getUserById(id: string) { return this.one('users', q => q.select('*').eq('id', id).maybeSingle()); }
  async getUserByEmail(email: string) { return this.one('users', q => q.select('*').ilike('email', email).maybeSingle()); }
  async createUser(u: any, pw?: string) {
    const created: any = await this.one('users', q => q.insert({ id: newId(), ...u, created_at: nowIso() }).select().single());
    if (pw && created?.id) await this.setPassword(created.id, pw);
    return created;
  }
  async setPassword(userId: string, pw: string) {
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.hashSync(pw, 10);
    await this.sb().from('user_passwords').upsert({ user_id: userId, password_hash: hash, updated_at: nowIso() }, { onConflict: 'user_id' });
  }
  async updateUser(id: string, updates: any) {
    return this.one('users', q => q.update({ ...updates, updated_at: nowIso() }).eq('id', id).select().single());
  }
  async deleteUser(id: string) {
    await this.sb().from('user_passwords').delete().eq('user_id', id);
    await this.sb().from('users').delete().eq('id', id);
    return true;
  }
  async verifyPassword(userId: string, pw: string) {
    const { data: row } = await this.sb().from('user_passwords').select('*').eq('user_id', userId).maybeSingle();
    if (!row?.password_hash) return false;
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(pw, row.password_hash);
  }

  // ================= posts =================
  async getPosts(options?: { limit?: number; offset?: number; status?: string }) {
    return this.list('posts', q => {
      let b = q.select('*');
      b = options?.status ? b.eq('status', options.status) : b.eq('status', 'published');
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async getAllPosts() { return this.list('posts', q => q.select('*').order('created_at', { ascending: false })); }
  async getPostById(id: string) { return this.one('posts', q => q.select('*').eq('id', id).maybeSingle()); }
  async getPostBySlug(slug: string) { return this.one('posts', q => q.select('*').eq('slug', slug).maybeSingle()); }
  async createPost(p: any, _authorId?: string) {
    const payload = { id: newId(), ...p, created_at: nowIso(), updated_at: nowIso() };
    if (payload.status === 'published' && !payload.publishedAt) payload.publishedAt = nowIso();
    return this.one('posts', q => q.insert(payload).select().single());
  }
  async updatePost(id: string, updates: any) {
    return this.one('posts', q => q.update({ ...updates, updated_at: nowIso() }).eq('id', id).select().single());
  }
  async deletePost(id: string) { await this.sb().from('posts').delete().eq('id', id); return true; }

  // ================= categories =================
  async getCategories() { return this.list('categories', q => q.select('*').order('name', { ascending: true })); }
  async getCategoryById(id: string) { return this.one('categories', q => q.select('*').eq('id', id).maybeSingle()); }
  async getCategoryBySlug(slug: string) { return this.one('categories', q => q.select('*').eq('slug', slug).maybeSingle()); }
  async createCategory(c: any) { return this.one('categories', q => q.insert({ id: newId(), ...c, created_at: nowIso() }).select().single()); }
  async updateCategory(id: string, updates: any) {
    return this.one('categories', q => q.update({ ...updates, updated_at: nowIso() }).eq('id', id).select().single());
  }
  async deleteCategory(id: string) { await this.sb().from('categories').delete().eq('id', id); return true; }

  // ================= tags =================
  async getTags() { return this.list('tags', q => q.select('*')); }
  async createTag(t: any) { return this.one('tags', q => q.insert({ id: newId(), ...t }).select().single()); }

  // ================= comments =================
  async getComments(options?: { postId?: string; status?: string; limit?: number }) {
    return this.list('comments', q => {
      let b = q.select('*');
      if (options?.postId) b = b.eq('post_id', options.postId);
      if (options?.status) b = b.eq('status', options.status);
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async createComment(c: any) { return this.one('comments', q => q.insert({ id: newId(), ...c, created_at: nowIso() }).select().single()); }
  async updateCommentStatus(id: string, status: string) {
    return this.one('comments', q => q.update({ status }).eq('id', id).select().single());
  }
  async deleteComment(id: string) { await this.sb().from('comments').delete().eq('id', id); return true; }

  // ================= affiliate =================
  async getAffiliateLinks() { return this.list('affiliate_links', q => q.select('*').order('created_at', { ascending: false })); }
  async getAffiliateBySlug(slug: string) { return this.one('affiliate_links', q => q.select('*').eq('short_slug', slug).maybeSingle()); }
  async createAffiliateLink(a: any) { return this.one('affiliate_links', q => q.insert({ id: newId(), ...a, created_at: nowIso() }).select().single()); }
  async updateAffiliateLink(id: string, updates: any) {
    return this.one('affiliate_links', q => q.update(updates).eq('id', id).select().single());
  }
  async deleteAffiliateLink(id: string) { await this.sb().from('affiliate_links').delete().eq('id', id); return true; }

  // NOTE: affiliate_clicks / product_reviews store SNAKE_CASE columns. The
  // SBQuery adapter inserts raw keys, so camelCase payloads must be mapped
  // explicitly (same as SupabaseDatabase.logAffiliateClick) or the insert
  // silently dies with "Unknown column 'productId'".
  async logAffiliateClick(click: any) {
    const row = await this.one('affiliate_clicks', q => q.insert({
      id: newId(),
      product_id: click.productId || null,
      category_id: click.categoryId || null,
      page_url: click.pageUrl || null,
      page_type: click.pageType || null,
      banner_id: click.bannerId || null,
      section_type: click.sectionType || null,
      cta_position: click.ctaPosition || null,
      device_type: click.deviceType || null,
      session_id: click.sessionId || null,
      user_id: click.userId || null,
      campaign: click.campaign || null,
      article_id: click.articleId || null,
      created_at: nowIso(),
    }).select().single());
    // Keep the per-product click counter in sync so product pages/dashboards
    // can show "N people clicked this deal" without a join.
    if (click.productId) {
      try {
        const cur = await this.one('product_reviews', q => q.select('click_count').eq('id', click.productId).maybeSingle());
        const next = Number((cur as any)?.click_count ?? (cur as any)?.clickCount ?? 0) + 1;
        await this.sb().from('product_reviews').update({ click_count: next }).eq('id', click.productId);
      } catch (e) { console.error('Failed to increment click_count:', (e as Error).message); }
    }
    return row;
  }
  async getAffiliateClicks(options?: { limit?: number; offset?: number }) {
    return this.list('affiliate_clicks', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }

  // ================= pages =================
  async getPages(options?: { limit?: number; offset?: number; status?: string }) {
    return this.list('pages', q => {
      let b = q.select('*');
      b = options?.status ? b.eq('status', options.status) : b.eq('status', 'published');
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async getAllPages() { return this.list('pages', q => q.select('*').order('created_at', { ascending: false })); }
  async getPageById(id: string) { return this.one('pages', q => q.select('*').eq('id', id).maybeSingle()); }
  async getPageBySlug(slug: string) { return this.one('pages', q => q.select('*').eq('slug', slug).maybeSingle()); }
  async createPage(p: any) { return this.one('pages', q => q.insert({ id: newId(), ...p, created_at: nowIso() }).select().single()); }
  async updatePage(id: string, updates: any) { return this.one('pages', q => q.update(updates).eq('id', id).select().single()); }
  async deletePage(id: string) { await this.sb().from('pages').delete().eq('id', id); return true; }

  // ================= settings =================
  async getSettings() {
    const { data } = await this.sb().from('settings').select('*').limit(1).maybeSingle();
    return data || {};
  }
  async updateSettings(updates: any) {
    const existing: any = await this.getSettings();
    const payload = existing?.id ? { ...existing, ...updates, id: existing.id } : { id: newId(), ...updates };
    return this.one('settings', q => q.upsert(payload, { onConflict: 'id' }).select().single());
  }

  // ================= media =================
  async getMedia(options?: { limit?: number }) {
    return this.list('media', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async uploadMedia(m: any) { return this.one('media', q => q.insert({ id: newId(), ...m, created_at: nowIso() }).select().single()); }
  async deleteMedia(id: string) { await this.sb().from('media').delete().eq('id', id); return true; }

  // ================= newsletter =================
  async getNewsletterSubscribers() { return this.list('newsletter_subscribers', q => q.select('*').order('created_at', { ascending: false })); }
  async addNewsletterSubscriber(s: any) { return this.one('newsletter_subscribers', q => q.insert({ id: newId(), ...s, created_at: nowIso() }).select().single()); }
  async deleteSubscriber(id: string) { await this.sb().from('newsletter_subscribers').delete().eq('id', id); return true; }
  async getSubscribersDueForDrip() { return this.list('newsletter_subscribers', q => q.select('*').eq('status', 'active')); }
  async updateSubscriberDripProgress(id: string, progress: any) {
    return this.one('newsletter_subscribers', q => q.update({ drip_progress: progress }).eq('id', id).select().single());
  }

  // ================= messages =================
  async getMessages(options?: { status?: string; limit?: number }) {
    return this.list('messages', q => {
      let b = q.select('*');
      if (options?.status) b = b.eq('status', options.status);
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async submitMessage(m: any) { return this.one('messages', q => q.insert({ id: newId(), ...m, created_at: nowIso() }).select().single()); }
  async markMessageRead(id: string) { return this.one('messages', q => q.update({ status: 'read' }).eq('id', id).select().single()); }

  // ================= logs =================
  async getLogs(options?: { limit?: number; offset?: number }) {
    return this.list('activity_logs', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }

  // ================= topic clusters / content upgrades =================
  async getTopicClusters() { return this.list('topic_clusters', q => q.select('*').order('created_at', { ascending: false })); }
  async createTopicCluster(t: any) { return this.one('topic_clusters', q => q.insert({ id: newId(), ...t, created_at: nowIso() }).select().single()); }
  async updateTopicCluster(id: string, updates: any) { return this.one('topic_clusters', q => q.update(updates).eq('id', id).select().single()); }
  async deleteTopicCluster(id: string) { await this.sb().from('topic_clusters').delete().eq('id', id); return true; }
  async getContentUpgrades() { return this.list('content_briefs', q => q.select('*')); }
  async createContentUpgrade(d: any) { return this.one('content_briefs', q => q.insert({ id: newId(), ...d }).select().single()); }
  async updateContentUpgrade(id: string, updates: any) { return this.one('content_briefs', q => q.update(updates).eq('id', id).select().single()); }
  async deleteContentUpgrade(id: string) { await this.sb().from('content_briefs').delete().eq('id', id); return true; }
  async trackUpgradeDownload(id: string) {
    const item: any = await this.one('content_briefs', q => q.select('*').eq('id', id).maybeSingle());
    if (!item) return null;
    return this.one('content_briefs', q => q.update({ downloads: (item.downloads || 0) + 1 }).eq('id', id).select().single());
  }

  // ================= brands =================
  async getBrands() { return this.list('brands', q => q.select('*').eq('status', 'active').order('name', { ascending: true })); }
  async createBrand(b: any) { return this.one('brands', q => q.insert({ id: newId(), ...b, created_at: nowIso() }).select().single()); }
  async updateBrand(id: string, updates: any) { return this.one('brands', q => q.update(updates).eq('id', id).select().single()); }
  async deleteBrand(id: string) { await this.sb().from('brands').delete().eq('id', id); return true; }

  // ================= homepage hero slides =================
  async getHomepageHeroSlides() { return this.list('homepage_hero_slides', q => q.select('*').order('sort_order', { ascending: true })); }
  async createHomepageHeroSlide(s: any) { return this.one('homepage_hero_slides', q => q.insert({ id: newId(), ...s, created_at: nowIso() }).select().single()); }
  async updateHomepageHeroSlide(id: string, updates: any) {
    return this.one('homepage_hero_slides', q => q.update({ ...updates, updated_at: nowIso() }).eq('id', id).select().single());
  }
  async deleteHomepageHeroSlide(id: string) { await this.sb().from('homepage_hero_slides').delete().eq('id', id); return true; }

  // ================= homepage sections =================
  async getHomepageSections() { return this.list('homepage_sections', q => q.select('*').order('sort_order', { ascending: true })); }
  async createHomepageSection(s: any) { return this.one('homepage_sections', q => q.insert({ id: newId(), ...s, created_at: nowIso() }).select().single()); }
  async updateHomepageSection(id: string, updates: any) { return this.one('homepage_sections', q => q.update(updates).eq('id', id).select().single()); }
  async deleteHomepageSection(id: string) { await this.sb().from('homepage_sections').delete().eq('id', id); return true; }

  // ================= category banners =================
  async getCategoryBanners(categoryId?: string) {
    return this.list('category_banners', q => {
      let b = q.select('*');
      if (categoryId) b = b.eq('category_id', categoryId);
      return b.order('sort_order', { ascending: true });
    });
  }
  async createCategoryBanner(b: any) { return this.one('category_banners', q => q.insert({ id: newId(), ...b, created_at: nowIso() }).select().single()); }
  async updateCategoryBanner(id: string, updates: any) { return this.one('category_banners', q => q.update(updates).eq('id', id).select().single()); }
  async deleteCategoryBanner(id: string) { await this.sb().from('category_banners').delete().eq('id', id); return true; }

  // ================= category sections =================
  async getCategorySections(categoryId?: string) {
    return this.list('category_sections', q => {
      let b = q.select('*');
      if (categoryId) b = b.eq('category_id', categoryId);
      return b.order('sort_order', { ascending: true });
    });
  }
  async createCategorySection(s: any) { return this.one('category_sections', q => q.insert({ id: newId(), ...s }).select().single()); }
  async updateCategorySection(id: string, updates: any) { return this.one('category_sections', q => q.update(updates).eq('id', id).select().single()); }
  async deleteCategorySection(id: string) { await this.sb().from('category_sections').delete().eq('id', id); return true; }

  // ================= deals =================
  async getDeals(options?: { activeOnly?: boolean; limit?: number }) {
    return this.list('deals', q => {
      let b = q.select('*');
      if (options?.activeOnly) b = b.eq('is_active', true);
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async createDeal(d: any) { return this.one('deals', q => q.insert({ id: newId(), ...d, created_at: nowIso() }).select().single()); }
  async updateDeal(id: string, updates: any) { return this.one('deals', q => q.update(updates).eq('id', id).select().single()); }
  async deleteDeal(id: string) { await this.sb().from('deals').delete().eq('id', id); return true; }

  // ================= wishlist / recently viewed / comparisons =================
  async getWishlist(userId?: string, sessionId?: string) {
    return this.list('wishlist_items', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (userId && sessionId) b = b.or('user_id.eq.' + userId + ',session_id.eq.' + sessionId);
      else if (userId) b = b.eq('user_id', userId);
      else if (sessionId) b = b.eq('session_id', sessionId);
      return b;
    });
  }
  async addWishlistItem(w: any) { return this.one('wishlist_items', q => q.insert({ id: newId(), ...w, created_at: nowIso() }).select().single()); }
  async removeWishlistItem(id: string) { await this.sb().from('wishlist_items').delete().eq('id', id); return true; }
  async getRecentlyViewed(userId?: string, sessionId?: string, limit = 20) {
    return this.list('recently_viewed', q => {
      let b = q.select('*').order('viewed_at', { ascending: false }).limit(limit);
      if (userId && sessionId) b = b.or('user_id.eq.' + userId + ',session_id.eq.' + sessionId);
      else if (userId) b = b.eq('user_id', userId);
      else if (sessionId) b = b.eq('session_id', sessionId);
      return b;
    });
  }
  async addRecentlyViewed(r: any) { return this.one('recently_viewed', q => q.insert({ id: newId(), ...r }).select().single()); }
  async getSavedComparisons(userId?: string, sessionId?: string) {
    return this.list('saved_comparisons', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (userId && sessionId) b = b.or('user_id.eq.' + userId + ',session_id.eq.' + sessionId);
      else if (userId) b = b.eq('user_id', userId);
      else if (sessionId) b = b.eq('session_id', sessionId);
      return b;
    });
  }
  async saveComparison(c: any) { return this.one('saved_comparisons', q => q.insert({ id: newId(), ...c, created_at: nowIso() }).select().single()); }
  async deleteSavedComparison(id: string) { await this.sb().from('saved_comparisons').delete().eq('id', id); return true; }

  // ================= posts by product =================
  async getPostsByProductId(productId: string) {
    return this.list('posts', q => q.select('*').eq('product_id', productId).order('created_at', { ascending: false }));
  }

  // ================= search logs =================
  async logSearch(s: any) { return this.one('search_logs', q => q.insert({ id: newId(), ...s, created_at: nowIso() }).select().single()); }
  async getSearchLogs(limit = 100) { return this.list('search_logs', q => q.select('*').order('created_at', { ascending: false }).limit(limit)); }

  // ================= price alerts =================
  async getPriceAlerts(userId?: string) {
    return this.list('price_alerts', q => {
      let b = q.select('*');
      if (userId) b = b.eq('user_id', userId);
      return b;
    });
  }
  async createPriceAlert(a: any) { return this.one('price_alerts', q => q.insert({ id: newId(), ...a, created_at: nowIso() }).select().single()); }
  async updatePriceAlert(id: string, updates: any) { return this.one('price_alerts', q => q.update(updates).eq('id', id).select().single()); }
  async deletePriceAlert(id: string) { await this.sb().from('price_alerts').delete().eq('id', id); return true; }

  // ================= testimonials =================
  async getTestimonials() { return this.list('testimonials', q => q.select('*').order('created_at', { ascending: false })); }
  async createTestimonial(t: any) { return this.one('testimonials', q => q.insert({ id: newId(), ...t }).select().single()); }
  async updateTestimonial(id: string, updates: any) { return this.one('testimonials', q => q.update(updates).eq('id', id).select().single()); }
  async deleteTestimonial(id: string) { await this.sb().from('testimonials').delete().eq('id', id); return true; }

  // ================= extra affiliate / analytics =================
  // /go/:slug short-link tracker — mirrors Supabase semantics: resolve the
  // affiliate_links row by short_slug, bump its click_count, return the URL.
  async trackAffiliateClick(slug: string) {
    const link = await this.one('affiliate_links', q => q.select('*').eq('short_slug', slug).maybeSingle());
    if (!link) return null;
    try {
      await this.sb().from('affiliate_links')
        .update({ click_count: ((link as any).click_count || 0) + 1 })
        .eq('id', (link as any).id);
    } catch (e) { console.error('Failed to increment link click_count:', (e as Error).message); }
    return (link as any).affiliate_url || (link as any).affiliateUrl || null;
  }
  async getClickAnalytics(options?: { limit?: number; offset?: number }) {
    return this.list('affiliate_clicks', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      if (options?.offset && options.limit) b = b.range(options.offset, options.offset + options.limit - 1);
      return b;
    });
  }
  async getSearchAnalytics(options?: { limit?: number }) {
    return this.list('search_logs', q => {
      let b = q.select('*').order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      return b;
    });
  }
  async likeComment(id: string) {
    const item: any = await this.one('comments', q => q.select('*').eq('id', id).maybeSingle());
    if (!item) return null;
    return this.one('comments', q => q.update({ likes: (item.likes || 0) + 1 }).eq('id', id).select().single());
  }

  // ================= amazon sync =================
  async listAmazonSyncStatus(options?: { limit?: number; offset?: number; status?: string }) {
    return this.list('amazon_sync_status', q => {
      let b = q.select('*');
      if (options?.status) b = b.eq('sync_status', options.status);
      b = b.order('updated_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      if (options?.offset && options.limit) b = b.range(options.offset, options.offset + options.limit - 1);
      return b;
    });
  }
  async getAmazonSyncStatus(productId: string) {
    return this.one('amazon_sync_status', q => q.select('*').eq('product_id', productId).maybeSingle());
  }
  async bulkCreateAmazonSyncStatus(entries: any[]): Promise<number> {
    if (!entries?.length) return 0;
    const rows = entries.map(e => ({ id: newId(), ...e }));
    const { error } = await this.sb().from('amazon_sync_status').upsert(rows, { onConflict: 'product_id' });
    if (error) throw new Error(error.message);
    return rows.length;
  }
  async updateAmazonSyncStatus(productId: string, updates: any) {
    return this.one('amazon_sync_status', q => q.update({ ...updates, updated_at: nowIso() }).eq('product_id', productId).select().single());
  }
  async getAmazonSyncSettings() {
    const { data } = await this.sb().from('amazon_sync_settings').select('*').limit(1).maybeSingle();
    return data || null;
  }
  async updateAmazonSyncSettings(updates: any) {
    const existing: any = await this.getAmazonSyncSettings();
    const payload = existing?.id ? { ...existing, ...updates, id: existing.id } : { id: newId(), ...updates };
    return this.one('amazon_sync_settings', q => q.upsert(payload, { onConflict: 'id' }).select().single());
  }
  async getAmazonPriceHistory(productId: string, limit = 30) {
    return this.list('amazon_price_history', q => q.select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(limit));
  }
  async recordPriceHistory(entry: any) {
    return this.one('amazon_price_history', q => q.insert({ id: newId(), ...entry, created_at: nowIso() }).select().single());
  }
  async getAmazonSyncLogs(options?: { limit?: number; offset?: number; productId?: string }) {
    return this.list('amazon_sync_logs', q => {
      let b = q.select('*');
      if (options?.productId) b = b.eq('product_id', options.productId);
      b = b.order('created_at', { ascending: false });
      if (options?.limit) b = b.limit(options.limit);
      if (options?.offset && options.limit) b = b.range(options.offset, options.offset + options.limit - 1);
      return b;
    });
  }
  async logAmazonSync(entry: any) {
    return this.one('amazon_sync_logs', q => q.insert({ id: newId(), ...entry, created_at: nowIso() }).select().single());
  }
  async getAmazonMarketplaces() { return this.list('amazon_marketplaces', q => q.select('*')); }
  async getAmazonApiCredentials() { return this.list('amazon_api_credentials', q => q.select('*')); }
  async upsertAmazonApiCredential(cred: any) {
    return this.one('amazon_api_credentials', q => q.upsert({ id: cred.id || newId(), ...cred }, { onConflict: 'marketplace_code' }).select().single());
  }
  async getAmazonApiUsage() { return this.list('amazon_api_usage', q => q.select('*').order('date', { ascending: false })); }
}