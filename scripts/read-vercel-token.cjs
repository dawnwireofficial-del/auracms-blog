// Prints the Vercel CLI session token from auth.json so deploys can reuse the
// logged-in DawnWire session instead of requiring a manually pasted token.
const path = require('path');
const fs = require('fs');
const candidates = [
  process.env.APPDATA && path.join(process.env.APPDATA, 'xdg.data', 'com.vercel.cli', 'auth.json'),
  process.env.APPDATA && path.join(process.env.APPDATA, 'com.vercel.cli', 'auth.json'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'com.vercel.cli', 'auth.json'),
];
for (const p of candidates) {
  if (!p || !fs.existsSync(p)) continue;
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j.token) { process.stdout.write(j.token); process.exit(0); }
  } catch { /* try next */ }
}
process.exit(1);
