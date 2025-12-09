import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
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

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("pl");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["mazowieckie"]);

  const handleRegionChange = (regionId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegions((prev) => [...prev, regionId]);
    } else {
      setSelectedRegions((prev) => prev.filter((r) => r !== regionId));
    }
  };

  const handleSave = () => {
    // Save settings to localStorage or database
    localStorage.setItem("userSettings", JSON.stringify({
      language: selectedLanguage,
      regions: selectedRegions,
    }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-card rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Ustawienia</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
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
                    className="text-sm font-medium cursor-pointer"
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
              Region (województwo)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {regions.map((region) => (
                <div key={region.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region.id}`}
                    checked={selectedRegions.includes(region.id)}
                    onCheckedChange={(checked) => 
                      handleRegionChange(region.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`region-${region.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {region.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="gradient" onClick={handleSave}>
            Zapisz
          </Button>
        </div>
      </div>
    </div>
  );
}
