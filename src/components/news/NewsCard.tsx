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
  badge?: "hot" | "trending" | "new" | "local";
  variant?: "default" | "large" | "horizontal" | "compact";
  className?: string;
  source?: string;
  likes?: number;
  comments?: number;
}

export function NewsCard({
  id,
  title,
  excerpt,
  category,
  image,
  timestamp,
  badge,
  variant = "default",
  className,
  source = "Informacje.pl",
  likes = Math.floor(Math.random() * 500) + 50,
  comments = Math.floor(Math.random() * 100) + 10,
}: NewsCardProps) {
  const Wrapper = id ? Link : "div";
  const wrapperProps = id ? { to: `/article/${id}` } : {};

  // Large hero card - MSN style with overlay
  if (variant === "large") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("msn-card-large group cursor-pointer aspect-[16/9]", className)}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="overlay" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm opacity-80">{source}</span>
              <span className="text-sm opacity-60">· {timestamp}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold line-clamp-2 mb-3 group-hover:underline">
              {title}
            </h2>
            <div className="flex items-center gap-4 text-sm opacity-80">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {comments}
              </span>
            </div>
          </div>
        </article>
      </Wrapper>
    );
  }

  // Horizontal card - for smaller side cards
  if (variant === "horizontal") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("group flex gap-4 cursor-pointer", className)}>
          <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{source}</span>
              <span>· {timestamp}</span>
            </div>
            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
              {badge === "local" && (
                <span className="flex items-center gap-1 text-green-600">
                  <MapPin className="h-3 w-3" />
                  Lokalne
                </span>
              )}
            </div>
          </div>
        </article>
      </Wrapper>
    );
  }

  // Compact card - for sidebar lists
  if (variant === "compact") {
    return (
      <Wrapper {...(wrapperProps as any)}>
        <article className={cn("group flex gap-3 cursor-pointer py-3 border-b border-border last:border-0", className)}>
          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span>{source}</span>
              <span>· {timestamp}</span>
            </div>
            <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h4>
          </div>
        </article>
      </Wrapper>
    );
  }

  // Default card - MSN style grid card
  return (
    <Wrapper {...(wrapperProps as any)}>
      <article className={cn("msn-card group", className)}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{source}</span>
            <span>· {timestamp}</span>
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {title}
          </h3>
          {excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
              <ThumbsUp className="h-3.5 w-3.5" />
              {likes}
            </span>
            <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
              <MessageCircle className="h-3.5 w-3.5" />
              {comments}
            </span>
            {badge === "trending" && (
              <span className="flex items-center gap-1 text-primary ml-auto">
                <TrendingUp className="h-3.5 w-3.5" />
                Trending
              </span>
            )}
            {badge === "local" && (
              <span className="flex items-center gap-1 text-green-600 ml-auto">
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
