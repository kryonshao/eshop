import { Link } from "react-router-dom";

const categories: Array<{
  name: string;
  nameEn: string;
  image: string;
  link: string;
}> = [];

export default function Categories() {
  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-medium tracking-wider uppercase text-sm">
            分类浏览
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-2">
            按类别选购
          </h2>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            暂无分类
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.name}
                to={category.link}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center">
                  <span className="text-primary-foreground/70 text-sm uppercase tracking-wider">
                    {category.nameEn}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary-foreground mt-1 group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  <div className="w-12 h-0.5 bg-accent mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
