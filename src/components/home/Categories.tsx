import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  name_en: string;
  image_url: string;
  display_order: number;
}

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("product_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(3);

      if (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
        return;
      }

      setCategories((data || []) as unknown as Category[]);
    };

    loadCategories();
  }, []);

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-medium tracking-wider uppercase text-sm">
            {t("product.browseByCategory")}
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            {t("product.shopByCategory")}
          </h2>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {t("product.noCategories")}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center">
                  <span className="text-primary-foreground/70 text-sm uppercase tracking-wider">
                    {category.name_en}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary-foreground mt-1 group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  <div className="w-12 h-0.5 bg-accent mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
