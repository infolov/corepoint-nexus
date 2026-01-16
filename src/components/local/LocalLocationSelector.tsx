import { useState } from "react";
import { MapPin, Navigation, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useGeolocation, UserLocation } from "@/hooks/use-geolocation";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocalLocationSelectorProps {
  onLocationSet: (location: UserLocation) => void;
  onSkip?: () => void;
  compact?: boolean;
}

const voivodeshipDisplayNames: Record<string, string> = {
  "mazowieckie": "Mazowieckie",
  "małopolskie": "Małopolskie",
  "malopolskie": "Małopolskie",
  "śląskie": "Śląskie",
  "slaskie": "Śląskie",
  "wielkopolskie": "Wielkopolskie",
  "pomorskie": "Pomorskie",
  "dolnośląskie": "Dolnośląskie",
  "dolnoslaskie": "Dolnośląskie",
  "łódzkie": "Łódzkie",
  "lodzkie": "Łódzkie",
  "kujawsko-pomorskie": "Kujawsko-Pomorskie",
  "podkarpackie": "Podkarpackie",
  "lubelskie": "Lubelskie",
  "warmińsko-mazurskie": "Warmińsko-Mazurskie",
  "warminsko-mazurskie": "Warmińsko-Mazurskie",
  "zachodniopomorskie": "Zachodniopomorskie",
  "podlaskie": "Podlaskie",
  "świętokrzyskie": "Świętokrzyskie",
  "swietokrzyskie": "Świętokrzyskie",
  "opolskie": "Opolskie",
  "lubuskie": "Lubuskie",
};

export function LocalLocationSelector({ 
  onLocationSet, 
  onSkip,
  compact = false 
}: LocalLocationSelectorProps) {
  const { detectLocation, saveLocation, loading } = useGeolocation();
  const [isDetecting, setIsDetecting] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const voivodeships = getVoivodeships();
  const powiats = selectedVoivodeship ? getPowiats(selectedVoivodeship) : [];
  const cities = selectedVoivodeship && selectedPowiat 
    ? getGminas(selectedVoivodeship, selectedPowiat) 
    : [];

  // Filter voivodeships by search
  const filteredVoivodeships = voivodeships.filter((v) => {
    const displayName = voivodeshipDisplayNames[v] || v;
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const location = await detectLocation();
      const displayLocation = location.city 
        ? `${location.city}` 
        : location.county 
          ? location.county
          : voivodeshipDisplayNames[location.voivodeship || ""] || location.voivodeship;
      toast.success(`Wykryto lokalizację: ${displayLocation}`);
      onLocationSet(location);
    } catch (error) {
      toast.error("Nie udało się wykryć lokalizacji. Wybierz ręcznie.");
      setShowManualSelection(true);
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
    onLocationSet(location);
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

  const getLocationLevelDescription = () => {
    if (selectedCity) {
      return "~80% miasto + ~15% powiat + ~5% województwo";
    }
    if (selectedPowiat) {
      return "~85% powiat + ~15% województwo";
    }
    if (selectedVoivodeship) {
      return "100% treści z województwa";
    }
    return null;
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Ustaw swoją lokalizację</h3>
              <p className="text-sm text-muted-foreground">
                Wybierz miasto, powiat lub województwo, aby zobaczyć lokalne wiadomości
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAutoDetect}
              disabled={isDetecting || loading}
              className="gap-2"
            >
              {isDetecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Wykrywam...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Wykryj automatycznie
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualSelection(!showManualSelection)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Wybierz ręcznie
            </Button>
          </div>
        </div>

        {showManualSelection && (
          <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Powiat</label>
                <Select 
                  value={selectedPowiat} 
                  onValueChange={handlePowiatChange}
                  disabled={!selectedVoivodeship}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedVoivodeship ? "Wybierz powiat" : "Najpierw wybierz województwo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {powiats.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Miasto / Gmina</label>
                <Select 
                  value={selectedCity} 
                  onValueChange={setSelectedCity}
                  disabled={!selectedPowiat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPowiat ? "Wybierz miasto" : "Najpierw wybierz powiat"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {getLocationLevelDescription() && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Algorytm mieszania: {getLocationLevelDescription()}
                </Badge>
                <Button onClick={handleManualSave} disabled={!selectedVoivodeship}>
                  Zapisz lokalizację
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Wiadomości Lokalne</CardTitle>
        <CardDescription className="text-base">
          Ustaw swoją lokalizację, aby otrzymywać wiadomości z Twojego regionu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showManualSelection ? (
          <>
            <Button
              className="w-full h-14 gap-3 text-base"
              onClick={handleAutoDetect}
              disabled={isDetecting || loading}
            >
              {isDetecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Wykrywanie lokalizacji...
                </>
              ) : (
                <>
                  <Navigation className="h-5 w-5" />
                  Wykryj automatycznie
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">lub</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 gap-3 text-base"
              onClick={() => setShowManualSelection(true)}
            >
              <Search className="h-5 w-5" />
              Wyszukaj swoją lokalizację
            </Button>

            {onSkip && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onSkip}
              >
                Pomiń (pokaż wszystkie regiony)
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Wybierz swoją lokalizację</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualSelection(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">1</Badge>
                  Województwo
                </label>
                <Select value={selectedVoivodeship} onValueChange={handleVoivodeshipChange}>
                  <SelectTrigger className="h-12">
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
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">2</Badge>
                    Powiat <span className="text-muted-foreground font-normal">(opcjonalnie)</span>
                  </label>
                  <Select value={selectedPowiat} onValueChange={handlePowiatChange}>
                    <SelectTrigger className="h-12">
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
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">3</Badge>
                    Miasto / Gmina <span className="text-muted-foreground font-normal">(opcjonalnie)</span>
                  </label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12">
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
            </div>

            {getLocationLevelDescription() && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Algorytm mieszania treści:</strong> {getLocationLevelDescription()}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowManualSelection(false)}
              >
                Wstecz
              </Button>
              <Button
                className="flex-1"
                onClick={handleManualSave}
                disabled={!selectedVoivodeship}
              >
                Zapisz lokalizację
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Możesz zmienić lokalizację w dowolnym momencie w ustawieniach.
        </p>
      </CardContent>
    </Card>
  );
}
