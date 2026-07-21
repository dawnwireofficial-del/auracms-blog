import express from 'express';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', async (req, res) => {
  if (req.body.secret !== 'migrate123') return res.status(401).send('Unauthorized');
  
  const DB_URL = req.body.connectionString || process.env.SUPABASE_DB_URL;
  if (!DB_URL) return res.status(500).send('SUPABASE_DB_URL is missing in request body');

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL from Vercel');

    const schema = `
      CREATE TABLE IF NOT EXISTS posts ( id TEXT PRIMARY KEY, title TEXT, slug TEXT, excerpt TEXT, content TEXT, category_id TEXT, author_id TEXT, status TEXT, published_at TEXT, created_at TEXT, updated_at TEXT, featured_image TEXT, seo_title TEXT, seo_description TEXT, seo_keywords TEXT, tags JSONB );
      CREATE TABLE IF NOT EXISTS categories ( id TEXT PRIMARY KEY, name TEXT, slug TEXT, description TEXT, parent_id TEXT, status TEXT, created_at TEXT );
      CREATE TABLE IF NOT EXISTS product_reviews ( id TEXT PRIMARY KEY, product_name TEXT, slug TEXT, brand TEXT, category_id TEXT, price TEXT, original_price TEXT, rating NUMERIC, review_count NUMERIC, affiliate_url TEXT, product_image TEXT, pros JSONB, cons JSONB, best_for TEXT, verdict TEXT, ai_verdict JSONB, score_breakdown JSONB, specs JSONB, status TEXT, published_at TEXT, deal_badge TEXT, coupon_code TEXT, coupon_expiry TEXT, alternative_stores JSONB );
      CREATE TABLE IF NOT EXISTS price_alerts ( id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, email TEXT, product_id TEXT, target_price NUMERIC, current_price NUMERIC, alert_type TEXT, is_triggered BOOLEAN, status TEXT, created_at TEXT, triggered_at TEXT );
      CREATE TABLE IF NOT EXISTS wishlist ( id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, product_id TEXT, added_at TEXT );
      CREATE TABLE IF NOT EXISTS recently_viewed ( id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, product_id TEXT, viewed_at TEXT );
      CREATE TABLE IF NOT EXISTS saved_comparisons ( id TEXT PRIMARY KEY, user_id TEXT, session_id TEXT, product_ids JSONB, created_at TEXT, title TEXT );
      CREATE TABLE IF NOT EXISTS brands ( id TEXT PRIMARY KEY, name TEXT, slug TEXT, logo_url TEXT, description TEXT, status TEXT );
    `;

    await client.query(schema);

    // Seed Data
    const dataDir = path.join(process.cwd(), 'data');
    let dbData = { posts: [], categories: [], product_reviews: [], brands: [] };
    if (fs.existsSync(path.join(dataDir, 'db.json'))) {
      dbData = JSON.parse(fs.readFileSync(path.join(dataDir, 'db.json'), 'utf-8'));
    }

    // Insert Product Reviews
    for (const r of (dbData.product_reviews || []) as any[]) {
      await client.query(`
        INSERT INTO product_reviews (id, product_name, slug, brand, category_id, price, affiliate_url, product_image, status, alternative_stores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [r.id, r.product_name, r.slug, r.brand, r.category_id, r.price, r.affiliate_url, r.product_image, r.status, JSON.stringify(r.alternative_stores || [])]);
    }

    res.json({ status: 'Success', message: 'Tables created and seed data inserted!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  } finally {
    await client.end();
  }
});

export default router;
