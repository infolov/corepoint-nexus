import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigationCategories } from "@/hooks/use-navigation-categories";
import { Category, SubCategory } from "@/data/categories";
import { useNavigate } from "react-router-dom";

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { categories: CATEGORIES } = useNavigationCategories();

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

  // Update dropdown position when hovered category changes
  useEffect(() => {
    if (containerRef.current && hoveredCategory) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [hoveredCategory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) clearTimeout(closeTimeout);
    };
  }, [closeTimeout]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseEnter = useCallback((categorySlug: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setHoveredCategory(categorySlug);
  }, [closeTimeout]);

  const handleMouseLeave = useCallback(() => {
    const timeout = setTimeout(() => {
      setHoveredCategory(null);
      setHoveredSubcategory(null);
    }, 150);
    setCloseTimeout(timeout);
  }, []);

  const handleDropdownMouseEnter = useCallback(() => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  }, [closeTimeout]);

  const handleCategoryClick = (category: Category) => {
    onCategoryChange?.(category.slug);
    setHoveredCategory(null);
    setHoveredSubcategory(null);
    
    // Navigate to category page - use correct route format
    if (category.slug === "all") {
      navigate("/");
    } else if (category.slug === "lokalne") {
      navigate("/lokalne");
    } else {
      navigate(`/${category.slug}`);
    }
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug: string, subSubSlug?: string) => {
    let fullSlug = `${categorySlug}/${subcategorySlug}`;
    if (subSubSlug) {
      fullSlug = `${categorySlug}/${subcategorySlug}/${subSubSlug}`;
    }
    
    onCategoryChange?.(fullSlug);
    setHoveredCategory(null);
    setHoveredSubcategory(null);
    
    // Navigate - use correct route format
    if (categorySlug === "lokalne") {
      navigate(`/lokalne?sub=${subcategorySlug}`);
    } else if (categorySlug === "sport") {
      navigate(`/sport/${subcategorySlug}`);
    } else {
      // For other categories, pass subcategory as query param
      navigate(`/${categorySlug}?sub=${subcategorySlug}${subSubSlug ? `&subsub=${subSubSlug}` : ''}`);
    }
  };

  const hasSubcategories = (category: Category) => 
    category.subcategories && category.subcategories.length > 0;
  const currentHoveredCategory = CATEGORIES.find((c: Category) => c.slug === hoveredCategory);

  const dropdownContent = !isMobile && currentHoveredCategory && hasSubcategories(currentHoveredCategory) && (
    <div 
      className="fixed z-[9999]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      onMouseEnter={handleDropdownMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-popover border border-border rounded-lg shadow-xl mt-1 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-150 mx-2 sm:mx-4">
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          {currentHoveredCategory.subcategories.map((sub: SubCategory) => {
            const hasSubSubs = sub.subcategories && sub.subcategories.length > 0;
            const isSubHovered = hoveredSubcategory === sub.slug;
            
            return (
              <div 
                key={sub.slug}
                className="relative"
                onMouseEnter={() => hasSubSubs && setHoveredSubcategory(sub.slug)}
                onMouseLeave={() => setHoveredSubcategory(null)}
              >
                <button
                  onClick={() => handleSubcategoryClick(currentHoveredCategory.slug, sub.slug)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-muted hover:text-primary",
                    isSubHovered && "bg-muted text-primary"
                  )}
                >
                  {sub.name}
                  {hasSubSubs && (
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      isSubHovered && "rotate-180"
                    )} />
                  )}
                </button>
                
                {/* Sub-subcategories dropdown */}
                {hasSubSubs && isSubHovered && (
                  <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg py-2 min-w-[180px] z-[10000] animate-in fade-in-0 zoom-in-95 duration-100">
                    {sub.subcategories!.map((subsub) => (
                      <button
                        key={subsub.slug}
                        onClick={() => handleSubcategoryClick(currentHoveredCategory.slug, sub.slug, subsub.slug)}
                        className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {subsub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div 
        ref={containerRef}
        className="sticky top-12 sm:top-14 md:top-16 z-40 bg-nav/95 backdrop-blur-md border-b border-nav-foreground/10 w-full"
      >
        <div className="w-full px-2 sm:px-4 md:container relative">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-r from-nav via-nav to-transparent"
            >
              <ChevronLeft className="h-5 w-5 text-nav-foreground/60 hover:text-nav-foreground transition-colors" />
            </button>
          )}

          {/* Scrollable Categories */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide py-1.5 sm:py-2 px-6 sm:px-8"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            {CATEGORIES.map((category) => {
              const hasSubs = hasSubcategories(category) && !isMobile;
              const isActive = activeCategory === category.slug || activeCategory.startsWith(category.slug + "/");
              const isHovered = hoveredCategory === category.slug;
              
              return (
                <div
                  key={category.slug}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => hasSubs && handleMouseEnter(category.slug)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                      "hover:bg-nav-foreground/10 focus:outline-none",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-nav-foreground/80 hover:text-nav-foreground",
                      isHovered && !isActive && "bg-nav-foreground/10 ring-2 ring-primary/30"
                    )}
                  >
                    {category.name}
                    {hasSubs && (
                      <ChevronDown className={cn(
                        "h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200",
                        isHovered && "rotate-180"
                      )} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-l from-nav via-nav to-transparent"
            >
              <ChevronRight className="h-5 w-5 text-nav-foreground/60 hover:text-nav-foreground transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu - rendered via portal to escape overflow:hidden */}
      {typeof document !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}
