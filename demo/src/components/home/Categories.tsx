import { Link } from "react-router-dom";

const categories = [
  {
    name: "外套系列",
    nameEn: "Outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    link: "/products?category=外套",
  },
  {
    name: "连衣裙",
    nameEn: "Dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
    link: "/products?category=裙装",
  },
  {
    name: "休闲裤装",
    nameEn: "Pants",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    link: "/products?category=裤装",
  },
];

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
      </div>
    </section>
  );
}
