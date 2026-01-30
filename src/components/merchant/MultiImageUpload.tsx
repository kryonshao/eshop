import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucket?: string;
}

export default function MultiImageUpload({ 
  value = [], 
  onChange, 
  maxImages = 5,
  bucket = "product-images" 
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (value.length + files.length > maxImages) {
      toast.error(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 大小超过 5MB`);
        return;
      }
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      onChange([...value, ...uploadedUrls]);
      toast.success(`成功上传 ${uploadedUrls.length} 张图片`);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error("图片上传失败：" + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
    toast.success("图片已删除");
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...value];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-4">
        {/* Existing Images */}
        {value.map((url, index) => (
          <div
            key={index}
            className="relative group aspect-square rounded-lg overflow-hidden border"
          >
            <img
              src={url}
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Image Badge */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {index === 0 ? "主图" : `图 ${index + 1}`}
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {index > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReorder(index, 0)}
                  title="设为主图"
                >
                  主图
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {canAddMore && (
          <div
            className={cn(
              "aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-2",
              uploading && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">上传中...</p>
              </>
            ) : (
              <>
                <Plus className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs font-medium">添加图片</p>
                <p className="text-xs text-muted-foreground">
                  {value.length}/{maxImages}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• 最多上传 {maxImages} 张图片</p>
        <p>• 支持 JPG、PNG、GIF，每张最大 5MB</p>
        <p>• 第一张图片为主图，点击"主图"按钮可调整顺序</p>
        <p>• 可以一次选择多张图片批量上传</p>
      </div>
    </div>
  );
}
