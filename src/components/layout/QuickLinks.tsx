import { Link } from "react-router-dom";
import { 
  Newspaper, 
  TrendingUp, 
  Trophy, 
  Cpu, 
  Film, 
  Cloud, 
  ShoppingBag, 
  Car, 
  Plane, 
  Heart, 
  Utensils, 
  Gamepad2 
} from "lucide-react";

const quickLinks = [
  { name: "Najnowsze", href: "/news", icon: Newspaper },
  { name: "Giełda", href: "/business", icon: TrendingUp },
  { name: "Sport", href: "/sport", icon: Trophy },
  { name: "Tech", href: "/tech", icon: Cpu },
  { name: "Rozrywka", href: "/entertainment", icon: Film },
  { name: "Pogoda", href: "/weather", icon: Cloud },
  { name: "Zakupy", href: "/business", icon: ShoppingBag },
  { name: "Motoryzacja", href: "/news", icon: Car },
  { name: "Podróże", href: "/entertainment", icon: Plane },
  { name: "Zdrowie", href: "/news", icon: Heart },
  { name: "Jedzenie", href: "/entertainment", icon: Utensils },
  { name: "Gaming", href: "/tech", icon: Gamepad2 },
];

export function QuickLinks() {
  return (
    <div className="w-full bg-secondary/50 border-b border-border">
      <div className="container">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors whitespace-nowrap"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
