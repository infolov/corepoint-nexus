import { cn } from "@/lib/utils";
import { Monitor, Square, Smartphone } from "lucide-react";

interface AdBannerProps {
  variant?: "horizontal" | "square" | "vertical";
  className?: string;
}

const variantNames: Record<string, { name: string; icon: typeof Monitor }> = {
  horizontal: { name: "Baner - Strona Główna", icon: Monitor },
  square: { name: "Baner boczny", icon: Square },
  vertical: { name: "Baner pionowy", icon: Monitor },
};

export function AdBanner({ variant = "horizontal", className }: AdBannerProps) {
  const variants = {
    horizontal: "aspect-[728/90] max-h-[90px]",
    square: "aspect-square",
    vertical: "aspect-[300/600]",
  };

  const { name, icon: Icon } = variantNames[variant];

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center border border-border/50",
        variants[variant],
        className
      )}
    >
      <div className="text-center p-4">
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs uppercase tracking-wider mb-1">
          <Icon className="h-3 w-3" />
          <span>{name}</span>
        </div>
        <p className="text-sm text-muted-foreground/70">
          Twoja reklama może być tutaj
        </p>
      </div>
      <span className="absolute top-1 right-2 text-[10px] text-muted-foreground/50">
        AD
      </span>
    </div>
  );
}
