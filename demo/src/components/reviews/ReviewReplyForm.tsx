import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReviewReplyFormProps {
  reviewId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReviewReplyForm({
  reviewId,
  onSuccess,
  onCancel,
}: ReviewReplyFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (!content.trim()) {
      toast.error("请输入回复内容");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("review_replies").insert({
        review_id: reviewId,
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      toast.success("回复成功");
      setContent("");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      if (error.code === "42501") {
        toast.error("您没有权限回复评价");
      } else {
        toast.error("回复失败，请重试");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="输入商家回复..."
        rows={3}
        maxLength={500}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          发布回复
        </Button>
      </div>
    </div>
  );
}
