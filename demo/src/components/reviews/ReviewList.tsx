import { useState, useEffect } from "react";
import { Star, User, X, MessageSquare, Check, XCircle, Clock, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import ReviewReplyForm from "./ReviewReplyForm";

interface ReviewReply {
  id: string;
  content: string;
  created_at: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[] | null;
  is_anonymous: boolean;
  created_at: string;
  status: string;
  user_name?: string;
  replies?: ReviewReply[];
}

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { isMerchant, isAdmin } = useUserRole();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user names and replies for reviews
      const reviewsWithDetails = await Promise.all(
        (data || []).map(async (review) => {
          // Get user name
          let user_name = "用户";
          if (review.is_anonymous) {
            user_name = "匿名用户";
          } else {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", review.user_id)
              .maybeSingle();
            user_name = profile?.full_name || "用户";
          }

          // Get replies
          const { data: replies } = await supabase
            .from("review_replies")
            .select("id, content, created_at")
            .eq("review_id", review.id)
            .order("created_at", { ascending: true });

          return {
            ...review,
            user_name,
            replies: replies || [],
          };
        })
      );

      setReviews(reviewsWithDetails);

      // Calculate stats (only approved reviews for public stats)
      const approvedReviews = reviewsWithDetails.filter(
        (r) => r.status === "approved"
      );
      if (approvedReviews.length > 0) {
        const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
        setAverageRating(sum / approvedReviews.length);

        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        approvedReviews.forEach((r) => {
          counts[r.rating as keyof typeof counts]++;
        });
        setRatingCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reviewId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status })
        .eq("id", reviewId);

      if (error) throw error;

      toast.success(status === "approved" ? "评价已通过" : "评价已拒绝");
      fetchReviews();
    } catch (error) {
      console.error("Error updating review status:", error);
      toast.error("操作失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-accent text-accent-foreground">
            <Check className="h-3 w-3 mr-1" />
            已通过
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            待审核
          </Badge>
        );
    }
  };

  // Filter reviews for non-merchants (only show approved)
  const displayReviews = isMerchant || isAdmin
    ? reviews
    : reviews.filter((r) => r.status === "approved");

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        加载评价中...
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Rating Summary */}
      <div className="flex items-center gap-8 p-6 bg-secondary rounded-lg mb-8">
        <div className="text-center">
          <p className="text-4xl font-semibold">
            {averageRating > 0 ? averageRating.toFixed(1) : "-"}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.filter((r) => r.status === "approved").length} 条评价
          </p>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating];
            const approvedCount = reviews.filter(
              (r) => r.status === "approved"
            ).length;
            const percentage =
              approvedCount > 0 ? (count / approvedCount) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <Star className="h-3 w-3 fill-accent text-accent" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {displayReviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            暂无评价，快来发表第一条评价吧！
          </p>
        ) : (
          displayReviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{review.user_name}</span>
                    {(isMerchant || isAdmin) && getStatusBadge(review.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    {review.title && (
                      <span className="font-medium">{review.title}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("zh-CN")}
                </span>
              </div>
              {review.content && (
                <p className="mt-3 text-muted-foreground">{review.content}</p>
              )}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {review.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      className="relative group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`评价图片 ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                    </button>
                  ))}
                </div>
              )}

              {/* Merchant Replies */}
              {review.replies && review.replies.length > 0 && (
                <div className="mt-4 space-y-2">
                  {review.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="pl-4 border-l-2 border-primary/30 bg-primary/5 p-3 rounded-r-lg"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          商家回复
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleDateString(
                            "zh-CN"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Merchant Actions */}
              {(isMerchant || isAdmin) && (
                <div className="mt-4 flex items-center gap-2">
                  {review.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(review.id, "approved")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(review.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                    </>
                  )}
                  {review.status === "approved" &&
                    (!review.replies || review.replies.length === 0) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        回复
                      </Button>
                    )}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === review.id && (
                <ReviewReplyForm
                  reviewId={review.id}
                  onSuccess={() => {
                    setReplyingTo(null);
                    fetchReviews();
                  }}
                  onCancel={() => setReplyingTo(null)}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {previewImage && (
            <img
              src={previewImage}
              alt="评价图片预览"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
