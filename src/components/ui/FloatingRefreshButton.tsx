import { RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FloatingRefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FloatingRefreshButton({ onClick, isLoading, className }: FloatingRefreshButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="icon"
      className={cn(
        "fixed right-4 top-1/3 z-50",
        "w-12 h-12 rounded-full shadow-lg",
        "bg-[hsl(209,90%,58%)] hover:bg-[hsl(209,90%,52%)] text-white",
        "transition-all duration-300 hover:scale-110",
        "border-2 border-white/20",
        className
      )}
      title="Odśwież artykuły"
    >
      <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
    </Button>
  );
}
