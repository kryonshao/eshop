import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VariantAttribute } from "@/types/inventory";

interface VariantSelectorProps {
  attributes: VariantAttribute[];
  onChange: (attributes: VariantAttribute[]) => void;
}

export default function VariantSelector({ attributes, onChange }: VariantSelectorProps) {
  const addAttribute = () => {
    onChange([...attributes, { name: "", value: "" }]);
  };

  const removeAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: "name" | "value", value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = value;
    onChange(newAttributes);
  };

  return (
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
          <div className="flex-1 space-y-1">
            <Input
              placeholder="属性名（如：颜色、尺码）"
              value={attr.name}
              onChange={(e) => updateAttribute(index, "name", e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Input
              placeholder="属性值（如：红色、L）"
              value={attr.value}
              onChange={(e) => updateAttribute(index, "value", e.target.value)}
            />
          </div>
          {attributes.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAttribute(index)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          点击"添加属性"创建商品变体
        </p>
      )}
    </div>
  );
}
