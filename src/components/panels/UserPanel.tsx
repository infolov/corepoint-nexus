import { Link } from "react-router-dom";
import { User, LayoutDashboard, LogOut, Settings, Bell, Bookmark, History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface UserPanelProps {
  onSignOut: () => void;
  onSettingsClick: () => void;
  className?: string;
}

export function UserPanel({ onSignOut, onSettingsClick, className }: UserPanelProps) {
  const { user } = useAuth();

  if (user) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* User info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="w-12 h-12 rounded-full bg-hero-gradient flex items-center justify-center shadow-lg">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate text-senior">
              {user.user_metadata?.full_name || "Użytkownik"}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/dashboard">
            <Button variant="gradient" className="w-full h-12 text-senior">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Panel
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-12 text-senior" onClick={onSignOut}>
            <LogOut className="h-5 w-5 mr-2" />
            Wyloguj
          </Button>
        </div>

        {/* User links */}
        <div className="space-y-1">
          <Link 
            to="/powiadomienia" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-senior font-medium">Powiadomienia</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link 
            to="/zapisane" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Bookmark className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-senior font-medium">Zapisane</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link 
            to="/historia" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-senior font-medium">Historia</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <button 
            onClick={onSettingsClick}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-senior font-medium">Ustawienia</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated user panel
  return (
    <div className={cn("space-y-4", className)}>
      {/* Welcome message */}
      <div className="text-center p-4 rounded-xl bg-muted/30">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground text-senior mb-1">Witaj!</h3>
        <p className="text-sm text-muted-foreground">
          Zaloguj się, aby personalizować treści i zarządzać reklamami
        </p>
      </div>

      {/* Auth buttons */}
      <div className="space-y-2">
        <Link to="/login" className="block">
          <Button variant="gradient" className="w-full h-12 text-senior">
            <User className="h-5 w-5 mr-2" />
            Zaloguj się
          </Button>
        </Link>
        <Link to="/login?register=true" className="block">
          <Button variant="outline" className="w-full h-12 text-senior">
            Zarejestruj się
          </Button>
        </Link>
      </div>

      {/* Benefits */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Korzyści z konta:</strong> Personalizowane wiadomości, 
          powiadomienia, panel reklamodawcy, historia przeglądania.
        </p>
      </div>
    </div>
  );
}
