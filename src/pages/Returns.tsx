import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function Returns() {
  const { t } = useTranslation();

  const returnConditions = [
    { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: t("returns.condition1") },
    { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: t("returns.condition2") },
    { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: t("returns.condition3") },
    { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: t("returns.condition4") },
  ];

  const nonReturnableItems = [
    t("returns.nonReturnable1"),
    t("returns.nonReturnable2"),
    t("returns.nonReturnable3"),
    t("returns.nonReturnable4"),
    t("returns.nonReturnable5"),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw className="h-8 w-8 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {t("returns.title")}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t("returns.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Return Policy Overview */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent rounded-full flex-shrink-0">
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t("returns.policyTitle")}</h3>
                <p className="text-muted-foreground">
                  {t("returns.policyDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("returns.conditions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {returnConditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-3">
                  {condition.icon}
                  <span>{condition.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Return Process */}
        <Card>
          <CardHeader>
            <CardTitle>{t("returns.process")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { step: "1", title: t("returns.step1"), description: t("returns.step1Desc") },
                { step: "2", title: t("returns.step2"), description: t("returns.step2Desc") },
                { step: "3", title: t("returns.step3"), description: t("returns.step3Desc") },
                { step: "4", title: t("returns.step4"), description: t("returns.step4Desc") },
                { step: "5", title: t("returns.step5"), description: t("returns.step5Desc") },
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

        {/* Non-returnable Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {t("returns.nonReturnable")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nonReturnableItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Shipping Costs */}
        <Card>
          <CardHeader>
            <CardTitle>{t("returns.shippingCosts")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{t("returns.qualityIssue")}</h3>
              <p className="text-muted-foreground">
                {t("returns.qualityIssueDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("returns.nonQualityIssue")}</h3>
              <p className="text-muted-foreground">
                {t("returns.nonQualityIssueDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              {t("returns.notes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{t("returns.note1")}</li>
              <li>{t("returns.note2")}</li>
              <li>{t("returns.note3")}</li>
              <li>{t("returns.note4")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
