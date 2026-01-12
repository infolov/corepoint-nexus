import { useState, useEffect, createContext, useContext } from "react";

type ThemeMode = "light" | "dark" | "system";

interface DisplaySettings {
  mode: "standard" | "compact" | "comfortable";
  fontSize: "normal" | "large" | "extra-large";
  dataSaver: boolean;
  theme: ThemeMode;
}

const defaultSettings: DisplaySettings = {
  mode: "standard",
  fontSize: "normal",
  dataSaver: false,
  theme: "system",
};

interface DisplayModeContextType {
  settings: DisplaySettings;
  setMode: (mode: DisplaySettings["mode"]) => void;
  setFontSize: (size: DisplaySettings["fontSize"]) => void;
  toggleDataSaver: () => void;
  updateSettings: (settings: Partial<DisplaySettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

// Apply theme to document - can be called before React renders
const applyThemeToDocument = (theme: ThemeMode) => {
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    return prefersDark;
  } else {
    document.documentElement.classList.toggle("dark", theme === "dark");
    return theme === "dark";
  }
};

// Initialize theme immediately on load (before React renders)
const initializeTheme = (): DisplaySettings => {
  const stored = localStorage.getItem("displaySettings");
  const settings = stored ? JSON.parse(stored) : defaultSettings;
  
  // Also check for legacy theme storage
  const legacyTheme = localStorage.getItem("theme") as ThemeMode | null;
  if (legacyTheme && !stored) {
    settings.theme = legacyTheme;
  }
  
  applyThemeToDocument(settings.theme);
  return settings;
};

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(initializeTheme);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches);
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem("displaySettings", JSON.stringify(settings));
    // Also save to legacy location for SettingsPanel compatibility
    localStorage.setItem("theme", settings.theme);
    
    // Apply font size classes to document
    document.documentElement.classList.remove("font-normal", "font-large", "font-extra-large");
    document.documentElement.classList.add(`font-${settings.fontSize}`);
    
    // Apply data saver class
    document.documentElement.classList.toggle("data-saver", settings.dataSaver);
    
    // Apply theme
    const dark = applyThemeToDocument(settings.theme);
    setIsDark(dark);
  }, [settings]);

  const setMode = (mode: DisplaySettings["mode"]) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  const setFontSize = (fontSize: DisplaySettings["fontSize"]) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const toggleDataSaver = () => {
    setSettings(prev => ({ ...prev, dataSaver: !prev.dataSaver }));
  };

  const setTheme = (theme: ThemeMode) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const toggleTheme = () => {
    setSettings(prev => {
      // Toggle between light and dark, or if system, switch to opposite of current
      let newTheme: ThemeMode;
      if (prev.theme === "system") {
        newTheme = isDark ? "light" : "dark";
      } else {
        newTheme = prev.theme === "dark" ? "light" : "dark";
      }
      return { ...prev, theme: newTheme };
    });
  };

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <DisplayModeContext.Provider value={{ 
      settings, 
      setMode, 
      setFontSize, 
      toggleDataSaver, 
      updateSettings,
      setTheme,
      toggleTheme,
      isDark 
    }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const context = useContext(DisplayModeContext);
  if (!context) {
    // Return default fallback instead of throwing - prevents crash during HMR
    return {
      settings: { mode: "standard" as const, fontSize: "normal" as const, dataSaver: false, theme: "system" as ThemeMode },
      setMode: () => {},
      setFontSize: () => {},
      toggleDataSaver: () => {},
      updateSettings: () => {},
      setTheme: () => {},
      toggleTheme: () => {},
      isDark: false,
    };
  }
  return context;
}
