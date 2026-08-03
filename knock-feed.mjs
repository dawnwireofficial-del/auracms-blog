import dotenv from 'dotenv';
dotenv.config({ path: 'D:/auracms---ai-powered-blog-platform (1)/.env.knock.prod.local' });
import { Knock } from '@knocklabs/node';

const prod = new Knock({ apiKey: process.env.KNOCK_API_KEY });

const items = [];
for await (const page of prod.users.feeds.listItems('verify@dawnwire.com', 'default')) {
  items.push(...page.entries);
}
console.log(`feed items for verify@dawnwire.com: ${items.length}`);
for (const it of items) {
  const firstBlock = it.blocks?.[0];
  console.log(`  - ${it.source} | inserted=${String(it.inserted_at).slice(0, 19)} | blocks=${(it.blocks || []).length} | block[0]=${JSON.stringify(firstBlock).slice(0, 160)}`);
}
process.exit(0);
