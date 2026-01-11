import { useState, useEffect, createContext, useContext } from "react";

interface DisplaySettings {
  mode: "standard" | "compact" | "comfortable";
  fontSize: "normal" | "large" | "extra-large";
  dataSaver: boolean;
}

const defaultSettings: DisplaySettings = {
  mode: "standard",
  fontSize: "normal",
  dataSaver: false,
};

interface DisplayModeContextType {
  settings: DisplaySettings;
  setMode: (mode: DisplaySettings["mode"]) => void;
  setFontSize: (size: DisplaySettings["fontSize"]) => void;
  toggleDataSaver: () => void;
  updateSettings: (settings: Partial<DisplaySettings>) => void;
}

const DisplayModeContext = createContext<DisplayModeContextType | null>(null);

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    const stored = localStorage.getItem("displaySettings");
    return stored ? JSON.parse(stored) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("displaySettings", JSON.stringify(settings));
    
    // Apply font size classes to document
    document.documentElement.classList.remove("font-normal", "font-large", "font-extra-large");
    document.documentElement.classList.add(`font-${settings.fontSize}`);
    
    // Apply data saver class
    document.documentElement.classList.toggle("data-saver", settings.dataSaver);
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

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <DisplayModeContext.Provider value={{ settings, setMode, setFontSize, toggleDataSaver, updateSettings }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  const context = useContext(DisplayModeContext);
  if (!context) {
    // Return default fallback instead of throwing - prevents crash during HMR
    return {
      settings: { mode: "standard" as const, fontSize: "normal" as const, dataSaver: false },
      setMode: () => {},
      setFontSize: () => {},
      toggleDataSaver: () => {},
      updateSettings: () => {},
    };
  }
  return context;
}
