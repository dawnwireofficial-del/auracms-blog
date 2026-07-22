export interface RouteState {
  name: string;
  param?: string;
}

export function resolveRouteFromPath(path: string): RouteState {
  if (!path) return { name: 'home' };
  
  // Strip query string and hash
  const cleanPath = path.split('?')[0].split('#')[0] || '/';

  if (cleanPath === '/products' || cleanPath === '/products/') return { name: 'products' };
  if (cleanPath === '/review' || cleanPath === '/review/' || cleanPath === '/reviews' || cleanPath === '/reviews/') return { name: 'products' };
  if (cleanPath.startsWith('/products/category/')) return { name: 'category', param: cleanPath.substring(19) };
  if (cleanPath.startsWith('/products/')) return { name: 'review', param: cleanPath.substring(10) };
  if (cleanPath.startsWith('/review/')) return { name: 'review', param: cleanPath.substring(8) };
  if (cleanPath.startsWith('/product/')) return { name: 'review', param: cleanPath.substring(9) };
  if (cleanPath.startsWith('/post/')) return { name: 'post', param: cleanPath.substring(6) };
  if (cleanPath.startsWith('/portfolio/')) return { name: 'portfolio', param: cleanPath.substring(11) };
  if (cleanPath === '/portfolio') return { name: 'portfolio', param: '' };
  if (cleanPath.startsWith('/category/')) return { name: 'posts-by-category', param: cleanPath.substring(10) };
  if (cleanPath.startsWith('/page/')) return { name: 'page', param: cleanPath.substring(6) };
  if (cleanPath === '/contact') return { name: 'contact' };
  if (cleanPath === '/admin') return { name: 'admin' };
  if (cleanPath === '/about') return { name: 'about' };
  if (cleanPath === '/services') return { name: 'services' };
  if (cleanPath.startsWith('/services/')) return { name: 'service-detail', param: cleanPath.substring(10) };
  if (cleanPath === '/advertise') return { name: 'advertise' };
  if (cleanPath === '/submit-product') return { name: 'submit-product' };
  if (cleanPath === '/case-studies') return { name: 'case-studies' };
  if (cleanPath === '/newsletter') return { name: 'newsletter' };
  if (cleanPath === '/editorial-policy') return { name: 'editorial-policy' };
  if (cleanPath === '/affiliate-disclosure') return { name: 'affiliate-disclosure' };
  if (cleanPath === '/privacy') return { name: 'privacy' };
  if (cleanPath === '/terms') return { name: 'terms' };
  if (cleanPath === '/articles') return { name: 'articles' };
  if (cleanPath.startsWith('/cluster/')) return { name: 'cluster', param: cleanPath.substring(9) };
  if (cleanPath.startsWith('/buyers-guide/')) return { name: 'buyers-guide', param: cleanPath.substring(14) };
  if (cleanPath === '/buyers-guide') return { name: 'buyers-guide' };
  if (cleanPath.startsWith('/browse/')) return { name: 'category', param: cleanPath.substring(8) };
  if (cleanPath === '/categories') return { name: 'categories' };
  if (cleanPath === '/deals') return { name: 'deals' };
  if (cleanPath === '/wishlist') return { name: 'wishlist' };
  if (cleanPath === '/buying-guides') return { name: 'buying-guides' };
  if (cleanPath === '/recently-viewed') return { name: 'recently-viewed' };
  if (cleanPath.startsWith('/search')) {
    try {
      const url = new URL(path, 'https://dummy.local');
      const q = url.searchParams.get('q') || '';
      return { name: 'search', param: q };
    } catch {
      return { name: 'search', param: '' };
    }
  }

  return { name: 'home' };
}
