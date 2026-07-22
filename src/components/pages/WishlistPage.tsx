import React, { useState, useEffect } from 'react';
import { Heart, Trash2, ExternalLink, ShoppingBag, AlertCircle, Star, Scale } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchWishlist, mergeGuestWishlist, getLocalWishlistIds, setLocalWishlistIds } from '../../utils/wishlist';
import { normalizeProduct } from '../../utils/productMapper';

export default function WishlistPage({ onNavigate, user }: { onNavigate: (r: string, p?: string) => void, user: any }) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        await mergeGuestWishlist(user);
      }
      const items = await fetchWishlist(user);
      setWishlistItems(items);
    } catch (e: any) {
      console.error('Failed to load wishlist:', e);
      setError(e.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const removeFromWishlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const itemToRemove = wishlistItems.find(item => item.id === id);
      const res = await fetch(`/api/public/wishlist/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== id));
        if (itemToRemove?.productId) {
          const local = getLocalWishlistIds().filter(pid => pid !== itemToRemove.productId);
          setLocalWishlistIds(local);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wishlist?')) return;
    try {
      for (const item of wishlistItems) {
        await fetch(`/api/public/wishlist/${item.id}`, { method: 'DELETE' });
      }
      setWishlistItems([]);
      setLocalWishlistIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-sm font-bold mb-4">
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
            Your Saved Items
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-4">
            My Wishlist
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            Products you're keeping an eye on. Come back when you're ready to buy!
          </p>

          {wishlistItems.length > 0 && (
            <button
              onClick={clearAllWishlist}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all wishlist items
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-[#246BFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-red-200 dark:border-red-900/30 p-8">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-slate-800 dark:text-white font-bold mb-4">{error}</p>
            <button onClick={loadData} className="px-5 py-2.5 bg-[#246BFF] text-white font-bold rounded-xl text-xs">
              Retry
            </button>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Your wishlist is empty</h3>
            <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
              Start browsing our top picks and deals to add items to your wishlist.
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white px-6 py-3 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item, i) => {
              const prod = normalizeProduct(item.product);
              const name = prod.productName || `Product ID: ${item.productId}`;
              const image = prod.productImage;
              const price = prod.price;
              const origPrice = prod.originalPrice;
              const brand = prod.brand;
              const rating = prod.rating;
              const slug = prod.slug || item.productId;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-[#246BFF]/10 transition-all group flex flex-col relative"
                >
                  <button
                    onClick={(e) => removeFromWishlist(item.id, e)}
                    className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-black/70 hover:bg-red-500 hover:text-white p-2 rounded-full text-slate-500 dark:text-zinc-400 transition-colors backdrop-blur-sm shadow-sm cursor-pointer"
                    aria-label="Remove from wishlist"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div
                    onClick={() => onNavigate('review', slug)}
                    className="relative aspect-[4/3] bg-slate-50 dark:bg-zinc-950 p-6 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-zinc-700" />
                    )}
                    {(rating || 0) > 0 && (
                      <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(rating || 0).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {brand && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{brand}</span>
                    )}
                    <h3
                      onClick={() => onNavigate('review', slug)}
                      className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2 flex-1 group-hover:text-[#246BFF] transition-colors cursor-pointer"
                    >
                      {name}
                    </h3>

                    {price && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">{price}</span>
                        {origPrice && origPrice !== price && (
                          <span className="text-xs text-red-500 line-through">{origPrice}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-2">
                      <button
                        onClick={() => onNavigate('review', slug)}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-[#246BFF] text-white hover:bg-[#1A5AD6] transition-all cursor-pointer shadow-sm"
                      >
                        View Review <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
