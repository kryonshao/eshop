import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler, Info } from "lucide-react";

export default function SizeGuide() {
  const { t } = useTranslation();

  const sizeCharts = {
    tops: [
      { size: "XS", chest: "84-88", waist: "66-70", shoulder: "38-40" },
      { size: "S", chest: "88-92", waist: "70-74", shoulder: "40-42" },
      { size: "M", chest: "92-96", waist: "74-78", shoulder: "42-44" },
      { size: "L", chest: "96-100", waist: "78-82", shoulder: "44-46" },
      { size: "XL", chest: "100-104", waist: "82-86", shoulder: "46-48" },
      { size: "XXL", chest: "104-108", waist: "86-90", shoulder: "48-50" },
    ],
    bottoms: [
      { size: "XS", waist: "66-70", hip: "88-92", length: "98-100" },
      { size: "S", waist: "70-74", hip: "92-96", length: "100-102" },
      { size: "M", waist: "74-78", hip: "96-100", length: "102-104" },
      { size: "L", waist: "78-82", hip: "100-104", length: "104-106" },
      { size: "XL", waist: "82-86", hip: "104-108", length: "106-108" },
      { size: "XXL", waist: "86-90", hip: "108-112", length: "108-110" },
    ],
  };

  const measurementTips = [
    {
      title: t("sizeGuide.chestMeasure"),
      description: t("sizeGuide.chestMeasureDesc"),
    },
    {
      title: t("sizeGuide.waistMeasure"),
      description: t("sizeGuide.waistMeasureDesc"),
    },
    {
      title: t("sizeGuide.hipMeasure"),
      description: t("sizeGuide.hipMeasureDesc"),
    },
    {
      title: t("sizeGuide.shoulderMeasure"),
      description: t("sizeGuide.shoulderMeasureDesc"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Ruler className="h-8 w-8 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {t("sizeGuide.title")}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t("sizeGuide.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Measurement Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-accent" />
              {t("sizeGuide.howToMeasure")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {measurementTips.map((tip) => (
                <div key={tip.title} className="space-y-2">
                  <h3 className="font-semibold">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tops Size Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sizeGuide.topsChart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.size")}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.chest")} (cm)</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.waist")} (cm)</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.shoulder")} (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeCharts.tops.map((row) => (
                    <tr key={row.size} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.size}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.chest}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.waist}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.shoulder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Bottoms Size Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sizeGuide.bottomsChart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.size")}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.waist")} (cm)</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.hip")} (cm)</th>
                    <th className="text-left py-3 px-4 font-semibold">{t("sizeGuide.length")} (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeCharts.bottoms.map((row) => (
                    <tr key={row.size} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.size}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.waist}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.hip}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Tips */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sizeGuide.tips")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{t("sizeGuide.betweenSizes")}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t("sizeGuide.loosefit")}</li>
                <li>{t("sizeGuide.slimfit")}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("sizeGuide.notes")}</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t("sizeGuide.note1")}</li>
                <li>{t("sizeGuide.note2")}</li>
                <li>{t("sizeGuide.note3")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
