import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, Plus, Ban, Star, Share2, HelpCircle, Flag } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

// Fallback image for broken images - using local placeholder
const FALLBACK_IMAGE = "/placeholder.svg";

interface NewsCardProps {
  id?: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  sourceUrl?: string;
  badge?: "hot" | "trending" | "new" | "pilne";
  hasVideo?: boolean;
  variant?: "default" | "horizontal" | "compact" | "hero" | "msn-slot";
  className?: string;
}

// Source icon colors mapping
const sourceColors: Record<string, string> = {
  "PAP": "bg-blue-500",
  "Reuters": "bg-orange-500",
  "Bloomberg": "bg-emerald-500",
  "TVN24": "bg-red-500",
  "Polsat News": "bg-yellow-500",
  "Money.pl": "bg-green-500",
  "Forbes": "bg-slate-700",
  "Informacje.pl": "bg-primary",
  "INFORMACJE.PL": "bg-primary",
  "Bankier.pl": "bg-blue-600",
  "Sportowe Fakty": "bg-orange-600",
  "Chip.pl": "bg-cyan-600",
  "Dobreprogramy": "bg-purple-600",
  "Rzeczpospolita": "bg-red-700",
  "Onet": "bg-blue-700",
  "WP": "bg-red-600",
  "Interia": "bg-indigo-600",
  "Gazeta.pl": "bg-green-600",
};

const getSourceColor = (source: string) => {
  return sourceColors[source] || "bg-primary";
};

// Category colors mapping
const categoryColors: Record<string, string> = {
  "sport": "bg-green-600",
  "Sport": "bg-green-600",
  "wiadomości": "bg-yellow-500",
  "Wiadomości": "bg-yellow-500",
  "news": "bg-yellow-500",
  "News": "bg-yellow-500",
  "technologie": "bg-indigo-700",
  "Technologie": "bg-indigo-700",
  "tech": "bg-indigo-700",
  "Tech": "bg-indigo-700",
  "biznes": "bg-amber-700",
  "Biznes": "bg-amber-700",
  "business": "bg-amber-700",
  "Business": "bg-amber-700",
  "lifestyle": "bg-pink-500",
  "Lifestyle": "bg-pink-500",
  "rozrywka": "bg-purple-500",
  "Rozrywka": "bg-purple-500",
  "pogoda": "bg-sky-500",
  "Pogoda": "bg-sky-500",
  "motoryzacja": "bg-red-600",
  "Motoryzacja": "bg-red-600",
  "zdrowie": "bg-teal-500",
  "Zdrowie": "bg-teal-500",
  "nauka": "bg-cyan-600",
  "Nauka": "bg-cyan-600",
  "polityka": "bg-slate-600",
  "Polityka": "bg-slate-600",
  "kultura": "bg-violet-500",
  "Kultura": "bg-violet-500",
  "świat": "bg-blue-600",
  "Świat": "bg-blue-600",
};

const getCategoryColor = (category: string) => {
  // Check for exact match first
  if (categoryColors[category]) return categoryColors[category];
  
  // Check for partial match (subcategories)
  const lowerCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(categoryColors)) {
    if (lowerCategory.includes(key.toLowerCase())) return value;
  }
  
  return "bg-primary/90";
};

const getSourceInitials = (source: string) => {
  if (source.length <= 3) return source;
  return source.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

// Image component with fallback
const CardImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  <img
    src={src}
    alt={alt}
    className={className}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      if (target.src !== FALLBACK_IMAGE) {
        target.src = FALLBACK_IMAGE;
      }
    }}
  />
);

export function NewsCard({
  id,
  title,
  excerpt,
  content,
  category,
  image,
  timestamp,
  source = "Informacje.pl",
  sourceUrl,
  badge,
  hasVideo,
  variant = "default",
  className,
}: NewsCardProps) {
  // Generate article URL - opens in new tab
  const articleUrl = id ? `/artykul/${id}` : "#";

  // Save article data to localStorage when clicking, so it's available in new tab
  const handleArticleClick = () => {
    if (id) {
      const articleData = {
        id,
        title,
        excerpt,
        content,
        category,
        image,
        timestamp,
        source,
        sourceUrl,
        badge,
      };
      localStorage.setItem(`article_${id}`, JSON.stringify(articleData));
    }
  };

  // Context menu handlers
  const handleFollow = () => {
    toast.success(`Obserwujesz ${source}`);
  };

  const handleBlock = () => {
    toast.success(`Zablokowano ${source}`);
  };

  const handleManageInterests = () => {
    toast.info("Zarządzanie zainteresowaniami będzie dostępne wkrótce");
  };

  const handleShare = async () => {
    const url = window.location.origin + articleUrl;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link skopiowany do schowka");
    }
  };

  const handleWhySeeing = () => {
    toast.info(`Widzisz to na podstawie kategorii: ${category}`);
  };

  const handleReport = () => {
    toast.success("Dziękujemy za zgłoszenie problemu");
  };

  // Render context menu wrapper
  const renderWithContextMenu = (content: React.ReactNode) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {content}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover/95 backdrop-blur-md border-border">
        <ContextMenuItem onClick={handleFollow} className="gap-3 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Obserwuj {source}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleBlock} className="gap-3 cursor-pointer">
          <Ban className="w-4 h-4" />
          <span>Zablokuj {source}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleManageInterests} className="gap-3 cursor-pointer">
          <Star className="w-4 h-4" />
          <span>Zarządzaj zainteresowaniami</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleShare} className="gap-3 cursor-pointer">
          <Share2 className="w-4 h-4" />
          <span>Udostępnij</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleWhySeeing} className="gap-3 cursor-pointer">
          <HelpCircle className="w-4 h-4" />
          <span>Dlaczego to widzę?</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleReport} className="gap-3 cursor-pointer">
          <Flag className="w-4 h-4" />
          <span>Zgłoś problem</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  // MSN-style compact list item (for sidebar/data saver)
  if (variant === "compact") {
    return renderWithContextMenu(
      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={handleArticleClick}>
        <article className={cn(
          "group flex gap-3 py-3 px-3 -mx-3",
          "border-b border-border/50 last:border-0",
          "hover:bg-muted/50 transition-all duration-200 rounded-lg",
          className
        )}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center flex-shrink-0", getSourceColor(source))}>
                <span className="text-[9px] font-bold text-white">{getSourceInitials(source)}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{source}</span>
              <span className="text-xs text-primary font-medium">· {category}</span>
              <span className="text-xs text-muted-foreground">· {timestamp}</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {title}
            </h4>
          </div>
          <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            <CardImage
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            )}
          </div>
        </article>
      </a>
    );
  }

  // MSN-style horizontal card
  if (variant === "horizontal") {
    return renderWithContextMenu(
      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={handleArticleClick}>
        <article className={cn(
          "group flex gap-4 p-2 -m-2 rounded-xl",
          "hover:bg-muted/50 transition-all duration-200",
          className
        )}>
          <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
            <CardImage
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center", getSourceColor(source))}>
                <span className="text-[9px] font-bold text-white">{getSourceInitials(source)}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{source}</span>
              <span className="text-xs text-primary font-medium">· {category}</span>
              <span className="text-xs text-muted-foreground">· {timestamp}</span>
            </div>
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
        </article>
      </a>
    );
  }

  // MSN-style hero card (large featured card)
  if (variant === "hero") {
    return renderWithContextMenu(
      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block h-full" onClick={handleArticleClick}>
        <article className={cn(
          "group relative overflow-hidden",
          "rounded-2xl",
          "aspect-[4/3] lg:aspect-auto lg:h-full",
          className
        )}>
          <CardImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Light gradient under text */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {hasVideo && (
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          )}

          {/* Category badge - top left */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className={cn(getCategoryColor(category), "text-white text-xs font-medium px-2.5 py-1")}>
              {category}
            </Badge>
          </div>
          
          {/* Badge - top right circle */}
          {badge && (
            <div className="absolute top-3 right-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-base",
                badge === "pilne" ? "bg-destructive text-destructive-foreground" : 
                badge === "hot" ? "bg-orange-500 text-white" : 
                badge === "trending" ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
              )}>
                {badge === "pilne" ? "!" : badge === "hot" ? "🔥" : badge === "trending" ? "📈" : "✨"}
              </div>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-white font-light">{source}</span>
              <span className="text-sm text-white/80 font-light">· {timestamp}</span>
            </div>
            
            <h3 className="font-bold text-3xl md:text-4xl text-white line-clamp-3 leading-tight">
              {title}
            </h3>
          </div>
        </article>
      </a>
    );
  }

  // MSN-style slot card (for slots 2-5 in sidebar)
  if (variant === "msn-slot") {
    return renderWithContextMenu(
      <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={handleArticleClick}>
        <article className={cn(
          "group rounded-xl overflow-hidden relative",
          "h-[95px] lg:h-[98px] bg-muted",
          className
        )}>
          <CardImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Light gradient under text */}
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {hasVideo && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}

          {/* Category badge - top left */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className={cn(getCategoryColor(category), "text-white text-[8px] font-medium px-1.5 py-0.5")}>
              {category}
            </Badge>
          </div>
          
          {/* Badge - top right circle */}
          {badge && (
            <div className="absolute top-2 right-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                badge === "pilne" ? "bg-destructive text-destructive-foreground" : 
                badge === "hot" ? "bg-orange-500 text-white" : 
                badge === "trending" ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
              )}>
                {badge === "pilne" ? "!" : badge === "hot" ? "🔥" : badge === "trending" ? "📈" : "✨"}
              </div>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-white font-light">{source}</span>
              <span className="text-[10px] text-white/80 font-light">· {timestamp}</span>
            </div>
            <h4 className="font-bold text-base text-white line-clamp-2 leading-tight">
              {title}
            </h4>
          </div>
        </article>
      </a>
    );
  }

  // MSN-style default card (grid item) - title below image on all devices
  return renderWithContextMenu(
    <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={handleArticleClick}>
      <article className={cn(
        "group rounded-xl overflow-hidden bg-card",
        "flex flex-col",
        className
      )}>
        {/* Image container */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <CardImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {hasVideo && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          )}

          {/* Category badge - top left */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3">
            <Badge variant="secondary" className={cn(getCategoryColor(category), "text-white text-[10px] font-medium px-2 py-0.5")}>
              {category}
            </Badge>
          </div>
          
          {badge && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3">
              <div className={cn(
                "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm",
                badge === "pilne" ? "bg-destructive text-destructive-foreground" : 
                badge === "hot" ? "bg-orange-500 text-white" : 
                badge === "trending" ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
              )}>
                {badge === "pilne" ? "!" : badge === "hot" ? "🔥" : badge === "trending" ? "📈" : "✨"}
              </div>
            </div>
          )}
        </div>

        {/* Content below image - all devices */}
        <div className="p-3 bg-card">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium">{source}</span>
            <span className="text-[11px] text-muted-foreground">· {timestamp}</span>
          </div>
          <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </article>
    </a>
  );
}