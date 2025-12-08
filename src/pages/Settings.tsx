import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Building, Phone, Save, Bell, Loader2, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreferencesSelector } from "@/components/notifications/PreferencesSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface NotificationPreferences {
  categories: string[];
  tags: string[];
}

interface SiteSettings {
  region: string;
  voivodeship: string;
  county: string;
  city: string;
  locality: string;
  language: string;
}

const voivodeships = [
  "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
  "łódzkie", "małopolskie", "mazowieckie", "opolskie", "podkarpackie",
  "podlaskie", "pomorskie", "śląskie", "świętokrzyskie", "warmińsko-mazurskie",
  "wielkopolskie", "zachodniopomorskie"
];

const languages = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    avatar_url: null,
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    categories: [],
    tags: [],
  });
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    region: "polska",
    voivodeship: "",
    county: "",
    city: "",
    locality: "",
    language: "pl",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          company_name: data.company_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url,
        });
      } else {
        // Use auth metadata if no profile exists
        setProfile({
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
          company_name: user.user_metadata?.company_name || "",
          phone: "",
          avatar_url: null,
        });
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user]);

  // Fetch notification preferences
  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      setLoadingPreferences(true);
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setPreferences({
          categories: data.categories || [],
          tags: data.tags || [],
        });
      }
      setLoadingPreferences(false);
    };

    fetchPreferences();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);

    // Validate inputs
    if (profile.full_name && profile.full_name.length > 100) {
      toast({
        variant: "destructive",
        title: "Błąd walidacji",
        description: "Imię i nazwisko nie może przekraczać 100 znaków.",
      });
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name?.trim() || null,
        company_name: profile.company_name?.trim() || null,
        phone: profile.phone?.trim() || null,
      })
      .eq("user_id", user.id);

    setSavingProfile(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Błąd zapisu",
        description: "Nie udało się zapisać zmian. Spróbuj ponownie.",
      });
    } else {
      toast({
        title: "Zapisano",
        description: "Twoje dane zostały zaktualizowane.",
      });
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setSavingPreferences(true);

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("user_notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from("user_notification_preferences")
        .update({
          categories: preferences.categories,
          tags: preferences.tags,
        })
        .eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("user_notification_preferences")
        .insert({
          user_id: user.id,
          categories: preferences.categories,
          tags: preferences.tags,
        });
      error = result.error;
    }

    setSavingPreferences(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Błąd zapisu",
        description: "Nie udało się zapisać preferencji. Spróbuj ponownie.",
      });
    } else {
      toast({
        title: "Zapisano",
        description: "Twoje preferencje powiadomień zostały zaktualizowane.",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Ustawienia</h1>
          <p className="text-muted-foreground mb-8">
            Zarządzaj swoim kontem i preferencjami powiadomień
          </p>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Powiadomienia
              </TabsTrigger>
              <TabsTrigger value="site" className="gap-2">
                <MapPin className="h-4 w-4" />
                Strona
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-6">Dane konta</h2>

                {loadingProfile ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Imię i nazwisko"
                        value={profile.full_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        maxLength={100}
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={profile.email || ""}
                        disabled
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-muted border border-input text-muted-foreground cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        Nie można zmienić
                      </span>
                    </div>

                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Nazwa firmy (opcjonalnie)"
                        value={profile.company_name || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, company_name: e.target.value })
                        }
                        maxLength={100}
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="tel"
                        placeholder="Numer telefonu (opcjonalnie)"
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        maxLength={20}
                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full"
                      variant="gradient"
                    >
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Zapisz zmiany
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-2">
                  Preferencje powiadomień
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Wybierz kategorie i tagi, o których chcesz otrzymywać
                  powiadomienia o nowych artykułach.
                </p>

                {loadingPreferences ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <PreferencesSelector
                      selectedCategories={preferences.categories}
                      selectedTags={preferences.tags}
                      onCategoriesChange={(categories) =>
                        setPreferences({ ...preferences, categories })
                      }
                      onTagsChange={(tags) =>
                        setPreferences({ ...preferences, tags })
                      }
                    />

                    <Button
                      onClick={handleSavePreferences}
                      disabled={savingPreferences}
                      className="w-full mt-6"
                      variant="gradient"
                    >
                      {savingPreferences ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Zapisz preferencje
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Site Settings Tab */}
            <TabsContent value="site">
              <div className="bg-card rounded-xl p-6 shadow-sm border">
                <h2 className="text-lg font-semibold mb-2">Ustawienia strony</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Dostosuj lokalizację i język wyświetlania treści.
                </p>

                <div className="space-y-4">
                  {/* Language */}
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Język
                    </label>
                    <Select
                      value={siteSettings.language}
                      onValueChange={(value) =>
                        setSiteSettings({ ...siteSettings, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz język" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region */}
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Region
                    </label>
                    <Select
                      value={siteSettings.region}
                      onValueChange={(value) =>
                        setSiteSettings({ ...siteSettings, region: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="polska">Polska</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voivodeship */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Województwo</label>
                    <Select
                      value={siteSettings.voivodeship}
                      onValueChange={(value) =>
                        setSiteSettings({ ...siteSettings, voivodeship: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz województwo" />
                      </SelectTrigger>
                      <SelectContent>
                        {voivodeships.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* County (Gmina) */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Gmina</label>
                    <input
                      type="text"
                      placeholder="Wpisz gminę"
                      value={siteSettings.county}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, county: e.target.value })
                      }
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Miasto</label>
                    <input
                      type="text"
                      placeholder="Wpisz miasto"
                      value={siteSettings.city}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, city: e.target.value })
                      }
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  {/* Locality */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Miejscowość</label>
                    <input
                      type="text"
                      placeholder="Wpisz miejscowość"
                      value={siteSettings.locality}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, locality: e.target.value })
                      }
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      setSavingSiteSettings(true);
                      // Save to localStorage for now
                      localStorage.setItem("siteSettings", JSON.stringify(siteSettings));
                      setTimeout(() => {
                        setSavingSiteSettings(false);
                        toast({
                          title: "Zapisano",
                          description: "Ustawienia strony zostały zaktualizowane.",
                        });
                      }, 500);
                    }}
                    disabled={savingSiteSettings}
                    className="w-full"
                    variant="gradient"
                  >
                    {savingSiteSettings ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Zapisz ustawienia
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
