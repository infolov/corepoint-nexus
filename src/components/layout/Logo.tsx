import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function Logo({ className, size = "md", showIcon = false }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg sm:text-xl",
    md: "text-xl sm:text-2xl md:text-3xl",
    lg: "text-lg sm:text-xl md:text-3xl lg:text-5xl",
  };

  const iconSizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-xl",
    lg: "h-12 w-12 text-2xl",
  };

  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-hero-gradient",
          iconSizeClasses[size]
        )}>
          <span className="font-bold text-primary-foreground">I</span>
        </div>
      )}
      <span className={cn("font-bold tracking-tight", sizeClasses[size])}>
        informacje<span className="text-primary">.pl</span>
      </span>
    </Link>
  );
}
