import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, Category, SubCategory } from "@/data/categories";

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

interface NavItemProps {
  category: Category;
  isActive: boolean;
}

function NavItem({ category, isActive }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground",
          isOpen && "bg-accent/50"
        )}
      >
        {category.slug === "lokalne" && <MapPin className="h-4 w-4 mr-1" />}
        {category.name}
        <ChevronDown
          className={cn(
            "ml-1 h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown - positioned directly below the trigger */}
      {isOpen && category.subcategories.length > 0 && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            <SubcategoryMenu category={category} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MoreMenuItem() {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const otherCategories = MAIN_NAV_CATEGORIES.filter(
    (cat) => !PRIORITY_CATEGORIES.includes(cat.slug)
  );

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isOpen && "bg-accent/50"
        )}
      >
        Więcej
        <ChevronDown
          className={cn(
            "ml-1 h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 p-2 w-[320px] md:w-[500px]">
            <div className="grid md:grid-cols-2 gap-2">
              {otherCategories.map((category) => (
                <div key={category.slug} className="space-y-1">
                  <Link
                    to={`/${category.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-semibold hover:bg-accent rounded-md transition-colors"
                  >
                    {category.name}
                  </Link>
                  <div className="pl-3 space-y-0.5">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/${category.slug}/${sub.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                    {category.subcategories.length > 4 && (
                      <Link
                        to={`/${category.slug}`}
                        onClick={() => setIsOpen(false)}
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
        </div>
      )}
    </div>
  );
}

export function MainNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (slug: string) => {
    return currentPath === `/${slug}` || currentPath.startsWith(`/${slug}/`);
  };

  const priorityCategories = MAIN_NAV_CATEGORIES.filter((cat) =>
    PRIORITY_CATEGORIES.includes(cat.slug)
  );

  return (
    <nav className="w-full bg-background border-b border-border overflow-hidden">
      <div className="container">
        <div 
          className="flex items-center gap-1 py-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Link do strony głównej */}
          <Link
            to="/"
            className={cn(
              "inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0",
              "hover:bg-accent hover:text-accent-foreground",
              currentPath === "/" && "bg-accent text-accent-foreground"
            )}
          >
            Wszystko
          </Link>

          {/* Priorytetowe kategorie z dropdownami */}
          {priorityCategories.map((category) => (
            <div key={category.slug} className="flex-shrink-0">
              <NavItem
                category={category}
                isActive={isActive(category.slug)}
              />
            </div>
          ))}

          {/* Więcej - pozostałe kategorie */}
          <div className="flex-shrink-0">
            <MoreMenuItem />
          </div>
        </div>
      </div>
    </nav>
  );
}