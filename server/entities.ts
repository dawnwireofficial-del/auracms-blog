interface Entity {
  name: string;
  aliases: string[];
  sameAs: string;
  type: string;
  category: string;
  description?: string;
}

const ENTITIES: Entity[] = [
  // === TECH COMPANIES ===
  { name: 'Apple', aliases: ['Apple Inc', 'Apple Inc.'], sameAs: 'https://www.wikidata.org/wiki/Q312', type: 'Corporation', category: 'company' },
  { name: 'Google', aliases: ['Google LLC', 'Alphabet'], sameAs: 'https://www.wikidata.org/wiki/Q95', type: 'Corporation', category: 'company' },
  { name: 'Microsoft', aliases: ['Microsoft Corporation', 'MS'], sameAs: 'https://www.wikidata.org/wiki/Q2283', type: 'Corporation', category: 'company' },
  { name: 'Amazon', aliases: ['Amazon.com', 'AWS'], sameAs: 'https://www.wikidata.org/wiki/Q3884', type: 'Corporation', category: 'company' },
  { name: 'Meta', aliases: ['Facebook', 'Meta Platforms'], sameAs: 'https://www.wikidata.org/wiki/Q380', type: 'Corporation', category: 'company' },
  { name: 'Netflix', aliases: ['Netflix Inc'], sameAs: 'https://www.wikidata.org/wiki/Q907311', type: 'Corporation', category: 'company' },
  { name: 'Tesla', aliases: ['Tesla Inc', 'Tesla Motors'], sameAs: 'https://www.wikidata.org/wiki/Q478214', type: 'Corporation', category: 'company' },
  { name: 'Adobe', aliases: ['Adobe Inc', 'Adobe Systems'], sameAs: 'https://www.wikidata.org/wiki/Q364612', type: 'Corporation', category: 'company' },
  { name: 'Salesforce', aliases: ['Salesforce.com'], sameAs: 'https://www.wikidata.org/wiki/Q752743', type: 'Corporation', category: 'company' },
  { name: 'Shopify', aliases: ['Shopify Inc'], sameAs: 'https://www.wikidata.org/wiki/Q2290913', type: 'Corporation', category: 'company' },
  { name: 'WordPress', aliases: ['WordPress', 'WP'], sameAs: 'https://www.wikidata.org/wiki/Q13166', type: 'Software', category: 'platform' },
  { name: 'WooCommerce', aliases: ['WooCommerce'], sameAs: 'https://www.wikidata.org/wiki/Q15149149', type: 'Software', category: 'platform' },
  { name: 'Supabase', aliases: ['Supabase'], sameAs: 'https://www.wikidata.org/wiki/Q109923065', type: 'Software', category: 'platform' },
  { name: 'Vercel', aliases: ['Vercel Inc'], sameAs: 'https://www.wikidata.org/wiki/Q105948622', type: 'Corporation', category: 'company' },
  { name: 'OpenAI', aliases: ['OpenAI'], sameAs: 'https://www.wikidata.org/wiki/Q113409897', type: 'Corporation', category: 'company' },

  // === PRODUCTS & PLATFORMS ===
  { name: 'Cohere', aliases: ['Cohere AI', 'Cohere'], sameAs: 'https://www.wikidata.org/wiki/Q108596194', type: 'Software', category: 'platform' },
  { name: 'Linux', aliases: ['Linux'], sameAs: 'https://www.wikidata.org/wiki/Q388', type: 'Software', category: 'platform' },
  { name: 'macOS', aliases: ['Mac OS', 'macOS'], sameAs: 'https://www.wikidata.org/wiki/Q14116', type: 'Software', category: 'platform' },
  { name: 'Windows', aliases: ['Microsoft Windows'], sameAs: 'https://www.wikidata.org/wiki/Q1406', type: 'Software', category: 'platform' },
  { name: 'Android', aliases: ['Android OS'], sameAs: 'https://www.wikidata.org/wiki/Q94', type: 'Software', category: 'platform' },
  { name: 'iOS', aliases: ['iOS'], sameAs: 'https://www.wikidata.org/wiki/Q48493', type: 'Software', category: 'platform' },
  { name: 'Chrome', aliases: ['Google Chrome'], sameAs: 'https://www.wikidata.org/wiki/Q76807', type: 'Software', category: 'platform' },
  { name: 'Firefox', aliases: ['Mozilla Firefox'], sameAs: 'https://www.wikidata.org/wiki/Q698', type: 'Software', category: 'platform' },
  { name: 'Safari', aliases: ['Apple Safari'], sameAs: 'https://www.wikidata.org/wiki/Q35773', type: 'Software', category: 'platform' },
  { name: 'Node.js', aliases: ['Node', 'NodeJS'], sameAs: 'https://www.wikidata.org/wiki/Q756100', type: 'Software', category: 'platform' },
  { name: 'React', aliases: ['React.js', 'ReactJS'], sameAs: 'https://www.wikidata.org/wiki/Q19841877', type: 'Software', category: 'platform' },
  { name: 'TypeScript', aliases: ['TypeScript'], sameAs: 'https://www.wikidata.org/wiki/Q1054727', type: 'ProgrammingLanguage', category: 'technology' },
  { name: 'JavaScript', aliases: ['JS', 'ECMAScript'], sameAs: 'https://www.wikidata.org/wiki/Q2005', type: 'ProgrammingLanguage', category: 'technology' },
  { name: 'Python', aliases: ['Python'], sameAs: 'https://www.wikidata.org/wiki/Q28865', type: 'ProgrammingLanguage', category: 'technology' },
  { name: 'PostgreSQL', aliases: ['Postgres', 'PostgresQL'], sameAs: 'https://www.wikidata.org/wiki/Q192490', type: 'Software', category: 'platform' },
  { name: 'Docker', aliases: ['Docker'], sameAs: 'https://www.wikidata.org/wiki/Q18434367', type: 'Software', category: 'platform' },
  { name: 'GitHub', aliases: ['GitHub'], sameAs: 'https://www.wikidata.org/wiki/Q364', type: 'Corporation', category: 'platform' },
  { name: 'GitLab', aliases: ['GitLab'], sameAs: 'https://www.wikidata.org/wiki/Q16619365', type: 'Corporation', category: 'platform' },
  { name: 'Slack', aliases: ['Slack'], sameAs: 'https://www.wikidata.org/wiki/Q5655514', type: 'Software', category: 'platform' },
  { name: 'Notion', aliases: ['Notion'], sameAs: 'https://www.wikidata.org/wiki/Q96414218', type: 'Software', category: 'platform' },

  // === MARKETING & SEO ===
  { name: 'Google Analytics', aliases: ['GA', 'GA4'], sameAs: 'https://www.wikidata.org/wiki/Q5515343', type: 'Software', category: 'marketing' },
  { name: 'Google Search Console', aliases: ['Search Console', 'GSC'], sameAs: 'https://www.wikidata.org/wiki/Q20981673', type: 'Software', category: 'marketing' },
  { name: 'Google Ads', aliases: ['Google AdWords', 'AdWords'], sameAs: 'https://www.wikidata.org/wiki/Q51796', type: 'Software', category: 'marketing' },
  { name: 'Ahrefs', aliases: ['Ahrefs'], sameAs: 'https://www.wikidata.org/wiki/Q4695066', type: 'Software', category: 'marketing' },
  { name: 'SEMrush', aliases: ['SEMrush'], sameAs: 'https://www.wikidata/wiki/Q7389445', type: 'Software', category: 'marketing' },
  { name: 'Moz', aliases: ['Moz'], sameAs: 'https://www.wikidata.org/wiki/Q6928647', type: 'Software', category: 'marketing' },
  { name: 'Yoast SEO', aliases: ['Yoast'], sameAs: 'https://www.wikidata.org/wiki/Q8054670', type: 'Software', category: 'marketing' },
  { name: 'RankMath', aliases: ['Rank Math'], sameAs: 'https://www.wikidata.org/wiki/Q96382060', type: 'Software', category: 'marketing' },
  { name: 'Mailchimp', aliases: ['Mailchimp'], sameAs: 'https://www.wikidata.org/wiki/Q6735527', type: 'Software', category: 'marketing' },
  { name: 'Canva', aliases: ['Canva'], sameAs: 'https://www.wikidata.org/wiki/Q28320800', type: 'Software', category: 'marketing' },
  { name: 'Figma', aliases: ['Figma'], sameAs: 'https://www.wikidata.org/wiki/Q29457830', type: 'Software', category: 'marketing' },
  { name: 'Google Tag Manager', aliases: ['GTM'], sameAs: 'https://www.wikidata.org/wiki/Q15726138', type: 'Software', category: 'marketing' },
  { name: 'Cloudflare', aliases: ['Cloudflare'], sameAs: 'https://www.wikidata.org/wiki/Q11412', type: 'Corporation', category: 'platform' },

  // === AI & ML ===
  { name: 'Artificial Intelligence', aliases: ['AI', 'artificial intelligence'], sameAs: 'https://www.wikidata.org/wiki/Q11660', type: 'Thing', category: 'technology' },
  { name: 'Machine Learning', aliases: ['ML', 'machine learning'], sameAs: 'https://www.wikidata.org/wiki/Q2539', type: 'Thing', category: 'technology' },
  { name: 'Natural Language Processing', aliases: ['NLP'], sameAs: 'https://www.wikidata.org/wiki/Q30642', type: 'Thing', category: 'technology' },
  { name: 'Large Language Model', aliases: ['LLM', 'large language model'], sameAs: 'https://www.wikidata.org/wiki/Q115826509', type: 'Thing', category: 'technology' },
  { name: 'ChatGPT', aliases: ['ChatGPT'], sameAs: 'https://www.wikidata.org/wiki/Q115905650', type: 'Software', category: 'ai' },
  { name: 'GPT-4', aliases: ['GPT 4'], sameAs: 'https://www.wikidata.org/wiki/Q116983427', type: 'Software', category: 'ai' },
  { name: 'DALL-E', aliases: ['DALLE', 'DALL E'], sameAs: 'https://www.wikidata.org/wiki/Q106611723', type: 'Software', category: 'ai' },
  { name: 'Midjourney', aliases: ['Midjourney'], sameAs: 'https://www.wikidata.org/wiki/Q113540677', type: 'Software', category: 'ai' },
  { name: 'Stable Diffusion', aliases: ['Stable Diffusion'], sameAs: 'https://www.wikidata.org/wiki/Q112190737', type: 'Software', category: 'ai' },
  { name: 'TensorFlow', aliases: ['TensorFlow'], sameAs: 'https://www.wikidata.org/wiki/Q23044559', type: 'Software', category: 'ai' },
  { name: 'PyTorch', aliases: ['PyTorch'], sameAs: 'https://www.wikidata.org/wiki/Q61471809', type: 'Software', category: 'ai' },

  // === AUDIO (headphones, etc) ===
  { name: 'Sony', aliases: ['Sony Corporation', 'Sony'], sameAs: 'https://www.wikidata.org/wiki/Q41187', type: 'Corporation', category: 'company' },
  { name: 'Bose', aliases: ['Bose Corporation'], sameAs: 'https://www.wikidata.org/wiki/Q849964', type: 'Corporation', category: 'company' },
  { name: 'Sennheiser', aliases: ['Sennheiser'], sameAs: 'https://www.wikidata.org/wiki/Q691321', type: 'Corporation', category: 'company' },
  { name: 'Audio-Technica', aliases: ['Audio Technica'], sameAs: 'https://www.wikidata.org/wiki/Q759737', type: 'Corporation', category: 'company' },
  { name: 'JBL', aliases: ['JBL'], sameAs: 'https://www.wikidata.org/wiki/Q1245823', type: 'Brand', category: 'company' },
  { name: 'Beats', aliases: ['Beats by Dre', 'Beats Electronics'], sameAs: 'https://www.wikidata.org/wiki/Q813150', type: 'Brand', category: 'company' },
  { name: 'AKG', aliases: ['AKG Acoustics'], sameAs: 'https://www.wikidata.org/wiki/Q294669', type: 'Brand', category: 'company' },

  // === CONFERENCES & STANDARDS ===
  { name: 'SEO', aliases: ['Search Engine Optimization', 'search engine optimization'], sameAs: 'https://www.wikidata.org/wiki/Q180711', type: 'Thing', category: 'marketing' },
  { name: 'JSON-LD', aliases: ['JSON LD', 'json-ld'], sameAs: 'https://www.wikidata.org/wiki/Q180711', type: 'Thing', category: 'technology' },
  { name: 'Schema.org', aliases: ['Schema', 'schema.org'], sameAs: 'https://www.wikidata.org/wiki/Q180711', type: 'Thing', category: 'technology' },
  { name: 'Core Web Vitals', aliases: ['CWV', 'Web Vitals'], sameAs: 'https://www.wikidata.org/wiki/Q106923880', type: 'Thing', category: 'technology' },
  { name: 'GDPR', aliases: ['General Data Protection Regulation'], sameAs: 'https://www.wikidata.org/wiki/Q21469343', type: 'Thing', category: 'legal' },
  { name: 'REST', aliases: ['REST API', 'RESTful'], sameAs: 'https://www.wikidata.org/wiki/Q749107', type: 'Thing', category: 'technology' },
  { name: 'API', aliases: ['Application Programming Interface'], sameAs: 'https://www.wikidata.org/wiki/Q165194', type: 'Thing', category: 'technology' },
  { name: 'HTTPS', aliases: ['HTTP Secure'], sameAs: 'https://www.wikidata.org/wiki/Q839486', type: 'Thing', category: 'technology' },
  { name: 'DNS', aliases: ['Domain Name System'], sameAs: 'https://www.wikidata.org/wiki/Q8767', type: 'Thing', category: 'technology' },
  { name: 'SaaS', aliases: ['Software as a Service'], sameAs: 'https://www.wikidata.org/wiki/Q932340', type: 'Thing', category: 'business' },
  { name: 'CMS', aliases: ['Content Management System'], sameAs: 'https://www.wikidata.org/wiki/Q131103', type: 'Thing', category: 'technology' },
  { name: 'CDN', aliases: ['Content Delivery Network'], sameAs: 'https://www.wikidata.org/wiki/Q131103', type: 'Thing', category: 'technology' },
  { name: 'SSR', aliases: ['Server Side Rendering', 'server-side rendering'], sameAs: 'https://www.wikidata.org/wiki/Q131103', type: 'Thing', category: 'technology' },
  { name: 'CLS', aliases: ['Cumulative Layout Shift'], sameAs: 'https://www.wikidata.org/wiki/Q106923880', type: 'Thing', category: 'technology' },
  { name: 'LCP', aliases: ['Largest Contentful Paint'], sameAs: 'https://www.wikidata.org/wiki/Q106923880', type: 'Thing', category: 'technology' },
  { name: 'FID', aliases: ['First Input Delay'], sameAs: 'https://www.wikidata.org/wiki/Q106923880', type: 'Thing', category: 'technology' },
  { name: 'INP', aliases: ['Interaction to Next Paint'], sameAs: 'https://www.wikidata.org/wiki/Q106923880', type: 'Thing', category: 'technology' },

  // === AFFILIATE & ECOMMERCE ===
  { name: 'Amazon Associates', aliases: ['Amazon Affiliate'], sameAs: 'https://www.wikidata.org/wiki/Q4740894', type: 'Software', category: 'affiliate' },
  { name: 'ShareASale', aliases: ['Share A Sale'], sameAs: 'https://www.wikidata.org/wiki/Q7489235', type: 'Software', category: 'affiliate' },
  { name: 'Commission Junction', aliases: ['CJ Affiliate'], sameAs: 'https://www.wikidata.org/wiki/Q5152328', type: 'Software', category: 'affiliate' },
  { name: 'Rakuten', aliases: ['Rakuten Marketing'], sameAs: 'https://www.wikidata.org/wiki/Q1042136', type: 'Corporation', category: 'affiliate' },
  { name: 'Impact', aliases: ['Impact Radius'], sameAs: 'https://www.wikidata.org/wiki/Q6004749', type: 'Software', category: 'affiliate' },

  // === DEVICES & HARDWARE ===
  { name: 'AirPods', aliases: ['Apple AirPods'], sameAs: 'https://www.wikidata.org/wiki/Q25641333', type: 'Product', category: 'hardware' },
  { name: 'AirPods Pro', aliases: ['Apple AirPods Pro'], sameAs: 'https://www.wikidata.org/wiki/Q96414219', type: 'Product', category: 'hardware' },
  { name: 'iPhone', aliases: ['iPhone'], sameAs: 'https://www.wikidata.org/wiki/Q276', type: 'Product', category: 'hardware' },
  { name: 'iPad', aliases: ['iPad'], sameAs: 'https://www.wikidata.org/wiki/Q279', type: 'Product', category: 'hardware' },
  { name: 'MacBook', aliases: ['MacBook', 'MacBook Pro', 'MacBook Air'], sameAs: 'https://www.wikidata.org/wiki/Q3066648', type: 'Product', category: 'hardware' },
  { name: 'Pixel', aliases: ['Google Pixel'], sameAs: 'https://www.wikidata.org/wiki/Q3066648', type: 'Product', category: 'hardware' },
  { name: 'Galaxy', aliases: ['Samsung Galaxy'], sameAs: 'https://www.wikidata.org/wiki/Q3066648', type: 'Product', category: 'hardware' },

  // === PEOPLE ===
  { name: 'Elon Musk', aliases: ['Elon'], sameAs: 'https://www.wikidata.org/wiki/Q317521', type: 'Person', category: 'person' },
  { name: 'Sam Altman', aliases: ['Samuel Altman'], sameAs: 'https://www.wikidata.org/wiki/Q218165', type: 'Person', category: 'person' },
  { name: 'Satya Nadella', aliases: ['Nadella'], sameAs: 'https://www.wikidata.org/wiki/Q7426554', type: 'Person', category: 'person' },
  { name: 'Tim Cook', aliases: ['Timothy Cook'], sameAs: 'https://www.wikidata.org/wiki/Q7426554', type: 'Person', category: 'person' },
  { name: 'Mark Zuckerberg', aliases: ['Zuckerberg'], sameAs: 'https://www.wikidata.org/wiki/Q36215', type: 'Person', category: 'person' },
  { name: 'Jeff Bezos', aliases: ['Bezos'], sameAs: 'https://www.wikidata.org/wiki/Q312556', type: 'Person', category: 'person' },
  { name: 'Larry Page', aliases: ['Lawrence Page'], sameAs: 'https://www.wikidata.org/wiki/Q92738', type: 'Person', category: 'person' },
  { name: 'Sergey Brin', aliases: ['Brin'], sameAs: 'https://www.wikidata.org/wiki/Q92764', type: 'Person', category: 'person' },
];

const ENTITY_INDEX = new Map<string, Entity>();

for (const entity of ENTITIES) {
  ENTITY_INDEX.set(entity.name.toLowerCase(), entity);
  for (const alias of entity.aliases) {
    ENTITY_INDEX.set(alias.toLowerCase(), entity);
  }
}

export function getEntity(text: string): Entity | undefined {
  const clean = text.replace(/[.,!?;:'"()[\]{}]/g, '').trim().toLowerCase();
  return ENTITY_INDEX.get(clean);
}

export function findEntities(content: string): Entity[] {
  const found = new Map<string, Entity>();
  const lower = content.toLowerCase();

  const candidates = Array.from(ENTITY_INDEX.entries()).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [key, entity] of candidates) {
    if (found.has(entity.name)) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(content)) {
      found.set(entity.name, entity);
    }
  }

  return Array.from(found.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getEntitySchema(entities: Entity[]): Record<string, any>[] {
  return entities.map(entity => ({
    '@context': 'https://schema.org',
    '@type': entity.type,
    name: entity.name,
    sameAs: entity.sameAs,
    ...(entity.description ? { description: entity.description } : {}),
  }));
}

export function getAllEntities(): Entity[] {
  return ENTITIES;
}

export function getEntitiesByCategory(category: string): Entity[] {
  return ENTITIES.filter(e => e.category === category);
}
