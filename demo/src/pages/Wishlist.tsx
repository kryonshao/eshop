import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { products } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { wishlistIds, loading } = useWishlist();
  const { user } = useAuth();

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-semibold mb-2">请先登录</h1>
        <p className="text-muted-foreground text-center mb-6">
          登录后即可查看和管理您的收藏夹
        </p>
        <Button asChild>
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-semibold mb-8">我的收藏</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-lg" />
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-5 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-semibold mb-2">收藏夹为空</h1>
        <p className="text-muted-foreground text-center mb-6">
          浏览商品并点击心形图标添加到收藏夹
        </p>
        <Button asChild>
          <Link to="/products">浏览商品</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-semibold mb-8">
        我的收藏 ({wishlistProducts.length})
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
