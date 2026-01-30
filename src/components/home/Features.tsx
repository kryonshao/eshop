import { Truck, Shield, RefreshCw, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Features() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Truck,
      title: t("home.globalShipping"),
      description: t("home.globalShippingDesc"),
    },
    {
      icon: Shield,
      title: t("home.qualityAssurance"),
      description: t("home.qualityAssuranceDesc"),
    },
    {
      icon: RefreshCw,
      title: t("home.easyReturns"),
      description: t("home.easyReturnsDesc"),
    },
    {
      icon: Headphones,
      title: t("home.customerSupport"),
      description: t("home.customerSupportDesc"),
    },
  ];

  return (
    <section className="py-16 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
