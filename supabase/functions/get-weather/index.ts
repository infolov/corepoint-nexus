import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon, city } = await req.json();
    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");

    if (!apiKey) {
      console.error("OPENWEATHERMAP_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Weather API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let url: string;
    
    if (lat && lon) {
      // Use coordinates
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`;
    } else if (city) {
      // Use city name
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},PL&appid=${apiKey}&units=metric&lang=pl`;
    } else {
      // Default to Warsaw
      url = `https://api.openweathermap.org/data/2.5/weather?q=Warsaw,PL&appid=${apiKey}&units=metric&lang=pl`;
    }

    console.log("Fetching weather from:", url.replace(apiKey, "***"));

    const weatherResponse = await fetch(url);
    const weatherData = await weatherResponse.json();

    if (!weatherResponse.ok) {
      console.error("OpenWeatherMap error:", weatherData);
      return new Response(
        JSON.stringify({ error: weatherData.message || "Failed to fetch weather" }),
        { status: weatherResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also fetch 5-day forecast
    let forecastUrl: string;
    if (lat && lon) {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`;
    } else if (city) {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},PL&appid=${apiKey}&units=metric&lang=pl`;
    } else {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=Warsaw,PL&appid=${apiKey}&units=metric&lang=pl`;
    }

    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    // Process forecast to get daily data (one per day at noon)
    const dailyForecast = [];
    const seenDates = new Set();
    
    if (forecastData.list) {
      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toDateString();
        const hour = date.getHours();
        
        // Get one forecast per day, preferably around noon
        if (!seenDates.has(dateStr) && hour >= 11 && hour <= 14) {
          seenDates.add(dateStr);
          dailyForecast.push({
            date: item.dt,
            temp: Math.round(item.main.temp),
            icon: item.weather[0].icon,
            description: item.weather[0].description,
          });
          
          if (dailyForecast.length >= 5) break;
        }
      }
    }

    const result = {
      current: {
        temp: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        wind_speed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        city: weatherData.name,
        country: weatherData.sys.country,
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility ? Math.round(weatherData.visibility / 1000) : null,
      },
      forecast: dailyForecast,
    };

    console.log("Weather fetched successfully for:", weatherData.name);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching weather:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
