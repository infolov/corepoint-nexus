import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { Cloud, Droplets, Wind, Thermometer, Sun, CloudRain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const weekForecast = [
  { day: "Poniedziałek", temp: 22, icon: Sun, condition: "Słonecznie" },
  { day: "Wtorek", temp: 20, icon: Cloud, condition: "Pochmurno" },
  { day: "Środa", temp: 18, icon: CloudRain, condition: "Deszczowo" },
  { day: "Czwartek", temp: 19, icon: Cloud, condition: "Pochmurno" },
  { day: "Piątek", temp: 21, icon: Sun, condition: "Słonecznie" },
  { day: "Sobota", temp: 23, icon: Sun, condition: "Słonecznie" },
  { day: "Niedziela", temp: 22, icon: Cloud, condition: "Częściowe zachmurzenie" },
];

const cities = [
  { name: "Warszawa", temp: 22 },
  { name: "Kraków", temp: 20 },
  { name: "Gdańsk", temp: 18 },
  { name: "Wrocław", temp: 21 },
  { name: "Poznań", temp: 20 },
  { name: "Łódź", temp: 21 },
];

export default function Weather() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Pogoda</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Weather */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Weather */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Warszawa</h2>
                      <p className="text-muted-foreground">Polska</p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-6xl font-bold">22°</span>
                        <span className="text-2xl text-muted-foreground">C</span>
                      </div>
                      <p className="text-lg mt-2">Częściowe zachmurzenie</p>
                    </div>
                    <Sun className="h-24 w-24 text-yellow-500" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Wiatr</p>
                        <p className="font-semibold">12 km/h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Wilgotność</p>
                        <p className="font-semibold">65%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Odczuwalna</p>
                        <p className="font-semibold">24°C</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Week Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>Prognoza na tydzień</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weekForecast.map((day) => (
                      <div
                        key={day.day}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="font-medium w-32">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <day.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground w-40">{day.condition}</span>
                        </div>
                        <span className="font-semibold">{day.temp}°C</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <WeatherWidget />
              
              <Card>
                <CardHeader>
                  <CardTitle>Inne miasta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cities.map((city) => (
                      <div
                        key={city.name}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span>{city.name}</span>
                        <span className="font-semibold">{city.temp}°C</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
