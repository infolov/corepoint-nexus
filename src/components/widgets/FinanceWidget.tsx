import { useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Bitcoin, BarChart3 } from "lucide-react";
import { useFinance } from "@/hooks/use-finance";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TabType = "currencies" | "crypto" | "indices";

export function FinanceWidget() {
  const { data, loading, error, refetch } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>("currencies");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "currencies", label: "Waluty", icon: <DollarSign className="h-4 w-4" /> },
    { id: "crypto", label: "Krypto", icon: <Bitcoin className="h-4 w-4" /> },
    { id: "indices", label: "Indeksy", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const renderChange = (change: string, showPercent = true) => {
    const numChange = parseFloat(change);
    const isPositive = numChange >= 0;
    return (
      <span className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{change}{showPercent ? "%" : ""}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Finanse</h3>
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Finanse
        </h3>
        <button
          onClick={handleRefresh}
          className="p-1.5 hover:bg-muted rounded-md transition-colors"
          title="Odśwież dane"
        >
          <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {activeTab === "currencies" && data?.currencies.map((currency) => (
          <div
            key={currency.code}
            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{currency.code}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">1 {currency.code}</p>
                <p className="text-xs text-muted-foreground">Kurs PLN</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{currency.rate} PLN</p>
              {renderChange(currency.changePercent)}
            </div>
          </div>
        ))}

        {activeTab === "crypto" && data?.crypto.map((coin) => (
          <div
            key={coin.symbol}
            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                coin.symbol === "BTC" && "bg-orange-500/10",
                coin.symbol === "ETH" && "bg-blue-500/10",
                coin.symbol === "XRP" && "bg-gray-500/10",
                coin.symbol === "SOL" && "bg-purple-500/10"
              )}>
                <span className={cn(
                  "text-xs font-bold",
                  coin.symbol === "BTC" && "text-orange-500",
                  coin.symbol === "ETH" && "text-blue-500",
                  coin.symbol === "XRP" && "text-gray-500",
                  coin.symbol === "SOL" && "text-purple-500"
                )}>{coin.symbol}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{coin.price} PLN</p>
              {renderChange(coin.change24h)}
            </div>
          </div>
        ))}

        {activeTab === "indices" && data?.indices.map((index) => (
          <div
            key={index.symbol}
            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-chart-1" />
              </div>
              <div>
                <p className="font-medium text-foreground">{index.name}</p>
                <p className="text-xs text-muted-foreground">{index.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{index.value}</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={cn(
                  "text-xs",
                  parseFloat(index.change) >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {parseFloat(index.change) >= 0 ? "+" : ""}{index.change}
                </span>
                {renderChange(index.changePercent)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {data?.timestamp && (
        <div className="px-3 py-2 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Aktualizacja: {new Date(data.timestamp).toLocaleTimeString("pl-PL")}
          </p>
        </div>
      )}
    </div>
  );
}
