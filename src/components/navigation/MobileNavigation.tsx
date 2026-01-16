import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, Category } from "@/data/categories";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_CATEGORIES = CATEGORIES.filter(
  (cat) => cat.slug !== "all" && cat.subcategories.length > 0
);

function CategoryAccordion({
  category,
  onNavigate,
}: {
  category: Category;
  onNavigate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center">
        <Link
          to={`/${category.slug}`}
          onClick={onNavigate}
          className="flex-1 flex items-center gap-2 px-4 py-3 text-base font-medium hover:bg-accent transition-colors"
        >
          {category.slug === "lokalne" && <MapPin className="h-4 w-4 text-primary" />}
          {category.name}
        </Link>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 mr-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="pl-4 pb-2 space-y-1">
          {category.subcategories.map((sub) => (
            <div key={sub.slug}>
              {sub.subcategories && sub.subcategories.length > 0 ? (
                <Collapsible
                  open={expandedSub === sub.slug}
                  onOpenChange={(open) => setExpandedSub(open ? sub.slug : null)}
                >
                  <div className="flex items-center">
                    <Link
                      to={`/${category.slug}/${sub.slug}`}
                      onClick={onNavigate}
                      className="flex-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-l transition-colors"
                    >
                      {sub.name}
                    </Link>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            expandedSub === sub.slug && "rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="pl-6 space-y-0.5">
                      {sub.subcategories.map((subsub) => (
                        <Link
                          key={subsub.slug}
                          to={`/${category.slug}/${sub.slug}/${subsub.slug}`}
                          onClick={onNavigate}
                          className="block px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded transition-colors"
                        >
                          {subsub.name}
                        </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  to={`/${category.slug}/${sub.slug}`}
                  onClick={onNavigate}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded transition-colors"
                >
                  {sub.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-left">Kategorie</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="py-2">
            {/* Link do strony głównej */}
            <Link
              to="/"
              onClick={onClose}
              className="block px-4 py-3 text-base font-medium hover:bg-accent transition-colors border-b border-border"
            >
              🏠 Strona główna
            </Link>

            {/* Wszystkie kategorie z akordeonami */}
            <div className="divide-y divide-border">
              {NAV_CATEGORIES.map((category) => (
                <CategoryAccordion
                  key={category.slug}
                  category={category}
                  onNavigate={onClose}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
