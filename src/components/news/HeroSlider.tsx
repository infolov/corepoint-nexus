import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFeaturedArticles } from "@/hooks/useArticles";
import { NewsCard } from "./NewsCard";

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: heroArticles = [], isLoading } = useFeaturedArticles();

  useEffect(() => {
    if (heroArticles.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(1, heroArticles.length - 2));
    }, 8000);
    return () => clearInterval(timer);
  }, [heroArticles.length]);

  const nextSlide = () => {
    if (heroArticles.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, heroArticles.length - 2));
  };

  const prevSlide = () => {
    if (heroArticles.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, heroArticles.length - 2)) % Math.max(1, heroArticles.length - 2));
  };

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[154px] w-full rounded-lg" />
          <Skeleton className="h-[154px] w-full rounded-lg" />
        </div>
      </section>
    );
  }

  if (heroArticles.length === 0) {
    return null;
  }

  const mainArticle = heroArticles[currentSlide] || heroArticles[0];
  const sideArticles = heroArticles.slice(currentSlide + 1, currentSlide + 3);

  return (
    <section className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Main Hero Card */}
        <div className="md:col-span-2 relative">
          <NewsCard
            id={mainArticle.id}
            title={mainArticle.title}
            category={mainArticle.category}
            image={mainArticle.image}
            timestamp={mainArticle.timestamp}
            badge={mainArticle.badge as "trending" | "local" | undefined}
            variant="hero"
            className="h-[320px]"
          />
          
          {/* Navigation Arrows */}
          {heroArticles.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 h-8 w-8 rounded-full"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 h-8 w-8 rounded-full"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: Math.max(1, heroArticles.length - 2) }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  index === currentSlide ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                )}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Side Cards */}
        <div className="flex flex-col gap-3">
          {sideArticles.map((article) => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              category={article.category}
              image={article.image}
              timestamp={article.timestamp}
              variant="hero"
              className="h-[154px]"
            />
          ))}
          {/* Fill empty slots if needed */}
          {sideArticles.length < 2 && heroArticles.slice(0, 2 - sideArticles.length).map((article) => (
            <NewsCard
              key={article.id + "-fill"}
              id={article.id}
              title={article.title}
              category={article.category}
              image={article.image}
              timestamp={article.timestamp}
              variant="hero"
              className="h-[154px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
