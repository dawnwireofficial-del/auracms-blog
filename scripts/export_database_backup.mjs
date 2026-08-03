import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFiles() {
  const envFiles = ['.env.prod', '.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvFiles();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== DAWNWIRE DATABASE BACKUP EXPORTER ===');
console.log('Supabase Endpoint:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERROR] Supabase credentials missing from env files');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBackup() {
  const tables = [
    'product_reviews',
    'categories',
    'brands',
    'posts',
    'pages',
    'settings',
    'affiliate_links',
    'affiliate_clicks',
    'seo_meta',
    'faq_items',
    'redirects',
    'error_404_logs',
    'keywords'
  ];

  const backupData = {
    metadata: {
      site: 'https://www.dawnwire.com',
      exportDate: new Date().toISOString(),
      generator: 'DawnWire Automated Backup Utility v2.0'
    },
    tables: {}
  };

  let totalRecords = 0;

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`[WARN] Failed to fetch table ${table}: ${error.message}`);
        backupData.tables[table] = [];
      } else {
        backupData.tables[table] = data || [];
        totalRecords += (data?.length || 0);
        console.log(`  ✓ Table '${table}': ${data?.length || 0} records exported.`);
      }
    } catch (err) {
      console.warn(`[WARN] Exception fetching ${table}: ${err.message}`);
      backupData.tables[table] = [];
    }
  }

  const outputPath = path.resolve(process.cwd(), 'dawnwire_database_backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n✅ Database backup successfully saved to: ${outputPath}`);
  console.log(`   Total Tables: ${tables.length}`);
  console.log(`   Total Records Exported: ${totalRecords}`);
  console.log(`   File Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);
}

createBackup();
