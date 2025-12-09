import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SportSubcategory {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  display_order: number;
}

interface GroupedCategories {
  [key: string]: {
    main: SportSubcategory;
    children: SportSubcategory[];
  };
}

export function SportDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [subcategories, setSubcategories] = useState<SportSubcategory[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubcategories = async () => {
      const { data, error } = await supabase
        .from("sport_subcategories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setSubcategories(data);
      }
    };

    fetchSubcategories();
  }, []);

  // Group subcategories by parent
  const grouped: GroupedCategories = {};
  const mainCategories: SportSubcategory[] = [];

  subcategories.forEach((cat) => {
    if (!cat.parent_category) {
      mainCategories.push(cat);
      grouped[cat.slug] = { main: cat, children: [] };
    } else {
      if (grouped[cat.parent_category]) {
        grouped[cat.parent_category].children.push(cat);
      }
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
        to="/sport"
        className="nav-link px-3 py-2 text-sm font-medium flex items-center gap-1"
      >
        Sport
        <ChevronDown className="h-3 w-3" />
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 w-64 bg-background border border-border rounded-lg shadow-lg z-50 py-2 max-h-[70vh] overflow-y-auto">
          {mainCategories.map((mainCat) => {
            const group = grouped[mainCat.slug];
            const hasChildren = group?.children.length > 0;
            const isExpanded = expandedGroup === mainCat.slug;

            return (
              <div key={mainCat.id}>
                <div
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
                  onMouseEnter={() => hasChildren && setExpandedGroup(mainCat.slug)}
                >
                  <Link
                    to={`/sport/${mainCat.slug}`}
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
                        to={`/sport/${child.slug}`}
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
