import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface EditorialCardProps {
  id?: string;
  title: string;
  excerpt?: string;
  category: string;
  image: string;
  timestamp: string;
  source?: string;
  sourceUrl?: string;
  onClick?: () => void;
  className?: string;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop";

export function EditorialCard({
  id,
  title,
  excerpt,
  category,
  image,
  timestamp,
  source = "Informacje.pl",
  sourceUrl,
  onClick,
  className,
}: EditorialCardProps) {
  return (
    <article 
      className={cn(
        "group cursor-pointer py-6 first:pt-0",
        "border-b border-border/40 last:border-0",
        "transition-colors duration-200",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        {/* Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== FALLBACK_IMAGE) {
                target.src = FALLBACK_IMAGE;
              }
            }}
          />
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-primary">{category}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{source}</span>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{timestamp}</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-200">
            {title}
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-muted-foreground leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
