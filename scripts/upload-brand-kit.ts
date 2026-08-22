#!/usr/bin/env npx tsx
/**
 * Uploads the finalized DawnWire brand kit (banners, heroes, icons) to imgbb
 * and writes scripts/asset-urls.json mapping file name -> {full, medium, thumb}.
 */
import fs from 'fs';
import path from 'path';

const SRC = String.raw`C:\Users\atifn\Videos\Dawn wire Kit brand\Finalized`;
const OUT = 'scripts/asset-urls-freeimage.json';
const KEY = process.env.FREEIMAGE_API_KEY || '';

async function upload(file: string): Promise<any> {
  const b64 = fs.readFileSync(file).toString('base64');
  const body = new URLSearchParams({
    key: KEY,
    action: 'upload',
    format: 'json',
    source: b64,
    title: path.basename(file, '.png'),
  });
  const resp = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(90000),
  });
  const j: any = await resp.json();
  if (j.status_code !== 200 || !j.image?.url) throw new Error(JSON.stringify(j).slice(0, 200));
  return {
    full: j.image.url,
    medium: j.image.medium?.url || j.image.display_url || j.image.url,
    thumb: j.image.thumb?.url || j.image.medium?.url || j.image.url,
  };
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.png$/i.test(e.name) ? [p] : [];
  });
}

async function main() {
  const files = walk(SRC);
  const result: Record<string, any> = {};
  if (fs.existsSync(OUT)) result = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  let done = 0;
  for (const f of files) {
    const rel = path.relative(SRC, f).replace(/\\/g, '/');
    done++;
    if (result[rel]?.full) { console.log(`skip ${done}/${files.length} ${rel}`); continue; }
    try {
      result[rel] = await upload(f);
      console.log(`[${done}/${files.length}] ${rel} -> ${result[rel].full}`);
      fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
    } catch (e: any) {
      console.error(`FAIL ${rel}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`DONE ${Object.keys(result).length} assets`);
}
main().catch(console.error);
