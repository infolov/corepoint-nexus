import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CATEGORIES, Category, SubCategory } from "@/data/categories";

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryClick = (category: Category) => {
    onCategoryChange?.(category.slug);
    setExpandedCategory(null);
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleCategoryHover = (categorySlug: string | null) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    if (categorySlug) {
      setExpandedCategory(categorySlug);
    } else {
      const timeout = setTimeout(() => {
        setExpandedCategory(null);
        setExpandedSubcategory(null);
      }, 150);
      setHoverTimeout(timeout);
    }
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug?: string, subSubSlug?: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (subSubSlug && subcategorySlug) {
      onCategoryChange?.(`${categorySlug}/${subcategorySlug}/${subSubSlug}`);
    } else if (subcategorySlug) {
      onCategoryChange?.(`${categorySlug}/${subcategorySlug}`);
    } else {
      onCategoryChange?.(categorySlug);
    }
    setExpandedCategory(null);
    setExpandedSubcategory(null);
  };

  const currentExpandedCategory = CATEGORIES.find(c => c.slug === expandedCategory);

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 w-full overflow-hidden">
      <div className="w-full px-2 sm:px-4 md:container relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-r from-background via-background to-transparent"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}

        {/* Scrollable Categories */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide py-2 px-6 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {CATEGORIES.map((category) => (
            <div 
              key={category.slug}
              className="relative flex-shrink-0"
              onMouseEnter={() => category.subcategories.length > 0 && handleCategoryHover(category.slug)}
              onMouseLeave={() => handleCategoryHover(null)}
            >
              <button
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  "hover:bg-muted",
                  activeCategory === category.slug
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground",
                  expandedCategory === category.slug && "bg-muted ring-2 ring-primary/30"
                )}
              >
                {category.name}
                {category.subcategories.length > 0 && !isMobile && (
                  <ChevronDown className={cn(
                    "h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200",
                    expandedCategory === category.slug && "rotate-180"
                  )} />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-l from-background via-background to-transparent"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Subcategories panel - expands below - hidden on mobile */}
      {!isMobile && currentExpandedCategory && currentExpandedCategory.subcategories.length > 0 && (
        <div 
          className="border-t border-border/50 bg-muted/30 animate-slide-down"
          onMouseEnter={() => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            setExpandedCategory(currentExpandedCategory.slug);
          }}
          onMouseLeave={() => handleCategoryHover(null)}
        >
          <div className="w-full px-2 sm:px-4 md:container py-4 sm:py-6">
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              {currentExpandedCategory.subcategories.map((sub: SubCategory) => (
                <div 
                  key={sub.slug} 
                  className="relative"
                  onMouseEnter={() => sub.subcategories && sub.subcategories.length > 0 && setExpandedSubcategory(sub.slug)}
                  onMouseLeave={() => setExpandedSubcategory(null)}
                >
                  <button
                    onClick={() => handleSubcategoryClick(currentExpandedCategory.slug, sub.slug)}
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium transition-colors",
                      "hover:text-primary",
                      expandedSubcategory === sub.slug ? "text-primary" : "text-foreground"
                    )}
                  >
                    {sub.name}
                    {sub.subcategories && sub.subcategories.length > 0 && (
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expandedSubcategory === sub.slug && "rotate-180"
                      )} />
                    )}
                  </button>
                  
                  {/* Sub-subcategories dropdown */}
                  {sub.subcategories && sub.subcategories.length > 0 && expandedSubcategory === sub.slug && (
                    <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                      {sub.subcategories.map((subsub) => (
                        <button
                          key={subsub.slug}
                          onClick={() => handleSubcategoryClick(currentExpandedCategory.slug, sub.slug, subsub.slug)}
                          className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {subsub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
