import { useState } from "react";
import { MapPin, Navigation, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";
import { useSmartGeolocation, UserLocation } from "@/hooks/use-smart-geolocation";
import { toast } from "sonner";
import { getLocalContentMixConfig, LOCAL_SUBCATEGORIES } from "@/data/categories";

const voivodeshipDisplayNames: Record<string, string> = {
  'mazowieckie': 'Mazowieckie',
  'pomorskie': 'Pomorskie',
  'małopolskie': 'Małopolskie',
  'śląskie': 'Śląskie',
  'wielkopolskie': 'Wielkopolskie',
  'dolnośląskie': 'Dolnośląskie',
  'łódzkie': 'Łódzkie',
  'zachodniopomorskie': 'Zachodniopomorskie',
  'kujawsko-pomorskie': 'Kujawsko-Pomorskie',
  'lubelskie': 'Lubelskie',
  'podkarpackie': 'Podkarpackie',
  'podlaskie': 'Podlaskie',
  'warmińsko-mazurskie': 'Warmińsko-Mazurskie',
  'lubuskie': 'Lubuskie',
  'świętokrzyskie': 'Świętokrzyskie',
  'opolskie': 'Opolskie',
};

interface LocalLocationSelectorProps {
  onLocationSet: (location: UserLocation) => void;
  compact?: boolean;
}

export function LocalLocationSelector({ onLocationSet, compact = false }: LocalLocationSelectorProps) {
  const { detectLocation, saveLocation, isDetecting, error, detectionPhase, isSecureContext, clearError } = useSmartGeolocation();
  const [selectedVoivodeship, setSelectedVoivodeship] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showManualSelection, setShowManualSelection] = useState(false);

  const voivodeships = getVoivodeships();
  const powiats = selectedVoivodeship ? getPowiats(selectedVoivodeship) : [];
  const cities = selectedVoivodeship && selectedPowiat ? getGminas(selectedVoivodeship, selectedPowiat) : [];

  // Calculate content mix preview
  const getContentMixPreview = () => {
    if (selectedCity) {
      const config = getLocalContentMixConfig("city");
      return `${config.cityPercentage}% miasto + ${config.countyPercentage}% powiat + ${config.voivodeshipPercentage}% województwo`;
    }
    if (selectedPowiat) {
      const config = getLocalContentMixConfig("county");
      return `${config.countyPercentage}% powiat + ${config.voivodeshipPercentage}% województwo`;
    }
    if (selectedVoivodeship) {
      return "100% treści z województwa";
    }
    return null;
  };

  const handleAutoDetect = async () => {
    if (isDetecting) return; // Prevent double-clicks
    
    clearError();
    const location = await detectLocation();
    
    if (location) {
      onLocationSet(location);
    } else {
      // Detection failed, show manual selection
      setShowManualSelection(true);
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

  const contentMixPreview = getContentMixPreview();

  // Detection phase label for UX feedback
  const getDetectionLabel = () => {
    switch (detectionPhase) {
      case "high_accuracy": return "GPS...";
      case "low_accuracy": return "Sieć...";
      case "reverse_geocoding": return "Adres...";
      case "ip_fallback": return "IP...";
      default: return "Wykryj";
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
        {/* Security warning */}
        {!isSecureContext && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Geolokalizacja wymaga bezpiecznego połączenia HTTPS.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-primary/20 rounded-full">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Ustaw lokalizację</p>
              <p className="text-xs text-muted-foreground">aby zobaczyć lokalne wiadomości</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAutoDetect}
              disabled={isDetecting || !isSecureContext}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {getDetectionLabel()}
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Wykryj
                </>
              )}
            </Button>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowManualSelection(!showManualSelection)}
              disabled={isDetecting}
            >
              Wybierz ręcznie
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && error !== "PERMISSION_DENIED" && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {showManualSelection && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={selectedVoivodeship} onValueChange={handleVoivodeshipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Województwo" />
                </SelectTrigger>
                <SelectContent>
                  {voivodeships.map((v) => (
                    <SelectItem key={v} value={v}>
                      {voivodeshipDisplayNames[v] || v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedPowiat} 
                onValueChange={handlePowiatChange}
                disabled={!selectedVoivodeship}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Powiat" />
                </SelectTrigger>
                <SelectContent>
                  {powiats.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity}
                disabled={!selectedPowiat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gmina/Miasto" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {contentMixPreview && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Miks treści: {contentMixPreview}
                </p>
                <Button size="sm" onClick={handleManualSave} disabled={!selectedVoivodeship}>
                  Zatwierdź
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Ustaw swoją lokalizację</CardTitle>
            <CardDescription className="mt-1">
              Wybierz miasto, powiat lub województwo, aby zobaczyć lokalne wiadomości
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security warning */}
        {!isSecureContext && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Geolokalizacja wymaga bezpiecznego połączenia HTTPS. 
              Automatyczne wykrywanie lokalizacji nie będzie działać.
            </AlertDescription>
          </Alert>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Auto-detect option */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1 h-14"
            onClick={handleAutoDetect}
            disabled={isDetecting || !isSecureContext}
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <div className="text-left">
                  <div className="font-medium">{getDetectionLabel()}</div>
                  <div className="text-xs text-muted-foreground">
                    {detectionPhase === "high_accuracy" && "Szukam sygnału GPS..."}
                    {detectionPhase === "low_accuracy" && "Lokalizacja sieciowa..."}
                    {detectionPhase === "reverse_geocoding" && "Określam dokładny adres..."}
                    {detectionPhase === "ip_fallback" && "Wykrywanie po IP..."}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Wykryj automatycznie</div>
                  <div className="text-xs text-muted-foreground">GPS → Sieć → IP</div>
                </div>
              </>
            )}
          </Button>
          <Button 
            variant={showManualSelection ? "secondary" : "default"}
            className="flex-1 h-14"
            onClick={() => setShowManualSelection(!showManualSelection)}
            disabled={isDetecting}
          >
            <MapPin className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Wybierz ręcznie</div>
              <div className="text-xs opacity-80">Wskaż na mapie</div>
            </div>
          </Button>
        </div>

        {/* Manual selection */}
        {showManualSelection && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Voivodeship */}
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

              {/* Powiat */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">2</Badge>
                  Powiat
                  <span className="text-muted-foreground text-xs">(opcjonalnie)</span>
                </label>
                <Select 
                  value={selectedPowiat} 
                  onValueChange={handlePowiatChange}
                  disabled={!selectedVoivodeship}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={selectedVoivodeship ? "Wybierz powiat" : "Najpierw wybierz woj."} />
                  </SelectTrigger>
                  <SelectContent>
                    {powiats.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City/Gmina */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">3</Badge>
                  Gmina/Miasto
                  <span className="text-muted-foreground text-xs">(opcjonalnie)</span>
                </label>
                <Select 
                  value={selectedCity} 
                  onValueChange={setSelectedCity}
                  disabled={!selectedPowiat}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={selectedPowiat ? "Wybierz gminę" : "Najpierw wybierz powiat"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content mix preview */}
            {contentMixPreview && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Miks treści lokalnych:</span>
                  <Badge variant="secondary">{contentMixPreview}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Im dokładniejsza lokalizacja, tym więcej treści z Twojego najbliższego otoczenia.
                </p>
              </div>
            )}

            {/* Local subcategories preview */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Kategorie lokalne:</span>
              <div className="flex flex-wrap gap-2">
                {LOCAL_SUBCATEGORIES.map((cat) => (
                  <Badge key={cat.slug} variant="outline" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <Button 
              className="w-full h-12" 
              onClick={handleManualSave}
              disabled={!selectedVoivodeship}
            >
              <ChevronRight className="h-5 w-5 mr-2" />
              Pokaż lokalne wiadomości
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
