import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

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
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show footer when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
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

  return (
    <footer 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-secondary/95 backdrop-blur-sm text-secondary-foreground border-t border-border transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container py-4">
        {/* MSN-style compact layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo and copyright */}
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links - horizontal on desktop */}
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

          {/* Social icons */}
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

        {/* Mobile copyright */}
        <p className="text-center text-xs text-muted-foreground mt-3 sm:hidden">
          © {new Date().getFullYear()} informacje.pl
        </p>
      </div>
    </footer>
  );
}
