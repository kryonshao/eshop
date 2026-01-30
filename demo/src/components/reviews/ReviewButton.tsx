import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReviewForm from "./ReviewForm";

interface ReviewButtonProps {
  productId: string;
  productName: string;
  orderId: string;
  orderStatus: string;
}

export default function ReviewButton({
  productId,
  productName,
  orderId,
  orderStatus,
}: ReviewButtonProps) {
  const { user } = useAuth();
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkReviewStatus();
    } else {
      setLoading(false);
    }
  }, [user, productId, orderId]);

  const checkReviewStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", productId)
        .eq("order_id", orderId)
        .maybeSingle();

      if (!error && data) {
        setHasReviewed(true);
      }
    } catch (error) {
      console.error("Error checking review status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only show for delivered or shipped orders
  const canReview = ["delivered", "shipped"].includes(orderStatus);

  if (loading || !canReview) {
    return null;
  }

  if (hasReviewed) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1">
        <Star className="h-4 w-4 fill-accent text-accent" />
        已评价
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsFormOpen(true)}
        className="gap-1"
      >
        <Star className="h-4 w-4" />
        评价
      </Button>
      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productId={productId}
        productName={productName}
        orderId={orderId}
        onSuccess={() => setHasReviewed(true)}
      />
    </>
  );
}
