import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  display_order: number;
}

interface GroupedCategories {
  [key: string]: {
    main: Subcategory;
    children: Subcategory[];
  };
}

interface CategoryDropdownProps {
  categoryName: string;
  categorySlug: string;
  parentFilter: string;
}

export function CategoryDropdown({ categoryName, categorySlug, parentFilter }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcategories = async () => {
      // Fetch main categories under the parent filter
      const { data: mainCats, error: mainError } = await supabase
        .from("sport_subcategories")
        .select("*")
        .eq("is_active", true)
        .eq("parent_category", parentFilter)
        .order("display_order");

      if (mainError || !mainCats) return;

      // Get all child subcategories for each main category
      const mainCatNames = mainCats.map((cat) => cat.name);
      
      const { data: childCats, error: childError } = await supabase
        .from("sport_subcategories")
        .select("*")
        .eq("is_active", true)
        .in("parent_category", mainCatNames)
        .order("display_order");

      if (!childError && childCats) {
        setSubcategories([...mainCats, ...childCats]);
      } else {
        setSubcategories(mainCats);
      }
    };

    fetchSubcategories();
  }, [parentFilter]);

  // Group subcategories by parent
  const grouped: GroupedCategories = {};
  const mainCategories: Subcategory[] = [];

  subcategories.forEach((cat) => {
    if (cat.parent_category === parentFilter) {
      mainCategories.push(cat);
      grouped[cat.name] = { main: cat, children: [] };
    }
  });

  subcategories.forEach((cat) => {
    if (cat.parent_category && grouped[cat.parent_category]) {
      grouped[cat.parent_category].children.push(cat);
    }
  });

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        setIsOpen(false);
        setExpandedGroup(null);
      }}
    >
      <Link
        to={`/${categorySlug}`}
        className="nav-link px-3 py-2 text-sm font-medium flex items-center gap-1"
      >
        {categoryName}
        <ChevronDown className="h-3 w-3" />
      </Link>

      {isOpen && mainCategories.length > 0 && (
        <div className="absolute top-full left-0 w-72 bg-background border border-border rounded-lg shadow-lg z-50 py-2 max-h-[70vh] overflow-y-auto">
          {mainCategories.map((mainCat) => {
            const group = grouped[mainCat.name];
            const hasChildren = group?.children.length > 0;
            const isExpanded = expandedGroup === mainCat.name;

            return (
              <div key={mainCat.id}>
                <div
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
                  onMouseEnter={() => hasChildren && setExpandedGroup(mainCat.name)}
                >
                  <Link
                    to={`/${categorySlug}/${mainCat.slug}`}
                    className="flex-1 text-sm font-medium text-foreground"
                  >
                    {mainCat.name}
                  </Link>
                  {hasChildren && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {hasChildren && isExpanded && (
                  <div className="pl-4 border-l-2 border-primary/20 ml-3 py-1">
                    {group.children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/${categorySlug}/${child.slug}`}
                        className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
