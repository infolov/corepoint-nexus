import { useDisplayMode } from "@/hooks/use-display-mode";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplaySettingsProps {
  className?: string;
}

export function DisplaySettings({ className }: DisplaySettingsProps) {
  const { settings, setTheme, setFontSize } = useDisplayMode();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Theme Selection */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Motyw
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={settings.theme === "light" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-5 w-5" />
            <span className="text-xs">Jasny</span>
          </Button>
          <Button
            variant={settings.theme === "dark" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-5 w-5" />
            <span className="text-xs">Ciemny</span>
          </Button>
          <Button
            variant={settings.theme === "system" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setTheme("system")}
          >
            <Monitor className="h-5 w-5" />
            <span className="text-xs">System</span>
          </Button>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
          <ZoomIn className="h-4 w-4" />
          Rozmiar tekstu
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={settings.fontSize === "normal" ? "default" : "outline"}
            className="text-sm"
            onClick={() => setFontSize("normal")}
          >
            Aa
          </Button>
          <Button
            variant={settings.fontSize === "large" ? "default" : "outline"}
            className="text-base"
            onClick={() => setFontSize("large")}
          >
            Aa
          </Button>
          <Button
            variant={settings.fontSize === "extra-large" ? "default" : "outline"}
            className="text-lg"
            onClick={() => setFontSize("extra-large")}
          >
            Aa
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Większy tekst ułatwia czytanie
        </p>
      </div>
    </div>
  );
}
