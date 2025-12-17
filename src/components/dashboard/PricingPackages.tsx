import { Check, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PricingPackage {
  id: string;
  name: string;
  days: number;
  price: number;
  savings?: number;
  popular?: boolean;
  description: string;
}

interface PricingPackagesProps {
  packages: PricingPackage[];
  selectedPackage: string | null;
  onPackageSelect: (packageId: string) => void;
  dailyRate: number;
}

const defaultPackages: PricingPackage[] = [
  {
    id: "1day",
    name: "1 dzień",
    days: 1,
    price: 100,
    description: "Dobre na szybkie promo"
  },
  {
    id: "1week",
    name: "1 tydzień",
    days: 7,
    price: 600,
    savings: 100,
    description: "Oszczędzasz 100 PLN"
  },
  {
    id: "1month",
    name: "1 miesiąc",
    days: 30,
    price: 2000,
    savings: 1000,
    popular: true,
    description: "Oszczędzasz 1000 PLN"
  }
];

export function PricingPackages({
  packages = defaultPackages,
  selectedPackage,
  onPackageSelect,
  dailyRate
}: PricingPackagesProps) {
  // Calculate actual prices based on daily rate
  const calculatedPackages = packages.map(pkg => ({
    ...pkg,
    price: pkg.days === 1 ? dailyRate : 
           pkg.days === 7 ? dailyRate * 6 : 
           dailyRate * 20,
    savings: pkg.days === 7 ? dailyRate : 
             pkg.days === 30 ? dailyRate * 10 : 
             undefined
  }));

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Wybierz pakiet</h3>
        <p className="text-sm text-muted-foreground">
          Stałe, zrozumiałe ceny bez ukrytych kosztów
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {calculatedPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className={cn(
              "relative cursor-pointer transition-all hover:shadow-lg",
              selectedPackage === pkg.id && "ring-2 ring-primary border-primary",
              pkg.popular && "border-primary/50"
            )}
            onClick={() => onPackageSelect(pkg.id)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Najpopularniejszy
                </Badge>
              </div>
            )}

            <CardHeader className={cn("text-center", pkg.popular && "pt-8")}>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <div>
                <span className="text-4xl font-bold">{pkg.price}</span>
                <span className="text-lg text-muted-foreground"> PLN</span>
              </div>

              {pkg.savings && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Oszczędzasz {pkg.savings} PLN
                </Badge>
              )}

              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{pkg.days} {pkg.days === 1 ? "dzień" : pkg.days < 5 ? "dni" : "dni"} emisji</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Pełne statystyki</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Raport po kampanii</span>
                </div>
              </div>

              {selectedPackage === pkg.id && (
                <div className="pt-2">
                  <Badge variant="default" className="w-full justify-center py-1">
                    <Check className="h-4 w-4 mr-1" />
                    Wybrano
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom duration info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Potrzebujesz innego okresu? Wybierz daty w kalendarzu powyżej, 
            a cena zostanie obliczona automatycznie.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
