import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80"
          alt="Fashion hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-32">
        <div className="max-w-2xl">
          <span className="inline-block text-accent font-medium tracking-wider uppercase text-sm mb-4 animate-fade-in">
            {t("home.newCollection")}
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight animate-fade-in-up">
            {t("home.heroTitle1")}
            <br />
            <span className="text-muted-foreground">{t("home.heroTitle2")}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {t("home.heroDescription")}
          </p>
          <div className="flex flex-wrap gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button variant="hero" asChild>
              <Link to="/products">
                {t("home.shopNow")}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outlineHero" asChild>
              <Link to="/new">{t("home.browseNew")}</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            {[
              { value: "50+", label: t("home.countriesShipping") },
              { value: "10K+", label: t("home.happyCustomers") },
              { value: "100%", label: t("home.qualityGuarantee") },
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
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("home.scrollToExplore")}</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
}
