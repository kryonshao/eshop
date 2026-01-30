import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import ProductQuickView from "./ProductQuickView";
import { useWishlist } from "@/contexts/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const isLiked = isInWishlist(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && (
              <Badge className="bg-primary text-primary-foreground">新品</Badge>
            )}
            {product.isSale && discount > 0 && (
              <Badge className="bg-accent text-accent-foreground">-{discount}%</Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-3 right-3 bg-background/80 backdrop-blur-sm transition-all duration-300 ${
              isHovered || isLiked ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isLiked ? "fill-accent text-accent" : ""
              }`}
            />
          </Button>

          {/* Quick Actions */}
          <div
            className={`absolute inset-x-3 bottom-3 flex gap-2 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              variant="default"
              className="flex-1 glass"
              onClick={(e) => {
                e.preventDefault();
                setShowQuickView(true);
              }}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              快速购买
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 backdrop-blur-sm shrink-0"
              asChild
            >
              <Link to={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Link>

        {/* Product Info */}
        <Link to={`/product/${product.id}`} className="block mt-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.category}
          </p>
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
}
