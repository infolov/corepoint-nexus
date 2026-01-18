import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CATEGORIES, Category, SubCategory } from "@/data/categories";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryBarProps {
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryBar({ activeCategory = "all", onCategoryChange }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
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
    setOpenDropdown(null);
    
    // Navigate to category page
    if (category.slug === "all") {
      navigate("/");
    } else if (category.slug === "lokalne") {
      navigate("/lokalne");
    } else {
      navigate(`/kategoria/${category.slug}`);
    }
  };

  const handleSubcategoryClick = (categorySlug: string, subcategorySlug?: string, subSubSlug?: string) => {
    let fullSlug = categorySlug;
    if (subcategorySlug) {
      fullSlug = `${categorySlug}/${subcategorySlug}`;
    }
    if (subSubSlug) {
      fullSlug = `${categorySlug}/${subcategorySlug}/${subSubSlug}`;
    }
    
    onCategoryChange?.(fullSlug);
    setOpenDropdown(null);
    
    // Navigate
    if (categorySlug === "lokalne") {
      navigate(`/lokalne?sub=${subcategorySlug || ""}`);
    } else {
      navigate(`/kategoria/${fullSlug}`);
    }
  };

  const hasSubcategories = (category: Category) => 
    category.subcategories && category.subcategories.length > 0;

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
            const hasSubs = hasSubcategories(category);
            
            // Categories without subcategories - simple button
            if (!hasSubs || isMobile) {
              return (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryClick(category)}
                  className={cn(
                    "flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                    "hover:bg-muted",
                    activeCategory === category.slug || activeCategory.startsWith(category.slug + "/")
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category.name}
                </button>
              );
            }

            // Categories with subcategories - dropdown menu
            return (
              <DropdownMenu 
                key={category.slug}
                open={openDropdown === category.slug}
                onOpenChange={(open) => setOpenDropdown(open ? category.slug : null)}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                      "hover:bg-muted focus:outline-none",
                      activeCategory === category.slug || activeCategory.startsWith(category.slug + "/")
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-muted-foreground hover:text-foreground",
                      openDropdown === category.slug && "bg-muted ring-2 ring-primary/30"
                    )}
                  >
                    {category.name}
                    <ChevronDown className={cn(
                      "h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200",
                      openDropdown === category.slug && "rotate-180"
                    )} />
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="start" 
                  sideOffset={8}
                  className="w-56 max-h-[70vh] overflow-y-auto bg-popover border border-border shadow-lg z-50"
                >
                  {/* Main category link */}
                  <DropdownMenuItem
                    onClick={() => handleCategoryClick(category)}
                    className="font-medium text-primary cursor-pointer"
                  >
                    Wszystkie z {category.name}
                  </DropdownMenuItem>
                  
                  <div className="h-px bg-border my-1" />
                  
                  {/* Subcategories */}
                  {category.subcategories.map((sub: SubCategory) => {
                    // If subcategory has sub-subcategories
                    if (sub.subcategories && sub.subcategories.length > 0) {
                      return (
                        <DropdownMenuSub key={sub.slug}>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <span>{sub.name}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent 
                            sideOffset={4}
                            className="min-w-[180px] bg-popover border border-border shadow-lg z-50"
                          >
                            <DropdownMenuItem
                              onClick={() => handleSubcategoryClick(category.slug, sub.slug)}
                              className="font-medium text-primary cursor-pointer"
                            >
                              Wszystkie z {sub.name}
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            {sub.subcategories.map((subsub) => (
                              <DropdownMenuItem
                                key={subsub.slug}
                                onClick={() => handleSubcategoryClick(category.slug, sub.slug, subsub.slug)}
                                className="cursor-pointer"
                              >
                                {subsub.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      );
                    }
                    
                    // Simple subcategory
                    return (
                      <DropdownMenuItem
                        key={sub.slug}
                        onClick={() => handleSubcategoryClick(category.slug, sub.slug)}
                        className="cursor-pointer"
                      >
                        {sub.name}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
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
    </div>
  );
}
