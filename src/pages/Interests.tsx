import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InterestsSelector } from "@/components/auth/InterestsSelector";
import { ArrowLeft, Loader2, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Interests() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        .select("categories, tags")
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

      toast.success("Zainteresowania zostały zapisane");
      navigate(-1);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Nie udało się zapisać zainteresowań");
    } finally {
      setSaving(false);
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
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót</span>
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Moje zainteresowania
              </h1>
              <p className="text-muted-foreground">
                Personalizuj wyświetlane treści
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <InterestsSelector
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              onCategoriesChange={setSelectedCategories}
              onTagsChange={setSelectedTags}
              onContinue={handleSave}
              isLoading={saving}
              showSkip={false}
              submitLabel="Zapisz zainteresowania"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
