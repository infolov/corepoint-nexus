import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Home } from "lucide-react";
import { getVoivodeships, getPowiats, getGminas } from "@/data/poland-divisions";

interface AdministrativeTargetingProps {
  voivodeship: string;
  powiat: string;
  gmina: string;
  onVoivodeshipChange: (value: string) => void;
  onPowiatChange: (value: string) => void;
  onGminaChange: (value: string) => void;
}

export const AdministrativeTargeting = ({
  voivodeship,
  powiat,
  gmina,
  onVoivodeshipChange,
  onPowiatChange,
  onGminaChange,
}: AdministrativeTargetingProps) => {
  const voivodeships = getVoivodeships();
  const powiats = voivodeship ? getPowiats(voivodeship) : [];
  const gminas = voivodeship && powiat ? getGminas(voivodeship, powiat) : [];

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (!voivodeship) {
      onPowiatChange("");
      onGminaChange("");
    }
  }, [voivodeship]);

  useEffect(() => {
    if (!powiat) {
      onGminaChange("");
    }
  }, [powiat]);

  const handleVoivodeshipChange = (value: string) => {
    onVoivodeshipChange(value);
    onPowiatChange("");
    onGminaChange("");
  };

  const handlePowiatChange = (value: string) => {
    onPowiatChange(value);
    onGminaChange("");
  };

  // Determine targeting level for display
  const getTargetingLevel = () => {
    if (gmina) return { level: "Gmina", color: "bg-green-500" };
    if (powiat) return { level: "Powiat", color: "bg-blue-500" };
    if (voivodeship) return { level: "Województwo", color: "bg-orange-500" };
    return null;
  };

  const targetingLevel = getTargetingLevel();

  return (
    <div className="space-y-4">
      {targetingLevel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Poziom targetowania:</span>
          <Badge variant="secondary" className={`${targetingLevel.color} text-white`}>
            {targetingLevel.level}
          </Badge>
        </div>
      )}

      {/* Voivodeship Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Województwo
        </Label>
        <Select value={voivodeship} onValueChange={handleVoivodeshipChange}>
          <SelectTrigger>
            <SelectValue placeholder="Wybierz województwo..." />
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

      {/* Powiat Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Powiat
          {!voivodeship && (
            <span className="text-xs text-muted-foreground">(wybierz najpierw województwo)</span>
          )}
        </Label>
        <Select
          value={powiat}
          onValueChange={handlePowiatChange}
          disabled={!voivodeship}
        >
          <SelectTrigger className={!voivodeship ? "opacity-50" : ""}>
            <SelectValue placeholder={voivodeship ? "Wybierz powiat..." : "Najpierw wybierz województwo"} />
          </SelectTrigger>
          <SelectContent>
            {powiats.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gmina Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />
          Gmina / Miasto
          {!powiat && (
            <span className="text-xs text-muted-foreground">(wybierz najpierw powiat)</span>
          )}
        </Label>
        <Select
          value={gmina}
          onValueChange={onGminaChange}
          disabled={!powiat}
        >
          <SelectTrigger className={!powiat ? "opacity-50" : ""}>
            <SelectValue placeholder={powiat ? "Wybierz gminę..." : "Najpierw wybierz powiat"} />
          </SelectTrigger>
          <SelectContent>
            {gminas.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Targeting summary */}
      {voivodeship && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-1">Zasięg reklamy:</p>
          <p className="text-sm text-muted-foreground">
            {gmina ? (
              <>Gmina <strong>{gmina}</strong>, powiat {powiat}, woj. {voivodeship}</>
            ) : powiat ? (
              <>Powiat <strong>{powiat}</strong>, woj. {voivodeship}</>
            ) : (
              <>Całe województwo <strong>{voivodeship}</strong></>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
