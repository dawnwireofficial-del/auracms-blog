export interface WishlistRecord {
  id: string;
  productId: string;
  userId?: string;
  sessionId?: string;
  createdAt?: string;
  product?: any;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('sessionId');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('sessionId', sid);
  }
  return sid;
}

export function getLocalWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dw_wishlist_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalWishlistIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dw_wishlist_ids', JSON.stringify([...new Set(ids)]));
  } catch {}
}

export async function fetchWishlist(user?: any): Promise<WishlistRecord[]> {
  const sid = getSessionId();
  const userIdParam = user?.id ? `&userId=${user.id}` : '';
  const res = await fetch(`/api/public/wishlist?sessionId=${sid}${userIdParam}`);
  if (res.ok) {
    const items: WishlistRecord[] = await res.json();
    if (Array.isArray(items)) {
      setLocalWishlistIds(items.map(i => i.productId));
      return items;
    }
  }
  return [];
}

export async function toggleWishlist(productId: string, user?: any): Promise<{ saved: boolean; wishlistId?: string }> {
  const sid = getSessionId();
  const currentItems = await fetchWishlist(user);
  const existing = currentItems.find(i => i.productId === productId);

  if (existing) {
    // Remove
    await fetch(`/api/public/wishlist/${existing.id}`, { method: 'DELETE' });
    const local = getLocalWishlistIds().filter(id => id !== productId);
    setLocalWishlistIds(local);
    return { saved: false };
  } else {
    // Add
    const res = await fetch('/api/public/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        userId: user?.id || null,
        sessionId: sid,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      const local = [...getLocalWishlistIds(), productId];
      setLocalWishlistIds(local);
      return { saved: true, wishlistId: created.id };
    }
    return { saved: false };
  }
}

export async function mergeGuestWishlist(user: any): Promise<void> {
  if (!user || !user.id) return;
  const sid = getSessionId();
  const localIds = getLocalWishlistIds();
  if (localIds.length === 0) return;

  try {
    await fetch('/api/public/wishlist/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId: sid, productIds: localIds }),
    });
  } catch (e) {
    console.error('Wishlist merge failed:', e);
  }
}
