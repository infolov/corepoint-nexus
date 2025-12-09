import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  id?: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  badge?: "hot" | "trending" | "new" | "pilne";
  variant?: "default" | "horizontal" | "compact" | "hero";
  likes?: number;
  comments?: number;
  className?: string;
}

export function NewsCard({
  id,
  title,
  excerpt,
  category,
  image,
  timestamp,
  source = "Informacje.pl",
  badge,
  variant = "default",
  likes = Math.floor(Math.random() * 50),
  comments = Math.floor(Math.random() * 20),
  className,
}: NewsCardProps) {
  const Wrapper = id ? Link : "div";
  const wrapperProps = id ? { to: `/artykul/${id}` } : {};

  // MSN-style compact list item (for sidebar)
  if (variant === "compact") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn("group flex gap-3 cursor-pointer py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded", className)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {badge && (
                <Badge variant={badge === "pilne" ? "destructive" : badge} className="text-[10px] px-1.5 py-0">
                  {badge === "pilne" ? "Pilne" : badge === "hot" ? "🔥" : badge === "trending" ? "📈" : "✨"}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{source}</span>
              <span className="text-xs text-muted-foreground">· {timestamp}</span>
            </div>
            <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h4>
          </div>
          <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </article>
      </Wrapper>
    );
  }

  // MSN-style horizontal card
  if (variant === "horizontal") {
    return (
      <Wrapper {...wrapperProps as any}>
        <article className={cn("group flex gap-4 cursor-pointer", className)}>
          <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{source}</span>
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
        <article className={cn("group relative cursor-pointer rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-full", className)}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {/* Source and timestamp */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-bold text-primary-foreground">IP</span>
              </div>
              <span className="text-sm text-white/90 font-medium">{source}</span>
              <span className="text-sm text-white/60">· {timestamp}</span>
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-lg md:text-xl text-white line-clamp-3 leading-snug">
              {title}
            </h3>
          </div>
        </article>
      </Wrapper>
    );
  }

  // MSN-style default card (grid item) - dark overlay style
  return (
    <Wrapper {...wrapperProps as any}>
      <article className={cn("group cursor-pointer rounded-xl overflow-hidden relative aspect-[4/3]", className)}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          {/* Source and timestamp */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded bg-primary/90 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary-foreground">IP</span>
            </div>
            <span className="text-[11px] text-white/80 font-medium">{source}</span>
            <span className="text-[11px] text-white/50">· {timestamp}</span>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>
      </article>
    </Wrapper>
  );
}
