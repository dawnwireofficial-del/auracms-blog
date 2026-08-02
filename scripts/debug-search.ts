import { extractAmazonProductData } from '../server/amazon-extractor';

(async () => {
  const asin = 'B07Z9Y4M3C';
  const d = await extractAmazonProductData(asin, 'dawnwire-20').catch((e: any) => ({ err: e.message }));
  if ((d as any).err) { console.log('ERR:', (d as any).err); process.exit(0); }
  const p = d as any;
  console.log('=== B07Z9Y4M3C');
  console.log('mainCategory:', p.mainCategory, '| subcategory:', p.subcategory);
  console.log('bestFor:', p.bestFor);
  console.log('categoryPath:', p.categoryPath);
  console.log('BSR:', p.bestSellersRank);
  console.log('department:', p.department);
})();
