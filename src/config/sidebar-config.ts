import { 
  LayoutDashboard, 
  BarChart3, 
  Megaphone, 
  Calendar, 
  Target, 
  CreditCard, 
  FileEdit, 
  Users, 
  Building2, 
  UserCheck, 
  FileText, 
  FolderTree, 
  Shield, 
  LayoutGrid, 
  Settings, 
  Activity,
  Eye,
  type LucideIcon
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
  // Optional: restrict section visibility
  requireAdmin?: boolean;
  requirePublisher?: boolean;
}

export const sidebarConfig: NavSection[] = [
  {
    // Main dashboard items - no heading for primary section
    items: [
      { title: "Panel główny", href: "/dashboard", icon: LayoutDashboard },
      { title: "Statystyki", href: "/dashboard/stats", icon: BarChart3 },
      { title: "Moje Kampanie", href: "/dashboard/campaigns", icon: Megaphone },
      { title: "Kalendarz", href: "/dashboard/calendar", icon: Calendar },
      { title: "Podgląd reklam", href: "/dashboard/preview", icon: Eye },
    ]
  },
  {
    heading: "Zasoby",
    items: [
      { title: "Miejsca reklamowe", href: "/dashboard/placements", icon: Target },
      { title: "Kredyty i Płatności", href: "/dashboard/credits", icon: CreditCard },
    ]
  },
  {
    heading: "Wydawca",
    requirePublisher: true,
    items: [
      { title: "Panel Wydawcy", href: "/dashboard/publisher", icon: FileEdit },
    ]
  },
  {
    heading: "Administracja",
    requireAdmin: true,
    items: [
      {
        title: "Użytkownicy i Partnerzy",
        href: "#",
        icon: Users,
        children: [
          { title: "Lista użytkowników", href: "/dashboard/admin/users", icon: Users },
          { title: "Partnerzy", href: "/dashboard/admin/partners", icon: Building2 },
          { title: "Dziennikarze", href: "/dashboard/admin/journalists", icon: UserCheck },
          { title: "Zgłoszenia", href: "/dashboard/admin/applications", icon: FileText },
        ]
      },
      {
        title: "Zarządzanie Treścią",
        href: "#",
        icon: FolderTree,
        children: [
          { title: "Kategorie", href: "/dashboard/admin/categories", icon: FolderTree },
          { title: "Fact Check", href: "/dashboard/admin/factcheck", icon: Shield },
          { title: "Karuzele", href: "/dashboard/admin/carousels", icon: LayoutGrid },
        ]
      },
      {
        title: "System",
        href: "#",
        icon: Settings,
        children: [
          { title: "Kampanie (Global)", href: "/dashboard/admin/campaigns", icon: Megaphone },
          { title: "Miejsca (Global)", href: "/dashboard/admin/placements", icon: Target },
          { title: "Statystyki platformy", href: "/dashboard/admin/stats", icon: BarChart3 },
          { title: "Ustawienia", href: "/dashboard/admin/settings", icon: Settings },
          { title: "Logi", href: "/dashboard/admin/logs", icon: Activity },
        ]
      }
    ]
  }
];

// Helper function to check if a path is active (exact or starts with for nested routes)
export function isPathActive(currentPath: string, href: string): boolean {
  if (href === "/dashboard") {
    return currentPath === "/dashboard";
  }
  return currentPath === href || currentPath.startsWith(href + "/");
}

// Helper to check if any child is active
export function hasActiveChild(currentPath: string, item: NavItem): boolean {
  if (item.children) {
    return item.children.some(child => isPathActive(currentPath, child.href));
  }
  return false;
}

// Helper to get all hrefs from config for route matching
export function getAllHrefs(config: NavSection[]): string[] {
  const hrefs: string[] = [];
  
  config.forEach(section => {
    section.items.forEach(item => {
      if (item.href !== "#") {
        hrefs.push(item.href);
      }
      if (item.children) {
        item.children.forEach(child => {
          if (child.href !== "#") {
            hrefs.push(child.href);
          }
        });
      }
    });
  });
  
  return hrefs;
}
