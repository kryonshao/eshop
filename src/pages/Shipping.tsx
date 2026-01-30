import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Globe, Clock, DollarSign, MapPin } from "lucide-react";

export default function Shipping() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-8 w-8 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {t("shipping.title")}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t("shipping.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Shipping Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              {t("shipping.methods")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">{t("shipping.standard")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("shipping.standardDesc")}
                </p>
                <div className="flex items-center gap-2 text-accent">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("shipping.standardTime")}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{t("shipping.express")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("shipping.expressDesc")}
                </p>
                <div className="flex items-center gap-2 text-accent">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("shipping.expressTime")}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{t("shipping.international")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("shipping.internationalDesc")}
                </p>
                <div className="flex items-center gap-2 text-accent">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("shipping.internationalTime")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              {t("shipping.coverage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{t("shipping.domestic")}</h3>
              <p className="text-muted-foreground">
                {t("shipping.domesticDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("shipping.internationalCoverage")}</h3>
              <p className="text-muted-foreground">
                {t("shipping.internationalDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Process */}
        <Card>
          <CardHeader>
            <CardTitle>{t("shipping.process")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { step: "1", title: t("shipping.step1"), description: t("shipping.step1Desc") },
                { step: "2", title: t("shipping.step2"), description: t("shipping.step2Desc") },
                { step: "3", title: t("shipping.step3"), description: t("shipping.step3Desc") },
                { step: "4", title: t("shipping.step4"), description: t("shipping.step4Desc") },
                { step: "5", title: t("shipping.step5"), description: t("shipping.step5Desc") },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-semibold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              {t("shipping.costs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg">
                <h3 className="font-semibold mb-2">{t("shipping.freeShipping")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("shipping.freeShippingDesc")}
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium">{t("shipping.standardCost")}</h4>
                  <p className="text-sm text-muted-foreground">{t("shipping.standardCostDesc")}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">{t("shipping.expressCost")}</h4>
                  <p className="text-sm text-muted-foreground">{t("shipping.expressCostDesc")}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">{t("shipping.internationalCost")}</h4>
                  <p className="text-sm text-muted-foreground">{t("shipping.internationalCostDesc")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              {t("shipping.tracking")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{t("shipping.trackingTitle")}</h3>
              <p className="text-muted-foreground">{t("shipping.trackingDesc")}</p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("shipping.trackingMethod1")}</li>
              <li>{t("shipping.trackingMethod2")}</li>
              <li>{t("shipping.trackingMethod3")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t("shipping.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("shipping.note1")}</li>
              <li>{t("shipping.note2")}</li>
              <li>{t("shipping.note3")}</li>
              <li>{t("shipping.note4")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
