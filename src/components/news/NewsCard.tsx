import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  badge?: "hot" | "trending" | "new";
  variant?: "default" | "horizontal" | "compact";
  className?: string;
}

export function NewsCard({
  title,
  excerpt,
  category,
  image,
  timestamp,
  badge,
  variant = "default",
  className,
}: NewsCardProps) {
  if (variant === "horizontal") {
    return (
      <article className={cn("group flex gap-4 cursor-pointer", className)}>
        <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="category" className="text-xs">{category}</Badge>
            {badge && (
              <Badge variant={badge} className="text-xs">
                {badge === "hot" && "🔥"}
                {badge === "trending" && "📈"}
                {badge === "new" && "✨"}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
            <Clock className="h-3 w-3" />
            {timestamp}
          </span>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group flex gap-3 cursor-pointer py-3 border-b border-border last:border-0", className)}>
        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-xs text-primary font-medium">{category}</span>
          <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group cursor-pointer card-hover bg-card rounded-xl overflow-hidden shadow-sm", className)}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="category">{category}</Badge>
          {badge && (
            <Badge variant={badge}>
              {badge === "hot" && "🔥 Gorące"}
              {badge === "trending" && "📈 Trending"}
              {badge === "new" && "✨ Nowe"}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {title}
        </h3>
        {excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {excerpt}
          </p>
        )}
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Clock className="h-3 w-3" />
          {timestamp}
        </span>
      </div>
    </article>
  );
}
