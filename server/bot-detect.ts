// Server-side bot / automated-traffic detection.
// Every affiliate click and page view is classified at write time so the admin
// dashboards can show REAL human traffic — test clicks, curl scripts, crawlers
// and social-preview scrapers are flagged (is_bot) instead of polluting the
// "clicks today" numbers that drive commission reporting.

const BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'slurp', 'bingpreview', 'bingbot', 'yandex', 'baiduspider',
  'duckduckbot', 'headless', 'phantom', 'playwright', 'puppeteer', 'selenium', 'chrome-lighthouse',
  'lighthouse', 'pagespeed', 'gtmetrix', 'pingdom', 'uptimerobot', 'screaming frog', 'semrush',
  'ahrefs', 'majestic', 'petalbot', 'mj12bot', 'dotbot', 'rogerbot', 'facebookexternalhit',
  'facebookcatalog', 'whatsapp', 'telegrambot', 'vkshare', 'linkedinbot', 'twitterbot', 'embedly',
  'quora link', 'pinterest', 'skypeuripreview', 'slackbot', 'discordbot', 'snapchat',
  'curl', 'wget', 'python-requests', 'python-urllib', 'node-fetch', 'axios', 'go-http-client',
  'java/', 'okhttp', 'httpclient', 'postman', 'insomnia', 'powershell', 'windows-powershell',
  'scrapy', 'aiohttp', 'httpx', 'libwww', 'lwp', 'mechanize', 'phantomjs', 'headlesschrome',
  'webscreenshot', 'api-client', 'httpie', 'aria2', 'monitor', 'healthcheck', 'validator',
];

// Returns true when the user agent looks like a bot / script / preview scraper
// rather than a real human browser session.
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // no UA = non-browser (server-side / scripted)
  const ua = String(userAgent).toLowerCase();
  if (BOT_PATTERNS.some((p) => ua.includes(p))) return true;
  // No recognizable browser-engine signature => scripted / non-human.
  const looksLikeBrowser =
    /\b(mozilla|chrome|safari|firefox|edg\/|opera|opr\/)\b/.test(ua) ||
    /(chrome|firefox|safari|version)\/\d/.test(ua);
  return !looksLikeBrowser;
}
