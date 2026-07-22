import { describe, it, expect } from 'vitest';
import { normalizeProduct, normalizeProducts } from '../src/utils/productMapper';

describe('normalizeProduct', () => {
  it('maps snake_case database fields to normalized camelCase model', () => {
    const raw = {
      id: 'prod-123',
      slug: 'graco-slimfit-car-seat',
      product_name: 'Graco Slimfit Car Seat',
      brand: 'Graco',
      product_image: 'https://m.media-amazon.com/images/I/81FD3xI82ZL.jpg',
      affiliate_url: 'https://www.amazon.com/dp/B0DHLPQ3B1',
      price: '$196.99',
      original_price: '$219.99',
      rating: 4.8,
      best_for: 'Space Saving Car Seats',
      stock_status: 'in_stock',
      cta_text: 'Buy on Amazon',
      status: 'published',
      created_at: '2026-07-21T00:00:00.000Z',
    };

    const normalized = normalizeProduct(raw);

    expect(normalized.id).toBe('prod-123');
    expect(normalized.slug).toBe('graco-slimfit-car-seat');
    expect(normalized.productName).toBe('Graco Slimfit Car Seat');
    expect(normalized.brand).toBe('Graco');
    expect(normalized.productImage).toBe('https://m.media-amazon.com/images/I/81FD3xI82ZL.jpg');
    expect(normalized.affiliateUrl).toBe('https://www.amazon.com/dp/B0DHLPQ3B1');
    expect(normalized.price).toBe('$196.99');
    expect(normalized.originalPrice).toBe('$219.99');
    expect(normalized.rating).toBe(4.8);
    expect(normalized.bestFor).toBe('Space Saving Car Seats');
    expect(normalized.stockStatus).toBe('in_stock');
    expect(normalized.ctaText).toBe('Buy on Amazon');
    expect(normalized.status).toBe('published');
  });

  it('handles camelCase objects seamlessly', () => {
    const raw = {
      id: 'prod-456',
      productName: 'Beauty of Joseon Eye Serum',
      productImage: 'https://m.media-amazon.com/images/I/51PbZMgofCL.jpg',
      rating: 4.3,
      status: 'published',
    };

    const normalized = normalizeProduct(raw);

    expect(normalized.id).toBe('prod-456');
    expect(normalized.productName).toBe('Beauty of Joseon Eye Serum');
    expect(normalized.productImage).toBe('https://m.media-amazon.com/images/I/51PbZMgofCL.jpg');
    expect(normalized.rating).toBe(4.3);
  });

  it('safely normalizes missing or invalid ratings to 0', () => {
    const unrated = normalizeProduct({ id: '1', product_name: 'Unrated Item', rating: null });
    expect(unrated.rating).toBe(0);

    const invalid = normalizeProduct({ id: '2', product_name: 'Invalid Item', rating: -5 });
    expect(invalid.rating).toBe(0);
  });

  it('normalizes arrays of products', () => {
    const items = normalizeProducts([
      { id: '1', product_name: 'Product 1' },
      { id: '2', product_name: 'Product 2' },
    ]);
    expect(items.length).toBe(2);
    expect(items[0].productName).toBe('Product 1');
    expect(items[1].productName).toBe('Product 2');
  });
});
