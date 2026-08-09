import React from 'react';
import { Head } from 'vike-react/Head';

interface SeoHelmetProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  ogLocale?: string;
  twitterCard?: string;
  twitterSite?: string;
  noIndex?: boolean;
  schema?: Record<string, any>;
  jsonLd?: Record<string, any>[];
  breadcrumbs?: { name: string; url: string }[];
  siteName?: string;
  siteTagline?: string;
  logoUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  howToSteps?: { name: string; text: string; image?: string }[];
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return window.location.origin;
  }
  return 'https://www.dawnwire.com';
}

export default function SeoHelmet({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  ogLocale = 'en_US',
  twitterCard = 'summary_large_image',
  twitterSite,
  noIndex,
  schema,
  jsonLd,
  breadcrumbs,
  siteName,
  siteTagline,
  logoUrl,
  publishedTime,
  modifiedTime,
  howToSteps,
}: SeoHelmetProps) {
  const name = siteName || 'DawnWire';
  const tagline = siteTagline || 'AI-Powered Blog Platform';
  const defaultTitle = `${name} — ${tagline}`;
  const defaultDescription = description || `${name} is a modern, AI-powered blog platform for creating and managing content with built-in SEO tools, analytics, and more.`;
  const baseUrl = getBaseUrl();
  const fullTitle = title ? `${title} | ${name}` : defaultTitle;
  const fullDesc = description || defaultDescription;
  const fullUrl = canonical || baseUrl;
  const imgUrl = ogImage || logoUrl || `${baseUrl}/logo/logo-transparent.png`;

  const schemas: Record<string, any>[] = [];

  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: name,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });

  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((bc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: bc.name,
        item: bc.url.startsWith('http') ? bc.url : `${baseUrl}${bc.url}`,
      })),
    });
  }

  // Organization schema with social links
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    url: baseUrl,
    logo: imgUrl,
    description: fullDesc,
  });

  // HowTo schema for buying guides / tutorials
  if (howToSteps && howToSteps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: fullTitle,
      description: fullDesc,
      step: howToSteps.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
        ...(s.image ? { image: s.image } : {}),
      })),
    });
  }

  if (schema) schemas.push(schema);
  if (jsonLd) schemas.push(...jsonLd);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={fullUrl} />
      <link rel="alternate" href={fullUrl} hrefLang="en" />
      <link rel="alternate" href={fullUrl} hrefLang="x-default" />
      <link rel="llms.txt" href={`${baseUrl}/llms.txt`} type="text/plain" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imgUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content={name} />
      <meta name="twitter:card" content={twitterCard} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={imgUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {ogType === 'article' && <meta property="article:author" content={name} />}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Head>
  );
}
