import { Knock } from '@knocklabs/node';

const TEST_KEY = 'sk_test__b2-yC-bsPS_t23f35WmasdqhwPXCndVzb1lQyjDs-Q';
const PROD_KEY = 'sk_lOoSlwSlfhCWTK3pm6tQQf-2h9hnKMM6PW4gCxiyszQ';
const RECIPIENT = [{ id: 'verify@dawnwire.com', collection: 'default' }];
const DATA = { productName: 'Beauty of Joseon Glow Serum', brand: 'BoJ', newPrice: 11.49, oldPrice: 15.99, savings: 4.5, productUrl: 'https://www.dawnwire.com/products/beauty-of-joseon-glow-serum' };

async function run(label, key) {
  const knock = new Knock({ apiKey: key });
  console.log(`\n=== ${label} ===`);
  for (const wf of ['price-drop', 'deal-alert']) {
    try {
      const res = await knock.workflows.trigger(wf, { recipients: RECIPIENT, data: DATA });
      const runId = res.workflow_run_id || res.id || 'n/a';
      let msgs = [];
      try {
        const page = await knock.messages.list({ workflow_run_id: runId });
        msgs = page.entries || [];
      } catch (e) { console.log(`  ${wf}: messages.list error: ${e.message}`); }
      console.log(`  ${wf}: run=${String(runId).slice(0, 12)}… messages=${msgs.length} ${msgs[0] ? `block0=${JSON.stringify(msgs[0].blocks?.[0] || msgs[0]).slice(0, 140)}` : ''}`);
    } catch (e) {
      console.log(`  ${wf}: FAILED — ${e.message}`);
    }
  }
  for (const feedId of ['e36a561c-62bf-4387-8084-2aafddb1ee2e', 'default']) {
    try {
      const items = [];
      for await (const page of knock.users.feeds.listItems('verify@dawnwire.com', feedId)) items.push(...page.entries);
      console.log(`  feed '${feedId}' items: ${items.length}`);
      for (const it of items.slice(0, 3)) {
        console.log(`    - ${it.source} | ${JSON.stringify(it.blocks?.[0]).slice(0, 160)}`);
      }
    } catch (e) {
      console.log(`  feed '${feedId}' ERROR: ${e.message}`);
    }
  }
}

await run('TEST (development)', TEST_KEY);
await run('PRODUCTION', PROD_KEY);
process.exit(0);
