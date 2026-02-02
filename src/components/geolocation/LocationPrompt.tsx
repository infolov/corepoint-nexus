import { useState } from "react";
import { MapPin, Navigation, X, Loader2, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSmartGeolocation, UserLocation } from "@/hooks/use-smart-geolocation";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
import { toast } from "sonner";

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
  const { detectLocation, saveLocation, isDetecting, error, detectionPhase, isSecureContext, clearError } = useSmartGeolocation();
  const [showManual, setShowManual] = useState(false);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const voivodeships = getVoivodeships();
  const powiats = selectedVoivodeship ? getPowiats(selectedVoivodeship) : [];
  const cities = selectedVoivodeship && selectedPowiat ? getGminas(selectedVoivodeship, selectedPowiat) : [];

  const getDetectionLabel = () => {
    switch (detectionPhase) {
      case "high_accuracy": return "GPS...";
      case "low_accuracy": return "Sieć...";
      case "reverse_geocoding": return "Adres...";
      case "ip_fallback": return "IP...";
      default: return "Wykrywanie...";
    }
  };

  const handleAutoDetect = async () => {
    if (isDetecting) return;
    
    clearError();
    const location = await detectLocation();
    
    if (location) {
      onLocationSet?.(location);
      onClose();
    } else {
      setShowManual(true);
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
    localStorage.setItem("locationPrompted", "true");
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-lg" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Twoja lokalizacja
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleSkip}
              disabled={isDetecting}
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Podaj swoją lokalizację, aby otrzymywać lokalne wiadomości i reklamy z Twojego regionu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Security warning */}
          {!isSecureContext && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Geolokalizacja wymaga HTTPS. Wybierz lokalizację ręcznie.
              </AlertDescription>
            </Alert>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {!showManual ? (
            <>
              <Button
                className="w-full h-10 sm:h-12 gap-2 text-sm sm:text-base"
                onClick={handleAutoDetect}
                disabled={isDetecting || !isSecureContext}
              >
                {isDetecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    {getDetectionLabel()}
                  </>
                ) : (
                  <>
                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                className="w-full h-10 sm:h-12 gap-2 text-sm sm:text-base"
                onClick={() => setShowManual(true)}
                disabled={isDetecting}
              >
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Wybierz ręcznie
              </Button>
            </>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">Województwo</label>
                <Select value={selectedVoivodeship} onValueChange={handleVoivodeshipChange}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Wybierz województwo" />
                  </SelectTrigger>
                  <SelectContent>
                    {voivodeships.map((v) => (
                      <SelectItem key={v} value={v} className="text-sm">
                        {voivodeshipDisplayNames[v] || v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {powiats.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Powiat</label>
                  <Select value={selectedPowiat} onValueChange={handlePowiatChange}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Wybierz powiat" />
                    </SelectTrigger>
                    <SelectContent>
                      {powiats.map((p) => (
                        <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cities.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Miasto / Gmina</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Wybierz miasto" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-1 sm:pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 sm:h-10 text-sm"
                  onClick={() => setShowManual(false)}
                >
                  Wstecz
                </Button>
                <Button
                  className="flex-1 h-9 sm:h-10 text-sm"
                  onClick={handleManualSave}
                  disabled={!selectedVoivodeship}
                >
                  Zapisz
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Możesz zmienić lokalizację w dowolnym momencie w ustawieniach.
        </p>
      </DialogContent>
    </Dialog>
  );
}
