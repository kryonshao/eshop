import { useState, useEffect } from "react";
import { Languages, Loader2, Package, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { i18nService } from "@/services/i18n/I18nService";
import ProductTranslationManager from "./ProductTranslationManager";
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

  useEffect(() => {
    fetchProducts();
  }, []);

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
                    {product.originalPrice && product.discountPrice && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Tag className="h-3 w-3" />
                        <span className="line-through">¥{product.originalPrice}</span>
                        <span className="text-primary font-medium">¥{product.discountPrice}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    翻译完成度: {statusMap[product.id] || 0}/{SUPPORTED_LOCALES.length}
                  </div>
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
    </Card>
  );
}
