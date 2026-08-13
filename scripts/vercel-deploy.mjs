import { execFileSync } from 'child_process';

// Permanent deploy: Vercel builds directly from the GitHub repo via gitSource.
// No file uploads (no Hobby 5000/24h quota), no rate limits on /v2/files, no
// manifest bookkeeping. CI just needs a project-scoped token that can create
// deployments for this project.

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const repoId = process.env.VERCEL_GIT_REPO_ID;

if (!token || !orgId || !projectId || !repoId) {
  console.error('Missing env: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_GIT_REPO_ID');
  process.exit(1);
}

const API = 'https://api.vercel.com';
const branch = process.env.VERCEL_GIT_BRANCH || 'master';

const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(`deploying git ref=${branch} sha=${sha}`);

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
    forceNew: 1,
    gitSource: {
      type: 'github',
      repoId: Number(repoId),
      ref: branch,
      sha,
    },
  }),
});

const text = await res.text();
let data;
try { data = JSON.parse(text); } catch { data = { raw: text }; }

if (!res.ok) {
  console.error(`createDeployment failed (${res.status}):`, text.slice(0, 2000));
  process.exit(1);
}

console.log(`deployment id=${data.id} url=${data.url}`);

// Poll until READY/ERROR/CANCELED.
const start = Date.now();
const timeoutMs = 900 * 1000;
let final;
while (Date.now() - start < timeoutMs) {
  const poll = await fetch(`${API}/v13/deployments/${data.id}?teamId=${orgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await poll.json();
  const state = d.readyState || d.error;
  console.log(`deploy state=${state}`);
  if (state === 'READY' || state === 'ERROR' || state === 'CANCELED') {
    final = d;
    break;
  }
  await new Promise(r => setTimeout(r, 10000));
}

if (!final) {
  console.error('timed out waiting for deployment');
  process.exit(1);
}

if (final.readyState !== 'READY') {
  console.error(JSON.stringify(final.error || final.readyState));
  process.exit(1);
}

console.log(`readyState=${final.readyState} alias=${(final.alias || []).join(',') || 'pending'} url=${final.url}`);