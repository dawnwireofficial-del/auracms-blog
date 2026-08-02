import { Knock } from '@knocklabs/node';

// Knock notifications-as-a-service integration.
//
// Guarded end-to-end: if KNOCK_API_KEY is absent nothing runs and no error is
// thrown, so the site keeps working until the Knock environment is configured.
// All workflows are env-configurable so they can be renamed in the Knock
// dashboard without a redeploy:
//   KNOCK_PRICE_DROP_WORKFLOW (default "price-drop")
//   KNOCK_DEAL_WORKFLOW       (default "deal-alert")

let _knock: Knock | null | undefined;

export function getKnock(): Knock | null {
  if (_knock === undefined) {
    _knock = process.env.KNOCK_API_KEY ? new Knock({ apiKey: process.env.KNOCK_API_KEY }) : null;
  }
  return _knock;
}

export function isKnockEnabled(): boolean {
  return !!getKnock();
}

export type KnockRecipient = string | { id: string; collection?: string };

interface TriggerPayload {
  recipients: KnockRecipient[];
  data?: Record<string, unknown>;
  actor?: string;
}

export async function triggerKnockWorkflow(workflowKey: string, payload: TriggerPayload): Promise<boolean> {
  const knock = getKnock();
  if (!knock) return false;
  try {
    // NOTE: recipient IDs MUST be passed as plain strings. Wrapping them in
    // { id, collection: 'default' } objects causes Knock to deliver the message
    // but never index it into the in-app feed (the feed contents endpoint
    // returns total_count 0 even though the message is delivered + rendered).
    const recipients = payload.recipients
      .filter(Boolean)
      .map((r) => (typeof r === 'string' ? r : r.id));
    if (recipients.length === 0) return false;
    await knock.workflows.trigger(workflowKey, {
      recipients,
      data: payload.data || {},
      actor: payload.actor,
    });
    return true;
  } catch (e: any) {
    console.warn(`[Knock] workflow "${workflowKey}" trigger failed:`, e.message);
    return false;
  }
}

const siteUrl = () => process.env.APP_URL || 'https://www.dawnwire.com';

export interface PriceDropNotification {
  userId?: string;
  email?: string;
  productId: string;
  productName: string;
  brand?: string;
  productImage?: string;
  slug?: string;
  asin?: string;
  oldPrice: number;
  newPrice: number;
  targetPrice?: number;
}

export async function notifyPriceDrop(input: PriceDropNotification): Promise<boolean> {
  const workflow = process.env.KNOCK_PRICE_DROP_WORKFLOW || 'price-drop';
  const recipients: KnockRecipient[] = [];
  if (input.userId) recipients.push(input.userId);
  if (input.email) recipients.push(input.email);
  if (recipients.length === 0) return false;
  return triggerKnockWorkflow(workflow, {
    recipients,
    data: {
      productId: input.productId,
      productName: input.productName,
      brand: input.brand || '',
      productImage: input.productImage || '',
      asin: input.asin || '',
      productUrl: input.slug ? `${siteUrl()}/products/${input.slug}` : '',
      oldPrice: input.oldPrice,
      newPrice: input.newPrice,
      targetPrice: input.targetPrice || 0,
      savings: Math.max(0, Math.round((input.oldPrice - input.newPrice) * 100) / 100),
    },
  });
}

export interface DealNotification {
  productId: string;
  productName: string;
  brand?: string;
  productImage?: string;
  slug?: string;
  asin?: string;
  price?: number;
  originalPrice?: number;
  discountPct?: number;
  event: 'deal_started' | 'back_in_stock';
}

export async function notifyDealToWishlistUsers(input: DealNotification): Promise<boolean> {
  const workflow = process.env.KNOCK_DEAL_WORKFLOW || 'deal-alert';
  const userIds = await getWishlistUserIds(input.productId);
  if (userIds.length === 0) return false;
  return triggerKnockWorkflow(workflow, {
    recipients: userIds,
    data: {
      event: input.event,
      productId: input.productId,
      productName: input.productName,
      brand: input.brand || '',
      productImage: input.productImage || '',
      asin: input.asin || '',
      productUrl: input.slug ? `${siteUrl()}/products/${input.slug}` : '',
      price: input.price || 0,
      originalPrice: input.originalPrice || 0,
      discountPct: input.discountPct || 0,
    },
  });
}

async function getWishlistUserIds(productId: string): Promise<string[]> {
  try {
    const { getSupabaseAdmin } = await import('./lib/supabase');
    const admin = await getSupabaseAdmin();
    const { data } = await admin
      .from('wishlist_items')
      .select('user_id')
      .eq('product_id', productId)
      .not('user_id', 'is', null);
    return (data || []).map((r: any) => r.user_id).filter(Boolean);
  } catch {
    return [];
  }
}
