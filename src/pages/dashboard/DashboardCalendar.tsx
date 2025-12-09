import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, parseISO, isWithinInterval } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  placement_name?: string;
}

export default function DashboardCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week">("month");

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("ad_campaigns")
          .select(`
            id,
            name,
            start_date,
            end_date,
            status,
            ad_placements (name)
          `)
          .eq("user_id", user.id)
          .order("start_date", { ascending: true });

        if (error) throw error;

        setCampaigns(data?.map(c => ({
          ...c,
          placement_name: (c.ad_placements as any)?.name
        })) || []);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCampaignsForDay = (day: Date) => {
    return campaigns.filter(campaign => {
      const startDate = parseISO(campaign.start_date);
      const endDate = parseISO(campaign.end_date);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "completed": return "bg-gray-500";
      case "rejected": return "bg-red-500";
      default: return "bg-blue-500";
    }
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  // Calculate padding for the first week
  const firstDayOfWeek = monthStart.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kalendarz rezerwacji</h1>
          <p className="text-muted-foreground mt-1">
            Przeglądaj i planuj swoje kampanie reklamowe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
          >
            Miesiąc
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Tydzień
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold capitalize">
              {format(currentDate, "LLLL yyyy", { locale: pl })}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Dziś
          </Button>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding for first week */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] p-1 bg-muted/30 rounded-lg" />
            ))}

            {days.map((day) => {
              const dayCampaigns = getCampaignsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[80px] p-1 rounded-lg border transition-colors",
                    isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50",
                    !isSameMonth(day, currentDate) && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayCampaigns.slice(0, 2).map((campaign) => (
                      <div
                        key={campaign.id}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded truncate text-white",
                          getStatusColor(campaign.status)
                        )}
                        title={campaign.name}
                      >
                        {campaign.name}
                      </div>
                    ))}
                    {dayCampaigns.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayCampaigns.length - 2} więcej
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-sm text-muted-foreground">Aktywne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Oczekujące</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-500" />
              <span className="text-sm text-muted-foreground">Zakończone</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące kampanie</CardTitle>
          <CardDescription>Twoje zaplanowane kampanie reklamowe</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
          ) : campaigns.filter(c => c.status === "active" || c.status === "pending").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak zaplanowanych kampanii
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns
                .filter(c => c.status === "active" || c.status === "pending")
                .slice(0, 5)
                .map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-8 rounded", getStatusColor(campaign.status))} />
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.placement_name} • {format(parseISO(campaign.start_date), "d MMM", { locale: pl })} - {format(parseISO(campaign.end_date), "d MMM yyyy", { locale: pl })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status === "active" ? "Aktywna" : "Oczekująca"}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
