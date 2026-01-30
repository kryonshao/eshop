import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("订阅成功！", {
        description: "感谢您的订阅，我们将为您发送最新优惠信息。",
      });
      setEmail("");
    }
  };

  return (
    <section className="py-20 md:py-32 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <Mail className="h-12 w-12 mx-auto mb-6 opacity-80" />
        <h2 className="font-display text-3xl md:text-4xl font-semibold">
          订阅获取独家优惠
        </h2>
        <p className="mt-4 text-primary-foreground/70 max-w-md mx-auto">
          订阅我们的新闻通讯，第一时间获取新品发布、限时折扣和专属优惠信息。
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
          <Input
            type="email"
            placeholder="输入您的邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            required
          />
          <Button type="submit" variant="gold">
            立即订阅
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
        <p className="mt-4 text-xs text-primary-foreground/50">
          订阅即表示您同意接收我们的营销邮件。您可以随时取消订阅。
        </p>
      </div>
    </section>
  );
}
