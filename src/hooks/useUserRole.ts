import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "admin" | "merchant" | "customer";

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setUserRole((data?.user_role as UserRole) || "customer");
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("customer");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole === "admin";
  const isMerchant = userRole === "merchant" || isAdmin;
  const isCustomer = userRole === "customer";

  return { 
    userRole, 
    loading, 
    isAdmin, 
    isMerchant,
    isCustomer
  };
}
