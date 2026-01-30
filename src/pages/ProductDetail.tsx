import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Minus, Plus, Heart, Share2, Truck, Shield, RefreshCw, Star, ThumbsUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import ProductCard from "@/components/product/ProductCard";
import ReviewList from "@/components/reviews/ReviewList";
import { supabase } from "@/integrations/supabase/client";
import { i18nService, type ProductTranslation } from "@/services/i18n/I18nService";
import { skuService } from "@/services/inventory/SKUService";
import { sizeGuideService, type SizeGuide } from "@/services/product/SizeGuideService";
import type { SKU } from "@/types/inventory";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any | null>(null);
  const { addToCart } = useCart();
  const { i18n } = useTranslation();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState("5.0");
  const [translation, setTranslation] = useState<ProductTranslation | null>(null);
  const [translationLoading, setTranslationLoading] = useState(true);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [selectedSku, setSelectedSku] = useState<SKU | null>(null);
  const [sizeGuide, setSizeGuide] = useState<SizeGuide | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct();
      loadSkus();
      loadSizeGuide();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchReviewStats();
      loadTranslation();
    }
  }, [product?.id, i18n.language]);

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from("products" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error loading product:", error);
      setProduct(null);
      return;
    }

    setProduct(data);
  };

  const loadTranslation = async () => {
    if (!product) return;
    
    setTranslationLoading(true);
    try {
      const currentLocale = i18n.language as any;
      const productTranslation = await i18nService.getProductTranslation(
        product.id,
        currentLocale
      );
      setTranslation(productTranslation);
    } catch (error) {
      console.error("Error loading product translation:", error);
    } finally {
      setTranslationLoading(false);
    }
  };

  const loadSkus = async () => {
    if (!id) return;
    const skuList = await skuService.getProductSKUs(id);
    setSkus(skuList);
  };

  const loadSizeGuide = async () => {
    if (!id) return;
    const guide = await sizeGuideService.getProductSizeGuide(id);
    setSizeGuide(guide);
  };

  const fetchReviewStats = async () => {
    if (!product) return;
    
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product.id);

    if (!error && data && data.length > 0) {
      setReviewCount(data.length);
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating((sum / data.length).toFixed(1));
    } else {
      setReviewCount(0);
      setAverageRating("5.0");
    }
  };

  if (!product) {
    return (
      <main className="pt-20 md:pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">商品未找到</h1>
          <Button asChild>
            <Link to="/products">返回商品列表</Link>
          </Button>
        </div>
      </main>
    );
  }

  const images = product.images || [product.image];

  // Get display name and description: use translation if available, otherwise use original
  const displayName = translation?.title || product.name;
  const displayDescription = translation?.description || product.fullDescription || product.description;
  const hasTranslation = !!translation?.title;

  const displayPrice = selectedSku?.price ?? product.price;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - displayPrice) / product.originalPrice) * 100)
    : 0;

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

  const resolveSelectedSku = (color: string, size: string) => {
    const match = skus.find((sku) => {
      const skuColor = sku.attributes.find((attr) => attr.name === "颜色")?.value;
      const skuSize = sku.attributes.find((attr) => attr.name === "尺码")?.value;
      return skuColor === color && skuSize === size;
    });
    setSelectedSku(match || null);
  };

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
  };

  const relatedProducts: any[] = [];

  return (
    <main className="pt-20 md:pt-24">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">首页</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground transition-colors">全部商品</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-foreground transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary">
              <img
                src={selectedSku?.imageUrl || images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover animate-fade-in"
              />
              {product.isNew && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">新品</Badge>
              )}
              {product.isSale && discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">-{discount}%</Badge>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                {product.category}
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold flex items-center gap-3">
                {displayName}
                {!hasTranslation && (
                  <Badge variant="outline" className="text-sm font-normal">
                    EN
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">{product.nameEn}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(Number(averageRating))
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{averageRating}</span>
              <span className="text-muted-foreground">({reviewCount} 条评价)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-semibold">${displayPrice.toFixed(2)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="text-accent border-accent">
                    节省 ${(product.originalPrice - displayPrice).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground">{displayDescription}</p>

            {/* Color Selection */}
            <div>
              <p className="font-medium mb-3">
                颜色: <span className="text-muted-foreground font-normal">{selectedColor || "请选择"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      resolveSelectedSku(color, selectedSize);
                    }}
                    className={`px-5 py-2.5 rounded-md border text-sm transition-all ${
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">
                  尺码: <span className="text-muted-foreground font-normal">{selectedSize || "请选择"}</span>
                </p>
                {(sizeGuide || availableSizes.length > 0) && (
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-sm text-accent hover:underline flex items-center gap-1"
                  >
                    尺码指南
                    <ChevronDown className={`h-4 w-4 transition-transform ${showSizeGuide ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      resolveSelectedSku(selectedColor, size);
                    }}
                    className={`min-w-[3rem] h-12 px-4 rounded-md border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Size Guide */}
              {showSizeGuide && sizeGuide && (
                <div className="mt-4 p-4 bg-secondary rounded-lg animate-fade-in">
                  <h4 className="font-medium mb-3">{sizeGuide.name}</h4>
                  
                  {/* Measurement Tips */}
                  {sizeGuide.measurement_tips?.tips && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">测量说明：</p>
                      {sizeGuide.measurement_tips.tips.map((tip, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{tip.title}：</span>
                          <span className="text-muted-foreground">{tip.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Size Chart */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {sizeGuide.chart_data.headers.map((header) => (
                            <th key={header} className="py-2 px-3 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizeGuide.chart_data.rows.map((row, index) => (
                          <tr key={index} className="border-b border-border/50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="py-2 px-3 text-muted-foreground">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>💡 提示：如果您的尺寸介于两个尺码之间，建议选择较大的尺码以获得更舒适的穿着体验。</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="hero" className="flex-1" onClick={handleAddToCart}>
                添加到购物车
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart className={`h-5 w-5 ${isLiked ? "fill-accent text-accent" : ""}`} />
              </Button>
              <Button variant="outline" size="icon" className="shrink-0">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-sm font-medium">全球配送</p>
                <p className="text-xs text-muted-foreground">满$99免运费</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-sm font-medium">30天退换</p>
                <p className="text-xs text-muted-foreground">无忧购物</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto text-accent mb-2" />
                <p className="text-sm font-medium">品质保证</p>
                <p className="text-xs text-muted-foreground">严格质检</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              商品详情
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              用户评价 ({reviewCount})
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
              配送信息
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="pt-8">
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="font-semibold mb-2">商品描述</h3>
                <p className="text-muted-foreground">{product.fullDescription || product.description}</p>
              </div>
              {product.material && (
                <div>
                  <h3 className="font-semibold mb-2">材质成分</h3>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
              )}
              {product.careInstructions && (
                <div>
                  <h3 className="font-semibold mb-2">洗护说明</h3>
                  <ul className="text-muted-foreground space-y-1">
                    {product.careInstructions.map((instruction, index) => (
                      <li key={index}>• {instruction}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="pt-8">
            <ReviewList productId={product.id} />
          </TabsContent>

          <TabsContent value="shipping" className="pt-8">
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="font-semibold mb-2">配送时间</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 中国大陆：3-5个工作日</li>
                  <li>• 港澳台地区：5-7个工作日</li>
                  <li>• 亚太地区：7-10个工作日</li>
                  <li>• 欧美地区：10-15个工作日</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">运费说明</h3>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 订单满$99全球免运费</li>
                  <li>• 未满$99收取$9.99运费</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">退换政策</h3>
                <p className="text-muted-foreground">
                  自收货之日起30天内，如商品存在质量问题或尺码不合适，可申请免费退换货。请确保商品未经穿着、洗涤，保持原始吊牌完好。
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-border">
          <h2 className="font-display text-2xl font-semibold mb-8">相关推荐</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      )}

      {/* Back to Products */}
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild>
          <Link to="/products">
            <ChevronLeft className="h-4 w-4 mr-2" />
            返回商品列表
          </Link>
        </Button>
      </div>
    </main>
  );
}
