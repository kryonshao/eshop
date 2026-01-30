import { useState } from "react";
import { Filter, Grid, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { products, categories } from "@/data/products";

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [gridSize, setGridSize] = useState<"small" | "large">("large");

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <main className="pt-20 md:pt-24">
      {/* Header */}
      <div className="bg-secondary py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-semibold">全部商品</h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            探索我们精心设计的高品质服装系列
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
              {filteredProducts.length} 件商品
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
            <p className="text-muted-foreground">暂无商品</p>
          </div>
        )}
      </div>
    </main>
  );
}
