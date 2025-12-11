import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
      { name: "Wypadki i zdarzenia", slug: "wypadki" },
      { name: "Pogoda", slug: "pogoda" },
      { name: "Samorząd", slug: "samorzad" },
      { name: "Prawo", slug: "prawo" },
      { name: "Edukacja", slug: "edukacja" },
      { name: "Wojsko i obronność", slug: "wojsko" },
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
      { name: "Sporty motorowe", slug: "sporty-motorowe" },
      { name: "Sporty walki", slug: "sporty-walki" },
      { name: "Hokej", slug: "hokej" },
      { name: "Lekkoatletyka", slug: "lekkoatletyka" },
      { name: "Sporty zimowe", slug: "sporty-zimowe" },
      { name: "E-sport", slug: "e-sport" },
      { name: "Inne sporty", slug: "inne-sporty" },
    ]
  },
  { 
    name: "Biznes", 
    slug: "biznes",
    subcategories: [
      { name: "Finanse osobiste", slug: "finanse-osobiste" },
      { name: "Giełda i inwestycje", slug: "gielda" },
      { name: "Nieruchomości", slug: "nieruchomosci" },
      { name: "Praca i kariera", slug: "praca" },
      { name: "Podatki", slug: "podatki" },
      { name: "Firmy i startupy", slug: "firmy" },
      { name: "Gospodarka", slug: "gospodarka" },
      { name: "Bankowość", slug: "bankowosc" },
      { name: "Ubezpieczenia", slug: "ubezpieczenia" },
      { name: "Kryptowaluty", slug: "kryptowaluty" },
    ]
  },
  { 
    name: "Technologia", 
    slug: "technologia",
    subcategories: [
      { name: "Smartfony", slug: "smartfony" },
      { name: "Komputery i laptopy", slug: "komputery" },
      { name: "Gaming", slug: "gaming" },
      { name: "Sztuczna inteligencja", slug: "ai" },
      { name: "Internet i social media", slug: "internet" },
      { name: "Recenzje i testy", slug: "recenzje" },
      { name: "Aplikacje", slug: "aplikacje" },
      { name: "Gadżety", slug: "gadzety" },
      { name: "Cyberbezpieczeństwo", slug: "cyberbezpieczenstwo" },
      { name: "Smart home", slug: "smart-home" },
    ]
  },
  { 
    name: "Lifestyle", 
    slug: "lifestyle",
    subcategories: [
      { name: "Moda", slug: "moda" },
      { name: "Uroda", slug: "uroda" },
      { name: "Związki i relacje", slug: "zwiazki" },
      { name: "Dom i wnętrza", slug: "dom" },
      { name: "Gotowanie i przepisy", slug: "gotowanie" },
      { name: "Podróże", slug: "podroze" },
      { name: "Zakupy", slug: "zakupy" },
      { name: "Ogród", slug: "ogrod" },
      { name: "Zwierzęta", slug: "zwierzeta" },
      { name: "DIY i rękodzieło", slug: "diy" },
    ]
  },
  { 
    name: "Rozrywka", 
    slug: "rozrywka",
    subcategories: [
      { name: "Film", slug: "film" },
      { name: "Muzyka", slug: "muzyka" },
      { name: "Seriale", slug: "seriale" },
      { name: "Gwiazdy i celebryci", slug: "gwiazdy" },
      { name: "Telewizja", slug: "tv" },
      { name: "Książki", slug: "ksiazki" },
      { name: "Streaming", slug: "streaming" },
      { name: "Koncerty i wydarzenia", slug: "wydarzenia" },
      { name: "Memy i viral", slug: "memy" },
      { name: "Plotki", slug: "plotki" },
    ]
  },
  { 
    name: "Zdrowie", 
    slug: "zdrowie",
    subcategories: [
      { name: "Dieta i odżywianie", slug: "dieta" },
      { name: "Fitness i trening", slug: "fitness" },
      { name: "Psychologia", slug: "psychologia" },
      { name: "Medycyna", slug: "medycyna" },
      { name: "Ciąża i macierzyństwo", slug: "ciaza" },
      { name: "Zdrowie dziecka", slug: "zdrowie-dziecka" },
      { name: "Zdrowie seniora", slug: "zdrowie-seniora" },
      { name: "Naturalne metody", slug: "naturalne" },
      { name: "Seksualność", slug: "seksualnosc" },
      { name: "Uzależnienia", slug: "uzaleznienia" },
    ]
  },
  { 
    name: "Nauka", 
    slug: "nauka",
    subcategories: [
      { name: "Kosmos i astronomia", slug: "kosmos" },
      { name: "Natura i przyroda", slug: "natura" },
      { name: "Historia", slug: "historia" },
      { name: "Odkrycia naukowe", slug: "odkrycia" },
      { name: "Ekologia i klimat", slug: "ekologia" },
      { name: "Archeologia", slug: "archeologia" },
      { name: "Fizyka", slug: "fizyka" },
      { name: "Biologia", slug: "biologia" },
      { name: "Chemia", slug: "chemia" },
      { name: "Matematyka", slug: "matematyka" },
    ]
  },
  { 
    name: "Motoryzacja", 
    slug: "motoryzacja",
    subcategories: [
      { name: "Testy samochodów", slug: "testy" },
      { name: "Nowości motoryzacyjne", slug: "nowosci" },
      { name: "Porady i poradniki", slug: "porady" },
      { name: "Samochody elektryczne", slug: "elektryczne" },
      { name: "Motocykle", slug: "motocykle" },
      { name: "Prawo jazdy", slug: "prawo-jazdy" },
      { name: "Ubezpieczenia OC/AC", slug: "ubezpieczenia-auto" },
      { name: "Tuning", slug: "tuning" },
      { name: "Klasyki", slug: "klasyki" },
      { name: "Wypadki drogowe", slug: "wypadki-drogowe" },
    ]
  },
  { 
    name: "Kultura", 
    slug: "kultura",
    subcategories: [
      { name: "Sztuka", slug: "sztuka" },
      { name: "Teatr", slug: "teatr" },
      { name: "Literatura", slug: "literatura" },
      { name: "Muzea i wystawy", slug: "muzea" },
      { name: "Architektura", slug: "architektura" },
      { name: "Fotografia", slug: "fotografia" },
      { name: "Design", slug: "design" },
      { name: "Historia kultury", slug: "historia-kultury" },
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

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

  const handleCategoryClick = (category: typeof categoriesWithSubs[0]) => {
    // Click always navigates to the category
    onCategoryChange?.(category.slug);
    setExpandedCategory(null);
  };

  const handleCategoryHover = (categorySlug: string | null) => {
    setExpandedCategory(categorySlug);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug?: string) => {
    if (subcategorySlug) {
      onCategoryChange?.(`${categorySlug}/${subcategorySlug}`);
    } else {
      onCategoryChange?.(categorySlug);
    }
    setExpandedCategory(null);
  };

  const currentExpandedCategory = categoriesWithSubs.find(c => c.slug === expandedCategory);

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
              onMouseEnter={() => category.subcategories.length > 0 && handleCategoryHover(category.slug)}
              onMouseLeave={() => handleCategoryHover(null)}
            >
              <button
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  "hover:bg-muted",
                  activeCategory === category.slug
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground",
                  expandedCategory === category.slug && "bg-muted ring-2 ring-primary/30"
                )}
              >
                {category.name}
                {category.subcategories.length > 0 && (
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    expandedCategory === category.slug && "rotate-180"
                  )} />
                )}
              </button>
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

      {/* Expanded Subcategories Panel */}
      {currentExpandedCategory && currentExpandedCategory.subcategories.length > 0 && (
        <div 
          className="border-t border-border/50 bg-muted/30 animate-fade-in"
          onMouseEnter={() => handleCategoryHover(currentExpandedCategory.slug)}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="container py-3">
            {/* Main category link */}
            <div className="flex items-center gap-2 mb-3">
              <button
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors",
                  activeCategory === currentExpandedCategory.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/80 text-primary-foreground hover:bg-primary"
                )}
                onClick={() => handleSubcategoryClick(currentExpandedCategory.slug)}
              >
                Wszystkie {currentExpandedCategory.name}
              </button>
              <button
                onClick={() => setExpandedCategory(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Zamknij
              </button>
            </div>
            
            {/* Subcategories grid - responsive */}
            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-2" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            )}>
              {currentExpandedCategory.subcategories.map((sub) => {
                const fullSlug = `${currentExpandedCategory.slug}/${sub.slug}`;
                const isActive = activeCategory === fullSlug;
                return (
                  <button
                    key={sub.slug}
                    className={cn(
                      "px-3 py-2.5 text-sm text-left rounded-lg transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground bg-background hover:bg-background/80 border border-border/50 hover:border-primary/30 hover:shadow-sm"
                    )}
                    onClick={() => handleSubcategoryClick(currentExpandedCategory.slug, sub.slug)}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
