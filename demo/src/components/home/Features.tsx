import { Truck, Shield, RefreshCw, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "全球配送",
    description: "覆盖50+国家，快速安全送达",
  },
  {
    icon: Shield,
    title: "品质保证",
    description: "精选面料，严格质检",
  },
  {
    icon: RefreshCw,
    title: "无忧退换",
    description: "30天内免费退换货",
  },
  {
    icon: Headphones,
    title: "专属客服",
    description: "7x24小时在线服务",
  },
];

export default function Features() {
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
