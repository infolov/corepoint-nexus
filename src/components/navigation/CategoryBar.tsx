import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CATEGORIES, Category, SubCategory } from "@/data/categories";
import { useNavigate } from "react-router-dom";

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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
    
    // Navigate to category page
    if (category.slug === "all") {
      navigate("/");
    } else if (category.slug === "lokalne") {
      navigate("/lokalne");
    } else {
      navigate(`/kategoria/${category.slug}`);
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
    
    // Navigate
    if (categorySlug === "lokalne") {
      navigate(`/lokalne?sub=${subcategorySlug}`);
    } else {
      navigate(`/kategoria/${fullSlug}`);
    }
  };

  const hasSubcategories = (category: Category) => 
    category.subcategories && category.subcategories.length > 0;

  const currentHoveredCategory = CATEGORIES.find(c => c.slug === hoveredCategory);

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
                    "flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    "hover:bg-muted focus:outline-none",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:text-foreground",
                    isHovered && !isActive && "bg-muted ring-2 ring-primary/30"
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
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 bg-gradient-to-l from-background via-background to-transparent"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* Dropdown Menu - appears on hover */}
      {!isMobile && currentHoveredCategory && hasSubcategories(currentHoveredCategory) && (
        <div 
          className="absolute left-0 right-0 z-50"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full px-2 sm:px-4 md:container">
            <div className="bg-popover border border-border rounded-lg shadow-xl mt-1 p-4 animate-in fade-in-0 zoom-in-95 duration-150">
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
                        <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg py-2 min-w-[180px] z-50 animate-in fade-in-0 zoom-in-95 duration-100">
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
        </div>
      )}
    </div>
  );
}
