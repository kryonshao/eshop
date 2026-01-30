import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const footerLinks = {
    shop: [
      { label: "全部商品", href: "/products" },
      { label: "新品上市", href: "/new" },
      { label: "特价优惠", href: "/sale" },
      { label: "热销榜单", href: "/bestsellers" },
    ],
    help: [
      { label: "尺码指南", href: "/size-guide" },
      { label: "配送信息", href: "/shipping" },
      { label: "退换政策", href: "/returns" },
      { label: "常见问题", href: "/faq" },
    ],
    about: [
      { label: "关于我们", href: "/about" },
      { label: "联系我们", href: "/contact" },
      { label: "隐私政策", href: "/privacy" },
      { label: "使用条款", href: "/terms" },
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
                BLANC<span className="text-accent">.</span>
              </h2>
            </Link>
            <p className="mt-4 text-muted-foreground max-w-sm">
              专注于高品质白牌服装，为全球消费者提供时尚、舒适、性价比高的穿着选择。
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
            <h3 className="font-semibold mb-4">购物</h3>
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
            <h3 className="font-semibold mb-4">帮助</h3>
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
            <h3 className="font-semibold mb-4">订阅优惠</h3>
            <p className="text-muted-foreground text-sm mb-4">
              订阅获取最新优惠和新品信息
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="输入邮箱"
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
            © 2024 BLANC. 保留所有权利。
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>支付方式：</span>
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
