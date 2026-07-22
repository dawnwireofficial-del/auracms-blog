import React from 'react';
import { useData } from 'vike-react/useData';
import { usePageContext } from 'vike-react/usePageContext';
import { Head } from 'vike-react/Head';
import type { Data } from './+data';
import App from '../src/App';
import { resolveRouteFromPath } from '../src/utils/routeResolver';
import { normalizeProduct } from '../src/utils/productMapper';

export default function Page() {
  const data = useData<Data>();
  const pageContext = usePageContext();
  const path = pageContext.urlPathname || pageContext.urlOriginal || '/';
  const initialRoute = resolveRouteFromPath(path);

  let jsonLd: any = null;
  if (initialRoute.name === 'review' && initialRoute.param && data?.productReviews) {
    const rawProd = data.productReviews.find((p: any) => p && (p.slug === initialRoute.param || p.id === initialRoute.param));
    if (rawProd) {
      const p = normalizeProduct(rawProd);
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.productName,
        image: p.productImage ? [p.productImage] : undefined,
        description: p.reviewSummary || p.productName,
        brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: (p.price || '0').toString().replace(/[^0-9.]/g, '') || '0',
          availability: p.stockStatus === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          url: p.affiliateUrl || `https://www.dawnwire.com/products/${p.slug}`
        },
        aggregateRating: (p.rating || 0) > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: p.rating,
          reviewCount: 1,
          bestRating: 5,
          worstRating: 1
        } : undefined
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </Head>
      )}
      <App initialData={data} initialRoute={initialRoute} />
    </>
  );
}
