import { useState, useEffect } from "react";
import { X, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { skuService } from "@/services/inventory/SKUService";
import type { SKU } from "@/types/inventory";

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
}: ProductQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [skus, setSkus] = useState<SKU[]>([]);
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);

  useEffect(() => {
    if (!product?.id) return;
    skuService.getProductSKUs(product.id).then(setSkus);
  }, [product?.id]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("请选择尺码");
      return;
    }
    if (!selectedColor) {
      toast.error("请选择颜色");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }

    toast.success("已添加到购物车", {
      description: `${product.name} - ${selectedColor} / ${selectedSize}`,
    });
    onClose();
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
  };

  const skuColors = Array.from(
    new Set(
      skus
        .map((sku) => sku.attributes.find((attr) => attr.name === "颜色")?.value)
        .filter(Boolean) as string[]
    )
  );

  const skuSizes = Array.from(
    new Set(
      skus
        .map((sku) => sku.attributes.find((attr) => attr.name === "尺码")?.value)
        .filter(Boolean) as string[]
    )
  );

  const availableColors = skuColors.length > 0 ? skuColors : product.colors || [];
  const availableSizes = skuSizes.length > 0 ? skuSizes : product.sizes || [];

  const displayPrice = selectedSku?.price ?? product.price;
  const displayImage = selectedSku?.imageUrl || product.image;

  const resolveSelectedSku = (color: string, size: string) => {
    const match = skus.find((sku) => {
      const skuColor = sku.attributes.find((attr) => attr.name === "颜色")?.value;
      const skuSize = sku.attributes.find((attr) => attr.name === "尺码")?.value;
      return skuColor === color && skuSize === size;
    });
    setSelectedSku(match || null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="relative aspect-square md:aspect-auto">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 md:hidden bg-background/80"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    {product.category}
                  </p>
                  <h2 className="font-display text-2xl font-semibold mt-1">
                    {product.name}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-2xl font-semibold">${displayPrice.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mt-4">{product.description}</p>

              {/* Color Selection */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">
                  颜色: <span className="text-muted-foreground">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        resolveSelectedSku(color, selectedSize);
                      }}
                      className={`px-4 py-2 rounded-md border text-sm transition-all ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">
                  尺码: <span className="text-muted-foreground">{selectedSize}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        resolveSelectedSku(selectedColor, size);
                      }}
                      className={`w-12 h-12 rounded-md border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">数量</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="mt-auto pt-6">
                <Button variant="hero" className="w-full" onClick={handleAddToCart}>
                  <Check className="h-4 w-4 mr-2" />
                  添加到购物车 - ${(displayPrice * quantity).toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
