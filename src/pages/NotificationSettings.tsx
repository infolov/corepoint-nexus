import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { id: "wiadomosci", name: "Wiadomości" },
  { id: "biznes", name: "Biznes" },
  { id: "sport", name: "Sport" },
  { id: "technologia", name: "Technologia" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "rozrywka", name: "Rozrywka" },
];

const sportSubcategories = [
  "Piłka nożna",
  "Koszykówka",
  "Siatkówka",
  "Tenis",
  "Sporty Motorowe",
  "Sporty Walki",
  "Hokej",
  "Lekkoatletyka",
  "Sporty Zimowe",
  "E-sport",
];

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification settings
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [recentlyViewedEnabled, setRecentlyViewedEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSelectedCategories(data.categories || []);
        setSelectedTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({
          user_id: user.id,
          categories: selectedCategories,
          tags: selectedTags,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Ustawienia powiadomień zostały zapisane");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Twoja przeglądarka nie obsługuje powiadomień push");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPushEnabled(true);
      toast.success("Powiadomienia push zostały włączone");
    } else {
      toast.error("Nie udało się włączyć powiadomień push");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót</span>
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Ustawienia powiadomień
              </h1>
              <p className="text-muted-foreground">
                Zarządzaj powiadomieniami i personalizacją treści
              </p>
            </div>
          </div>

          {/* Push Notifications */}
          <section className="bg-card rounded-xl p-6 mb-6 border border-border">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Typy powiadomień
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Powiadomienia push
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Otrzymuj powiadomienia w przeglądarce
                  </p>
                </div>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      requestPushPermission();
                    } else {
                      setPushEnabled(false);
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    Ostatnio oglądane
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Powiadomienia o podobnych artykułach
                  </p>
                </div>
                <Switch
                  checked={recentlyViewedEnabled}
                  onCheckedChange={setRecentlyViewedEnabled}
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="bg-card rounded-xl p-6 mb-6 border border-border">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Kategorie
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Wybierz kategorie, z których chcesz otrzymywać powiadomienia
            </p>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Sport Subcategories */}
          {selectedCategories.includes("sport") && (
            <section className="bg-card rounded-xl p-6 mb-6 border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Podkategorie sportowe
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Wybierz dyscypliny sportowe, które Cię interesują
              </p>

              <div className="grid grid-cols-2 gap-3">
                {sportSubcategories.map((subcategory) => (
                  <label
                    key={subcategory}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedTags.includes(subcategory)}
                      onCheckedChange={() => handleTagToggle(subcategory)}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {subcategory}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zapisz ustawienia
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
