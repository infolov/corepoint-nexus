import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, Category, SubCategory } from "@/data/categories";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// Kategorie wyświetlane w głównym menu (bez "Wszystko")
const MAIN_NAV_CATEGORIES = CATEGORIES.filter(
  (cat) => cat.slug !== "all" && cat.subcategories.length > 0
);

// Kategorie priorytetowe (widoczne na desktop)
const PRIORITY_CATEGORIES = [
  "lokalne",
  "wiadomosci",
  "swiat",
  "biznes",
  "sport",
  "tech-nauka",
];

interface SubcategoryMenuProps {
  category: Category;
  onClose: () => void;
}

function SubcategoryMenu({ category, onClose }: SubcategoryMenuProps) {
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  return (
    <div className="grid gap-1 p-2 w-[280px] md:w-[400px]">
      <Link
        to={`/${category.slug}`}
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary hover:bg-accent rounded-md transition-colors"
      >
        {category.slug === "lokalne" && <MapPin className="h-4 w-4" />}
        Wszystkie z {category.name}
      </Link>
      <div className="h-px bg-border my-1" />
      <div className="grid md:grid-cols-2 gap-1">
        {category.subcategories.map((sub) => (
          <div key={sub.slug} className="relative">
            {sub.subcategories && sub.subcategories.length > 0 ? (
              <div
                className="group"
                onMouseEnter={() => setExpandedSub(sub.slug)}
                onMouseLeave={() => setExpandedSub(null)}
              >
                <button
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    expandedSub === sub.slug && "bg-accent"
                  )}
                >
                  <span>{sub.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                {expandedSub === sub.slug && (
                  <div className="absolute left-full top-0 ml-1 z-50 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[160px]">
                    <Link
                      to={`/${category.slug}/${sub.slug}`}
                      onClick={onClose}
                      className="block px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md"
                    >
                      Wszystkie
                    </Link>
                    <div className="h-px bg-border my-1" />
                    {sub.subcategories.map((subsub) => (
                      <Link
                        key={subsub.slug}
                        to={`/${category.slug}/${sub.slug}/${subsub.slug}`}
                        onClick={onClose}
                        className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                      >
                        {subsub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={`/${category.slug}/${sub.slug}`}
                onClick={onClose}
                className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                {sub.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MainNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (slug: string) => {
    return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`);
  };

  return (
    <nav className="w-full bg-background border-b border-border">
      <div className="container">
        <NavigationMenu className="max-w-none w-full justify-start">
          <NavigationMenuList className="flex-wrap gap-0">
            {/* Link do strony głównej */}
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink
                  className={cn(
                    "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground rounded-md",
                    currentPath === "/" && "bg-accent text-accent-foreground"
                  )}
                >
                  Start
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Priorytetowe kategorie z dropdownami */}
            {MAIN_NAV_CATEGORIES.filter((cat) =>
              PRIORITY_CATEGORIES.includes(cat.slug)
            ).map((category) => (
              <NavigationMenuItem key={category.slug}>
                <NavigationMenuTrigger
                  className={cn(
                    "px-3 py-2 text-sm font-medium",
                    isActive(category.slug) && "bg-accent text-accent-foreground"
                  )}
                >
                  {category.slug === "lokalne" && (
                    <MapPin className="h-4 w-4 mr-1" />
                  )}
                  {category.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <SubcategoryMenu category={category} onClose={() => {}} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}

            {/* Więcej - pozostałe kategorie */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="px-3 py-2 text-sm font-medium">
                Więcej
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-1 p-2 w-[320px] md:w-[500px]">
                  <div className="grid md:grid-cols-2 gap-2">
                    {MAIN_NAV_CATEGORIES.filter(
                      (cat) => !PRIORITY_CATEGORIES.includes(cat.slug)
                    ).map((category) => (
                      <div key={category.slug} className="space-y-1">
                        <Link
                          to={`/${category.slug}`}
                          className="block px-3 py-2 text-sm font-semibold hover:bg-accent rounded-md transition-colors"
                        >
                          {category.name}
                        </Link>
                        <div className="pl-3 space-y-0.5">
                          {category.subcategories.slice(0, 4).map((sub) => (
                            <Link
                              key={sub.slug}
                              to={`/${category.slug}/${sub.slug}`}
                              className="block px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          {category.subcategories.length > 4 && (
                            <Link
                              to={`/${category.slug}`}
                              className="block px-2 py-1 text-xs text-primary hover:underline"
                            >
                              + więcej...
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
