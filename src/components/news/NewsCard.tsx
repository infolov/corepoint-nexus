import { ThumbsUp, MessageCircle, TrendingUp, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  id?: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  badge?: "trending" | "local";
  likes?: number;
  comments?: number;
  variant?: "hero" | "medium" | "small" | "list";
  className?: string;
}

export function NewsCard({
  id,
  title,
  excerpt,
  category,
  image,
  timestamp,
  source = "INFORMACJE.PL",
  badge,
  likes = Math.floor(Math.random() * 500) + 50,
  comments = Math.floor(Math.random() * 100) + 5,
  variant = "medium",
  className,
}: NewsCardProps) {
  const Wrapper = id ? Link : "div";
  const wrapperProps = id ? { to: `/article/${id}` } : {};

  // Hero variant - large card with overlay text
  if (variant === "hero") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("group relative cursor-pointer msn-card h-full min-h-[300px]", className)}>
          <div className="absolute inset-0">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
          <div className="relative h-full flex flex-col justify-end p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-white/80">{source}</span>
              <span className="text-xs text-white/60">·</span>
              <span className="text-xs text-white/60">{timestamp}</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-white line-clamp-3 mb-3 group-hover:underline">
              {title}
            </h2>
            <div className="flex items-center gap-4 text-white/70 text-xs">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {comments}
              </span>
              {badge === "trending" && (
                <span className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trending
                </span>
              )}
              {badge === "local" && (
                <span className="flex items-center gap-1 text-green-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Lokalne
                </span>
              )}
            </div>
          </div>
        </article>
      </Wrapper>
    );
  }

  // Medium variant - standard card with image on top
  if (variant === "medium") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("group cursor-pointer msn-card", className)}>
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground">{source}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors text-sm">
              {title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                {likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {comments}
              </span>
              {badge === "trending" && (
                <span className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  Trending
                </span>
              )}
            </div>
          </div>
        </article>
      </Wrapper>
    );
  }

  // Small variant - compact card
  if (variant === "small") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("group cursor-pointer msn-card", className)}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-2.5">
            <span className="text-xs text-muted-foreground">{source} · {timestamp}</span>
            <h4 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors text-sm mt-1">
              {title}
            </h4>
          </div>
        </article>
      </Wrapper>
    );
  }

  // List variant - horizontal layout for sidebar
  return (
    <Wrapper {...(wrapperProps as any)}>
      <article className={cn("group flex gap-3 cursor-pointer py-2", className)}>
        <div className="relative w-20 h-14 flex-shrink-0 overflow-hidden rounded">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">{source} · {timestamp}</span>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
        </div>
      </article>
    </Wrapper>
  );
}
