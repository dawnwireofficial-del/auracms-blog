export interface ActivityEvent {
  id?: string;
  type: 'PRODUCT_SEARCH' | 'WISHLIST_ADD' | 'AFFILIATE_CLICK' | 'PRICE_ALERT_CREATED' | 'PRODUCT_VIEW';
  productId?: string;
  productTitle?: string;
  userEmail?: string;
  details: string;
  timestamp: string;
}

export const logActivityEvent = async (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
  try {
    await fetch('/api/public/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (err) {
    // Activity logging is non-critical
  }
};

export const fetchRecentActivityEvents = async (max: number = 50): Promise<ActivityEvent[]> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dawnwire_auth_token') : null;
    const res = await fetch(`/api/admin/analytics/recent-activity?days=7`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    // Fallback
  }
  return [];
};
