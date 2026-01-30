import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { products } from "@/data/products";

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart from database when user logs in
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
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

      // Map database items to cart items with product details
      const cartItems: CartItem[] = data
        .map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          if (!product) return null;
          return {
            ...product,
            quantity: item.quantity,
            selectedSize: item.size || "",
            selectedColor: item.color || "",
          };
        })
        .filter((item): item is CartItem => item !== null);

      setItems(cartItems);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product, size: string, color: string) => {
    // Optimistic update
    setItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
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
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === id && item.selectedSize === size && item.selectedColor === color)
      )
    );

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
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedSize === size && item.selectedColor === color
          ? { ...item, quantity }
          : item
      )
    );

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

    if (user) {
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
