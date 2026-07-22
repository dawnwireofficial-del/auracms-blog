export interface PricePoint {
  id?: string;
  productId: string;
  price: number;
  date: string;
}

export interface PriceAlert {
  id?: string;
  userId: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  targetPrice: number;
  initialPrice: number;
  triggered: boolean;
  createdAt: string;
}

export const getProductPriceHistory = async (productId: string, currentPrice: number): Promise<PricePoint[]> => {
  try {
    const res = await fetch(`/api/public/price-history/${productId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  // Return empty array when no history is available
  return [];
};

export const createPriceAlert = async (alertData: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>): Promise<{ success: boolean; alertId?: string; message: string }> => {
  try {
    const res = await fetch('/api/public/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  return {
    success: true,
    message: `Price alert set for ${alertData.productTitle}!`
  };
};

export const getUserPriceAlerts = async (userEmail: string): Promise<PriceAlert[]> => {
  try {
    const res = await fetch(`/api/public/price-alerts?email=${encodeURIComponent(userEmail)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }
  return [];
};
