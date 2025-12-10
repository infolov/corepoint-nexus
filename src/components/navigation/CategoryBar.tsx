import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const categoriesWithSubs = [
  { 
    name: "Wszystko", 
    slug: "all",
    subcategories: []
  },
  { 
    name: "Wiadomości", 
    slug: "wiadomosci",
    subcategories: [
      { name: "Polska", slug: "polska" },
      { name: "Świat", slug: "swiat" },
      { name: "Polityka", slug: "polityka" },
      { name: "Społeczeństwo", slug: "spoleczenstwo" },
      { name: "Wypadki", slug: "wypadki" },
      { name: "Pogoda", slug: "pogoda" },
    ]
  },
  { 
    name: "Sport", 
    slug: "sport",
    subcategories: [
      { name: "Piłka nożna", slug: "pilka-nozna" },
      { name: "Koszykówka", slug: "koszykowka" },
      { name: "Siatkówka", slug: "siatkowka" },
      { name: "Tenis", slug: "tenis" },
      { name: "F1", slug: "f1" },
      { name: "MMA", slug: "mma" },
    ]
  },
  { 
    name: "Biznes", 
    slug: "biznes",
    subcategories: [
      { name: "Finanse", slug: "finanse" },
      { name: "Giełda", slug: "gielda" },
      { name: "Nieruchomości", slug: "nieruchomosci" },
      { name: "Praca", slug: "praca" },
      { name: "Podatki", slug: "podatki" },
      { name: "Firmy", slug: "firmy" },
    ]
  },
  { 
    name: "Technologia", 
    slug: "technologia",
    subcategories: [
      { name: "Smartfony", slug: "smartfony" },
      { name: "Komputery", slug: "komputery" },
      { name: "Gaming", slug: "gaming" },
      { name: "AI", slug: "ai" },
      { name: "Internet", slug: "internet" },
      { name: "Recenzje", slug: "recenzje" },
    ]
  },
  { 
    name: "Lifestyle", 
    slug: "lifestyle",
    subcategories: [
      { name: "Moda", slug: "moda" },
      { name: "Uroda", slug: "uroda" },
      { name: "Związki", slug: "zwiazki" },
      { name: "Dom", slug: "dom" },
      { name: "Gotowanie", slug: "gotowanie" },
      { name: "Podróże", slug: "podroze" },
    ]
  },
  { 
    name: "Rozrywka", 
    slug: "rozrywka",
    subcategories: [
      { name: "Film", slug: "film" },
      { name: "Muzyka", slug: "muzyka" },
      { name: "Seriale", slug: "seriale" },
      { name: "Gwiazdy", slug: "gwiazdy" },
      { name: "TV", slug: "tv" },
      { name: "Książki", slug: "ksiazki" },
    ]
  },
  { 
    name: "Zdrowie", 
    slug: "zdrowie",
    subcategories: [
      { name: "Dieta", slug: "dieta" },
      { name: "Fitness", slug: "fitness" },
      { name: "Psychologia", slug: "psychologia" },
      { name: "Medycyna", slug: "medycyna" },
      { name: "Ciąża", slug: "ciaza" },
      { name: "Dzieci", slug: "dzieci" },
    ]
  },
  { 
    name: "Nauka", 
    slug: "nauka",
    subcategories: [
      { name: "Kosmos", slug: "kosmos" },
      { name: "Natura", slug: "natura" },
      { name: "Historia", slug: "historia" },
      { name: "Odkrycia", slug: "odkrycia" },
      { name: "Ekologia", slug: "ekologia" },
    ]
  },
  { 
    name: "Motoryzacja", 
    slug: "motoryzacja",
    subcategories: [
      { name: "Testy", slug: "testy" },
      { name: "Nowości", slug: "nowosci" },
      { name: "Porady", slug: "porady" },
      { name: "Elektryki", slug: "elektryki" },
      { name: "Motocykle", slug: "motocykle" },
    ]
  },
];

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    <div className="sticky top-12 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
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
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categoriesWithSubs.map((category) => (
            <div 
              key={category.slug}
              className="relative flex-shrink-0"
              onMouseEnter={() => category.subcategories.length > 0 && setOpenDropdown(category.slug)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                onClick={() => onCategoryChange?.(category.slug)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "hover:bg-muted",
                  activeCategory === category.slug
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {category.name}
                {category.subcategories.length > 0 && (
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    openDropdown === category.slug && "rotate-180"
                  )} />
                )}
              </button>

              {/* Dropdown */}
              {category.subcategories.length > 0 && openDropdown === category.slug && (
                <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg py-2 z-50">
                  {/* Main category link */}
                  <Link
                    to={`/${category.slug}`}
                    className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    onClick={() => {
                      onCategoryChange?.(category.slug);
                      setOpenDropdown(null);
                    }}
                  >
                    Wszystkie {category.name}
                  </Link>
                  <div className="border-t border-border my-1" />
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      to={`/${category.slug}/${sub.slug}`}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
