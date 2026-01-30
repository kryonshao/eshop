import { useState, useEffect } from "react";
import { Languages, Loader2, Package, Tag, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { i18nService } from "@/services/i18n/I18nService";
import { sizeGuideService, type SizeGuide } from "@/services/product/SizeGuideService";
import ProductTranslationManager from "./ProductTranslationManager";
import MultiImageUpload from "./MultiImageUpload";
import { toast } from "sonner";
import type { SupportedLocale } from "@/types/locale";
import type { Product } from "@/types/product";

const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
] as unknown as SupportedLocale[];

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [newColor, setNewColor] = useState("");
  const [newSize, setNewSize] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    sizeGuideId: "",
    stock: "",
    isNew: false,
    isFeatured: false,
    isSale: false,
  });

  useEffect(() => {
    fetchProducts();
    loadSizeGuides();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories" as any)
        .select("id, name")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories((data || []) as Array<{ id: string; name: string }>);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };

  const loadSizeGuides = async () => {
    const categories = await sizeGuideService.getCategories();
    const allGuides: SizeGuide[] = [];
    for (const category of categories) {
      const guides = await sizeGuideService.getSizeGuidesByCategory(category.id);
      allGuides.push(...guides);
    }
    setSizeGuides(allGuides);
    
    // Set default size guide if available
    const defaultGuide = allGuides.find(g => g.name === '标准尺码');
    if (defaultGuide && !formData.sizeGuideId) {
      setFormData(prev => ({ ...prev, sizeGuideId: defaultGuide.id }));
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data || []) as unknown as Product[];
      setProducts(list);

      // Fetch translation status for each product
      const translationStatus: Record<string, number> = {};
      for (const product of list) {
        const translations = await i18nService.getProductTranslations(product.id);
        const completedCount = translations.filter(
          (t) => t.title?.trim() && t.description?.trim()
        ).length;
        translationStatus[product.id] = completedCount;
      }

      setStatusMap(translationStatus);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setStatusMap({});
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products" as any)
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          category: formData.category,
          image: formData.images[0] || "/placeholder.svg",
          images: formData.images,
          colors: formData.colors,
          sizes: formData.sizes,
          size_guide_id: formData.sizeGuideId || null,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          is_new: formData.isNew,
          is_featured: formData.isFeatured,
          is_sale: formData.isSale,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("商品添加成功");
      setShowAddDialog(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        images: [],
        colors: [],
        sizes: [],
        sizeGuideId: "",
        stock: "",
        isNew: false,
        isFeatured: false,
        isSale: false,
      });
      fetchProducts();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error("添加商品失败：" + error.message);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from("products" as any)
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          category: formData.category,
          image: formData.images[0] || "/placeholder.svg",
          images: formData.images,
          colors: formData.colors,
          sizes: formData.sizes,
          size_guide_id: formData.sizeGuideId || null,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          is_new: formData.isNew,
          is_featured: formData.isFeatured,
          is_sale: formData.isSale,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      toast.success("商品更新成功");
      setShowEditDialog(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        images: [],
        colors: [],
        sizes: [],
        sizeGuideId: "",
        stock: "",
        isNew: false,
        isFeatured: false,
        isSale: false,
      });
      fetchProducts();
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error("更新商品失败：" + error.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("确定要删除这个商品吗？")) return;

    try {
      const { error } = await supabase
        .from("products" as any)
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast.success("商品删除成功");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("删除商品失败：" + error.message);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    // Parse images from product
    let productImages: string[] = [];
    if (product.images && Array.isArray(product.images)) {
      productImages = product.images;
    } else if (product.image) {
      productImages = [product.image];
    }
    
    // Parse colors and sizes
    let productColors: string[] = [];
    let productSizes: string[] = [];
    if (product.colors && Array.isArray(product.colors)) {
      productColors = product.colors;
    }
    if (product.sizes && Array.isArray(product.sizes)) {
      productSizes = product.sizes;
    }
    
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      category: product.category || "",
      images: productImages,
      colors: productColors,
      sizes: productSizes,
      sizeGuideId: (product as any).size_guide_id || "",
      stock: ((product as any).stock || 0).toString(),
      isNew: (product as any).is_new || false,
      isFeatured: (product as any).is_featured || false,
      isSale: (product as any).is_sale || false,
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              商品管理
            </CardTitle>
            <CardDescription className="mt-1">
              管理您的商品库存和翻译
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              共 {products.length} 个商品
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加商品
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无商品</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.category} · ¥{product.price}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {product.originalPrice && product.discountPrice && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          <span className="line-through">¥{product.originalPrice}</span>
                          <span className="text-primary font-medium">¥{product.discountPrice}</span>
                        </div>
                      )}
                      <div className="text-xs">
                        <Badge variant={(product as any).stock > 0 ? "default" : "destructive"}>
                          库存: {(product as any).stock || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    翻译完成度: {statusMap[product.id] || 0}/{SUPPORTED_LOCALES.length}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* Open translation dialog */}}
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    管理翻译
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>添加商品</DialogTitle>
            <DialogDescription>填写商品信息</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-1">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">商品名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入商品名称"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">商品描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入商品描述"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">价格 *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.99"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="originalPrice">原价</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="199.99"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">分类</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="stock">库存数量</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="输入库存数量"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="images">商品图片（最多5张）</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  maxImages={5}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="colors">可选颜色</Label>
                <div className="flex gap-2">
                  <Input
                    id="colors"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="输入颜色，如：黑色"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newColor.trim()) {
                        e.preventDefault();
                        if (!formData.colors.includes(newColor.trim())) {
                          setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
                        }
                        setNewColor("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
                        setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
                        setNewColor("");
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.colors.map((color) => (
                    <Badge key={color} variant="secondary" className="gap-1">
                      {color}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sizes">可选尺码</Label>
                <div className="flex gap-2">
                  <Input
                    id="sizes"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="输入尺码，如：M"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSize.trim()) {
                        e.preventDefault();
                        if (!formData.sizes.includes(newSize.trim())) {
                          setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                        }
                        setNewSize("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
                        setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                        setNewSize("");
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map((size) => (
                    <Badge key={size} variant="secondary" className="gap-1">
                      {size}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="size-guide">尺码指南</Label>
                <select
                  id="size-guide"
                  value={formData.sizeGuideId}
                  onChange={(e) => setFormData({ ...formData, sizeGuideId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">无尺码指南</option>
                  {sizeGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name} {guide.name === '标准尺码' ? '(默认)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  💡 如不选择，将使用默认尺码指南
                </p>
              </div>
              
              <div className="grid gap-3 pt-2 border-t">
                <Label>商品标签</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-new"
                      checked={formData.isNew}
                      onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked as boolean })}
                    />
                    <label
                      htmlFor="is-new"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      🆕 新品上市（在首页"新品"区域展示）
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-featured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
                    />
                    <label
                      htmlFor="is-featured"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      ⭐ 特色商品（在首页"特色商品"区域展示）
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-sale"
                      checked={formData.isSale}
                      onCheckedChange={(checked) => setFormData({ ...formData, isSale: checked as boolean })}
                    />
                    <label
                      htmlFor="is-sale"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      🔥 特价优惠（在首页"特价"区域展示）
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 可以同时选择多个标签
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddProduct} disabled={!formData.name || !formData.price || formData.images.length === 0}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>编辑商品</DialogTitle>
            <DialogDescription>修改商品信息</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-1">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">商品名称 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入商品名称"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">商品描述</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入商品描述"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">价格 *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.99"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-originalPrice">原价</Label>
                  <Input
                    id="edit-originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="199.99"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">分类</Label>
                <select
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">库存数量</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="输入库存数量"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-images">商品图片（最多5张）</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  maxImages={5}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-colors">可选颜色</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-colors"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="输入颜色，如：黑色"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newColor.trim()) {
                        e.preventDefault();
                        if (!formData.colors.includes(newColor.trim())) {
                          setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
                        }
                        setNewColor("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
                        setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
                        setNewColor("");
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.colors.map((color) => (
                    <Badge key={color} variant="secondary" className="gap-1">
                      {color}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-sizes">可选尺码</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-sizes"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="输入尺码，如：M"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSize.trim()) {
                        e.preventDefault();
                        if (!formData.sizes.includes(newSize.trim())) {
                          setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                        }
                        setNewSize("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
                        setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
                        setNewSize("");
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map((size) => (
                    <Badge key={size} variant="secondary" className="gap-1">
                      {size}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-size-guide">尺码指南</Label>
                <select
                  id="edit-size-guide"
                  value={formData.sizeGuideId}
                  onChange={(e) => setFormData({ ...formData, sizeGuideId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">无尺码指南</option>
                  {sizeGuides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name} {guide.name === '标准尺码' ? '(默认)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  💡 如不选择，将使用默认尺码指南
                </p>
              </div>
              
              <div className="grid gap-3 pt-2 border-t">
                <Label>商品标签</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-is-new"
                      checked={formData.isNew}
                      onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked as boolean })}
                    />
                    <label
                      htmlFor="edit-is-new"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      🆕 新品上市（在首页"新品"区域展示）
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-is-featured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
                    />
                    <label
                      htmlFor="edit-is-featured"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      ⭐ 特色商品（在首页"特色商品"区域展示）
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-is-sale"
                      checked={formData.isSale}
                      onCheckedChange={(checked) => setFormData({ ...formData, isSale: checked as boolean })}
                    />
                    <label
                      htmlFor="edit-is-sale"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      🔥 特价优惠（在首页"特价"区域展示）
                    </label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 可以同时选择多个标签
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEditProduct} disabled={!formData.name || !formData.price || formData.images.length === 0}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
