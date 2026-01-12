import { useState } from "react";
import { MapPin, Navigation, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeolocation, UserLocation } from "@/hooks/use-geolocation";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LocationPromptProps {
  open: boolean;
  onClose: () => void;
  onLocationSet?: (location: UserLocation) => void;
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

export function LocationPrompt({ open, onClose, onLocationSet }: LocationPromptProps) {
  const { detectLocation, saveLocation, dismissPrompt, loading } = useGeolocation();
  const [isDetecting, setIsDetecting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const voivodeships = getVoivodeships();
  const powiats = selectedVoivodeship ? getPowiats(selectedVoivodeship) : [];
  const cities = selectedVoivodeship && selectedPowiat ? getGminas(selectedVoivodeship, selectedPowiat) : [];

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const location = await detectLocation();
      const displayLocation = location.city 
        ? `${location.city}, ${location.county}` 
        : voivodeshipDisplayNames[location.voivodeship || ""] || location.voivodeship;
      toast.success(`Wykryto lokalizację: ${displayLocation}`);
      onLocationSet?.(location);
      onClose();
    } catch (error) {
      toast.error("Nie udało się wykryć lokalizacji. Wybierz ręcznie.");
      setShowManual(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSave = async () => {
    if (!selectedVoivodeship) {
      toast.error("Wybierz przynajmniej województwo");
      return;
    }

    const location: UserLocation = {
      voivodeship: selectedVoivodeship,
      county: selectedPowiat || null,
      city: selectedCity || null,
      method: "manual",
    };

    await saveLocation(location);
    const displayLocation = selectedCity || selectedPowiat || voivodeshipDisplayNames[selectedVoivodeship];
    toast.success(`Ustawiono lokalizację: ${displayLocation}`);
    onLocationSet?.(location);
    onClose();
  };

  const handleSkip = () => {
    dismissPrompt();
    onClose();
  };

  const handleVoivodeshipChange = (value: string) => {
    setSelectedVoivodeship(value);
    setSelectedPowiat("");
    setSelectedCity("");
  };

  const handlePowiatChange = (value: string) => {
    setSelectedPowiat(value);
    setSelectedCity("");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Twoja lokalizacja
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Podaj swoją lokalizację, aby otrzymywać lokalne wiadomości i reklamy z Twojego regionu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showManual ? (
            <>
              <Button
                className="w-full h-12 gap-2"
                onClick={handleAutoDetect}
                disabled={isDetecting || loading}
              >
                {isDetecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Wykrywanie...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4" />
                    Wykryj automatycznie
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">lub</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 gap-2"
                onClick={() => setShowManual(true)}
              >
                <MapPin className="h-4 w-4" />
                Wybierz ręcznie
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Województwo</label>
                <Select value={selectedVoivodeship} onValueChange={handleVoivodeshipChange}>
                  <SelectTrigger>
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

              {powiats.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Powiat</label>
                  <Select value={selectedPowiat} onValueChange={handlePowiatChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz powiat" />
                    </SelectTrigger>
                    <SelectContent>
                      {powiats.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cities.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Miasto / Gmina</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz miasto" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowManual(false)}
                >
                  Wstecz
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleManualSave}
                  disabled={!selectedVoivodeship}
                >
                  Zapisz
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Możesz zmienić lokalizację w dowolnym momencie w ustawieniach.
        </p>
      </DialogContent>
    </Dialog>
  );
}
