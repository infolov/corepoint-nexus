import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useSiteSettings, SiteSetting } from "@/hooks/use-site-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Json } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShieldAlert,
  Settings,
  Globe,
  FileText,
  Users,
  Newspaper,
  Megaphone,
  Cloud,
  Save,
  Loader2,
  Check,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { AlertTickerManager } from "@/components/admin/AlertTickerManager";

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

interface SettingConfig {
  key: string;
  label: string;
  description: string;
  type: "text" | "number" | "boolean" | "select" | "password";
  icon: React.ComponentType<{ className?: string }>;
  options?: { value: string; label: string }[];
  category: string;
  placeholder?: string;
}

const settingsConfig: SettingConfig[] = [
  {
    key: "site_name",
    label: "Nazwa strony",
    description: "Wyświetlana w nagłówku i tytułach",
    type: "text",
    icon: Globe,
    category: "Ogólne",
  },
  {
    key: "site_description",
    label: "Opis strony",
    description: "Meta opis dla SEO",
    type: "text",
    icon: FileText,
    category: "Ogólne",
  },
  {
    key: "default_region",
    label: "Domyślny region",
    description: "Dla niezalogowanych użytkowników",
    type: "select",
    icon: Globe,
    options: regions.map((r) => ({ value: r.id, label: r.label })),
    category: "Ogólne",
  },
  {
    key: "maintenance_mode",
    label: "Tryb konserwacji",
    description: "Blokuje dostęp dla zwykłych użytkowników",
    type: "boolean",
    icon: Settings,
    category: "System",
  },
  {
    key: "registration_enabled",
    label: "Rejestracja włączona",
    description: "Pozwala na tworzenie nowych kont",
    type: "boolean",
    icon: Users,
    category: "System",
  },
  {
    key: "max_articles_per_page",
    label: "Artykułów na stronę",
    description: "Limit artykułów na jednej stronie",
    type: "number",
    icon: Newspaper,
    category: "Treści",
  },
  {
    key: "featured_articles_count",
    label: "Wyróżnione artykuły",
    description: "Liczba artykułów w sliderze",
    type: "number",
    icon: Newspaper,
    category: "Treści",
  },
  {
    key: "auto_verify_articles",
    label: "Automatyczna weryfikacja AI",
    description: "Weryfikuj nowe artykuły automatycznie",
    type: "boolean",
    icon: FileText,
    category: "Treści",
  },
  {
    key: "ad_refresh_interval",
    label: "Odświeżanie reklam (sek.)",
    description: "Interwał rotacji reklam",
    type: "number",
    icon: Megaphone,
    category: "Reklamy",
  },
  {
    key: "weather_widget_enabled",
    label: "Widget pogody",
    description: "Wyświetlaj widget pogody",
    type: "boolean",
    icon: Cloud,
    category: "Widgety",
  },
  {
    key: "firecrawl_api_key",
    label: "Klucz API Firecrawl",
    description: "Własny klucz API do scrapowania artykułów (firecrawl.dev)",
    type: "password",
    icon: Key,
    category: "Integracje",
    placeholder: "fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
];

export default function DashboardAdminSettings() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { settings, rawSettings, loading: settingsLoading, updateSetting, refetch } = useSiteSettings();
  const [localValues, setLocalValues] = useState<Record<string, unknown>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!settingsLoading && settings) {
      setLocalValues(settings);
    }
  }, [settingsLoading, settings]);

  const handleChange = (key: string, value: unknown) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    // Remove from saved state when changed
    setSavedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Auto-save for boolean switches
  const handleBooleanChange = async (key: string, value: boolean) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setSavingKeys((prev) => new Set(prev).add(key));
    
    const success = await updateSetting(key, value as Json);
    
    setSavingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (success) {
      setSavedKeys((prev) => new Set(prev).add(key));
      setTimeout(() => {
        setSavedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    } else {
      toast.error("Błąd podczas zapisywania");
    }
  };

  const handleSave = async (key: string) => {
    setSavingKeys((prev) => new Set(prev).add(key));
    
    const success = await updateSetting(key, localValues[key] as Json);
    
    setSavingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (success) {
      setSavedKeys((prev) => new Set(prev).add(key));
      toast.success("Ustawienie zapisane");
      setTimeout(() => {
        setSavedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
    } else {
      toast.error("Błąd podczas zapisywania");
    }
  };

  const hasChanged = (key: string): boolean => {
    return JSON.stringify(localValues[key]) !== JSON.stringify(settings[key]);
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Brak dostępu</h2>
          <p className="text-muted-foreground">
            Ta strona jest dostępna tylko dla administratorów.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categories = [...new Set(settingsConfig.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ustawienia globalne</h1>
        <p className="text-muted-foreground">
          Zarządzaj globalnymi ustawieniami strony
        </p>
      </div>

      {/* Alert Ticker Manager */}
      <AlertTickerManager />

      {settingsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsConfig
                  .filter((s) => s.category === category)
                  .map((config) => {
                    const Icon = config.icon;
                    const isSaving = savingKeys.has(config.key);
                    const isSaved = savedKeys.has(config.key);
                    const changed = hasChanged(config.key);

                    return (
                      <div
                        key={config.key}
                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">{config.label}</Label>
                              {changed && (
                                <Badge variant="outline" className="text-xs">
                                  Zmieniono
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {config.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {config.type === "boolean" ? (
                            <div className="flex items-center gap-2">
                              {savingKeys.has(config.key) && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              {savedKeys.has(config.key) && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                              <Switch
                                checked={localValues[config.key] as boolean}
                                onCheckedChange={(val) => handleBooleanChange(config.key, val)}
                                disabled={savingKeys.has(config.key)}
                              />
                            </div>
                          ) : config.type === "select" ? (
                            <Select
                              value={String(localValues[config.key] || "")}
                              onValueChange={(val) => handleChange(config.key, val)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Wybierz..." />
                              </SelectTrigger>
                              <SelectContent>
                                {config.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : config.type === "number" ? (
                            <Input
                              type="number"
                              value={String(localValues[config.key] || "")}
                              onChange={(e) =>
                                handleChange(config.key, parseInt(e.target.value) || 0)
                              }
                              className="w-24"
                            />
                          ) : config.type === "password" ? (
                            <div className="relative flex items-center">
                              <Input
                                type={showPassword[config.key] ? "text" : "password"}
                                value={String(localValues[config.key] || "")}
                                onChange={(e) => handleChange(config.key, e.target.value)}
                                placeholder={config.placeholder}
                                className="w-80 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 h-7 w-7 p-0"
                                onClick={() => setShowPassword(prev => ({ 
                                  ...prev, 
                                  [config.key]: !prev[config.key] 
                                }))}
                              >
                                {showPassword[config.key] ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Input
                              type="text"
                              value={String(localValues[config.key] || "")}
                              onChange={(e) => handleChange(config.key, e.target.value)}
                              className="w-64"
                            />
                          )}

                          {config.type !== "boolean" && (
                            <Button
                              size="sm"
                              variant={isSaved ? "secondary" : "default"}
                              onClick={() => handleSave(config.key)}
                              disabled={isSaving || !changed}
                              className="min-w-[80px]"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isSaved ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  OK
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Zapisz
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
