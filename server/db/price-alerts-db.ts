import fs from 'fs';
import path from 'path';
import { PriceAlert } from '../../src/types';
import { generateId, useSupabase } from '../db';
import { createClient } from '@supabase/supabase-js';

const DB_DIR = path.join(process.cwd(), 'data');
const ALERTS_FILE = path.join(DB_DIR, 'price_alerts.json');

// Initialize local JSON file if it doesn't exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(ALERTS_FILE)) fs.writeFileSync(ALERTS_FILE, JSON.stringify([]));

import { getSupabaseAdmin } from '../lib/supabase';

async function getClient() {
  if (useSupabase) {
    try {
      return await getSupabaseAdmin();
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function addPriceAlert(productId: string, email: string, targetPrice: number, currentPrice: number, userId?: string, opts: { alertType?: PriceAlert['alertType']; sessionId?: string } = {}): Promise<PriceAlert> {
  const alert: PriceAlert = {
    id: generateId(),
    productId,
    email,
    userId,
    sessionId: opts.sessionId,
    targetPrice,
    currentPrice,
    status: 'active',
    alertType: opts.alertType || 'price_drop',
    isTriggered: false,
    createdAt: new Date().toISOString()
  };

  const client = await getClient();
  if (client) {
    try {
      await client.from('price_alerts').insert([{
        id: alert.id,
        product_id: alert.productId,
        user_id: userId || null,
        session_id: opts.sessionId || null,
        email: alert.email,
        target_price: alert.targetPrice,
        current_price: alert.currentPrice,
        status: alert.status,
        alert_type: alert.alertType,
        is_triggered: alert.isTriggered,
        created_at: alert.createdAt
      }]);
      return alert;
    } catch (e) {
      console.warn('Supabase insert failed for price alert, falling back to local JSON:', e);
    }
  }

  // Local JSON fallback
  const alerts: PriceAlert[] = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  alerts.push(alert);
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
  return alert;
}

export async function getActiveAlerts(): Promise<PriceAlert[]> {
  const client = await getClient();
  if (client) {
    try {
      const { data } = await client.from('price_alerts').select('*').eq('status', 'active');
      if (data) return data.map((d: any) => ({
        id: d.id,
        productId: d.product_id,
        userId: d.user_id || undefined,
        email: d.email,
        targetPrice: d.target_price,
        currentPrice: d.current_price,
        status: d.status,
        alertType: d.alert_type,
        isTriggered: d.is_triggered,
        createdAt: d.created_at,
        triggeredAt: d.triggered_at
      }));
    } catch (e) {
      console.warn('Supabase select failed for price alert, falling back to local JSON:', e);
    }
  }
  const alerts: PriceAlert[] = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  return alerts.filter(a => a.status === 'active');
}

export async function markAlertTriggered(id: string): Promise<void> {
  const now = new Date().toISOString();
  const client = await getClient();
  if (client) {
    try {
      await client.from('price_alerts').update({ status: 'triggered', triggered_at: now }).eq('id', id);
      return;
    } catch (e) {
      console.warn('Supabase update failed, falling back to local JSON:', e);
    }
  }
  
  const alerts: PriceAlert[] = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  const idx = alerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    alerts[idx].status = 'triggered';
    alerts[idx].triggeredAt = now;
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
  }
}

export async function checkPriceAlerts() {
  const activeAlerts = await getActiveAlerts();
  if (activeAlerts.length === 0) return { processed: 0, triggered: 0 };

  const { dbInstance } = await import('../db');
  const products: any[] = await (dbInstance as any).getProductReviews();
  let triggered = 0;

  for (const alert of activeAlerts) {
    const product = products.find((p: any) => p.id === alert.productId);
    if (!product) continue;
    
    const currentPrice = parseFloat((product.price || '0').replace(/[^0-9.]/g, ''));
    const fired = alert.alertType === 'price_increase'
      ? currentPrice > 0 && currentPrice >= alert.targetPrice
      : currentPrice > 0 && currentPrice <= alert.targetPrice;
    if (fired) {
      await markAlertTriggered(alert.id);
      triggered++;
      console.log(`[Price Alerts] Triggered ${alert.alertType} alert ${alert.id} for ${alert.email} on product ${product.product_name} (New Price: $${currentPrice})`);
      const productUrl = product.slug ? `${process.env.APP_URL || 'https://www.dawnwire.com'}/products/${product.slug}` : '#';
      const { sendPriceDropAlertEmail, sendPriceIncreaseAlertEmail } = await import('../email');
      const sender = alert.alertType === 'price_increase' ? sendPriceIncreaseAlertEmail : sendPriceDropAlertEmail;
      await sender(alert.email, product.product_name, productUrl, alert.currentPrice, currentPrice);
      const { notifyPriceDrop } = await import('../knock');
      await notifyPriceDrop({
        userId: alert.userId,
        email: alert.email,
        productId: product.id,
        productName: product.product_name,
        brand: product.brand,
        productImage: product.product_image,
        slug: product.slug,
        asin: product.specs?.asin,
        oldPrice: alert.currentPrice,
        newPrice: currentPrice,
        targetPrice: alert.targetPrice,
      });
    }
  }

  return { processed: activeAlerts.length, triggered };
}
