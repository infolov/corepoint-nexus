import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  portal: [
    { name: "O nas", href: "/about" },
    { name: "Kontakt", href: "/contact" },
    { name: "Redakcja", href: "/team" },
    { name: "Kariera", href: "/careers" },
  ],
  categories: [
    { name: "Wiadomości", href: "/news" },
    { name: "Biznes", href: "/business" },
    { name: "Sport", href: "/sport" },
    { name: "Technologia", href: "/tech" },
  ],
  legal: [
    { name: "Polityka prywatności", href: "/privacy" },
    { name: "Regulamin", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
    { name: "RODO", href: "/gdpr" },
  ],
  advertisers: [
    { name: "Reklama", href: "/advertise" },
    { name: "Panel klienta", href: "/dashboard" },
    { name: "Cennik", href: "/pricing" },
    { name: "Kontakt B2B", href: "/b2b" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hero-gradient">
                <span className="text-xl font-bold text-primary-foreground">I</span>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Info<span className="text-primary">Pulse</span>
              </span>
            </Link>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Twoje źródło aktualnych informacji. Wiadomości, biznes, sport i więcej - wszystko w jednym miejscu.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Portal</h3>
            <ul className="space-y-2">
              {footerLinks.portal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kategorie</h3>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Dla reklamodawców</h3>
            <ul className="space-y-2">
              {footerLinks.advertisers.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Prawne</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-secondary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Zapisz się do newslettera</h3>
              <p className="text-sm text-secondary-foreground/70">
                Otrzymuj najważniejsze wiadomości prosto na skrzynkę
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Twój email"
                className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-secondary-foreground/10 border border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button variant="gradient">
                <Mail className="h-4 w-4 mr-2" />
                Zapisz
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-secondary-foreground/10 text-center text-sm text-secondary-foreground/50">
          <p>© {new Date().getFullYear()} InfoPulse. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
