import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { skuService } from "@/services/inventory/SKUService";
import type { SKU, VariantAttribute, CreateSKUParams } from "@/types/inventory";

interface SKUFormProps {
  productId: string;
  sku?: SKU | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  price: number;
  initialStock: number;
  imageUrl?: string;
}

export default function SKUForm({ productId, sku, onSuccess, onCancel }: SKUFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<VariantAttribute[]>(
    sku?.attributes || [{ name: "", value: "" }]
  );
  const [skuCodePreview, setSkuCodePreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      price: sku?.price || 0,
      initialStock: 0,
      imageUrl: sku?.imageUrl || "",
    },
  });

  // Update SKU code preview when attributes change
  useEffect(() => {
    if (attributes.some((attr) => attr.name && attr.value)) {
      const preview = skuService.generateSKUCode(productId, attributes);
      setSkuCodePreview(preview);
    } else {
      setSkuCodePreview("");
    }
  }, [attributes, productId]);

  const addAttribute = () => {
    setAttributes([...attributes, { name: "", value: "" }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: "name" | "value", value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    setAttributes(newAttributes);
  };

  const onSubmit = async (data: FormData) => {
    // Validate attributes
    const validAttributes = attributes.filter((attr) => attr.name && attr.value);
    if (validAttributes.length === 0) {
      toast({
        title: "验证失败",
        description: "请至少添加一个变体属性",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (sku) {
        // Update existing SKU
        await skuService.updateSKU(sku.id, {
          price: data.price,
          imageUrl: data.imageUrl,
          attributes: validAttributes,
        });
        toast({
          title: "更新成功",
          description: "SKU 信息已更新",
        });
      } else {
        // Create new SKU
        const params: CreateSKUParams = {
          productId,
          attributes: validAttributes,
          price: data.price,
          initialStock: data.initialStock,
          warehouseId: "default", // Will be resolved by service
          imageUrl: data.imageUrl,
        };
        await skuService.createSKU(params);
        toast({
          title: "创建成功",
          description: "新 SKU 已创建",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving SKU:", error);
      toast({
        title: "保存失败",
        description: "无法保存 SKU，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Variant Attributes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>变体属性</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="mr-2 h-4 w-4" />
            添加属性
          </Button>
        </div>

        {attributes.map((attr, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="属性名（如：颜色）"
              value={attr.name}
              onChange={(e) => updateAttribute(index, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="属性值（如：红色）"
              value={attr.value}
              onChange={(e) => updateAttribute(index, "value", e.target.value)}
              className="flex-1"
            />
            {attributes.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAttribute(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {skuCodePreview && (
          <div className="p-3 bg-secondary rounded-md">
            <p className="text-sm text-muted-foreground">SKU 代码预览：</p>
            <p className="font-mono font-semibold">{skuCodePreview}</p>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">
          价格 (USD) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          {...register("price", {
            required: "价格不能为空",
            min: { value: 0, message: "价格必须大于等于 0" },
          })}
        />
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      {/* Initial Stock (only for new SKU) */}
      {!sku && (
        <div className="space-y-2">
          <Label htmlFor="initialStock">
            初始库存 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="initialStock"
            type="number"
            min="0"
            {...register("initialStock", {
              required: "初始库存不能为空",
              min: { value: 0, message: "库存必须大于等于 0" },
            })}
          />
          {errors.initialStock && (
            <p className="text-sm text-destructive">{errors.initialStock.message}</p>
          )}
        </div>
      )}

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl">图片 URL（可选）</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://example.com/image.jpg"
          {...register("imageUrl")}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>{sku ? "更新" : "创建"}</>
          )}
        </Button>
      </div>
    </form>
  );
}
