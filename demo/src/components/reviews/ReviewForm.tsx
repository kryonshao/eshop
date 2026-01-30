import { useState, useRef } from "react";
import { Star, X, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  orderId: string;
  onSuccess?: () => void;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ReviewForm({
  isOpen,
  onClose,
  productId,
  productName,
  orderId,
  onSuccess,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (images.length + newFiles.length >= MAX_IMAGES) {
        toast.error(`最多上传 ${MAX_IMAGES} 张图片`);
        break;
      }

      const file = files[i];
      
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} 不是有效的图片文件`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} 超过 5MB 大小限制`);
        continue;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImages((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0 || !user) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of images) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("review-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("review-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("请选择评分");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        product_id: productId,
        order_id: orderId,
        rating,
        title: title.trim() || null,
        content: content.trim() || null,
        is_anonymous: isAnonymous,
        images: imageUrls.length > 0 ? imageUrls : null,
      });

      if (error) throw error;

      toast.success("评价提交成功");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.code === "23505") {
        toast.error("您已经评价过该商品");
      } else {
        toast.error("提交失败，请重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(5);
    setTitle("");
    setContent("");
    setIsAnonymous(false);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviews([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>评价商品</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Name */}
          <div>
            <p className="text-sm text-muted-foreground">商品</p>
            <p className="font-medium">{productName}</p>
          </div>

          {/* Rating */}
          <div>
            <Label className="mb-2 block">评分</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-medium">{rating} 分</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="review-title" className="mb-2 block">
              标题（可选）
            </Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="用一句话概括您的评价"
              maxLength={50}
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="review-content" className="mb-2 block">
              评价内容（可选）
            </Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享您的使用体验..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/500
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="mb-2 block">上传图片（可选）</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`预览 ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs mt-1">{images.length}/{MAX_IMAGES}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              最多 {MAX_IMAGES} 张，单张不超过 5MB
            </p>
          </div>

          {/* Anonymous */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
              匿名评价
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingImages}
              className="flex-1"
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传图片中...
                </>
              ) : isSubmitting ? (
                "提交中..."
              ) : (
                "提交评价"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
