import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  trend: "up" | "down";
  count: string;
}

const trendingTopics: TrendingTopic[] = [
  { id: "1", title: "Wybory 2024", category: "Polityka", trend: "up", count: "125K" },
  { id: "2", title: "iPhone 16", category: "Technologia", trend: "up", count: "98K" },
  { id: "3", title: "Liga Mistrzów", category: "Sport", trend: "up", count: "76K" },
  { id: "4", title: "Ceny paliw", category: "Biznes", trend: "down", count: "54K" },
  { id: "5", title: "Oscary 2024", category: "Rozrywka", trend: "up", count: "43K" },
];

export function TrendingWidget() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Trendy</h3>
      </div>

      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <div
            key={topic.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-card-hover cursor-pointer transition-colors"
          >
            <span className="text-lg font-bold text-muted-foreground w-6">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{topic.title}</h4>
              <span className="text-xs text-muted-foreground">{topic.category}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {topic.trend === "up" ? (
                <ArrowUp className="h-4 w-4 text-badge-new" />
              ) : (
                <ArrowDown className="h-4 w-4 text-badge-hot" />
              )}
              <span className="text-muted-foreground">{topic.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
