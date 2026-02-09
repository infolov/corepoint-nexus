import { Link } from "react-router-dom";
import { User, LayoutDashboard, LogOut, Settings, Bookmark, History, ChevronRight, Heart, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { cn } from "@/lib/utils";
import { ContentRatioSlider } from "@/components/settings/ContentRatioSlider";
import { InlineAuthForm } from "@/components/panels/InlineAuthForm";

interface UserPanelProps {
  onSignOut: () => void;
  onSettingsClick: () => void;
  className?: string;
}

export function UserPanel({ onSignOut, onSettingsClick, className }: UserPanelProps) {
  const { user } = useAuth();
  const { isAdmin, isPartner, isPublisher, getDashboardPath, loading: roleLoading } = useUserRole();

  if (user) {
    // Determine role label
    const getRoleLabel = () => {
      if (isAdmin) return "Administrator";
      if (isPublisher) return "Wydawca";
      if (isPartner) return "Partner";
      return "Użytkownik";
    };

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
            {!roleLoading && (
              <p className="text-xs text-primary font-medium">{getRoleLabel()}</p>
            )}
          </div>
        </div>

        {/* Quick actions - Dashboard link for all logged in users */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={getDashboardPath()}>
            <Button variant="gradient" className="w-full h-12 text-senior text-white [&_svg]:text-white">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Panel
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-12 text-senior" onClick={onSignOut}>
            <LogOut className="h-5 w-5 mr-2" />
            Wyloguj
          </Button>
        </div>

        {/* Preferences section with content ratio */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Preferencje feedu</h3>
          </div>
          <ContentRatioSlider />
        </div>

        {/* User links */}
        <div className="space-y-1">
          {/* HIDDEN: interests feature disabled
          <Link 
            to="/interests" 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-senior font-medium">Zainteresowania</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          */}
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

  // Unauthenticated user panel — inline auth form
  return (
    <div className={cn("space-y-4", className)}>
      <InlineAuthForm />

      {/* Benefits */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Korzyści z konta:</strong> Personalizowane wiadomości, 
          powiadomienia, zapisane artykuły, historia przeglądania.
        </p>
      </div>
    </div>
  );
}
