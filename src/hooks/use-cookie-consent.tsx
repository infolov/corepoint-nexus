import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

export interface CookiePreferences {
  necessary: boolean; // Always true - required for site to function
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentContextType {
  hasConsent: boolean;
  preferences: CookiePreferences;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptSelected: (prefs: Partial<CookiePreferences>) => void;
  openSettings: () => void;
  closeSettings: () => void;
  showSettings: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_PREFERENCES_KEY = "cookie_preferences";

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}

// Helper to check if a specific cookie category is allowed
export function isCookieAllowed(category: keyof CookiePreferences): boolean {
  if (category === "necessary") return true;
  
  try {
    const stored = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (stored) {
      const prefs = JSON.parse(stored) as CookiePreferences;
      return prefs[category] ?? false;
    }
  } catch {
    // If we can't read preferences, assume no consent
  }
  return false;
}

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent === "true" && savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs) as CookiePreferences;
        setPreferences({ ...parsed, necessary: true });
        setHasConsent(true);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const safePrefs = { ...prefs, necessary: true };
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(safePrefs));
    setPreferences(safePrefs);
    setHasConsent(true);
    setShowBanner(false);
    setShowSettings(false);

    // If analytics/marketing rejected, clear any existing tracking cookies
    if (!safePrefs.analytics) {
      clearAnalyticsCookies();
    }
    if (!safePrefs.marketing) {
      clearMarketingCookies();
    }
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }, [savePreferences]);

  const rejectAll = useCallback(() => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }, [savePreferences]);

  const acceptSelected = useCallback((prefs: Partial<CookiePreferences>) => {
    savePreferences({
      necessary: true,
      analytics: prefs.analytics ?? false,
      marketing: prefs.marketing ?? false,
      preferences: prefs.preferences ?? false,
    });
  }, [savePreferences]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const value: CookieConsentContextType = {
    hasConsent,
    preferences,
    showBanner,
    acceptAll,
    rejectAll,
    acceptSelected,
    openSettings,
    closeSettings,
    showSettings,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

// Helper functions to clear cookies by category
function clearAnalyticsCookies() {
  // Clear common analytics cookies
  const analyticsCookies = ["_ga", "_gid", "_gat", "__utma", "__utmb", "__utmc", "__utmz"];
  analyticsCookies.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  });
}

function clearMarketingCookies() {
  // Clear common marketing/advertising cookies
  const marketingCookies = ["_fbp", "_fbc", "fr", "IDE", "DSID"];
  marketingCookies.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  });
}
