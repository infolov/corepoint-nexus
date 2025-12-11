import { ExternalLink } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Source {
  name: string;
  url?: string;
  logo?: string;
}

interface SourcesCarouselProps {
  mainSource: string;
  mainSourceUrl?: string;
  category: string;
}

// Mock related sources based on category
const getRelatedSources = (category: string, mainSource: string): Source[] => {
  const sourcesByCategory: Record<string, Source[]> = {
    "Wiadomości": [
      { name: "TVN24", url: "https://tvn24.pl", logo: "TVN" },
      { name: "Polsat News", url: "https://polsatnews.pl", logo: "PN" },
      { name: "RMF24", url: "https://rmf24.pl", logo: "RMF" },
      { name: "Onet", url: "https://onet.pl", logo: "ON" },
      { name: "WP", url: "https://wp.pl", logo: "WP" },
      { name: "Interia", url: "https://interia.pl", logo: "IN" },
      { name: "Gazeta.pl", url: "https://gazeta.pl", logo: "GP" },
    ],
    "Biznes": [
      { name: "Money.pl", url: "https://money.pl", logo: "MN" },
      { name: "Bankier.pl", url: "https://bankier.pl", logo: "BK" },
      { name: "Forbes", url: "https://forbes.pl", logo: "FB" },
      { name: "Puls Biznesu", url: "https://pb.pl", logo: "PB" },
      { name: "Business Insider", url: "https://businessinsider.com.pl", logo: "BI" },
      { name: "Parkiet", url: "https://parkiet.com", logo: "PK" },
    ],
    "Sport": [
      { name: "Sport.pl", url: "https://sport.pl", logo: "SP" },
      { name: "WP SportoweFakty", url: "https://sportowefakty.wp.pl", logo: "SF" },
      { name: "Przegląd Sportowy", url: "https://przegladsportowy.onet.pl", logo: "PS" },
      { name: "Meczyki.pl", url: "https://meczyki.pl", logo: "MC" },
      { name: "Goal.pl", url: "https://goal.pl", logo: "GL" },
      { name: "Interia Sport", url: "https://sport.interia.pl", logo: "IS" },
    ],
    "Technologia": [
      { name: "Chip.pl", url: "https://chip.pl", logo: "CH" },
      { name: "Dobreprogramy", url: "https://dobreprogramy.pl", logo: "DP" },
      { name: "Benchmark.pl", url: "https://benchmark.pl", logo: "BM" },
      { name: "AntyWeb", url: "https://antyweb.pl", logo: "AW" },
      { name: "Spider's Web", url: "https://spidersweb.pl", logo: "SW" },
      { name: "Komputer Świat", url: "https://komputerswiat.pl", logo: "KS" },
    ],
    "Lifestyle": [
      { name: "Onet Kobieta", url: "https://kobieta.onet.pl", logo: "OK" },
      { name: "Elle", url: "https://elle.pl", logo: "EL" },
      { name: "Glamour", url: "https://glamour.pl", logo: "GL" },
      { name: "Vogue Polska", url: "https://vogue.pl", logo: "VP" },
      { name: "Zwierciadło", url: "https://zwierciadlo.pl", logo: "ZW" },
    ],
  };

  const sources = sourcesByCategory[category] || sourcesByCategory["Wiadomości"];
  
  // Filter out main source and return up to 6 related sources
  return sources
    .filter(s => s.name.toLowerCase() !== mainSource.toLowerCase())
    .slice(0, 6);
};

export const SourcesCarousel = ({ mainSource, mainSourceUrl, category }: SourcesCarouselProps) => {
  const relatedSources = getRelatedSources(category, mainSource);

  const allSources: Source[] = [
    { name: mainSource, url: mainSourceUrl, logo: mainSource.substring(0, 2).toUpperCase() },
    ...relatedSources,
  ];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
        <ExternalLink className="h-4 w-4" />
        Źródła i powiązane portale
      </h3>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-3">
          {allSources.map((source, index) => (
            <a
              key={source.name}
              href={source.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all
                ${index === 0 
                  ? "bg-primary/10 border-primary/30 hover:bg-primary/20" 
                  : "bg-card border-border hover:bg-muted hover:border-muted-foreground/20"
                }
              `}
            >
              <div 
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                  ${index === 0 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {source.logo || source.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${index === 0 ? "text-primary" : "text-foreground"}`}>
                  {source.name}
                </span>
                {index === 0 && (
                  <span className="text-[10px] text-primary/70">Główne źródło</span>
                )}
              </div>
            </a>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
