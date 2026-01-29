import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.svg"
          alt="Fashion hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-32">
        <div className="max-w-2xl">
          <span className="inline-block text-accent font-medium tracking-wider uppercase text-sm mb-4 animate-fade-in">
            2024 新品系列
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight animate-fade-in-up">
            简约之美
            <br />
            <span className="text-muted-foreground">定义你的风格</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            探索我们精心设计的高品质白牌服装系列，为您带来舒适与时尚的完美结合。
          </p>
          <div className="flex flex-wrap gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" asChild>
              <Link to="/products">
                立即选购
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outlineHero" asChild>
              <Link to="/new">浏览新品</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {[
              { value: "50+", label: "国家配送" },
              { value: "10K+", label: "满意顾客" },
              { value: "100%", label: "品质保证" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl md:text-4xl font-semibold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">滚动浏览</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
}
