import 'dotenv/config';
import { createHash, createHmac } from 'crypto';

const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT!;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;

function signRequest(method: string, path: string, body: Buffer) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(R2_ENDPOINT).host;
  const payloadHash = createHash('sha256').update(body).digest('hex');

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest();
  const kDate = hmac(`AWS4${R2_SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return {
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function test() {
  const key = 'test/ping.txt';
  const body = Buffer.from('ping-' + Date.now());
  const path = `/${R2_BUCKET}/${key}`;
  const headers = signRequest('PUT', path, body);
  headers['Content-Type'] = 'text/plain';

  const resp = await fetch(`${R2_ENDPOINT}${path}`, {
    method: 'PUT',
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  });

  console.log('HTTP:', resp.status);
  console.log('OK:', resp.ok);
  if (!resp.ok) {
    const err = await resp.text();
    console.log('Error:', err.substring(0, 300));
  } else {
    console.log('Upload successful!');
    console.log('URL:', `${R2_ENDPOINT.replace('https://', `https://${R2_BUCKET}.`)}/${key}`);
  }
}

test().catch(e => console.error('ERR:', e.message));
