import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFeaturedArticles } from "@/hooks/useArticles";

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: heroArticles = [], isLoading } = useFeaturedArticles();

  useEffect(() => {
    if (heroArticles.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroArticles.length]);

  const nextSlide = () => {
    if (heroArticles.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
  };

  const prevSlide = () => {
    if (heroArticles.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + heroArticles.length) % heroArticles.length);
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden rounded-xl bg-card shadow-lg">
        <Skeleton className="h-[400px] md:h-[500px] w-full" />
      </section>
    );
  }

  if (heroArticles.length === 0) {
    return null;
  }

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
                    <Badge variant={article.badge as "hot" | "trending" | "new"}>
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
