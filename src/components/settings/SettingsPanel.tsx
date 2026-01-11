import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DisplaySettings } from "./DisplaySettings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

const languages = [
  { id: "pl", label: "Polski" },
  { id: "en", label: "English" },
];

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

export function SettingsPanel({ isOpen, onClose, onSettingsSaved }: SettingsPanelProps) {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("pl");
  const [selectedRegion, setSelectedRegion] = useState("mazowieckie");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings when panel opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    // First try localStorage
    const localSettings = localStorage.getItem("userSettings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      setSelectedLanguage(parsed.language || "pl");
      setSelectedRegion(parsed.voivodeship || "mazowieckie");
    }

    // If logged in, fetch from database
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
          setSelectedLanguage(data.language || "pl");
          setSelectedRegion(data.voivodeship || "mazowieckie");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Always save to localStorage
    localStorage.setItem("userSettings", JSON.stringify({
      language: selectedLanguage,
      voivodeship: selectedRegion,
    }));

    // If logged in, save to database
    if (user) {
      try {
        // Check if settings exist
        const { data: existing } = await supabase
          .from("user_site_settings")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from("user_site_settings")
            .update({
              language: selectedLanguage,
              voivodeship: selectedRegion,
            })
            .eq("user_id", user.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from("user_site_settings")
            .insert({
              user_id: user.id,
              language: selectedLanguage,
              voivodeship: selectedRegion,
            });

          if (error) throw error;
        }

        toast.success("Ustawienia zapisane");
        onSettingsSaved?.();
      } catch (error) {
        console.error("Error saving settings:", error);
        toast.error("Błąd podczas zapisywania ustawień");
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
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Ustawienia</SheetTitle>
          {!user && (
            <SheetDescription>
              Zaloguj się, aby zapisać ustawienia na koncie
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Display Settings (Data Saver, Font Size, Mode) */}
              <DisplaySettings className="mb-6 pb-6 border-b border-border" />

              {/* Language Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Język / Language
                </h3>
                <div className="flex flex-wrap gap-4">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.id}`}
                        checked={selectedLanguage === lang.id}
                        onCheckedChange={() => setSelectedLanguage(lang.id)}
                      />
                      <Label 
                        htmlFor={`lang-${lang.id}`}
                        className="text-senior-sm font-medium cursor-pointer"
                      >
                        {lang.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Section */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  Województwo
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {regions.map((region) => (
                    <div key={region.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region.id}`}
                        checked={selectedRegion === region.id}
                        onCheckedChange={() => setSelectedRegion(region.id)}
                      />
                      <Label 
                        htmlFor={`region-${region.id}`}
                        className="text-senior-sm font-medium cursor-pointer"
                      >
                        {region.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
