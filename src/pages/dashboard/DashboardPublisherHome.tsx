import { Link } from "react-router-dom";
import { 
  FileEdit, 
  BarChart3,
  BookOpen,
  Users,
  Plus,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPublisherHome() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Nowy artykuł",
      description: "Napisz nowy artykuł sponsorowany",
      icon: Plus,
      href: "/dashboard/publisher/articles/new"
    },
    {
      title: "Moje artykuły",
      description: "Zarządzaj opublikowanymi artykułami",
      icon: BookOpen,
      href: "/dashboard/publisher/articles"
    },
    {
      title: "Statystyki",
      description: "Analizuj czytelnictwo artykułów",
      icon: BarChart3,
      href: "/dashboard/publisher/stats"
    },
    {
      title: "Dziennikarze",
      description: "Zlecaj artykuły dziennikarzom",
      icon: Users,
      href: "/dashboard/publisher/journalists"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Panel Wydawcy
          </h1>
          <p className="text-muted-foreground mt-1">
            Witaj, {user?.user_metadata?.full_name || "Wydawco"}! Twórz i zarządzaj artykułami sponsorowanymi.
          </p>
        </div>
        <Link to="/dashboard/publisher/articles/new">
          <Button variant="gradient" className="text-white [&_svg]:text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nowy artykuł
          </Button>
        </Link>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} to={action.href}>
              <Card className="h-full hover:border-primary/50 transition-colors group cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info card */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileEdit className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Wskazówka</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Artykuły sponsorowane są oznaczone specjalnym znacznikiem i mogą zawierać linki do Twojej strony. 
                Po napisaniu artykuł przechodzi weryfikację przed publikacją.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
