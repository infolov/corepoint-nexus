import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LogOut,
  User,
  Settings,
  ChevronDown
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
import { 
  getSidebarConfigForRole, 
  isPathActive, 
  hasActiveChild,
  type NavItem,
  type NavSection 
} from "@/config/sidebar-config";
import { useUserRole, UserRole } from "@/hooks/use-user-role";

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
  const currentPath = location.pathname;
  const { getPrimaryRole } = useUserRole();
  
  // Get the primary role and corresponding sidebar config
  const primaryRole = getPrimaryRole();
  const sidebarConfig = getSidebarConfigForRole(primaryRole);

  // Calculate which groups should be initially open based on current path
  const initialOpenGroups = useMemo(() => {
    const openGroups: Record<string, boolean> = {};
    
    sidebarConfig.forEach(section => {
      section.items.forEach(item => {
        if (item.children && hasActiveChild(currentPath, item)) {
          openGroups[item.title] = true;
        }
      });
    });
    
    return openGroups;
  }, [currentPath, sidebarConfig]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpenGroups);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Get role label for display
  const getRoleLabel = () => {
    switch (primaryRole) {
      case "admin": return "Administrator";
      case "publisher": return "Wydawca";
      case "partner": return "Partner";
      default: return "Użytkownik";
    }
  };

  // Render a single nav item (leaf node)
  const renderNavLink = (item: NavItem, isChild = false) => {
    const active = isPathActive(currentPath, item.href);
    const Icon = item.icon;
    
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isChild && "ml-6",
          active 
            ? "bg-primary text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    );
  };

  // Render a collapsible group with children
  const renderCollapsibleItem = (item: NavItem) => {
    const Icon = item.icon;
    const isOpen = openGroups[item.title] ?? false;
    const hasActive = hasActiveChild(currentPath, item);
    
    return (
      <Collapsible
        key={item.title}
        open={isOpen}
        onOpenChange={() => toggleGroup(item.title)}
      >
        <CollapsibleTrigger className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
          hasActive && !isOpen
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}>
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.title}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {item.children?.map(child => renderNavLink(child, true))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Render a nav item (either simple link or collapsible)
  const renderNavItem = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      return renderCollapsibleItem(item);
    }
    return renderNavLink(item);
  };

  // Render a section with optional heading
  const renderSection = (section: NavSection, index: number) => {
    return (
      <div key={section.heading || `section-${index}`} className={cn(index > 0 && "pt-4")}>
        {section.heading && (
          <div className="px-3 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.heading}
            </p>
          </div>
        )}
        <div className="space-y-1">
          {section.items.map(renderNavItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Logo size="md" />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
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
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded flex-shrink-0">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-primary font-medium">{getRoleLabel()}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-1">
          {sidebarConfig.map((section, index) => renderSection(section, index))}
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
