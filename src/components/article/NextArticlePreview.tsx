import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

interface NextArticlePreviewProps {
  article: {
    id: string;
    title: string;
    image: string;
    category: string;
    excerpt?: string;
    timestamp?: string;
  } | null;
}

export function NextArticlePreview({ article }: NextArticlePreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!article) return null;

  // Cache article data for instant load
  const handleClick = () => {
    localStorage.setItem(`article_${article.id}`, JSON.stringify(article));
  };

  return (
    <div
      ref={containerRef}
      className={`mt-8 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Scroll indicator */}
      <div className="flex flex-col items-center mb-6 text-muted-foreground">
        <span className="text-sm font-medium mb-2">Następny artykuł</span>
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </div>

      {/* Next article card */}
      <Link
        to={`/artykul/${article.id}`}
        onClick={handleClick}
        className="group block"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/10 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative p-6 md:p-8">
            <div className="flex items-start gap-4 md:gap-6">
              {/* Thumbnail */}
              <div className="hidden sm:block w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="mb-2">
                  {article.category}
                </Badge>
                <h3 className="text-lg md:text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span>Czytaj dalej</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
