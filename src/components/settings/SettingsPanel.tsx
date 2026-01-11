import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, User, Sun, Moon, Monitor, Bell, MapPin, Check, Cloud, Camera, X, ImageIcon } from "lucide-react";
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
type FontSize = "normal" | "large" | "extra-large";

interface NotificationSettings {
  breaking: boolean;
  daily: boolean;
  personalized: boolean;
}

type SaveStatus = "idle" | "saving" | "saved";

// Avatar constraints
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSIONS = 512; // 512x512 max
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function SettingsPanel({ isOpen, onClose, onSettingsSaved }: SettingsPanelProps) {
  const { user } = useAuth();
  const { settings: displaySettings, setFontSize } = useDisplayMode();
  const [selectedRegion, setSelectedRegion] = useState("mazowieckie");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    breaking: true,
    daily: false,
    personalized: true,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const fontSizeToSlider: Record<FontSize, number> = {
    "normal": 0,
    "large": 1,
    "extra-large": 2,
  };
  const sliderToFontSize: FontSize[] = ["normal", "large", "extra-large"];
  const fontSizeLabels = ["Mały", "Średni", "Duży"];

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus("saving");
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings();
    }, 800);
  }, [user, selectedRegion, theme, notifications, displaySettings.fontSize]);

  const saveSettings = async () => {
    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: selectedRegion,
    }));
    localStorage.setItem("theme", theme);

    if (user) {
      try {
        const { data: existingSite } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingSite) {
          await supabase
            .from("user_site_settings")
            .update({ voivodeship: selectedRegion })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_site_settings")
            .insert({ user_id: user.id, voivodeship: selectedRegion });
        }

        const { data: existingNotif } = await supabase
          .from("user_notification_preferences")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const notifData = {
          breaking_news: notifications.breaking,
          daily_digest: notifications.daily,
          personalized: notifications.personalized,
          theme_preference: theme,
          font_size: displaySettings.fontSize,
        };

        if (existingNotif) {
          await supabase
            .from("user_notification_preferences")
            .update(notifData)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_notification_preferences")
            .insert({ 
              user_id: user.id,
              ...notifData,
            });
        }

        setSaveStatus("saved");
        onSettingsSaved?.();
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error saving settings:", error);
        toast.error("Błąd podczas zapisywania");
        setSaveStatus("idle");
      }
    } else {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) return;
    debouncedSave();
  }, [selectedRegion, theme, notifications, displaySettings.fontSize]);

  useEffect(() => {
    if (isOpen) {
      initialLoadRef.current = true;
      loadSettings();
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isOpen, user]);

  const loadSettings = async () => {
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      setSelectedRegion(parsed.voivodeship || "mazowieckie");
    }

    const storedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme("system");
    }

    if (user) {
      setIsLoading(true);
      try {
        // Load profile (avatar)
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }

        const { data: siteSettings } = await supabase
          .from("user_site_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (siteSettings) {
          setSelectedRegion(siteSettings.voivodeship || "mazowieckie");
        }

        const { data: notifPrefs } = await supabase
          .from("user_notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (notifPrefs) {
          setNotifications({
            breaking: notifPrefs.breaking_news ?? true,
            daily: notifPrefs.daily_digest ?? false,
            personalized: notifPrefs.personalized ?? true,
          });
          if (notifPrefs.theme_preference) {
            setTheme(notifPrefs.theme_preference as ThemeMode);
            applyTheme(notifPrefs.theme_preference as ThemeMode);
          }
          if (notifPrefs.font_size) {
            setFontSize(notifPrefs.font_size as FontSize);
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 100);
      }
    } else {
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    }
  };

  const applyTheme = (newTheme: ThemeMode) => {
    localStorage.setItem("theme", newTheme);
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleFontSizeChange = (value: number[]) => {
    const size = sliderToFontSize[value[0]];
    setFontSize(size);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Dozwolone formaty: JPG, PNG, WebP");
        resolve(false);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Maksymalny rozmiar pliku: 2MB");
        resolve(false);
        return;
      }

      // Check dimensions
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
          toast.error(`Maksymalne wymiary: ${MAX_DIMENSIONS}x${MAX_DIMENSIONS}px`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        toast.error("Nie udało się wczytać obrazu");
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isValid = await validateImage(file);
    if (!isValid) {
      e.target.value = "";
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("user_id", user.id);

      setAvatarUrl(newAvatarUrl);
      toast.success("Avatar zaktualizowany");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Błąd podczas uploadu avatara");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      // Remove from storage
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(user.id);

      if (files && files.length > 0) {
        const filesToRemove = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToRemove);
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);

      setAvatarUrl(null);
      toast.success("Avatar usunięty");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Błąd podczas usuwania avatara");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <div className="max-w-[400px] mx-auto px-6 py-8">
          <SheetHeader className="mb-8">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-semibold tracking-tight">
                Ustawienia
              </SheetTitle>
              <SaveStatusIndicator status={saveStatus} />
            </div>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" strokeWidth={1.5} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Section with Avatar */}
              {user && (
                <section className="p-5 rounded-2xl bg-muted/40">
                  <div className="flex items-center gap-4">
                    {/* Avatar with upload */}
                    <div className="relative group">
                      <button
                        onClick={handleAvatarClick}
                        disabled={isUploadingAvatar}
                        className={cn(
                          "w-16 h-16 rounded-full overflow-hidden flex items-center justify-center",
                          "bg-gradient-to-br from-primary to-primary/70 shadow-sm",
                          "transition-all duration-200 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          isUploadingAvatar && "opacity-50"
                        )}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" strokeWidth={1.5} />
                        ) : avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-primary-foreground" strokeWidth={1.5} />
                        )}
                      </button>
                      
                      {/* Camera overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
                      </div>

                      {/* Remove button */}
                      {avatarUrl && !isUploadingAvatar && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAvatar();
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.user_metadata?.full_name || "Użytkownik"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" strokeWidth={1.5} />
                        Maks. 512×512px, 2MB
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Guest notice */}
              {!user && (
                <section className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Zaloguj się</span>, aby zapisać ustawienia na koncie i synchronizować je między urządzeniami.
                  </p>
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
                      {fontSizeLabels[fontSizeToSlider[displaySettings.fontSize as FontSize] ?? 0]}
                    </span>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[fontSizeToSlider[displaySettings.fontSize as FontSize] ?? 0]}
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

              {/* Autosave info */}
              <p className="text-xs text-muted-foreground text-center pt-4">
                Zmiany zapisują się automatycznie
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Save status indicator
function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs font-medium transition-all duration-300",
      status === "saving" ? "text-muted-foreground" : "text-green-600 dark:text-green-400"
    )}>
      {status === "saving" ? (
        <>
          <Cloud className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.5} />
          <span>Zapisywanie...</span>
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Zapisano</span>
        </>
      )}
    </div>
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
