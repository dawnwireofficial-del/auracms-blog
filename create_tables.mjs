import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL');

  const schema = `
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT,
      excerpt TEXT,
      content TEXT,
      category_id TEXT,
      author_id TEXT,
      status TEXT,
      published_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      featured_image TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      tags JSONB
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT,
      description TEXT,
      parent_id TEXT,
      status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_name TEXT,
      slug TEXT,
      brand TEXT,
      category_id TEXT,
      price TEXT,
      original_price TEXT,
      rating NUMERIC,
      review_count NUMERIC,
      affiliate_url TEXT,
      product_image TEXT,
      pros JSONB,
      cons JSONB,
      key_features JSONB,
      review_summary TEXT,
      cta_text TEXT,
      stock_status TEXT,
      best_for TEXT,
      verdict TEXT,
      ai_verdict JSONB,
      score_breakdown JSONB,
      specs JSONB,
      status TEXT,
      published_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deal_badge TEXT,
      coupon_code TEXT,
      coupon_expiry TEXT,
      alternative_stores JSONB
    );

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      email TEXT,
      product_id TEXT,
      target_price NUMERIC,
      current_price NUMERIC,
      alert_type TEXT,
      is_triggered BOOLEAN,
      status TEXT,
      created_at TEXT,
      triggered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      product_id TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS recently_viewed (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      product_id TEXT,
      viewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS saved_comparisons (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      product_ids JSONB,
      created_at TEXT,
      title TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT,
      logo_url TEXT,
      description TEXT,
      status TEXT
    );
  `;

  await client.query(schema);
  console.log('Tables created successfully');
  await client.end();
}

run().catch(console.error);
