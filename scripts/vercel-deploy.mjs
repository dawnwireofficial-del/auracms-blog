import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !orgId || !projectId) {
  console.error('Missing env: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID');
  process.exit(1);
}

const API = 'https://api.vercel.com';
const MANIFEST_PATH = process.env.VERCEL_MANIFEST_PATH || '.vercel-deploy-manifest.json';

// Vercel Hobby plan limits uploads (5000/24h). Only files the production build
// actually needs are uploaded. Junk dirs (backups, templates, old project
// copies, dev notes) are excluded so we never burn quota on non-shipping files.
const EXCLUDE_PREFIXES = [
  'Envato Purchased Templates/',
  'Hero Section/',
  'Portfolio page content/',
  'dawnwire/',
  'dawnwire_trimmed_service_icons/',
  'data/',
  '.kilo/',
  '.opencode/',
  'node_modules/',
  'dist/',
  '.git/',
];
const EXCLUDE_REGEX = /\.(zip|md)$/i;
const EXCLUDE_ROOT = new Set([
  'session.md',
  'Backcover.png',
  'Backcover 2.png',
  'Office.png',
  'dawn settle0amation-banner.png',
  'New Bot For Landing Page.svg',
  'dawnwire_animated_bot (1).svg',
  'dawnwire_animated_bot new updated.svg',
  'dawnwire_database_backup.json',
  'dawnwire_full_source_backup_2026.zip',
  'dawnwire.zip',
  'DawnWire Extension.zip',
  'metadata.json',
]);
// Docs/config that don't participate in the Vercel build.
const EXCLUDE_SINGLE = [
  'cleanse-secret.bat',
  'cleanse-secret.cmd',
  'cleanse-secret.js',
  'cleanse-secret.ps1',
  'dump_keys.js',
  'firebase-applet-config.json',
  'firebase-blueprint.json',
  'firestore.rules',
  'audit_supabase.mjs',
  'create_admin_user.mjs',
  'create_tables.mjs',
  'get_admin_user.mjs',
  'fix_schema.mjs',
  'migrate_pooler.mjs',
  'knock-e2e-verify.mjs',
  'knock-feed.mjs',
  'knock-fix-workflows.mjs',
  'knock-messages.mjs',
  'knock-verify.mjs',
  'push-env.mjs',
  'repair-images.ts',
  'session-ses_0a99.md',
  'session-ses_0dc2.md',
  'session.md',
  'test_extension_import.mjs',
  'test_public_products.mjs',
  'test_routes_and_updates.mjs',
  'find_slice_issues.mjs',
  'dawnwing.service',
  '.env',
].map(s => {
  if (s.includes('*')) {
    const re = new RegExp('^' + s.replace(/[.+^${}()|\[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    return { glob: s, re };
  }
  return { name: s, re: null };
});

function isExcluded(file) {
  if (EXCLUDE_PREFIXES.some(p => file.startsWith(p))) return true;
  if (EXCLUDE_ROOT.has(file)) return true;
  if (EXCLUDE_REGEX.test(file)) return true;
  return EXCLUDE_SINGLE.some(rule => rule.re ? rule.re.test(file) : rule.name === file);
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeManifest(next) {
  try {
    fs.writeFileSync(MANIFEST_PATH + '.tmp', JSON.stringify(next));
    fs.renameSync(MANIFEST_PATH + '.tmp', MANIFEST_PATH);
  } catch (e) {
    console.error('manifest write failed:', e.message);
  }
}

async function rawUpload(file, sha, size, buf) {
  const url = `${API}/v2/files?teamId=${orgId}`;
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'x-now-digest': sha,
          'x-now-size': String(size),
        },
        body: buf,
        signal: AbortSignal.timeout(60000),
      });
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr;
}

async function uploadFiles(files) {
  let okCount = 0;
  let failCount = 0;
  const queue = [...files];
  const pool = Array.from({ length: 12 }, async () => {
    while (true) {
      const f = queue.shift();
      if (!f) return;
      const ok = await uploadOne(f);
      if (ok) okCount++; else failCount++;
    }
  });
  await Promise.all(pool);
  return { okCount, failCount };
}

async function uploadOne({ file, sha, size }) {
  const buf = fs.readFileSync(path.join(process.cwd(), file));
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res;
    try {
      res = await rawUpload(file, sha, size, buf);
    } catch (e) {
      console.error(`network error (${e.cause?.code || e.message}) ${file}; retry ${attempt}`);
      await new Promise(r => setTimeout(r, 3000 * attempt));
      continue;
    }
    if (res.ok) return true;
    const text = await res.text().catch(() => '');
    if (res.status === 429) {
      const resetMatch = /"reset":\s*(\d+)/.exec(text);
      const resetAt = resetMatch ? new Date(Number(resetMatch[1]) * 1000).toISOString() : '?';
      console.error(`rate limited (429) ${file}; attempt ${attempt} reset~${resetAt}`);
      await new Promise(r => setTimeout(r, 3000 * attempt));
      continue;
    }
    if (res.status === 403 && /invalid/.test(text)) {
      console.error(`token/team invalid: ${text.slice(0, 200)}`);
      process.exit(1);
    }
    console.error(`upload ${file} failed (${res.status}): ${text.slice(0, 200)}`);
    return false;
  }
  return false;
}

async function createDeployment(files) {
  const res = await fetch(`${API}/v13/deployments?teamId=${orgId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: process.env.VERCEL_PROJECT_NAME || 'auracms-blog',
      project: projectId,
      target: 'production',
      files,
    }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok && res.status !== 200) {
    console.error('createDeployment failed:', text.slice(0, 2000));
    process.exit(1);
  }
  return data;
}

async function getDeployment(id) {
  const res = await fetch(`${API}/v13/deployments/${id}?teamId=${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function pollDeployment(id, timeoutMs = 900 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const data = await getDeployment(id);
    const state = data?.readyState || data?.error;
    console.log(`deploy state=${state}`);
    if (state === 'READY' || state === 'ERROR' || state === 'CANCELED') return data;
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('timed out waiting for deployment');
}

// Determine shipping files: all git-tracked files minus excluded build-irrelevant ones.
const allFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .map(f => f.replace(/\\/g, '/'))
  .filter(f => !isExcluded(f));

const files = allFiles.map(f => {
  const full = path.join(process.cwd(), f);
  const buf = fs.readFileSync(full);
  const sha = crypto.createHash('sha1').update(buf).digest('hex');
  return { file: f, sha, size: buf.length };
});

const prev = readManifest();
const prevFiles = (prev && prev.files) || {};
let toUpload = files;
if (prev && Object.keys(prevFiles).length > 0) {
  toUpload = files.filter(f => prevFiles[f.file] !== f.sha);
  if (toUpload.length === 0) {
    console.error('no changed files; uploading nothing');
  } else {
    console.error(`uploading ${toUpload.length}/${files.length} changed files`);
  }
} else {
  console.error(`no previous manifest; uploading all ${files.length} files`);
}

const uploaded = await uploadFiles(toUpload);
console.error(`uploaded=${uploaded.okCount}/${toUpload.length} (failed ${uploaded.failCount})`);

if (uploaded.okCount !== toUpload.length) {
  console.error(`Only ${uploaded.okCount}/${toUpload.length} files uploaded; ${uploaded.failCount} failed.`);
  console.error('This usually means the 24h file-upload quota is exhausted. No deploy created.');
  process.exit(1);
}

const data = await createDeployment(files.map(({ file, sha }) => ({ file, sha })));
console.log(`deployment id=${data.id} url=${data.url}`);
const finalData = await pollDeployment(data.id);
const final = await getDeployment(data.id);
console.log(`readyState=${final.readyState} alias=${(final.alias || []).join(',') || 'pending'} url=${final.url}`);
if (final.readyState === 'READY') {
  const manifest = {
    sha: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    files: Object.fromEntries(files.map(f => [f.file, f.sha])),
  };
  writeManifest(manifest);
  console.log(`manifest saved (${Object.keys(manifest.files).length} files) for next incremental upload`);
} else {
  console.error(JSON.stringify(final.error || final.readyState));
  process.exit(1);
}