import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, CreditCard, BarChart3, Target, CheckCircle, Clock, XCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";

interface CampaignStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

interface RevenueStats {
  totalCredits: number;
  totalTransactions: number;
  averageTransaction: number;
}

interface DailyStats {
  date: string;
  campaigns: number;
  credits: number;
  impressions: number;
  clicks: number;
}

interface TopAdvertiser {
  userId: string;
  email: string;
  companyName: string | null;
  totalCampaigns: number;
  totalSpent: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function DashboardAdminStats() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ totalCredits: 0, totalTransactions: 0, averageTransaction: 0 });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [topAdvertisers, setTopAdvertisers] = useState<TopAdvertiser[]>([]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchAllStats();
  }, [user, isAdmin, period]);

  const getPeriodDays = () => {
    switch (period) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      default: return 30;
    }
  };

  async function fetchAllStats() {
    setLoading(true);
    const days = getPeriodDays();
    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    try {
      // Fetch campaign statistics
      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("status, created_at, total_credits, user_id");

      if (campaigns) {
        const stats: CampaignStats = {
          total: campaigns.length,
          pending: campaigns.filter(c => c.status === "pending").length,
          approved: campaigns.filter(c => c.status === "approved").length,
          rejected: campaigns.filter(c => c.status === "rejected").length,
          completed: campaigns.filter(c => c.status === "completed").length,
        };
        setCampaignStats(stats);
      }

      // Fetch credit transactions
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("amount, transaction_type, created_at")
        .gte("created_at", startDate);

      if (transactions) {
        const purchases = transactions.filter(t => t.transaction_type === "purchase");
        const totalCredits = purchases.reduce((sum, t) => sum + t.amount, 0);
        setRevenueStats({
          totalCredits,
          totalTransactions: purchases.length,
          averageTransaction: purchases.length > 0 ? Math.round(totalCredits / purchases.length) : 0,
        });
      }

      // Fetch daily stats from campaign_stats
      const { data: stats } = await supabase
        .from("campaign_stats")
        .select("date, impressions, clicks")
        .gte("date", startDate)
        .order("date", { ascending: true });

      // Group by date
      const dailyMap = new Map<string, DailyStats>();
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dailyMap.set(date, { date, campaigns: 0, credits: 0, impressions: 0, clicks: 0 });
      }

      if (stats) {
        stats.forEach(s => {
          const existing = dailyMap.get(s.date);
          if (existing) {
            existing.impressions += s.impressions;
            existing.clicks += s.clicks;
          }
        });
      }

      // Count campaigns per day
      if (campaigns) {
        campaigns.forEach(c => {
          const date = format(new Date(c.created_at), "yyyy-MM-dd");
          const existing = dailyMap.get(date);
          if (existing) {
            existing.campaigns += 1;
            existing.credits += c.total_credits;
          }
        });
      }

      setDailyStats(Array.from(dailyMap.values()));

      // Fetch top advertisers
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, company_name");

      if (campaigns && profiles) {
        const advertiserMap = new Map<string, TopAdvertiser>();
        
        campaigns.forEach(c => {
          const profile = profiles.find(p => p.user_id === c.user_id);
          const existing = advertiserMap.get(c.user_id);
          
          if (existing) {
            existing.totalCampaigns += 1;
            existing.totalSpent += c.total_credits;
          } else {
            advertiserMap.set(c.user_id, {
              userId: c.user_id,
              email: profile?.email || "Nieznany",
              companyName: profile?.company_name || null,
              totalCampaigns: 1,
              totalSpent: c.total_credits,
            });
          }
        });

        const sorted = Array.from(advertiserMap.values())
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10);
        
        setTopAdvertisers(sorted);
      }

    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Brak dostępu do tej strony</p>
      </div>
    );
  }

  const pieData = [
    { name: "Oczekujące", value: campaignStats.pending, color: "hsl(var(--chart-1))" },
    { name: "Zatwierdzone", value: campaignStats.approved, color: "hsl(var(--chart-2))" },
    { name: "Odrzucone", value: campaignStats.rejected, color: "hsl(var(--chart-3))" },
    { name: "Zakończone", value: campaignStats.completed, color: "hsl(var(--chart-4))" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statystyki platformy</h1>
          <p className="text-muted-foreground">Podsumowanie wszystkich kampanii i przychodów</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Ostatnie 7 dni</SelectItem>
            <SelectItem value="30d">Ostatnie 30 dni</SelectItem>
            <SelectItem value="90d">Ostatnie 90 dni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Wszystkie kampanie</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaignStats.total}</div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    {campaignStats.pending}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {campaignStats.approved}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {campaignStats.rejected}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Przychody (kredyty)</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueStats.totalCredits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {revenueStats.totalTransactions} transakcji
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Średnia transakcja</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueStats.averageTransaction.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">kredytów</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Partnerzy</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topAdvertisers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">aktywnych</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Przegląd</TabsTrigger>
              <TabsTrigger value="campaigns">Kampanie</TabsTrigger>
              <TabsTrigger value="advertisers">Partnerzy</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Daily Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aktywność dzienna</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => format(new Date(date), "dd.MM", { locale: pl })}
                            className="text-xs"
                          />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: pl })}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="impressions" 
                            name="Wyświetlenia"
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="clicks" 
                            name="Kliknięcia"
                            stroke="hsl(var(--chart-2))" 
                            fill="hsl(var(--chart-2))" 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status kampanii</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Brak danych
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nowe kampanie w czasie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), "dd.MM", { locale: pl })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: pl })}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="campaigns" name="Nowe kampanie" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kredyty z kampanii</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), "dd.MM", { locale: pl })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: pl })}
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="credits" 
                          name="Kredyty"
                          stroke="hsl(var(--chart-3))" 
                          fill="hsl(var(--chart-3))" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advertisers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Partnerzy</CardTitle>
                </CardHeader>
                <CardContent>
                  {topAdvertisers.length > 0 ? (
                    <div className="space-y-4">
                      {topAdvertisers.map((advertiser, index) => (
                        <div key={advertiser.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{advertiser.companyName || advertiser.email}</p>
                              {advertiser.companyName && (
                                <p className="text-xs text-muted-foreground">{advertiser.email}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{advertiser.totalSpent.toLocaleString()} kr.</p>
                            <p className="text-xs text-muted-foreground">{advertiser.totalCampaigns} kampanii</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Brak Partnerów
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
