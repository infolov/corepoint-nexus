import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubSubCategory {
  name: string;
  slug: string;
}

interface SubCategory {
  name: string;
  slug: string;
  subcategories?: SubSubCategory[];
}

interface Category {
  name: string;
  slug: string;
  subcategories: SubCategory[];
}

const categoriesWithSubs: Category[] = [
  { 
    name: "Wszystko", 
    slug: "all",
    subcategories: []
  },
  { 
    name: "Wiadomości", 
    slug: "wiadomosci",
    subcategories: [
      { name: "Polska", slug: "polska", subcategories: [
        { name: "Polityka krajowa", slug: "polityka-krajowa" },
        { name: "Samorządy", slug: "samorzady" },
        { name: "Społeczeństwo", slug: "spoleczenstwo" },
      ]},
      { name: "Świat", slug: "swiat", subcategories: [
        { name: "Europa", slug: "europa" },
        { name: "USA", slug: "usa" },
        { name: "Azja", slug: "azja" },
        { name: "Bliski Wschód", slug: "bliski-wschod" },
      ]},
      { name: "Polityka", slug: "polityka", subcategories: [
        { name: "Sejm", slug: "sejm" },
        { name: "Senat", slug: "senat" },
        { name: "Rząd", slug: "rzad" },
        { name: "Partie polityczne", slug: "partie" },
      ]},
      { name: "Wypadki i zdarzenia", slug: "wypadki" },
      { name: "Pogoda", slug: "pogoda" },
      { name: "Prawo", slug: "prawo" },
      { name: "Edukacja", slug: "edukacja" },
      { name: "Wojsko i obronność", slug: "wojsko" },
    ]
  },
  { 
    name: "Sport", 
    slug: "sport",
    subcategories: [
      { name: "Piłka nożna", slug: "pilka-nozna", subcategories: [
        { name: "Ekstraklasa", slug: "ekstraklasa" },
        { name: "Premier League", slug: "premier-league" },
        { name: "La Liga", slug: "la-liga" },
        { name: "Serie A", slug: "serie-a" },
        { name: "Bundesliga", slug: "bundesliga" },
        { name: "Liga Mistrzów", slug: "liga-mistrzow" },
        { name: "Reprezentacja Polski", slug: "reprezentacja" },
        { name: "Transfery", slug: "transfery" },
      ]},
      { name: "Koszykówka", slug: "koszykowka", subcategories: [
        { name: "NBA", slug: "nba" },
        { name: "Euroliga", slug: "euroliga" },
        { name: "PLK", slug: "plk" },
      ]},
      { name: "Siatkówka", slug: "siatkowka", subcategories: [
        { name: "PlusLiga", slug: "plusliga" },
        { name: "Liga Mistrzów", slug: "liga-mistrzow-siatka" },
        { name: "Reprezentacja", slug: "reprezentacja-siatka" },
      ]},
      { name: "Tenis", slug: "tenis", subcategories: [
        { name: "ATP", slug: "atp" },
        { name: "WTA", slug: "wta" },
        { name: "Wielki Szlem", slug: "wielki-szlem" },
      ]},
      { name: "Sporty motorowe", slug: "sporty-motorowe", subcategories: [
        { name: "Formuła 1", slug: "f1" },
        { name: "MotoGP", slug: "motogp" },
        { name: "WRC", slug: "wrc" },
        { name: "Żużel", slug: "zuzel" },
      ]},
      { name: "Sporty walki", slug: "sporty-walki", subcategories: [
        { name: "MMA/UFC", slug: "mma" },
        { name: "KSW", slug: "ksw" },
        { name: "Boks", slug: "boks" },
      ]},
      { name: "Hokej", slug: "hokej" },
      { name: "Lekkoatletyka", slug: "lekkoatletyka" },
      { name: "Sporty zimowe", slug: "sporty-zimowe", subcategories: [
        { name: "Skoki narciarskie", slug: "skoki" },
        { name: "Biegi narciarskie", slug: "biegi" },
        { name: "Biathlon", slug: "biathlon" },
      ]},
      { name: "E-sport", slug: "e-sport", subcategories: [
        { name: "CS2", slug: "cs2" },
        { name: "League of Legends", slug: "lol" },
        { name: "Valorant", slug: "valorant" },
      ]},
    ]
  },
  { 
    name: "Biznes", 
    slug: "biznes",
    subcategories: [
      { name: "Finanse osobiste", slug: "finanse-osobiste", subcategories: [
        { name: "Oszczędzanie", slug: "oszczedzanie" },
        { name: "Kredyty", slug: "kredyty" },
        { name: "Lokaty", slug: "lokaty" },
      ]},
      { name: "Giełda i inwestycje", slug: "gielda", subcategories: [
        { name: "GPW", slug: "gpw" },
        { name: "Wall Street", slug: "wall-street" },
        { name: "Fundusze", slug: "fundusze" },
      ]},
      { name: "Nieruchomości", slug: "nieruchomosci" },
      { name: "Praca i kariera", slug: "praca" },
      { name: "Podatki", slug: "podatki" },
      { name: "Firmy i startupy", slug: "firmy" },
      { name: "Gospodarka", slug: "gospodarka" },
      { name: "Bankowość", slug: "bankowosc" },
      { name: "Kryptowaluty", slug: "kryptowaluty", subcategories: [
        { name: "Bitcoin", slug: "bitcoin" },
        { name: "Ethereum", slug: "ethereum" },
        { name: "Altcoiny", slug: "altcoiny" },
      ]},
    ]
  },
  { 
    name: "Technologia", 
    slug: "technologia",
    subcategories: [
      { name: "Smartfony", slug: "smartfony", subcategories: [
        { name: "iPhone", slug: "iphone" },
        { name: "Samsung", slug: "samsung" },
        { name: "Xiaomi", slug: "xiaomi" },
      ]},
      { name: "Komputery i laptopy", slug: "komputery" },
      { name: "Gaming", slug: "gaming", subcategories: [
        { name: "PC", slug: "pc" },
        { name: "PlayStation", slug: "playstation" },
        { name: "Xbox", slug: "xbox" },
        { name: "Nintendo", slug: "nintendo" },
      ]},
      { name: "Sztuczna inteligencja", slug: "ai", subcategories: [
        { name: "ChatGPT", slug: "chatgpt" },
        { name: "Gemini", slug: "gemini" },
        { name: "Claude", slug: "claude" },
        { name: "Midjourney", slug: "midjourney" },
      ]},
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
      { name: "Moda", slug: "moda", subcategories: [
        { name: "Damska", slug: "damska" },
        { name: "Męska", slug: "meska" },
        { name: "Trendy", slug: "trendy" },
      ]},
      { name: "Uroda", slug: "uroda", subcategories: [
        { name: "Makijaż", slug: "makijaz" },
        { name: "Pielęgnacja", slug: "pielegnacja" },
        { name: "Fryzury", slug: "fryzury" },
      ]},
      { name: "Związki i relacje", slug: "zwiazki" },
      { name: "Dom i wnętrza", slug: "dom" },
      { name: "Gotowanie i przepisy", slug: "gotowanie", subcategories: [
        { name: "Obiady", slug: "obiady" },
        { name: "Desery", slug: "desery" },
        { name: "Fit przepisy", slug: "fit" },
      ]},
      { name: "Podróże", slug: "podroze", subcategories: [
        { name: "Europa", slug: "europa-podroze" },
        { name: "Egzotyka", slug: "egzotyka" },
        { name: "Polska", slug: "polska-podroze" },
      ]},
      { name: "Zakupy", slug: "zakupy" },
      { name: "Ogród", slug: "ogrod" },
      { name: "Zwierzęta", slug: "zwierzeta" },
    ]
  },
  { 
    name: "Rozrywka", 
    slug: "rozrywka",
    subcategories: [
      { name: "Film", slug: "film", subcategories: [
        { name: "Premiery", slug: "premiery" },
        { name: "Recenzje", slug: "recenzje-film" },
        { name: "Box office", slug: "box-office" },
      ]},
      { name: "Muzyka", slug: "muzyka", subcategories: [
        { name: "Pop", slug: "pop" },
        { name: "Rock", slug: "rock" },
        { name: "Hip-hop", slug: "hip-hop" },
        { name: "Elektroniczna", slug: "elektroniczna" },
      ]},
      { name: "Seriale", slug: "seriale", subcategories: [
        { name: "Netflix", slug: "netflix" },
        { name: "HBO Max", slug: "hbo" },
        { name: "Disney+", slug: "disney" },
      ]},
      { name: "Gwiazdy i celebryci", slug: "gwiazdy" },
      { name: "Telewizja", slug: "tv" },
      { name: "Książki", slug: "ksiazki" },
      { name: "Streaming", slug: "streaming" },
      { name: "Koncerty i wydarzenia", slug: "wydarzenia" },
    ]
  },
  { 
    name: "Zdrowie", 
    slug: "zdrowie",
    subcategories: [
      { name: "Dieta i odżywianie", slug: "dieta", subcategories: [
        { name: "Keto", slug: "keto" },
        { name: "Weganizm", slug: "weganizm" },
        { name: "Intermittent fasting", slug: "if" },
      ]},
      { name: "Fitness i trening", slug: "fitness", subcategories: [
        { name: "Siłownia", slug: "silownia" },
        { name: "Cardio", slug: "cardio" },
        { name: "Joga", slug: "joga" },
      ]},
      { name: "Psychologia", slug: "psychologia" },
      { name: "Medycyna", slug: "medycyna" },
      { name: "Ciąża i macierzyństwo", slug: "ciaza" },
      { name: "Zdrowie dziecka", slug: "zdrowie-dziecka" },
      { name: "Naturalne metody", slug: "naturalne" },
    ]
  },
  { 
    name: "Nauka", 
    slug: "nauka",
    subcategories: [
      { name: "Kosmos i astronomia", slug: "kosmos", subcategories: [
        { name: "NASA", slug: "nasa" },
        { name: "SpaceX", slug: "spacex" },
        { name: "Planety", slug: "planety" },
      ]},
      { name: "Natura i przyroda", slug: "natura" },
      { name: "Historia", slug: "historia" },
      { name: "Odkrycia naukowe", slug: "odkrycia" },
      { name: "Ekologia i klimat", slug: "ekologia" },
      { name: "Archeologia", slug: "archeologia" },
    ]
  },
  { 
    name: "Motoryzacja", 
    slug: "motoryzacja",
    subcategories: [
      { name: "Testy samochodów", slug: "testy", subcategories: [
        { name: "SUV", slug: "suv" },
        { name: "Sedany", slug: "sedany" },
        { name: "Hatchbacki", slug: "hatchbacki" },
      ]},
      { name: "Samochody elektryczne", slug: "elektryczne", subcategories: [
        { name: "Tesla", slug: "tesla" },
        { name: "BYD", slug: "byd" },
        { name: "Polskie EV", slug: "polskie-ev" },
      ]},
      { name: "Motocykle", slug: "motocykle" },
      { name: "Porady", slug: "porady-moto" },
      { name: "Tuning", slug: "tuning" },
      { name: "Klasyki", slug: "klasyki" },
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
      { name: "Design", slug: "design" },
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
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
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
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleCategoryHover = (categorySlug: string | null) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    if (categorySlug) {
      // Immediately show on hover
      setExpandedCategory(categorySlug);
    } else {
      // Delay hiding to allow moving to panel
      const timeout = setTimeout(() => {
        setExpandedCategory(null);
      }, 150);
      setHoverTimeout(timeout);
    }
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug?: string, subSubSlug?: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (subSubSlug && subcategorySlug) {
      onCategoryChange?.(`${categorySlug}/${subcategorySlug}/${subSubSlug}`);
    } else if (subcategorySlug) {
      onCategoryChange?.(`${categorySlug}/${subcategorySlug}`);
    } else {
      onCategoryChange?.(categorySlug);
    }
    setExpandedCategory(null);
    setExpandedSubcategory(null);
  };

  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);

  const currentExpandedCategory = categoriesWithSubs.find(c => c.slug === expandedCategory);

  // Hide on mobile
  if (isMobile) {
    return null;
  }

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
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

      {/* Subcategories panel - expands below */}
      {currentExpandedCategory && currentExpandedCategory.subcategories.length > 0 && (
        <div 
          className="border-t border-border/50 bg-muted/30 animate-slide-down"
          onMouseEnter={() => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            setExpandedCategory(currentExpandedCategory.slug);
          }}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="container py-6">
            {/* Grid layout for thematic grouping */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {/* All button as first column */}
              <div className="flex flex-col gap-2">
                <button
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-colors text-left",
                    activeCategory === currentExpandedCategory.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted text-foreground border border-border"
                  )}
                  onClick={() => handleSubcategoryClick(currentExpandedCategory.slug)}
                >
                  📌 Wszystko
                </button>
              </div>
              
              {/* Each subcategory as a thematic column */}
              {currentExpandedCategory.subcategories.map((sub) => {
                const fullSlug = `${currentExpandedCategory.slug}/${sub.slug}`;
                const isActive = activeCategory === fullSlug || activeCategory.startsWith(fullSlug + '/');
                const hasSubSubs = sub.subcategories && sub.subcategories.length > 0;
                
                return (
                  <div key={sub.slug} className="flex flex-col gap-1.5">
                    {/* Main subcategory header */}
                    <button
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-bold transition-colors text-left border-b-2 border-primary/30 pb-2 mb-1",
                        isActive
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      )}
                      onClick={() => handleSubcategoryClick(currentExpandedCategory.slug, sub.slug)}
                    >
                      {sub.name}
                    </button>
                    
                    {/* Sub-subcategories as vertical list */}
                    {hasSubSubs && (
                      <div className="flex flex-col gap-0.5">
                        {sub.subcategories!.map((subSub) => {
                          const subSubFullSlug = `${currentExpandedCategory.slug}/${sub.slug}/${subSub.slug}`;
                          const isSubSubActive = activeCategory === subSubFullSlug;
                          
                          return (
                            <button
                              key={subSub.slug}
                              className={cn(
                                "px-3 py-1 rounded text-xs transition-colors text-left",
                                isSubSubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              )}
                              onClick={() => handleSubcategoryClick(currentExpandedCategory.slug, sub.slug, subSub.slug)}
                            >
                              {subSub.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
