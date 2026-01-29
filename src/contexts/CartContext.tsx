import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { inventoryService } from "@/services/inventory/InventoryService";
import { skuService } from "@/services/inventory/SKUService";
import { toast } from "sonner";
import type { SKU } from "@/types/inventory";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, color: string) => void;
  removeFromCart: (id: string, size: string, color: string) => void;
  updateQuantity: (id: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// 访客购物车存储键名
const GUEST_CART_KEY = "guest_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 加载购物车：优先从数据库（登录用户），否则从 localStorage（访客）
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      loadGuestCart();
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const productIds = (data || []).map((item) => item.product_id).filter(Boolean);
      const productMap = await fetchProductsByIds(productIds);

      const cartItems = await Promise.all(
        data.map(async (item) => {
          const product = productMap[item.product_id];
          if (!product) return null;

          const attributes = [];
          if (item.size) attributes.push({ name: "尺码", value: item.size });
          if (item.color) attributes.push({ name: "颜色", value: item.color });

          let sku: SKU | null = null;
          if (attributes.length > 0) {
            sku = await skuService.findSKUByAttributes(product.id, attributes);
          }

          return {
            ...product,
            price: sku?.price ?? product.price,
            image: sku?.imageUrl || product.image,
            quantity: item.quantity,
            selectedSize: item.size || "",
            selectedColor: item.color || "",
            skuId: sku?.id,
          };
        })
      );

      const filteredCartItems = cartItems.filter(
        (item): item is CartItem => item !== null
      );

      setItems(filteredCartItems);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByIds = async (ids: string[]) => {
    if (!ids.length) return {} as Record<string, Product>;
    const { data, error } = await supabase
      .from("products" as any)
      .select("*")
      .in("id", ids);
    if (error) {
      console.error("Error loading products for cart:", error);
      return {} as Record<string, Product>;
    }
    return (data || []).reduce((acc, product) => {
      const item = product as unknown as Product;
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, Product>);
  };

  // 从 localStorage 加载访客购物车
  const loadGuestCart = () => {
    const guestCart = localStorage.getItem(GUEST_CART_KEY);
    if (guestCart) {
      try {
        setItems(JSON.parse(guestCart));
      } catch (error) {
        console.error("Error loading guest cart:", error);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  };

  // 保存访客购物车到 localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving guest cart:", error);
    }
  };

  const addToCart = async (product: Product, size: string, color: string) => {
    // Check stock availability before adding to cart
    let resolvedSku: SKU | null = null;
    try {
      // Map product + size + color to SKU ID
      const attributes = [];
      if (size) attributes.push({ name: "尺码", value: size });
      if (color) attributes.push({ name: "颜色", value: color });

      resolvedSku = await skuService.findSKUByAttributes(product.id, attributes);
      
      if (!resolvedSku) {
        toast.error("商品不可用", {
          description: "该商品规格暂时不可用",
        });
        return;
      }

      // Check if stock is available
      const hasStock = await inventoryService.checkStock(resolvedSku.id, 1);
      
      if (!hasStock) {
        toast.error("库存不足", {
          description: "该商品暂时缺货",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking stock:", error);
      toast.error("检查库存失败", {
        description: "请稍后重试",
      });
      return;
    }

    const pricedProduct: Product = {
      ...product,
      price: resolvedSku?.price ?? product.price,
      image: resolvedSku?.imageUrl || product.image,
    };

    // Optimistic update
    setItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      const updatedItems = existingItem 
        ? prev.map((item) =>
            item.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
              ? { ...item, quantity: item.quantity + 1, skuId: resolvedSku?.id }
              : item
          )
        : [
            {
              ...pricedProduct,
              quantity: 1,
              selectedSize: size,
              selectedColor: color,
              skuId: resolvedSku?.id,
            },
          ];

      // 保存到 localStorage（访客模式）
      if (!user) {
        saveGuestCart(updatedItems);
      }

      return updatedItems;
    });

    // Sync with database if logged in
    if (user) {
      try {
        const existingItem = items.find(
          (item) =>
            item.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        if (existingItem) {
          await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + 1 })
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .eq("size", size)
            .eq("color", color);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
            size,
            color,
          });
        }
      } catch (error) {
        console.error("Error syncing cart:", error);
        // Reload cart to ensure consistency
        loadCart();
      }
    }
  };

  const removeFromCart = async (id: string, size: string, color: string) => {
    // Optimistic update
    setItems((prev) => {
      const updatedItems = prev.filter(
        (item) =>
          !(item.id === id && item.selectedSize === size && item.selectedColor === color)
      );
      
      if (!user) {
        saveGuestCart(updatedItems);
      }
      
      return updatedItems;
    });

    // Sync with database if logged in
    if (user) {
      try {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id)
          .eq("size", size)
          .eq("color", color);
      } catch (error) {
        console.error("Error removing from cart:", error);
        loadCart();
      }
    }
  };

  const updateQuantity = async (id: string, size: string, color: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id, size, color);
      return;
    }

    // Optimistic update
    setItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.id === id && item.selectedSize === size && item.selectedColor === color
          ? { ...item, quantity }
          : item
      );
      
      if (!user) {
        saveGuestCart(updatedItems);
      }
      
      return updatedItems;
    });

    // Sync with database if logged in
    if (user) {
      try {
        await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", id)
          .eq("size", size)
          .eq("color", color);
      } catch (error) {
        console.error("Error updating cart:", error);
        loadCart();
      }
    }
  };

  const clearCart = async () => {
    setItems([]);

    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
    } else {
      try {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
