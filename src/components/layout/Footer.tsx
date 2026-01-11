import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const allLinks = [
    ...footerLinks.portal,
    ...footerLinks.legal,
    ...footerLinks.partners,
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="container py-6">
        {/* MSN-style compact layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and copyright */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hero-gradient">
                <span className="text-lg font-bold text-primary-foreground">I</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                Info<span className="text-primary">Pulse</span>
              </span>
            </Link>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              © {new Date().getFullYear()}
            </span>
          </div>

          {/* Links - horizontal on desktop */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {allLinks.map((link, index) => (
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
        <p className="text-center text-xs text-muted-foreground mt-4 sm:hidden">
          © {new Date().getFullYear()} InfoPulse. Wszelkie prawa zastrzeżone.
        </p>
      </div>
    </footer>
  );
}
