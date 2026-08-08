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

async function uploadFiles(files) {
  let okCount = 0;
  const queue = [...files];
  const pool = Array.from({ length: 16 }, async () => {
    while (true) {
      const f = queue.shift();
      if (!f) return;
      await uploadOne(f);
      okCount++;
      if (okCount % 200 === 0) console.error(`uploaded ${okCount}/${files.length}`);
    }
  });
  await Promise.all(pool);
}

async function uploadOne({ file, sha, size }) {
  const url = `${API}/v2/files?teamId=${orgId}`;
  const buf = fs.readFileSync(path.join(process.cwd(), file));
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'x-now-digest': sha,
        'x-now-size': String(size),
      },
      body: buf,
    });
    if (res.ok) return;
    const text = await res.text().catch(() => '');
    console.error(`upload ${file} failed (${res.status}): ${text.slice(0, 200)}`);
    if (attempt === 2) throw new Error(`upload failed for ${file}`);
  }
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

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .map(f => {
    const full = path.join(process.cwd(), f);
    const buf = fs.readFileSync(full);
    const sha = crypto.createHash('sha1').update(buf).digest('hex');
    return { file: f.replace(/\\/g, '/'), sha, size: buf.length };
  });

console.error(`uploading ${files.length} files`);
await uploadFiles(files);
const data = await createDeployment(files.map(({ file, sha }) => ({ file, sha })));
console.log(`deployment id=${data.id} url=${data.url}`);
const finalData = await pollDeployment(data.id);
const final = await getDeployment(data.id);
console.log(`readyState=${final.readyState} alias=${(final.alias || []).join(',') || 'pending'} url=${final.url}`);
if (final.readyState !== 'READY') {
  console.error(JSON.stringify(final.error || final.readyState));
  process.exit(1);
}