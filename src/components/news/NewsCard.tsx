import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

// Fallback image for broken images
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop";

interface NewsCardProps {
  id?: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  sourceUrl?: string; // External RSS article link
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
  // If sourceUrl exists (RSS article), use external link; otherwise use internal Link
  const isExternalLink = !!sourceUrl;
  
  const Wrapper = isExternalLink 
    ? "a" 
    : id 
      ? Link 
      : "div";
  
  const wrapperProps = isExternalLink 
    ? { href: sourceUrl, target: "_blank", rel: "noopener noreferrer" } 
    : id 
      ? { to: `/artykul/${id}` } 
      : {};

  // MSN-style compact list item (for sidebar/data saver)
  if (variant === "compact") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn(
          "group flex gap-3 cursor-pointer py-3 px-3 -mx-3",
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
      </Wrapper>
    );
  }

  // MSN-style horizontal card
  if (variant === "horizontal") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn(
          "group flex gap-4 cursor-pointer p-2 -m-2 rounded-xl",
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
      </Wrapper>
    );
  }

  // MSN-style hero card (large featured card)
  if (variant === "hero") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn(
          "group relative cursor-pointer overflow-hidden",
          "rounded-2xl shadow-lg",
          "aspect-[4/3] lg:aspect-auto lg:h-full",
          className
        )}>
          <CardImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Video indicator */}
          {hasVideo && (
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          )}
          
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
            {/* Badge */}
            {badge && (
              <Badge variant={badge === "pilne" ? "destructive" : badge} className="mb-3">
                {badge === "pilne" ? "PILNE" : badge === "hot" ? "Popularne" : badge === "trending" ? "Na czasie" : "Nowe"}
              </Badge>
            )}
            
            {/* Source and timestamp */}
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-lg", getSourceColor(source))}>
                <span className="text-[10px] font-bold text-white">{getSourceInitials(source)}</span>
              </div>
              <span className="text-sm text-white/90 font-medium">{source}</span>
              <span className="text-sm text-primary-foreground/80 font-medium bg-primary/30 px-2 py-0.5 rounded">{category}</span>
              <span className="text-sm text-white/60">· {timestamp}</span>
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-xl md:text-2xl text-white line-clamp-3 leading-tight">
              {title}
            </h3>
          </div>
        </article>
      </Wrapper>
    );
  }

  // MSN-style slot card (for slots 2-5 in sidebar)
  if (variant === "msn-slot") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn(
          "group cursor-pointer rounded-xl overflow-hidden relative",
          "h-[95px] lg:h-[98px] shadow-sm bg-muted",
          "hover:shadow-md transition-shadow duration-200",
          className
        )}>
          <CardImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          
          {/* Video indicator */}
          {hasVideo && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={cn("w-4 h-4 rounded flex items-center justify-center", getSourceColor(source))}>
                <span className="text-[8px] font-bold text-white">{getSourceInitials(source)}</span>
              </div>
              <span className="text-[10px] text-white/80 font-medium">{source}</span>
              <span className="text-[10px] text-primary-foreground/80 font-medium bg-primary/30 px-1.5 py-0.5 rounded text-[9px]">{category}</span>
              <span className="text-[10px] text-white/60">· {timestamp}</span>
            </div>
            <h4 className="font-semibold text-xs text-white line-clamp-2 leading-tight">
              {title}
            </h4>
          </div>
        </article>
      </Wrapper>
    );
  }

  // MSN-style default card (grid item) - 16:9 aspect ratio with proper height
  return (
    <Wrapper {...wrapperProps as any}>
      <article className={cn(
        "group cursor-pointer rounded-xl overflow-hidden relative",
        "aspect-[16/9] min-h-[180px] max-h-[250px] bg-muted",
        "shadow-sm hover:shadow-lg transition-all duration-300",
        className
      )}>
        <CardImage
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        
        {/* Video indicator */}
        {hasVideo && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3">
            <Badge variant={badge === "pilne" ? "destructive" : badge} className="text-[10px] px-2 py-0.5">
              {badge === "pilne" ? "PILNE" : badge === "hot" ? "🔥" : badge === "trending" ? "📈" : "✨"}
            </Badge>
          </div>
        )}
        
        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          {/* Source, category and timestamp */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
            <div className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shadow", getSourceColor(source))}>
              <span className="text-[9px] sm:text-[10px] font-bold text-white">{getSourceInitials(source)}</span>
            </div>
            <span className="text-[11px] sm:text-xs text-white/90 font-medium">{source}</span>
            <span className="text-[10px] sm:text-[11px] text-primary-foreground/90 font-medium bg-primary/40 px-1.5 py-0.5 rounded">{category}</span>
            <span className="text-[11px] sm:text-xs text-white/60">· {timestamp}</span>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-sm sm:text-base text-white line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>
      </article>
    </Wrapper>
  );
}
