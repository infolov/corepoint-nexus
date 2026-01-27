import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  CreditCard, 
  BarChart3, 
  Megaphone, 
  Settings, 
  LogOut,
  User,
  Shield,
  Users,
  LayoutGrid,
  Building2,
  Eye,
  Activity,
  FileText,
  UserCheck,
  FileEdit,
  FolderTree,
  ChevronDown,
  Briefcase,
  Wrench,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  name: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Dashboard - przegląd i metryki
const dashboardItems: NavItem[] = [
  { name: "Panel główny", href: "/dashboard", icon: LayoutDashboard },
  { name: "Statystyki kampanii", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Podgląd reklam", href: "/dashboard/preview", icon: Eye },
];

// Operacje - kampanie i rezerwacje
const operationsItems: NavItem[] = [
  { name: "Moje kampanie", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Kalendarz rezerwacji", href: "/dashboard/calendar", icon: Calendar },
  { name: "Miejsca reklamowe", href: "/dashboard/placements", icon: Target },
  { name: "Kredyty reklamowe", href: "/dashboard/credits", icon: CreditCard },
];

// Wydawca
const publisherItems: NavItem[] = [
  { name: "Panel Wydawcy", href: "/dashboard/publisher", icon: FileEdit },
];

// Admin - Zarządzanie treścią
const adminContentItems: NavItem[] = [
  { name: "Kategorie i źródła", href: "/dashboard/admin/categories", icon: FolderTree },
  { name: "Weryfikacja Faktów", href: "/dashboard/admin/factcheck", icon: Shield },
  { name: "Karuzele banerów", href: "/dashboard/admin/carousels", icon: LayoutGrid },
];

// Admin - Zarządzanie użytkownikami
const adminUsersItems: NavItem[] = [
  { name: "Użytkownicy", href: "/dashboard/admin/users", icon: Users },
  { name: "Partnerzy", href: "/dashboard/admin/partners", icon: Building2 },
  { name: "Zgłoszenia partnerskie", href: "/dashboard/admin/applications", icon: FileText },
  { name: "Dziennikarze", href: "/dashboard/admin/journalists", icon: UserCheck },
];

// Admin - Kampanie i reklamy
const adminCampaignsItems: NavItem[] = [
  { name: "Zarządzanie kampaniami", href: "/dashboard/admin/campaigns", icon: Megaphone },
  { name: "Zarządzanie miejscami", href: "/dashboard/admin/placements", icon: Target },
  { name: "Statystyki platformy", href: "/dashboard/admin/stats", icon: BarChart3 },
];

// Admin - Ustawienia systemu
const adminSettingsItems: NavItem[] = [
  { name: "Ustawienia globalne", href: "/dashboard/admin/settings", icon: Settings },
  { name: "Logi aktywności", href: "/dashboard/admin/logs", icon: Activity },
];

interface DashboardSidebarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  isAdmin: boolean;
  isPublisher: boolean;
  isDemoMode: boolean;
  onSignOut: () => void;
  onClose?: () => void;
}

export function DashboardSidebar({
  user,
  isAdmin,
  isPublisher,
  isDemoMode,
  onSignOut,
  onClose,
}: DashboardSidebarProps) {
  const location = useLocation();
  
  // Sprawdź która grupa powinna być otwarta na podstawie aktualnej ścieżki
  const getInitialOpenGroups = () => {
    const path = location.pathname;
    const openGroups: Record<string, boolean> = {};
    
    if (dashboardItems.some(item => item.href === path)) {
      openGroups.dashboard = true;
    }
    if (operationsItems.some(item => item.href === path)) {
      openGroups.operations = true;
    }
    if (publisherItems.some(item => item.href === path)) {
      openGroups.publisher = true;
    }
    if (adminContentItems.some(item => item.href === path)) {
      openGroups.adminContent = true;
    }
    if (adminUsersItems.some(item => item.href === path)) {
      openGroups.adminUsers = true;
    }
    if (adminCampaignsItems.some(item => item.href === path)) {
      openGroups.adminCampaigns = true;
    }
    if (adminSettingsItems.some(item => item.href === path)) {
      openGroups.adminSettings = true;
    }
    
    // Domyślnie otwórz Dashboard jeśli nic nie pasuje
    if (Object.keys(openGroups).length === 0) {
      openGroups.dashboard = true;
    }
    
    return openGroups;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const isActive = (href: string) => location.pathname === href;

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-6",
          active 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  const renderNavGroup = (
    groupKey: string,
    label: string,
    icon: LucideIcon,
    items: NavItem[],
    className?: string
  ) => {
    const Icon = icon;
    const isOpen = openGroups[groupKey] ?? false;
    const hasActiveItem = items.some(item => isActive(item.href));
    
    return (
      <Collapsible
        key={groupKey}
        open={isOpen}
        onOpenChange={() => toggleGroup(groupKey)}
        className={className}
      >
        <CollapsibleTrigger className={cn(
          "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          hasActiveItem && !isOpen
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        )}>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            {label}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {items.map(renderNavItem)}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Logo size="md" />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            isDemoMode ? "bg-amber-500/10" : "bg-primary/10"
          )}>
            <User className={cn("h-5 w-5", isDemoMode ? "text-amber-500" : "text-primary")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name || "Użytkownik"}
              </p>
              {isDemoMode && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {/* Dashboard Group */}
          {renderNavGroup("dashboard", "Dashboard", LayoutDashboard, dashboardItems)}
          
          {/* Operations Group */}
          {renderNavGroup("operations", "Kampanie", Briefcase, operationsItems)}

          {/* Publisher Section */}
          {(isPublisher || isAdmin) && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Wydawca
                </p>
              </div>
              {renderNavGroup("publisher", "Publikacje", FileEdit, publisherItems)}
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administracja
                </p>
              </div>
              
              {renderNavGroup("adminContent", "Treści", FolderTree, adminContentItems)}
              {renderNavGroup("adminUsers", "Użytkownicy", Users, adminUsersItems)}
              {renderNavGroup("adminCampaigns", "Reklamy", Megaphone, adminCampaignsItems)}
              {renderNavGroup("adminSettings", "System", Wrench, adminSettingsItems)}
            </>
          )}

          {/* Settings - zawsze widoczne jako pojedynczy link */}
          <div className="pt-3">
            <Link
              to="/dashboard/settings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive("/dashboard/settings")
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Settings className="h-5 w-5" />
              Ustawienia konta
            </Link>
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Wyloguj się
        </Button>
      </div>
    </div>
  );
}
