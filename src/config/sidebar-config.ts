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
  Heart,
  Bookmark,
  History,
  Bell,
  BookOpen,
  type LucideIcon
} from "lucide-react";
import { UserRole } from "@/hooks/use-user-role";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

// Configuration for each role's sidebar
export type RoleSidebarConfig = Record<UserRole, NavSection[]>;

// User dashboard sidebar
const userSidebarConfig: NavSection[] = [
  {
    items: [
      { title: "Panel główny", href: "/dashboard/user", icon: LayoutDashboard },
      { title: "Zainteresowania", href: "/interests", icon: Heart },
      { title: "Zapisane", href: "/zapisane", icon: Bookmark },
      { title: "Historia", href: "/historia", icon: History },
      { title: "Powiadomienia", href: "/notifications/settings", icon: Bell },
    ]
  },
  {
    heading: "Konto",
    items: [
      { title: "Ustawienia", href: "/dashboard/user/settings", icon: Settings },
      { title: "Zostań partnerem", href: "/dashboard/user/partner-application", icon: Building2 },
    ]
  }
];

// Partner dashboard sidebar
const partnerSidebarConfig: NavSection[] = [
  {
    items: [
      { title: "Panel główny", href: "/dashboard/partner", icon: LayoutDashboard },
      { title: "Statystyki", href: "/dashboard/partner/stats", icon: BarChart3 },
      { title: "Moje Kampanie", href: "/dashboard/partner/campaigns", icon: Megaphone },
      { title: "Kalendarz", href: "/dashboard/partner/calendar", icon: Calendar },
      { title: "Podgląd reklam", href: "/dashboard/partner/preview", icon: Eye },
    ]
  },
  {
    heading: "Zasoby",
    items: [
      { title: "Artykuł sponsorowany", href: "/dashboard/partner/sponsored-article", icon: FileEdit },
      { title: "Miejsca reklamowe", href: "/dashboard/partner/placements", icon: Target },
      { title: "Kredyty i Płatności", href: "/dashboard/partner/credits", icon: CreditCard },
    ]
  },
  {
    heading: "Konto",
    items: [
      { title: "Ustawienia", href: "/dashboard/partner/settings", icon: Settings },
    ]
  }
];

// Publisher dashboard sidebar
const publisherSidebarConfig: NavSection[] = [
  {
    items: [
      { title: "Panel główny", href: "/dashboard/publisher", icon: LayoutDashboard },
      { title: "Moje artykuły", href: "/dashboard/publisher/articles", icon: BookOpen },
      { title: "Nowy artykuł", href: "/dashboard/publisher/articles/new", icon: FileEdit },
      { title: "Statystyki", href: "/dashboard/publisher/stats", icon: BarChart3 },
    ]
  },
  {
    heading: "Zasoby",
    items: [
      { title: "Dziennikarze", href: "/dashboard/publisher/journalists", icon: UserCheck },
    ]
  },
  {
    heading: "Konto",
    items: [
      { title: "Ustawienia", href: "/dashboard/publisher/settings", icon: Settings },
    ]
  }
];

// Admin dashboard sidebar
const adminSidebarConfig: NavSection[] = [
  {
    items: [
      { title: "Panel główny", href: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Statystyki platformy", href: "/dashboard/admin/stats", icon: BarChart3 },
    ]
  },
  {
    heading: "Użytkownicy i Partnerzy",
    items: [
      { title: "Lista użytkowników", href: "/dashboard/admin/users", icon: Users },
      { title: "Partnerzy", href: "/dashboard/admin/partners", icon: Building2 },
      { title: "Dziennikarze", href: "/dashboard/admin/journalists", icon: UserCheck },
      { title: "Zgłoszenia", href: "/dashboard/admin/applications", icon: FileText },
    ]
  },
  {
    heading: "Zarządzanie treścią",
    items: [
      { title: "Weryfikacja artykułów", href: "/dashboard/admin/article-review", icon: FileText },
      { title: "Kategorie", href: "/dashboard/admin/categories", icon: FolderTree },
      { title: "Fact Check", href: "/dashboard/admin/factcheck", icon: Shield },
      { title: "Karuzele", href: "/dashboard/admin/carousels", icon: LayoutGrid },
    ]
  },
  {
    heading: "System",
    items: [
      { title: "Kampanie (Global)", href: "/dashboard/admin/campaigns", icon: Megaphone },
      { title: "Miejsca (Global)", href: "/dashboard/admin/placements", icon: Target },
      { title: "Ustawienia", href: "/dashboard/admin/settings", icon: Settings },
      { title: "Logi", href: "/dashboard/admin/logs", icon: Activity },
    ]
  }
];

// Export the configuration for each role
export const roleSidebarConfigs: RoleSidebarConfig = {
  user: userSidebarConfig,
  partner: partnerSidebarConfig,
  publisher: publisherSidebarConfig,
  admin: adminSidebarConfig,
};

// Get sidebar config for a specific role
export function getSidebarConfigForRole(role: UserRole): NavSection[] {
  return roleSidebarConfigs[role] || userSidebarConfig;
}

// Helper function to check if a path is active (exact or starts with for nested routes)
export function isPathActive(currentPath: string, href: string): boolean {
  // Handle external links to main site
  if (!href.startsWith("/dashboard")) {
    return currentPath === href;
  }
  
  // For dashboard routes, check exact match or prefix match
  const basePath = href.split("/").slice(0, 4).join("/"); // e.g., /dashboard/partner
  if (href === basePath) {
    return currentPath === href;
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
