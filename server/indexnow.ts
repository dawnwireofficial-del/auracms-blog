import https from 'https';

// IndexNow instant-ping (Bing / Yandex / Seznam / Naver via api.indexnow.org).
// Fire-and-forget: never blocks or fails the calling request.

const KEY = '01f662fd86d64e149f4ed8835236efd1';
const HOST = 'www.dawnwire.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function pingIndexNow(urls: string | string[]): void {
  try {
    const list = (Array.isArray(urls) ? urls : [urls])
      .filter((u) => typeof u === 'string' && u.startsWith('http'))
      .slice(0, 100);
    if (list.length === 0) return;
    const payload = JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: list });
    const req = https.request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 8000,
    }, (res) => {
      res.resume();
      res.on('end', () => console.log(`[IndexNow] pinged ${list.length} url(s) -> ${res.statusCode}`));
    });
    req.on('error', () => {});
    req.write(payload);
    req.end();
  } catch {}
}

export function indexNowKey(): string {
  return KEY;
}
