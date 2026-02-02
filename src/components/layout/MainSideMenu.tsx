import { Link } from "react-router-dom";
import { Sun, Moon, Settings, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserPanel } from "@/components/panels/UserPanel";

interface MainSideMenuProps {
  trigger: React.ReactNode;
  userSettings: {
    city?: string | null;
    county?: string | null;
    voivodeship?: string | null;
  };
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
  onSettingsClick: () => void;
}

export function MainSideMenu({
  trigger,
  userSettings,
  isDark,
  toggleTheme,
  onSignOut,
  onSettingsClick,
}: MainSideMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left text-senior">Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          {/* Location section */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Twoja lokalizacja</h3>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {userSettings.city || userSettings.county || userSettings.voivodeship ? (
                  <>
                    <p className="text-sm font-medium text-foreground truncate">
                      {userSettings.city || userSettings.county || userSettings.voivodeship}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        userSettings.county && userSettings.city ? `pow. ${userSettings.county}` : null,
                        userSettings.voivodeship
                      ].filter(Boolean).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nie ustawiono lokalizacji</p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-shrink-0 text-xs"
                onClick={onSettingsClick}
              >
                Zmień
              </Button>
            </div>
          </div>

          {/* User Panel */}
          <div className="border-b border-border pb-4">
            <UserPanel onSignOut={onSignOut} onSettingsClick={onSettingsClick} />
          </div>

          {/* Personalization section */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Wyświetlanie</h3>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-start text-senior-sm" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5 mr-2" /> : <Moon className="h-5 w-5 mr-2" />}
                {isDark ? "Tryb jasny" : "Tryb ciemny"}
              </Button>
              <Button variant="ghost" className="w-full justify-start text-senior-sm" onClick={onSettingsClick}>
                <Settings className="h-5 w-5 mr-2" />
                Ustawienia
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
