import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Newsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success(t("home.subscribeSuccess"), {
        description: t("home.subscribeSuccessDesc"),
      });
      setEmail("");
    }
  };

  return (
    <section className="py-20 md:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <Mail className="h-12 w-12 mx-auto mb-6 opacity-80" />
        <h2 className="font-display text-3xl md:text-4xl font-semibold">
          {t("home.subscribeTitle")}
        </h2>
        <p className="mt-4 text-primary-foreground/70 max-w-md mx-auto">
          {t("home.subscribeDescription")}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
          <Input
            type="email"
            placeholder={t("home.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            required
          />
          <Button type="submit" variant="gold">
            {t("home.subscribeButton")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
        <p className="mt-4 text-xs text-primary-foreground/50">
          {t("home.subscribeDisclaimer")}
        </p>
      </div>
    </section>
  );
}
