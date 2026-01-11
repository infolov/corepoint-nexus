import { Link } from "react-router-dom";

const footerLinks = [
  { name: "O nas", href: "/about" },
  { name: "Kontakt", href: "/contact" },
  { name: "Polityka prywatności", href: "/privacy" },
  { name: "Regulamin", href: "/terms" },
  { name: "Reklama", href: "/dashboard" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            informacje<span className="text-primary">.pl</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} informacje.pl
        </p>
      </div>
    </footer>
  );
}
