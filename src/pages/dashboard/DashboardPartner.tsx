import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Megaphone, 
  Calendar, 
  CreditCard,
  Target,
  Eye,
  Plus,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPartner() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Nowa kampania",
      description: "Utwórz nową kampanię reklamową",
      icon: Plus,
      href: "/dashboard/partner/campaigns/new",
      variant: "gradient" as const
    },
    {
      title: "Moje kampanie",
      description: "Zarządzaj aktywnymi kampaniami",
      icon: Megaphone,
      href: "/dashboard/partner/campaigns"
    },
    {
      title: "Statystyki",
      description: "Analizuj wyniki kampanii",
      icon: BarChart3,
      href: "/dashboard/partner/stats"
    },
    {
      title: "Kalendarz",
      description: "Planuj emisje reklam",
      icon: Calendar,
      href: "/dashboard/partner/calendar"
    }
  ];

  const resources = [
    {
      title: "Miejsca reklamowe",
      description: "Przeglądaj dostępne sloty",
      icon: Target,
      href: "/dashboard/partner/placements"
    },
    {
      title: "Kredyty i płatności",
      description: "Zarządzaj budżetem",
      icon: CreditCard,
      href: "/dashboard/partner/credits"
    },
    {
      title: "Podgląd reklam",
      description: "Zobacz jak wyglądają Twoje reklamy",
      icon: Eye,
      href: "/dashboard/partner/preview"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Panel Partnera
          </h1>
          <p className="text-muted-foreground mt-1">
            Witaj, {user?.user_metadata?.full_name || "Partnerze"}! Zarządzaj swoimi kampaniami reklamowymi.
          </p>
        </div>
        <Link to="/dashboard/partner/campaigns/new">
          <Button variant="gradient" className="text-white [&_svg]:text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nowa kampania
          </Button>
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Szybkie akcje</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href}>
                <Card className="h-full hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Zasoby</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link key={resource.href} to={resource.href}>
                <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
