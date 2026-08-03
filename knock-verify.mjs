import { Knock } from '@knocklabs/node';

const workflows = ['price-drop', 'deal-alert'];
const recipient = [{ id: 'verify@dawnwire.com', collection: 'default' }];

console.log('=== TEST environment ===');
const testKnock = new Knock({ apiKey: 'sk_test__b2-yC-bsPS_t23f35WmasdqhwPXCndVzb1lQyjDs-Q' });
for (const wf of workflows) {
  try {
    const res = await testKnock.workflows.trigger(wf, { recipients: recipient, data: { productName: 'Verify', newPrice: 9.99, productUrl: 'https://www.dawnwire.com' } });
    console.log(`${wf}: OK —`, JSON.stringify(res));
  } catch (e) {
    console.log(`${wf}: FAILED — ${e.message}`);
  }
}

console.log('\n=== PRODUCTION environment ===');
import dotenv from 'dotenv';
dotenv.config({ path: 'D:/auracms---ai-powered-blog-platform (1)/.env.knock.prod.local' });
const prodKnock = new Knock({ apiKey: process.env.KNOCK_API_KEY });
for (const wf of workflows) {
  try {
    const res = await prodKnock.workflows.trigger(wf, { recipients: recipient, data: { productName: 'Verify', newPrice: 9.99, productUrl: 'https://www.dawnwire.com' } });
    console.log(`${wf}: OK —`, JSON.stringify(res));
  } catch (e) {
    console.log(`${wf}: FAILED — ${e.message}`);
  }
}
process.exit(0);
