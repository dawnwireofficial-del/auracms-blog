import dotenv from 'dotenv';
dotenv.config({ path: 'D:/auracms---ai-powered-blog-platform (1)/.env.knock.prod.local' });
import { Knock } from '@knocklabs/node';

const prod = new Knock({ apiKey: process.env.KNOCK_API_KEY });

const runs = ['bfb05138-924b-5b05-99a0-c27f7739250a', 'b0536ec5-585c-508f-9428-91f8cf68bc63'];
for (const run of runs) {
  const items = [];
  for await (const page of prod.messages.list({ workflow_run_id: run })) {
    items.push(...page.entries);
  }
  console.log(`run ${run.slice(0, 8)}: ${items.length} messages`);
  for (const m of items) {
    console.log(`   channel=${m.channel_id} | status=${m.status} | inserted_at=${String(m.inserted_at).slice(0, 19)}`);
  }
}
process.exit(0);
