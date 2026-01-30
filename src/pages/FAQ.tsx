import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ShoppingBag, Truck, CreditCard, RotateCcw, Shield } from "lucide-react";

export default function FAQ() {
  const { t } = useTranslation();

  const faqCategories = [
    {
      title: t("faq.orderRelated"),
      icon: <ShoppingBag className="h-5 w-5" />,
      questions: [
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
        { q: t("faq.q3"), a: t("faq.a3") },
        { q: t("faq.q4"), a: t("faq.a4") },
      ],
    },
    {
      title: t("faq.shippingRelated"),
      icon: <Truck className="h-5 w-5" />,
      questions: [
        { q: t("faq.q5"), a: t("faq.a5") },
        { q: t("faq.q6"), a: t("faq.a6") },
        { q: t("faq.q7"), a: t("faq.a7") },
        { q: t("faq.q8"), a: t("faq.a8") },
      ],
    },
    {
      title: t("faq.paymentRelated"),
      icon: <CreditCard className="h-5 w-5" />,
      questions: [
        { q: t("faq.q9"), a: t("faq.a9") },
        { q: t("faq.q10"), a: t("faq.a10") },
        { q: t("faq.q11"), a: t("faq.a11") },
        { q: t("faq.q12"), a: t("faq.a12") },
      ],
    },
    {
      title: t("faq.returnRelated"),
      icon: <RotateCcw className="h-5 w-5" />,
      questions: [
        { q: t("faq.q13"), a: t("faq.a13") },
        { q: t("faq.q14"), a: t("faq.a14") },
        { q: t("faq.q15"), a: t("faq.a15") },
        { q: t("faq.q16"), a: t("faq.a16") },
      ],
    },
    {
      title: t("faq.productRelated"),
      icon: <Shield className="h-5 w-5" />,
      questions: [
        { q: t("faq.q17"), a: t("faq.a17") },
        { q: t("faq.q18"), a: t("faq.a18") },
        { q: t("faq.q19"), a: t("faq.a19") },
        { q: t("faq.q20"), a: t("faq.a20") },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-8 w-8 text-accent" />
          <h1 className="font-display text-3xl md:text-4xl font-semibold">
            {t("faq.title")}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t("faq.subtitle")}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {faqCategories.map((category, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-semibold">{category.title}</h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((item, qIndex) => (
                  <AccordionItem key={qIndex} value={`item-${index}-${qIndex}`}>
                    <AccordionTrigger className="text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {/* Contact Support */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">{t("faq.noAnswer")}</h3>
              <p className="text-muted-foreground">
                {t("faq.contactUs")}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("faq.customerEmail")}</span>
                  <span className="font-medium ml-2">support@altes.com</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("faq.workingHours")}</span>
                  <span className="font-medium ml-2">{t("faq.workingHoursValue")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
