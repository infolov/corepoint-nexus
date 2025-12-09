import { useState, useEffect } from "react";
import { Play, MoreHorizontal, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeroArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  timestamp: string;
  source: string;
  badge?: "hot" | "trending" | "new" | "pilne";
  hasVideo?: boolean;
}

const heroArticles: HeroArticle[] = [
  {
    id: "1",
    title: "Trump nie ma wątpliwości ws. Rosji. Mówi o III wojnie światowej",
    excerpt: "Prezydent USA komentuje sytuację międzynarodową w wywiadzie dla mediów.",
    category: "Polityka",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    timestamp: "2 godz.",
    source: "o2",
    badge: "hot",
    hasVideo: false,
  },
  {
    id: "2",
    title: "Rekordowe wzrosty na giełdach światowych. Eksperci prognozują dalsze zyski",
    excerpt: "Indeksy giełdowe biją kolejne rekordy.",
    category: "Biznes",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop",
    timestamp: "4 godz.",
    source: "Finanse24",
    badge: "trending",
  },
  {
    id: "3",
    title: "Reprezentacja Polski w drodze do finału mistrzostw",
    excerpt: "Polscy sportowcy pokazali klasę w półfinałowych zmaganiach.",
    category: "Sport",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=600&fit=crop",
    timestamp: "6 godz.",
    source: "Sport.pl",
    badge: "new",
  },
];

// All sidebar articles - divided into pages
const allSidebarArticles = [
  // Page 1
  [
    {
      id: "s1",
      title: "Kiedy ruszy budowa elektrowni jądrowej? Tusk...",
      source: "DoRzeczy",
      timestamp: "3 godz.",
      image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=200&fit=crop",
      badge: "pilne" as const,
    },
    {
      id: "s2",
      title: "Ostry spór w NBP. Adam Glapiński odsunął trzech...",
      source: "Rzeczpospolita",
      timestamp: "1 godz.",
      image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=200&h=200&fit=crop",
    },
    {
      id: "s3",
      title: "Łowca nastolatek ponownie stanął przed sądem. Jest...",
      source: "Onet Wiadomości",
      timestamp: "1 godz.",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=200&fit=crop",
    },
  ],
  // Page 2
  [
    {
      id: "s4",
      title: "Nowe przepisy podatkowe wchodzą w życie. Co się zmieni?",
      source: "Money.pl",
      timestamp: "2 godz.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
      badge: "pilne" as const,
    },
    {
      id: "s5",
      title: "Wielka fuzja w branży technologicznej. Kto zyska najwięcej?",
      source: "Business Insider",
      timestamp: "4 godz.",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop",
    },
    {
      id: "s6",
      title: "Pogoda na weekend. Synoptycy ostrzegają przed...",
      source: "TVN Meteo",
      timestamp: "30 min",
      image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=200&h=200&fit=crop",
    },
  ],
  // Page 3
  [
    {
      id: "s7",
      title: "Najnowsze wyniki badań: Polacy zmieniają nawyki żywieniowe",
      source: "Zdrowie.pl",
      timestamp: "5 godz.",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop",
    },
    {
      id: "s8",
      title: "Premiera nowego smartfona. Czy warto czekać na...",
      source: "Chip.pl",
      timestamp: "3 godz.",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop",
      badge: "pilne" as const,
    },
    {
      id: "s9",
      title: "Polska reprezentacja koszykarzy awansowała do...",
      source: "Sport.pl",
      timestamp: "1 godz.",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop",
    },
  ],
  // Page 4
  [
    {
      id: "s10",
      title: "Rząd zapowiada nowe inwestycje w infrastrukturę drogową",
      source: "PAP",
      timestamp: "6 godz.",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=200&h=200&fit=crop",
    },
    {
      id: "s11",
      title: "Kontrowersyjny wyrok sądu. Obrońcy praw człowieka reagują",
      source: "Prawo.pl",
      timestamp: "2 godz.",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop",
      badge: "pilne" as const,
    },
    {
      id: "s12",
      title: "Nowy serial bije rekordy popularności. O czym jest?",
      source: "Filmweb",
      timestamp: "4 godz.",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=200&fit=crop",
    },
  ],
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sidebarPage, setSidebarPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentArticle = heroArticles[currentSlide];
  const currentSidebarArticles = allSidebarArticles[sidebarPage];

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + heroArticles.length) % heroArticles.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
  };

  const goToSidebarPage = (page: number) => {
    setSidebarPage(page);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      {/* Main Hero Card */}
      <div>
        <article className="group relative cursor-pointer rounded-xl overflow-hidden aspect-[16/9] lg:h-full">
          <img
            src={currentArticle.image}
            alt={currentArticle.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Navigation arrows */}
          <button 
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          
          {/* Video play icon */}
          {currentArticle.hasVideo && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}
          
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {/* Source and timestamp */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">🔥</span>
              </div>
              <span className="text-sm text-white/90 font-medium">{currentArticle.source}</span>
              <span className="text-sm text-white/60">· {currentArticle.timestamp}</span>
            </div>
            
            {/* Title */}
            <h2 className="font-bold text-xl md:text-2xl text-white mb-4 line-clamp-3 leading-tight">
              {currentArticle.title}
            </h2>
            
            {/* Dots indicator */}
            <div className="flex justify-end gap-1">
              {Array.from({ length: 20 }).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    index === currentSlide ? "bg-white w-4" : "bg-white/30"
                  )}
                  onClick={() => index < heroArticles.length && setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Sidebar - Najlepsze artykuły */}
      <div className="bg-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-foreground">Najlepsze artykuły</h3>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-0 min-h-[240px]">
          {currentSidebarArticles.map((article) => (
            <article 
              key={article.id} 
              className="group flex gap-3 cursor-pointer py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors rounded px-2 -mx-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {article.badge === "pilne" && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                      Pilne
                    </Badge>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                      <span className="text-[8px] font-bold text-muted-foreground">
                        {article.source.charAt(0)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{article.source}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">· {article.timestamp}</span>
                </div>
                <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
              </div>
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </article>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {allSidebarArticles.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSidebarPage(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === sidebarPage ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Sponsorowane label */}
        <div className="text-right mt-3">
          <span className="text-xs text-muted-foreground">Sponsorowane</span>
        </div>
      </div>
    </div>
  );
}
