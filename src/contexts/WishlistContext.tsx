import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: string[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load wishlist from database when user logs in
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistIds([]);
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setWishlistIds(data.map((item) => item.product_id));
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error("请先登录以添加收藏");
      return;
    }

    const isCurrentlyInWishlist = isInWishlist(productId);

    // Optimistic update
    if (isCurrentlyInWishlist) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    } else {
      setWishlistIds((prev) => [...prev, productId]);
    }

    try {
      if (isCurrentlyInWishlist) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;
        toast.success("已从收藏夹移除");
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;
        toast.success("已添加到收藏夹");
      }
    } catch (error) {
      // Revert on error
      if (isCurrentlyInWishlist) {
        setWishlistIds((prev) => [...prev, productId]);
      } else {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      }
      console.error("Error toggling wishlist:", error);
      toast.error("操作失败，请重试");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isInWishlist,
        toggleWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
