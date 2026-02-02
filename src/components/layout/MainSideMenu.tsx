import { MapPin, Settings, Sun, Moon, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPanel } from "@/components/panels/UserPanel";
import { cn } from "@/lib/utils";

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

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  subtitle?: string | null;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

function SettingsRow({ icon, iconBgClass, label, subtitle, onClick, rightElement }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconBgClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {rightElement || (
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      )}
    </button>
  );
}

export function MainSideMenu({
  trigger,
  userSettings,
  isDark,
  toggleTheme,
  onSignOut,
  onSettingsClick,
}: MainSideMenuProps) {
  // Location display logic: prioritize city > county > voivodeship
  const getLocationLabel = () => {
    if (userSettings.city) return userSettings.city;
    if (userSettings.county) return userSettings.county;
    if (userSettings.voivodeship) return userSettings.voivodeship;
    return "Ustaw lokalizację";
  };

  const getLocationSubtitle = () => {
    const parts: string[] = [];
    if (userSettings.city && userSettings.county) {
      parts.push(`pow. ${userSettings.county}`);
    }
    if (userSettings.voivodeship && (userSettings.city || userSettings.county)) {
      parts.push(userSettings.voivodeship);
    }
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const hasLocation = userSettings.city || userSettings.county || userSettings.voivodeship;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-80 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-left text-lg font-semibold">
            Strefa użytkownika
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-4">
          {/* Hero Section - User Panel */}
          <div className="pb-4">
            <UserPanel onSignOut={onSignOut} onSettingsClick={onSettingsClick} />
          </div>

          <Separator className="my-2" />

          {/* Preferences Section */}
          <div className="py-2">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Preferencje
            </p>
            
            <div className="space-y-1">
              {/* Location */}
              <SettingsRow
                icon={<MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                label={getLocationLabel()}
                subtitle={getLocationSubtitle()}
                onClick={onSettingsClick}
              />

              {/* Account Settings */}
              <SettingsRow
                icon={<Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                iconBgClass="bg-gray-100 dark:bg-gray-800"
                label="Ustawienia konta"
                onClick={onSettingsClick}
              />

              {/* Theme Toggle */}
              <SettingsRow
                icon={
                  isDark 
                    ? <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> 
                    : <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                }
                iconBgClass={isDark ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-amber-100 dark:bg-amber-900/30"}
                label={isDark ? "Tryb ciemny" : "Tryb jasny"}
                subtitle="Zmień wygląd aplikacji"
                onClick={toggleTheme}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Footer - Logout */}
        <div className="p-4 border-t border-border bg-background">
          <Button 
            variant="outline" 
            className="w-full h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Wyloguj się
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
