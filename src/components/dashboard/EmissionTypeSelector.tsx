import { useState } from "react";
import { Crown, Users, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EmissionType = "exclusive" | "rotation";

interface Slot {
  id: number;
  available: boolean;
}

interface EmissionTypeSelectorProps {
  selectedType: EmissionType | null;
  selectedSlot: number | null;
  onTypeSelect: (type: EmissionType) => void;
  onSlotSelect: (slot: number) => void;
  availableSlots?: Slot[];
  exclusivePrice: number;
  rotationPrice: number;
}

export function EmissionTypeSelector({
  selectedType,
  selectedSlot,
  onTypeSelect,
  onSlotSelect,
  availableSlots = [
    { id: 1, available: true },
    { id: 2, available: false },
    { id: 3, available: true },
    { id: 4, available: true },
  ],
  exclusivePrice,
  rotationPrice,
}: EmissionTypeSelectorProps) {
  const availableSlotCount = availableSlots.filter(s => s.available).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exclusive Option */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            selectedType === "exclusive" && "ring-2 ring-primary border-primary"
          )}
          onClick={() => onTypeSelect("exclusive")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Pełna Wyłączność</CardTitle>
              </div>
              {selectedType === "exclusive" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <Badge variant="outline" className="w-fit bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
              Exclusive
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Twoja reklama wyświetlana zawsze, bez konkurencji. Idealna dla kampanii wizerunkowych.
            </CardDescription>
            
            {/* 100% visibility indicator */}
            <div className="relative pt-2">
              <div className="text-center mb-2">
                <span className="text-2xl font-bold text-primary">100%</span>
                <span className="text-sm text-muted-foreground ml-1">widoczności</span>
              </div>
              <div className="h-3 bg-primary rounded-full" />
            </div>

            <div className="text-center pt-2">
              <span className="text-2xl font-bold">{exclusivePrice} PLN</span>
              <span className="text-sm text-muted-foreground">/dzień</span>
            </div>
          </CardContent>
        </Card>

        {/* Rotation Option */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            selectedType === "rotation" && "ring-2 ring-primary border-primary"
          )}
          onClick={() => onTypeSelect("rotation")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Rotacja (Slot)</CardTitle>
              </div>
              {selectedType === "rotation" && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-600 border-blue-500/30">
              {availableSlotCount}/4 wolnych slotów
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Reklamy rotują się przy odświeżeniu strony. Niższa cena, większa elastyczność.
            </CardDescription>

            {/* Pie chart visualization */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {availableSlots.map((slot, index) => {
                    const startAngle = (index * 90);
                    const isSelected = selectedType === "rotation" && selectedSlot === slot.id;
                    
                    return (
                      <path
                        key={slot.id}
                        d={describeArc(50, 50, 40, startAngle, startAngle + 88)}
                        fill="none"
                        stroke={
                          isSelected ? "hsl(var(--primary))" :
                          slot.available ? "hsl(var(--primary) / 0.3)" :
                          "hsl(var(--muted))"
                        }
                        strokeWidth="18"
                        className={cn(
                          "transition-all",
                          slot.available && selectedType === "rotation" && "cursor-pointer hover:opacity-80"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (slot.available && selectedType === "rotation") {
                            onSlotSelect(slot.id);
                          }
                        }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-bold">25%</span>
                  <span className="text-xs text-muted-foreground">na slot</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Twoja reklama będzie wyświetlana co 4. odsłonę strony
            </p>

            <div className="text-center pt-2">
              <span className="text-2xl font-bold">{rotationPrice} PLN</span>
              <span className="text-sm text-muted-foreground">/dzień</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slot selection for rotation */}
      {selectedType === "rotation" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Wybierz slot</CardTitle>
            <CardDescription>
              Kliknij na dostępny slot w wykresie powyżej lub wybierz poniżej
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    slot.available && "hover:border-primary cursor-pointer",
                    !slot.available && "opacity-50 cursor-not-allowed bg-muted",
                    selectedSlot === slot.id && "border-primary bg-primary/10"
                  )}
                  onClick={() => slot.available && onSlotSelect(slot.id)}
                >
                  <div className="text-center">
                    <span className="text-sm font-medium">Slot {slot.id}</span>
                    <p className="text-xs text-muted-foreground">
                      {slot.available ? "Dostępny" : "Zajęty"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to describe SVG arc
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
