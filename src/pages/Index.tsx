import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import Features from "@/components/home/Features";
import Newsletter from "@/components/home/Newsletter";

const Index = () => {
  return (
    <main>
      <Hero />
      <Features />
      <FeaturedProducts />
      <Categories />
      <Newsletter />
    </main>
  );
};

export default Index;
