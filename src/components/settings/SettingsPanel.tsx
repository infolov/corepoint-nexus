import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, User, Sun, Moon, Monitor, Bell, MapPin, Check, Cloud, Camera, X, ImageIcon, LocateFixed } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "./ImageCropDialog";
import { polandDivisions, getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
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

// Voivodeship display names mapping
const voivodeshipDisplayNames: Record<string, string> = {
  "mazowieckie": "Mazowieckie",
  "małopolskie": "Małopolskie",
  "śląskie": "Śląskie",
  "wielkopolskie": "Wielkopolskie",
  "pomorskie": "Pomorskie",
  "dolnośląskie": "Dolnośląskie",
  "łódzkie": "Łódzkie",
  "kujawsko-pomorskie": "Kujawsko-Pomorskie",
  "podkarpackie": "Podkarpackie",
  "lubelskie": "Lubelskie",
  "warmińsko-mazurskie": "Warmińsko-Mazurskie",
  "zachodniopomorskie": "Zachodniopomorskie",
  "podlaskie": "Podlaskie",
  "świętokrzyskie": "Świętokrzyskie",
  "opolskie": "Opolskie",
  "lubuskie": "Lubuskie",
};

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
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string>("");
  const [selectedPowiat, setSelectedPowiat] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifications, setNotifications] = useState<NotificationSettings>({
    breaking: true,
    daily: false,
    personalized: true,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Get available options based on selections
  const voivodeships = getVoivodeships();
  const powiats = selectedVoivodeship ? getPowiats(selectedVoivodeship) : [];
  const cities = selectedVoivodeship && selectedPowiat ? getGminas(selectedVoivodeship, selectedPowiat) : [];

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
  }, [user, selectedVoivodeship, selectedPowiat, selectedCity, theme, notifications, displaySettings.fontSize]);

  const saveSettings = async () => {
    localStorage.setItem("userSettings", JSON.stringify({
      voivodeship: selectedVoivodeship,
      county: selectedPowiat,
      city: selectedCity,
    }));
    localStorage.setItem("theme", theme);

    if (user) {
      try {
        const { data: existingSite } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const siteData = { 
          voivodeship: selectedVoivodeship || null, 
          county: selectedPowiat || null,
          city: selectedCity || null,
        };

        if (existingSite) {
          await supabase
            .from("user_site_settings")
            .update(siteData)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("user_site_settings")
            .insert({ user_id: user.id, ...siteData });
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
  }, [selectedVoivodeship, selectedPowiat, selectedCity, theme, notifications, displaySettings.fontSize]);

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

  // Handle voivodeship change - reset dependent fields
  const handleVoivodeshipChange = (value: string) => {
    setSelectedVoivodeship(value);
    setSelectedPowiat("");
    setSelectedCity("");
  };

  // Handle powiat change - reset dependent fields
  const handlePowiatChange = (value: string) => {
    // "__all__" means "all powiats" = no specific powiat selected
    setSelectedPowiat(value === "__all__" ? "" : value);
    setSelectedCity("");
  };

  // Handle city change
  const handleCityChange = (value: string) => {
    // "__all__" means "all cities" = no specific city selected
    setSelectedCity(value === "__all__" ? "" : value);
  };

  // Auto-detect location using IP geolocation
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      // Get client IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // Call geolocation API
      const geoResponse = await fetch(`https://ipwho.is/${clientIP}`);
      const geoData = await geoResponse.json();
      
      if (geoData.success && geoData.country === 'Poland') {
        const city = geoData.city?.toLowerCase().trim() || '';
        const region = geoData.region?.toLowerCase().trim() || '';
        
        // Try to find matching voivodeship
        let detectedVoivodeship = '';
        
        // Check region mapping
        const regionMappings: Record<string, string> = {
          'warmia-masuria': 'warmińsko-mazurskie',
          'warmian-masurian': 'warmińsko-mazurskie',
          'pomeranian': 'pomorskie',
          'masovian': 'mazowieckie',
          'lesser poland': 'małopolskie',
          'silesian': 'śląskie',
          'greater poland': 'wielkopolskie',
          'lower silesian': 'dolnośląskie',
          'łódź': 'łódzkie',
          'lodz': 'łódzkie',
          'kuyavian-pomeranian': 'kujawsko-pomorskie',
          'subcarpathian': 'podkarpackie',
          'lublin': 'lubelskie',
          'west pomeranian': 'zachodniopomorskie',
          'podlaskie': 'podlaskie',
          'holy cross': 'świętokrzyskie',
          'opole': 'opolskie',
          'lubusz': 'lubuskie',
        };

        for (const [key, value] of Object.entries(regionMappings)) {
          if (region.includes(key) || key.includes(region)) {
            detectedVoivodeship = value;
            break;
          }
        }

        // Also check direct voivodeship name
        if (!detectedVoivodeship) {
          for (const v of voivodeships) {
            if (region.includes(v) || v.includes(region)) {
              detectedVoivodeship = v;
              break;
            }
          }
        }

        if (detectedVoivodeship) {
          setSelectedVoivodeship(detectedVoivodeship);
          
          // Try to find matching powiat/city
          const powiatsList = getPowiats(detectedVoivodeship);
          for (const powiat of powiatsList) {
            const cities = getGminas(detectedVoivodeship, powiat);
            const matchedCity = cities.find(c => 
              c.toLowerCase() === city || 
              city.includes(c.toLowerCase()) ||
              c.toLowerCase().includes(city)
            );
            if (matchedCity) {
              setSelectedPowiat(powiat);
              setSelectedCity(matchedCity);
              toast.success(`Wykryto lokalizację: ${matchedCity}, ${powiat}`);
              break;
            }
          }
          
          if (!selectedCity) {
            toast.success(`Wykryto województwo: ${voivodeshipDisplayNames[detectedVoivodeship] || detectedVoivodeship}`);
          }
        } else {
          toast.error("Nie udało się określić województwa. Wybierz ręcznie.");
        }
      } else {
        toast.error("Nie wykryto lokalizacji w Polsce");
      }
    } catch (error) {
      console.error("Location detection error:", error);
      toast.error("Błąd podczas wykrywania lokalizacji");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const loadSettings = async () => {
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      setSelectedVoivodeship(parsed.voivodeship || "");
      setSelectedPowiat(parsed.county || "");
      setSelectedCity(parsed.city || "");
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
          setSelectedVoivodeship(siteSettings.voivodeship || "");
          setSelectedPowiat(siteSettings.county || "");
          setSelectedCity(siteSettings.city || "");
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

  const validateImageBasic = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Dozwolone formaty: JPG, PNG, WebP");
      return false;
    }

    // Check file size (increased for pre-crop - will be reduced after crop)
    if (file.size > MAX_FILE_SIZE * 5) { // 10MB max for pre-crop
      toast.error("Maksymalny rozmiar pliku: 10MB");
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isValid = validateImageBasic(file);
    if (!isValid) {
      e.target.value = "";
      return;
    }

    // Create object URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageSrc(imageUrl);
    setCropDialogOpen(true);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setCropDialogOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    }

    setIsUploadingAvatar(true);

    try {
      const fileName = `avatar.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Delete old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);

      // Upload cropped avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, { 
          upsert: true,
          contentType: "image/jpeg"
        });

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
    }
  };

  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
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

                {/* Location Selector */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" strokeWidth={1.5} />
                      Lokalizacja
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="gap-2 h-8"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <LocateFixed className="h-3 w-3" />
                      )}
                      {isDetectingLocation ? "Wykrywanie..." : "Wykryj automatycznie"}
                    </Button>
                  </div>

                  {/* Voivodeship */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Województwo</Label>
                    <Select value={selectedVoivodeship} onValueChange={handleVoivodeshipChange}>
                      <SelectTrigger className="w-full bg-muted/30 border-0 h-11">
                        <SelectValue placeholder="Wybierz województwo" />
                      </SelectTrigger>
                      <SelectContent>
                        {voivodeships.map((v) => (
                          <SelectItem key={v} value={v}>
                            {voivodeshipDisplayNames[v] || v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Powiat */}
                  {selectedVoivodeship && powiats.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Powiat</Label>
                      <Select value={selectedPowiat || "__all__"} onValueChange={handlePowiatChange}>
                        <SelectTrigger className="w-full bg-muted/30 border-0 h-11">
                          <SelectValue placeholder="Wybierz powiat (opcjonalnie)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Wszystkie powiaty</SelectItem>
                          {powiats.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* City/Gmina */}
                  {selectedPowiat && cities.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Miasto / Gmina</Label>
                      <Select value={selectedCity || "__all__"} onValueChange={handleCityChange}>
                        <SelectTrigger className="w-full bg-muted/30 border-0 h-11">
                          <SelectValue placeholder="Wybierz miasto (opcjonalnie)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Wszystkie miasta</SelectItem>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Current location display */}
                  {(selectedVoivodeship || selectedPowiat || selectedCity) && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Twoja lokalizacja:</span>{" "}
                        {[
                          selectedCity,
                          selectedPowiat,
                          voivodeshipDisplayNames[selectedVoivodeship] || selectedVoivodeship
                        ].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wiadomości i reklamy będą dopasowane do tej lokalizacji
                      </p>
                    </div>
                  )}
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

        {/* Crop dialog */}
        {selectedImageSrc && (
          <ImageCropDialog
            isOpen={cropDialogOpen}
            onClose={handleCropDialogClose}
            imageSrc={selectedImageSrc}
            onCropComplete={handleCropComplete}
          />
        )}
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
