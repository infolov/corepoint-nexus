import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, User, Sun, Moon, Monitor, Bell, MapPin, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const regions = [
  { id: "mazowieckie", label: "Mazowieckie" },
  { id: "malopolskie", label: "Małopolskie" },
  { id: "slaskie", label: "Śląskie" },
  { id: "wielkopolskie", label: "Wielkopolskie" },
  { id: "pomorskie", label: "Pomorskie" },
  { id: "dolnoslaskie", label: "Dolnośląskie" },
  { id: "lodzkie", label: "Łódzkie" },
  { id: "kujawsko-pomorskie", label: "Kujawsko-Pomorskie" },
  { id: "podkarpackie", label: "Podkarpackie" },
  { id: "lubelskie", label: "Lubelskie" },
  { id: "warminsko-mazurskie", label: "Warmińsko-Mazurskie" },
  { id: "zachodniopomorskie", label: "Zachodniopomorskie" },
  { id: "podlaskie", label: "Podlaskie" },
  { id: "swietokrzyskie", label: "Świętokrzyskie" },
  { id: "opolskie", label: "Opolskie" },
  { id: "lubuskie", label: "Lubuskie" },
];

type ThemeMode = "light" | "dark" | "system";

export function SettingsPanel({ isOpen, onClose, onSettingsSaved }: SettingsPanelProps) {
  const { user } = useAuth();
  const { settings: displaySettings, setFontSize } = useDisplayMode();
  const [selectedRegion, setSelectedRegion] = useState("mazowieckie");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifications, setNotifications] = useState({
    breaking: true,
    daily: false,
    personalized: true,
  });

  // Font size slider value (0 = normal, 1 = large, 2 = extra-large)
  const fontSizeToSlider = {
    "normal": 0,
    "large": 1,
    "extra-large": 2,
  };
  const sliderToFontSize = ["normal", "large", "extra-large"] as const;
  const fontSizeLabels = ["Mały", "Średni", "Duży"];

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      // Check current theme
      const isDark = document.documentElement.classList.contains("dark");
      const stored = localStorage.getItem("theme");
      if (stored === "system" || !stored) {
        setTheme("system");
      } else {
        setTheme(isDark ? "dark" : "light");
      }
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      setSelectedRegion(parsed.voivodeship || "mazowieckie");
    }

    if (user) {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_site_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSelectedRegion(data.voivodeship || "mazowieckie");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleFontSizeChange = (value: number[]) => {
    const size = sliderToFontSize[value[0]];
    setFontSize(size);
  };

  const handleSave = async () => {
    setIsSaving(true);

    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: selectedRegion,
    }));

    if (user) {
      try {
        const { data: existing } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("user_site_settings")
            .update({ voivodeship: selectedRegion })
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_site_settings")
            .insert({ user_id: user.id, voivodeship: selectedRegion });
          if (error) throw error;
        }

        toast.success("Ustawienia zapisane");
        onSettingsSaved?.();
      } catch (error) {
        console.error("Error saving settings:", error);
        toast.error("Błąd podczas zapisywania");
      }
    } else {
      toast.success("Ustawienia zapisane lokalnie");
      onSettingsSaved?.();
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <div className="max-w-[400px] mx-auto px-6 py-8">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              Ustawienia
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Section */}
              {user && (
                <section className="p-5 rounded-2xl bg-muted/40">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                      <User className="h-7 w-7 text-primary-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || "Użytkownik"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Preferences Section */}
              <section className="space-y-6">
                {/* Theme Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-medium">
                    Motyw
                  </Label>
                  <div className="flex gap-2">
                    <ThemeButton
                      icon={<Sun className="h-4 w-4" strokeWidth={1.5} />}
                      label="Jasny"
                      active={theme === "light"}
                      onClick={() => handleThemeChange("light")}
                    />
                    <ThemeButton
                      icon={<Moon className="h-4 w-4" strokeWidth={1.5} />}
                      label="Ciemny"
                      active={theme === "dark"}
                      onClick={() => handleThemeChange("dark")}
                    />
                    <ThemeButton
                      icon={<Monitor className="h-4 w-4" strokeWidth={1.5} />}
                      label="System"
                      active={theme === "system"}
                      onClick={() => handleThemeChange("system")}
                    />
                  </div>
                </div>

                {/* Font Size Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground font-medium">
                      Rozmiar tekstu
                    </Label>
                    <span className="text-sm font-medium text-foreground">
                      {fontSizeLabels[fontSizeToSlider[displaySettings.fontSize]]}
                    </span>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[fontSizeToSlider[displaySettings.fontSize]]}
                      onValueChange={handleFontSizeChange}
                      max={2}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Aa</span>
                      <span className="text-sm">Aa</span>
                      <span className="text-base">Aa</span>
                    </div>
                  </div>
                </div>

                {/* Region Selector */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                    Województwo
                  </Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-full bg-muted/30 border-0 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* Notifications Section */}
              <section className="space-y-4">
                <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" strokeWidth={1.5} />
                  Powiadomienia
                </Label>
                
                <div className="space-y-1">
                  <NotificationToggle
                    label="Pilne wiadomości"
                    description="Natychmiastowe alerty o ważnych wydarzeniach"
                    checked={notifications.breaking}
                    onChange={(checked) => setNotifications(prev => ({ ...prev, breaking: checked }))}
                  />
                  <NotificationToggle
                    label="Podsumowanie dnia"
                    description="Codzienny przegląd najważniejszych wiadomości"
                    checked={notifications.daily}
                    onChange={(checked) => setNotifications(prev => ({ ...prev, daily: checked }))}
                  />
                  <NotificationToggle
                    label="Spersonalizowane"
                    description="Wiadomości dopasowane do Twoich zainteresowań"
                    checked={notifications.personalized}
                    onChange={(checked) => setNotifications(prev => ({ ...prev, personalized: checked }))}
                  />
                </div>
              </section>

              {/* Save Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-12 rounded-xl font-medium"
                  variant="default"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" strokeWidth={1.5} />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      Zapisz zmiany
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Theme button component
function ThemeButton({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl transition-all duration-200",
        active 
          ? "bg-primary text-primary-foreground shadow-sm" 
          : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// Notification toggle component
function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/40 transition-colors">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
