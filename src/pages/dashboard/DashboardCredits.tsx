import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Plus, 
  History, 
  TrendingUp,
  TrendingDown,
  Package,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_pln: number;
  price_eur: number | null;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export default function DashboardCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch balance
        const { data: creditsData } = await supabase
          .from("advertiser_credits")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        setBalance(creditsData?.balance || 0);

        // Fetch packages
        const { data: packagesData } = await supabase
          .from("credit_packages")
          .select("*")
          .eq("is_active", true)
          .order("credits", { ascending: true });

        setPackages(packagesData || []);

        // Fetch transactions
        const { data: transactionsData } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        setTransactions(transactionsData || []);
      } catch (error) {
        console.error("Error fetching credits data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    // In production, this would redirect to a payment gateway
    toast.info("Funkcja płatności będzie dostępna wkrótce");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kredyty reklamowe</h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj swoimi kredytami i przeglądaj historię transakcji.
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dostępne kredyty</p>
              <p className="text-4xl font-bold mt-1">{balance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                kredytów do wykorzystania
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Kup kredyty
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {packages.map((pkg, index) => (
            <Card 
              key={pkg.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                index === 2 ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handlePurchase(pkg.id)}
            >
              {index === 2 && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-1 font-medium">
                  Najpopularniejszy
                </div>
              )}
              <CardContent className={`p-4 text-center ${index === 2 ? "pt-8" : ""}`}>
                <p className="text-3xl font-bold">{pkg.credits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mb-3">kredytów</p>
                <p className="text-xl font-semibold text-primary">
                  {formatCurrency(pkg.price_pln)}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {(pkg.price_pln / pkg.credits).toFixed(2)} PLN/kredyt
                </p>
                <Button 
                  variant={index === 2 ? "gradient" : "outline"} 
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Kup
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historia transakcji
          </CardTitle>
          <CardDescription>
            Twoje ostatnie zakupy i wykorzystanie kredytów
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak transakcji
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.transaction_type === "purchase" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-orange-100 text-orange-600"
                    }`}>
                      {transaction.transaction_type === "purchase" ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.transaction_type === "purchase" 
                          ? "Zakup kredytów" 
                          : transaction.description || "Wykorzystanie kredytów"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(transaction.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.transaction_type === "purchase" 
                      ? "text-green-600" 
                      : "text-orange-600"
                  }`}>
                    {transaction.transaction_type === "purchase" ? "+" : "-"}
                    {Math.abs(transaction.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Informacje o kredytach</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Kredyty nie wygasają - wykorzystaj je kiedy chcesz
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Większe pakiety = niższa cena za kredyt
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Faktura VAT wystawiana automatycznie
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
