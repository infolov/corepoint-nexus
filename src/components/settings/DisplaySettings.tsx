import { useDisplayMode } from "@/hooks/use-display-mode";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monitor, Smartphone, ZoomIn, Zap, LayoutGrid, List, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplaySettingsProps {
  className?: string;
}

export function DisplaySettings({ className }: DisplaySettingsProps) {
  const { settings, setMode, setFontSize, toggleDataSaver } = useDisplayMode();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Display Mode */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Tryb wyświetlania
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={settings.mode === "standard" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setMode("standard")}
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="text-xs">Standard</span>
          </Button>
          <Button
            variant={settings.mode === "compact" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setMode("compact")}
          >
            <List className="h-5 w-5" />
            <span className="text-xs">Kompakt</span>
          </Button>
          <Button
            variant={settings.mode === "comfortable" ? "default" : "outline"}
            className="flex-col h-auto py-3 gap-1"
            onClick={() => setMode("comfortable")}
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-xs">Wygodny</span>
          </Button>
        </div>
      </div>

      {/* Font Size for 40+ UX */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          <ZoomIn className="h-4 w-4 inline mr-2" />
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

      {/* Data Saver Mode */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="data-saver" className="font-semibold text-foreground cursor-pointer">
              Oszczędzanie danych
            </Label>
            <p className="text-xs text-muted-foreground">
              Mniejsze obrazki, szybsze ładowanie
            </p>
          </div>
        </div>
        <Switch
          id="data-saver"
          checked={settings.dataSaver}
          onCheckedChange={toggleDataSaver}
        />
      </div>
    </div>
  );
}
