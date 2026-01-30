import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    shop: [
      { label: t("nav.allProducts"), href: "/products" },
      { label: t("nav.newArrivals"), href: "/new" },
      { label: t("nav.sale"), href: "/sale" },
      { label: t("nav.bestsellers"), href: "/bestsellers" },
    ],
    help: [
      { label: t("nav.sizeGuide"), href: "/size-guide" },
      { label: t("nav.shippingInfo"), href: "/shipping" },
      { label: t("nav.returnPolicy"), href: "/returns" },
      { label: t("nav.faq"), href: "/faq" },
    ],
    about: [
      { label: t("footer.aboutUs"), href: "/about" },
      { label: t("footer.contactUs"), href: "/contact" },
      { label: t("footer.privacyPolicy"), href: "/privacy" },
      { label: t("footer.termsOfService"), href: "/terms" },
    ],
  };

  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                AltEs<span className="text-accent">.</span>
              </h2>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-sm">
              {t("footer.brandDescription")}
            </p>
            <div className="flex items-center space-x-4 mt-6">
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.shop")}</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.help")}</h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.subscribeTitle")}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {t("footer.subscribeDescription")}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                className="flex-1"
              />
              <Button variant="default" size="icon">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 AltEs. {t("footer.copyright")}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{t("footer.paymentMethods")}</span>
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>PayPal</span>
            <span>•</span>
            <span>支付宝</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
