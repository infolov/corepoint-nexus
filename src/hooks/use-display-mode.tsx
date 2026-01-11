import { useState, useEffect, createContext, useContext } from "react";

type Theme = "light" | "dark" | "system";

interface DisplaySettings {
  theme: Theme;
  fontSize: "normal" | "large" | "extra-large";
}

const defaultSettings: DisplaySettings = {
  theme: "system",
  fontSize: "normal",
};

interface DisplayModeContextType {
  settings: DisplaySettings;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: DisplaySettings["fontSize"]) => void;
  updateSettings: (settings: Partial<DisplaySettings>) => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    const stored = localStorage.getItem("displaySettings");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old settings
      return {
        theme: parsed.theme || "system",
        fontSize: parsed.fontSize || "normal",
      };
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("displaySettings", JSON.stringify(settings));
    
    // Apply font size classes to document
    document.documentElement.classList.remove("font-normal", "font-large", "font-extra-large");
    document.documentElement.classList.add(`font-${settings.fontSize}`);
    
    // Apply theme
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (settings.theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (settings.theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [settings.theme]);

  const setTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setFontSize = (fontSize: DisplaySettings["fontSize"]) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <DisplayModeContext.Provider value={{ settings, setTheme, setFontSize, updateSettings }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const context = useContext(DisplayModeContext);
  if (!context) {
    throw new Error("useDisplayMode must be used within DisplayModeProvider");
  }
  return context;
}
