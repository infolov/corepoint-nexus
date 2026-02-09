import { Link } from "react-router-dom";
import { 
  Bookmark, 
  Heart, 
  History, 
  Bell, 
  Settings,
  ChevronRight,
  Newspaper
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardUser() {
  const { user } = useAuth();

  const quickLinks = [
    // HIDDEN: interests feature disabled
    // {
    //   title: "Zainteresowania",
    //   description: "Personalizuj wiadomości według kategorii",
    //   icon: Heart,
    //   href: "/interests",
    //   color: "text-rose-500"
    // },
    {
      title: "Zapisane artykuły",
      description: "Przeglądaj zapisane materiały",
      icon: Bookmark,
      href: "/zapisane",
      color: "text-blue-500"
    },
    {
      title: "Historia przeglądania",
      description: "Zobacz ostatnio czytane artykuły",
      icon: History,
      href: "/historia",
      color: "text-amber-500"
    },
    {
      title: "Powiadomienia",
      description: "Zarządzaj powiadomieniami",
      icon: Bell,
      href: "/notifications/settings",
      color: "text-green-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold">
          {user?.user_metadata?.full_name ? `Witaj, ${user.user_metadata.full_name}!` : "Witaj!"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj swoimi preferencjami i śledź ulubione tematy.
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} to={link.href}>
              <Card className="h-full hover:border-primary/50 transition-colors group cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-muted ${link.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription className="mt-1">{link.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Partner promotion */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Chcesz zostać Partnerem?</h3>
              <p className="text-sm text-muted-foreground">
                Prowadź kampanie reklamowe i docieraj do tysięcy czytelników.
              </p>
            </div>
          </div>
          <Link to="/dashboard/user/partner-application">
            <Button variant="default">Złóż wniosek</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Settings link */}
      <Link to="/dashboard/user/settings">
        <Card className="hover:border-primary/50 transition-colors group cursor-pointer">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Ustawienia konta</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
