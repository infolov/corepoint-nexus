import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const footerLinks = {
  portal: [
    { name: "O nas", href: "/about" },
    { name: "Kontakt", href: "/contact" },
  ],
  legal: [
    { name: "Polityka prywatności", href: "/privacy" },
    { name: "Regulamin", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
    { name: "RODO", href: "/gdpr" },
  ],
  partners: [
    { name: "Współpraca", href: "/advertise" },
    { name: "Panel Partnera", href: "/dashboard" },
    { name: "Kontakt B2B", href: "/b2b" },
  ],
};

export function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsExpanded(false); // Collapse when hiding
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const allLinks = [
    ...footerLinks.portal,
    ...footerLinks.legal,
    ...footerLinks.partners,
  ];

  // Mobile collapsed footer
  if (isMobile) {
    return (
      <footer 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-secondary/95 backdrop-blur-sm text-secondary-foreground border-t border-border transition-all duration-300",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Expanded content */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="container py-3 space-y-3">
            {/* Links grid */}
            <nav className="grid grid-cols-2 gap-2 text-xs">
              {allLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors py-1"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
            {/* Social icons */}
            <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/50">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Collapsed bar - always visible */}
        <div className="container py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2 text-xs gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Zwiń
                </>
              ) : (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Więcej
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>
    );
  }

  // Desktop footer (unchanged)
  return (
    <footer 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-secondary/95 backdrop-blur-sm text-secondary-foreground border-t border-border transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {allLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
              <Youtube className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
