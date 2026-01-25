import { useState } from "react";
import { Cookie, Settings, Shield, BarChart3, Megaphone, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCookieConsent, CookiePreferences } from "@/hooks/use-cookie-consent";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const { 
    showBanner, 
    showSettings, 
    acceptAll, 
    rejectAll, 
    acceptSelected,
    openSettings,
    closeSettings 
  } = useCookieConsent();

  const [tempPrefs, setTempPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const handleSaveSettings = () => {
    acceptSelected(tempPrefs);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Main Banner */}
      {showBanner && !showSettings && (
        <div 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background border-t shadow-lg",
            "animate-in slide-in-from-bottom duration-300"
          )}
        >
          <div className="container max-w-6xl mx-auto p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              {/* Text content */}
              <div className="flex gap-3 flex-1">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    Ta strona używa plików cookies
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Używamy plików cookies, aby zapewnić najlepsze doświadczenia na naszej stronie. 
                    Cookies niezbędne są wymagane do działania strony. Możesz też wyrazić zgodę na 
                    cookies analityczne i marketingowe, które pomagają nam ulepszać nasze usługi.{" "}
                    <a href="/cookies" className="text-primary hover:underline">
                      Dowiedz się więcej
                    </a>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={openSettings}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Ustawienia
                </Button>
                <Button 
                  variant="outline" 
                  onClick={rejectAll}
                >
                  Odrzuć opcjonalne
                </Button>
                <Button 
                  onClick={acceptAll}
                  className="bg-primary hover:bg-primary/90"
                >
                  Akceptuj wszystkie
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={(open) => !open && closeSettings()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Ustawienia plików cookies
            </DialogTitle>
            <DialogDescription>
              Wybierz, jakie pliki cookies chcesz zaakceptować. Cookies niezbędne są 
              wymagane do prawidłowego działania strony i nie można ich wyłączyć.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <Label className="font-medium">Niezbędne</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wymagane do działania strony. Obejmują zapamiętywanie sesji, 
                    preferencji bezpieczeństwa i tego wyboru cookies.
                  </p>
                </div>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-primary" />
            </div>

            {/* Analytics cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
              <div className="flex gap-3">
                <BarChart3 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <Label className="font-medium">Analityczne</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony, 
                    co pozwala ją ulepszać.
                  </p>
                </div>
              </div>
              <Switch 
                checked={tempPrefs.analytics}
                onCheckedChange={(checked) => setTempPrefs(prev => ({ ...prev, analytics: checked }))}
              />
            </div>

            {/* Marketing cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
              <div className="flex gap-3">
                <Megaphone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <Label className="font-medium">Marketingowe</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Służą do wyświetlania spersonalizowanych reklam i mierzenia 
                    skuteczności kampanii reklamowych.
                  </p>
                </div>
              </div>
              <Switch 
                checked={tempPrefs.marketing}
                onCheckedChange={(checked) => setTempPrefs(prev => ({ ...prev, marketing: checked }))}
              />
            </div>

            {/* Preference cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
              <div className="flex gap-3">
                <Sliders className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <Label className="font-medium">Preferencje</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Zapamiętują Twoje ustawienia, takie jak język, region czy 
                    wygląd interfejsu.
                  </p>
                </div>
              </div>
              <Switch 
                checked={tempPrefs.preferences}
                onCheckedChange={(checked) => setTempPrefs(prev => ({ ...prev, preferences: checked }))}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={rejectAll}
              className="flex-1"
            >
              Odrzuć opcjonalne
            </Button>
            <Button 
              onClick={handleSaveSettings}
              className="flex-1"
            >
              Zapisz wybrane
            </Button>
            <Button 
              onClick={acceptAll}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Akceptuj wszystkie
            </Button>
          </div>

          {/* Privacy policy link */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Więcej informacji znajdziesz w naszej{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Polityce prywatności
            </a>{" "}
            oraz{" "}
            <a href="/cookies" className="text-primary hover:underline">
              Polityce cookies
            </a>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
