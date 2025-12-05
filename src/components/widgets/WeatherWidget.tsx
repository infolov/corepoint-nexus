import { Sun, Cloud, CloudRain, Wind, Droplets } from "lucide-react";

interface WeatherDay {
  day: string;
  temp: number;
  icon: "sun" | "cloud" | "rain";
}

const weatherData: WeatherDay[] = [
  { day: "Dziś", temp: 22, icon: "sun" },
  { day: "Pt", temp: 20, icon: "cloud" },
  { day: "So", temp: 18, icon: "rain" },
  { day: "Nd", temp: 21, icon: "sun" },
  { day: "Pn", temp: 19, icon: "cloud" },
];

const WeatherIcon = ({ type }: { type: "sun" | "cloud" | "rain" }) => {
  switch (type) {
    case "sun":
      return <Sun className="h-6 w-6 text-weather-sunny" />;
    case "cloud":
      return <Cloud className="h-6 w-6 text-weather-cloudy" />;
    case "rain":
      return <CloudRain className="h-6 w-6 text-primary" />;
  }
};

export function WeatherWidget() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-lg mb-4">Pogoda - Warszawa</h3>
      
      {/* Current Weather */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Sun className="h-12 w-12 text-weather-sunny" />
          <div>
            <span className="text-4xl font-bold">22°</span>
            <p className="text-muted-foreground text-sm">Słonecznie</p>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground space-y-1">
          <p className="flex items-center justify-end gap-1">
            <Wind className="h-4 w-4" /> 12 km/h
          </p>
          <p className="flex items-center justify-end gap-1">
            <Droplets className="h-4 w-4" /> 45%
          </p>
        </div>
      </div>

      {/* Forecast */}
      <div className="flex justify-between">
        {weatherData.map((day) => (
          <div key={day.day} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{day.day}</span>
            <WeatherIcon type={day.icon} />
            <span className="text-sm font-medium">{day.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
