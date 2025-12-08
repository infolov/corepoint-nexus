import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  timestamp: string;
  badge?: "hot" | "trending" | "new";
}

const heroArticles: HeroArticle[] = [
  {
    id: "1",
    title: "Przełomowa decyzja UE w sprawie regulacji sztucznej inteligencji",
    excerpt: "Unia Europejska przyjęła nowe przepisy dotyczące AI, które zmienią sposób działania technologicznych gigantów na kontynencie.",
    category: "Technologia",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    timestamp: "2 godz. temu",
    badge: "hot",
  },
  {
    id: "2",
    title: "Rekordowe wzrosty na giełdach światowych",
    excerpt: "Indeksy giełdowe biją kolejne rekordy. Eksperci analizują przyczyny i prognozy na kolejne miesiące.",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
    timestamp: "4 godz. temu",
    badge: "trending",
  },
  {
    id: "3",
    title: "Reprezentacja Polski w drodze do finału mistrzostw",
    excerpt: "Polscy sportowcy pokazali klasę w półfinałowych zmaganiach. Przed nami wielki finał.",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop",
    timestamp: "6 godz. temu",
    badge: "new",
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroArticles.length) % heroArticles.length);
  };

  return (
    <section className="relative overflow-hidden rounded-xl bg-card shadow-lg">
      <div className="relative h-[400px] md:h-[500px]">
        {heroArticles.map((article, index) => (
          <div
            key={article.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            )}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="category">{article.category}</Badge>
                  {article.badge && (
                    <Badge variant={article.badge}>
                      {article.badge === "hot" && "🔥 Gorące"}
                      {article.badge === "trending" && "📈 Trending"}
                      {article.badge === "new" && "✨ Nowe"}
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
                  {article.title}
                </h2>
                <p className="text-white/80 text-base md:text-lg mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-white/60 text-sm">
                    <Clock className="h-4 w-4" />
                    {article.timestamp}
                  </span>
                  <Link to={`/article/${article.id}`}>
                    <Button variant="gradient" size="sm">
                      Czytaj więcej
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroArticles.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentSlide ? "bg-primary w-6" : "bg-white/50 hover:bg-white/80"
            )}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
