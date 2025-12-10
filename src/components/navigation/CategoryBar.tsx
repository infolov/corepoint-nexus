import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { name: "Wszystko", slug: "all" },
  { name: "Wiadomości", slug: "wiadomosci" },
  { name: "Biznes", slug: "biznes" },
  { name: "Sport", slug: "sport" },
  { name: "Technologia", slug: "technologia" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Rozrywka", slug: "rozrywka" },
  { name: "Zdrowie", slug: "zdrowie" },
  { name: "Nauka", slug: "nauka" },
  { name: "Motoryzacja", slug: "motoryzacja" },
  { name: "Podróże", slug: "podroze" },
  { name: "Kultura", slug: "kultura" },
  { name: "Polityka", slug: "polityka" },
  { name: "Świat", slug: "swiat" },
];

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-r from-background via-background to-transparent"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}

        {/* Scrollable Categories */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => onCategoryChange?.(category.slug)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                "hover:bg-muted",
                activeCategory === category.slug
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-l from-background via-background to-transparent"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
