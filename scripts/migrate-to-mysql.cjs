#!/usr/bin/env node
const mysql = require("C:/Users/atifn/AppData/Local/Temp/opencode/mysql-check/node_modules/mysql2/promise");

const TABLES = [
  "users","categories","brands","tags","pages","posts",
  "category_banners","category_sections",
  "homepage_hero_slides","homepage_sections",
  "product_reviews",
  "shopping_events","event_products",
  "brands","deals",
  "affiliate_links","affiliate_health","affiliate_clicks","affiliate_link_log",
  "amazon_marketplaces","amazon_api_credentials","amazon_api_usage",
  "amazon_sync_status","amazon_sync_settings","amazon_sync_logs",
  "amazon_price_history",
  "deals","price_alerts",
  "comments","tags",
  "wishlist_items","recently_viewed","saved_comparisons",
  "newsletter_subscribers","messages","activity_logs",
  "redirects","media","portfolio_projects","services",
  "faq_items","testimonials","internal_links","keywords",
  "topic_clusters","content_briefs","buying_guides",
  "error_404_logs","activity_logs"
];

const TABLES_DEDUP = [...new Set([
  "users","categories","brands","tags","pages","posts",
  "category_banners","category_sections",
  "homepage_hero_slides","homepage_sections",
  "product_reviews",
  "shopping_events","event_products",
  "brands","deals",
  "affiliate_links","affiliate_health","affiliate_clicks","affiliate_link_log",
  "amazon_marketplaces","amazon_api_credentials","amazon_api_usage",
  "amazon_sync_status","amazon_sync_settings","amazon_sync_logs",
  "amazon_price_history",
  "deals","price_alerts",
  "comments","tags",
  "wishlist_items","recently_viewed","saved_comparisons",
  "newsletter_subscribers","messages","activity_logs",
  "redirects","media","portfolio_projects","services",
  "faq_items","testimonials","internal_links","keywords",
  "topic_clusters","content_briefs","buying_guides",
  "error_404_logs","activity_logs"
])];

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2hkeHZicm5kemtrb3FkbHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc0Mzg4NiwiZXhwIjoyMDk4MzE5ODg2fQ.SlKJ1Oq38f6rZaEhexXqETi4Cuq3awK-tBiHlsDAE4c";
const PAGE_SIZE = 1000;
const INSERT_BATCH = 500;

function toMySQL(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

async function main() {
  const mysql = require("C:/Users/atifn/AppData/Local/Temp/opencode/mysql-check/node_modules/mysql2/promise");
  const conn = await mysql.createConnection({
    host: "srv1932.hstgr.io", port: 3306,
    user: "u916810702_dawnwire", password: "!M7oD*srOX",
    database: "u916810702_dawnwire", connectTimeout: 30000
  });
  console.log("Connected to MySQL");

  const TABLES_DEDUP = [...new Set([
    "users","categories","brands","tags","pages","posts",
    "category_banners","category_sections",
    "homepage_hero_slides","homepage_sections",
    "product_reviews",
    "shopping_events","event_products",
    "brands","deals",
    "affiliate_links","affiliate_health","affiliate_clicks","affiliate_link_log",
    "amazon_marketplaces","amazon_api_credentials","amazon_api_usage",
    "amazon_sync_status","amazon_sync_settings","amazon_sync_logs",
    "amazon_price_history",
    "deals","price_alerts",
    "comments","tags",
    "wishlist_items","recently_viewed","saved_comparisons",
    "newsletter_subscribers","messages","activity_logs",
    "redirects","media","portfolio_projects","services",
    "faq_items","testimonials","internal_links","keywords",
    "topic_clusters","content_briefs","buying_guides",
    "error_404_logs","activity_logs"
  ])];

  let grandTotal = 0;

  for (const table of TABLES_DEDUP) {
    console.log("\n--- " + table + " ---");
    let total = 0;
    let offset = 0;

    while (true) {
      const res = await fetch("https://nzghdxvbrndzkkoqdlqw.supabase.co/rest/v1/" + table + "?select=*&limit=1000&offset=" + offset + "&order=id.asc", {
        headers: {
          "apikey": "sb_publishable_toy-BSdhpLKpoHIzaQDevg_bqKOOW94",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2hkeHZicm5kemtrb3FkbHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc0Mzg4NiwiZXhwIjoyMDk4MzE5ODg2fQ.SlKJ1Oq38f6rZaEhexXqETi4Cuq3awK-tBiHlsDAE4c",
          "Accept": "application/json"
        }
      });

      if (!res.ok) {
        console.error("  Fetch fail: " + res.status + " " + res.statusText);
        break;
      }

      const rows = await res.json();
      if (!rows || rows.length === 0) break;

      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        if (!batch.length) continue;
        const cols = Object.keys(batch[0]);
        const placeholders = batch.map(() => "(" + cols.map(() => "?").join(",") + ")").join(",");
        const values = batch.flatMap(r => cols.map(c => {
          const v = r[c];
          if (v === null || v === undefined) return null;
          if (typeof v === "object") return JSON.stringify(v);
          if (typeof v === "boolean") return v ? 1 : 0;
          return v;
        }));
        const sql = "INSERT INTO `" + table + "` (`" + Object.keys(batch[0]).join("`,`") + "`) VALUES " + batch.map(() => "(" + cols.map(() => "?").join(",") + ")").join(",");

        try {
          await conn.query(sql, values);
        } catch (e) {
          console.error("  batch fail " + table + ":", e.message);
        }
      }

      total += rows.length;
      offset += 1000;
      if (rows.length < 1000) break;
    }
    console.log("  " + table + ": " + total + " rows");
  }
  console.log("Migration complete");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });