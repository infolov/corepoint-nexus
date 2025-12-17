import { useState, useEffect } from "react";
import { MapPin, Navigation, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATIONS, findNearestStation, type StationCoords } from "@/hooks/use-weather";
import { toast } from "sonner";

interface LocationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationChange: (station: StationCoords) => void;
  currentStation?: StationCoords | null;
}

// Group stations by voivodeship for better UX
const VOIVODESHIPS: Record<string, string[]> = {
  "Dolnośląskie": ["Jelenia Góra", "Kłodzko", "Legnica", "Śnieżka", "Wrocław"],
  "Kujawsko-Pomorskie": ["Toruń", "Chojnice"],
  "Lubelskie": ["Lublin", "Włodawa", "Zamość"],
  "Lubuskie": ["Gorzów", "Słubice", "Zielona Góra"],
  "Łódzkie": ["Łódź", "Sulejów"],
  "Małopolskie": ["Kasprowy Wierch", "Kraków", "Nowy Sącz", "Tarnów", "Zakopane"],
  "Mazowieckie": ["Kozienice", "Mława", "Ostrołęka", "Płock", "Siedlce", "Warszawa"],
  "Opolskie": ["Opole", "Racibórz"],
  "Podkarpackie": ["Krosno", "Lesko", "Przemyśl", "Rzeszów"],
  "Podlaskie": ["Białystok", "Suwałki"],
  "Pomorskie": ["Gdańsk", "Hel", "Lębork", "Łeba", "Ustka"],
  "Śląskie": ["Bielsko Biała", "Częstochowa", "Katowice"],
  "Świętokrzyskie": ["Kielce", "Sandomierz"],
  "Warmińsko-Mazurskie": ["Elbląg", "Kętrzyn", "Mikołajki", "Olsztyn"],
  "Wielkopolskie": ["Kalisz", "Koło", "Leszno", "Piła", "Poznań", "Wieluń"],
  "Zachodniopomorskie": ["Kołobrzeg", "Koszalin", "Resko", "Szczecin", "Szczecinek", "Świnoujście"],
};

export function LocationSettings({ isOpen, onClose, onLocationChange, currentStation }: LocationSettingsProps) {
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedVoivodeship) {
      setAvailableCities(VOIVODESHIPS[selectedVoivodeship] || []);
      setSelectedCity("");
    }
  }, [selectedVoivodeship]);

  // Initialize from current station
  useEffect(() => {
    if (currentStation && isOpen) {
      // Find voivodeship for current station
      for (const [voi, cities] of Object.entries(VOIVODESHIPS)) {
        if (cities.includes(currentStation.name)) {
          setSelectedVoivodeship(voi);
          setSelectedCity(currentStation.name);
          break;
        }
      }
    }
  }, [currentStation, isOpen]);

  const handleAutoDetect = () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolokalizacja nie jest obsługiwana przez tę przeglądarkę");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestStation(
          position.coords.latitude,
          position.coords.longitude
        );
        
        // Save to localStorage
        localStorage.setItem("userLocation", JSON.stringify({
          stationId: nearest.id,
          stationName: nearest.name,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          auto: true,
        }));
        
        onLocationChange(nearest);
        toast.success(`Wykryto lokalizację: ${nearest.name}`);
        setIsDetecting(false);
        onClose();
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Nie udało się wykryć lokalizacji. Sprawdź uprawnienia przeglądarki.");
        setIsDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualSelect = () => {
    if (!selectedCity) {
      toast.error("Wybierz miasto");
      return;
    }

    const station = STATIONS.find(s => s.name === selectedCity);
    if (!station) {
      toast.error("Nie znaleziono stacji dla wybranego miasta");
      return;
    }

    // Save to localStorage
    localStorage.setItem("userLocation", JSON.stringify({
      stationId: station.id,
      stationName: station.name,
      lat: station.lat,
      lon: station.lon,
      auto: false,
    }));

    onLocationChange(station);
    toast.success(`Ustawiono lokalizację: ${station.name}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Ustaw lokalizację
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-detect section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Automatyczne wykrywanie</h4>
            <Button 
              onClick={handleAutoDetect} 
              disabled={isDetecting}
              className="w-full"
              variant="outline"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wykrywanie...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Użyj mojej lokalizacji (GPS)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Przeglądarka poprosi o zgodę na dostęp do lokalizacji
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">lub</span>
            </div>
          </div>

          {/* Manual selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Wybierz ręcznie</h4>
            
            <Select value={selectedVoivodeship} onValueChange={setSelectedVoivodeship}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz województwo" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(VOIVODESHIPS).sort().map((voi) => (
                  <SelectItem key={voi} value={voi}>
                    {voi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedCity} 
              onValueChange={setSelectedCity}
              disabled={!selectedVoivodeship}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz miasto" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.sort().map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleManualSelect} 
              disabled={!selectedCity}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Zapisz lokalizację
            </Button>
          </div>

          {/* Current location info */}
          {currentStation && (
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Obecna lokalizacja: <span className="font-medium text-foreground">{currentStation.name}</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}