import { describe, it, expect } from 'vitest';
import { resolveRouteFromPath } from '../src/utils/routeResolver';

describe('routeResolver', () => {
  it('resolves /products to products route', () => {
    expect(resolveRouteFromPath('/products')).toEqual({ name: 'products' });
  });

  it('maps bare /review and /reviews to products route instead of empty review', () => {
    expect(resolveRouteFromPath('/review')).toEqual({ name: 'products' });
    expect(resolveRouteFromPath('/review/')).toEqual({ name: 'products' });
    expect(resolveRouteFromPath('/reviews')).toEqual({ name: 'products' });
    expect(resolveRouteFromPath('/reviews/')).toEqual({ name: 'products' });
  });

  it('resolves product review detail page with slug', () => {
    expect(resolveRouteFromPath('/review/graco-car-seat')).toEqual({
      name: 'review',
      param: 'graco-car-seat'
    });
  });

  it('resolves blog post detail page with slug', () => {
    expect(resolveRouteFromPath('/post/sample-post')).toEqual({
      name: 'post',
      param: 'sample-post'
    });
  });
});
