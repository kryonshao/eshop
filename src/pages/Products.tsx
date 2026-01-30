import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Filter, Grid, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

export default function Products() {
  const { t } = useTranslation();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [gridSize, setGridSize] = useState<"small" | "large">("large");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([
    { id: "all", name: t("product.all") },
  ]);

  // Determine page type based on route
  const getPageInfo = () => {
    if (location.pathname === "/new") {
      return {
        title: t("product.newArrivals"),
        description: t("product.newArrivalsDesc"),
      };
    } else if (location.pathname === "/sale") {
      return {
        title: t("product.saleItems"),
        description: t("product.saleItemsDesc"),
      };
    } else if (location.pathname === "/bestsellers") {
      return {
        title: t("product.bestsellers"),
        description: t("product.bestsellersDesc"),
      };
    } else {
      return {
        title: t("product.allProducts"),
        description: t("product.allProductsDesc"),
      };
    }
  };

  const pageInfo = getPageInfo();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products" as any)
          .select("*")
          .eq("is_active", true);

        if (error || !data || data.length === 0) {
          setProducts([]);
          setCategories([{ id: "all", name: t("product.all") }]);
          return;
        }

        const list = (data || []) as unknown as Product[];
        setProducts(list);

        const categorySet = new Set(list.map((p) => p.category).filter(Boolean));
        setCategories([
          { id: "all", name: t("product.all") },
          ...Array.from(categorySet).map((category) => ({ id: category, name: category })),
        ]);
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
        setCategories([{ id: "all", name: t("product.all") }]);
      }
    };

    loadProducts();
  }, [t]);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <main className="pt-20 md:pt-24">
      {/* Header */}
      <div className="bg-secondary py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-semibold">{pageInfo.title}</h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            {pageInfo.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {t("product.items")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant={gridSize === "large" ? "default" : "ghost"}
                size="icon"
                onClick={() => setGridSize("large")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === "small" ? "default" : "ghost"}
                size="icon"
                onClick={() => setGridSize("small")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={`grid gap-4 md:gap-6 ${
            gridSize === "large"
              ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          }`}
        >
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{t("product.noProducts")}</p>
          </div>
        )}
      </div>
    </main>
  );
}
