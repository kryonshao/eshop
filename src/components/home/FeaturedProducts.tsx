import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";

export default function FeaturedProducts() {
  const { t } = useTranslation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadFeatured = async () => {
      const { data, error } = await supabase
        .from("products" as any)
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("featured_order", { ascending: true })
        .limit(8);

      if (error) {
        console.error("Error loading featured products:", error);
        setFeaturedProducts([]);
        return;
      }

      setFeaturedProducts((data || []) as unknown as Product[]);
    };

    loadFeatured();
  }, []);

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-accent font-medium tracking-wider uppercase text-sm">
              {t("product.featured")}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
              {t("product.popularItems")}
            </h2>
          </div>
          <Button variant="ghost" asChild className="self-start md:self-auto">
            <Link to="/products">
              {t("product.viewAll")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
