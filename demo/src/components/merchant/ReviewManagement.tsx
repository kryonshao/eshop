import { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  Check,
  XCircle,
  Clock,
  Search,
  Image,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { products } from "@/data/products";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[] | null;
  status: string;
  is_anonymous: boolean;
  created_at: string;
  user_name?: string;
  product_name?: string;
  replies?: any[];
}

export default function ReviewManagement() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich reviews with product names and user names
      const enrichedReviews = await Promise.all(
        (data || []).map(async (review) => {
          // Get product name
          const product = products.find((p) => p.id === review.product_id);
          
          // Get user name
          let user_name = "匿名用户";
          if (!review.is_anonymous) {
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
            .select("*")
            .eq("review_id", review.id);

          return {
            ...review,
            product_name: product?.name || "未知商品",
            user_name,
            replies: replies || [],
          };
        })
      );

      setReviews(enrichedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("加载评价失败");
    } finally {
      setLoading(false);
    }
  };

  const updateReviewStatus = async (
    reviewId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: newStatus })
        .eq("id", reviewId);

      if (error) throw error;

      toast.success(newStatus === "approved" ? "评价已通过" : "评价已拒绝");
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("操作失败");
    }
  };

  const submitReply = async (reviewId: string) => {
    if (!user || !replyContent.trim()) return;

    try {
      const { error } = await supabase.from("review_replies").insert({
        review_id: reviewId,
        user_id: user.id,
        content: replyContent.trim(),
      });

      if (error) throw error;

      toast.success("回复成功");
      setReplyingTo(null);
      setReplyContent("");
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error("回复失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-accent/20 text-accent-foreground">
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

  const filteredReviews = reviews.filter(
    (review) =>
      review.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名或评价内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            评价列表
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredReviews.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">加载中...</p>
          ) : filteredReviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无评价</p>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-secondary/50 rounded-lg space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.user_name}</span>
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        商品: {review.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
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
                  </div>

                  {/* Content */}
                  {review.title && (
                    <p className="font-medium">{review.title}</p>
                  )}
                  {review.content && (
                    <p className="text-muted-foreground">{review.content}</p>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewImages(review.images)}
                          className="relative group"
                        >
                          <img
                            src={img}
                            alt={`评价图片 ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                            <Image className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Replies */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="space-y-2 mt-3">
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
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === review.id && (
                    <div className="pt-3 space-y-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="输入商家回复..."
                        rows={3}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitReply(review.id)}
                        >
                          发布回复
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {review.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateReviewStatus(review.id, "approved")
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateReviewStatus(review.id, "rejected")
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </>
                    )}
                    {review.status === "approved" &&
                      (!review.replies || review.replies.length === 0) &&
                      replyingTo !== review.id && (
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImages}
        onOpenChange={() => setPreviewImages(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>评价图片</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewImages?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`评价图片 ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
