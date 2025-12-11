import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ArticleSummaryProps {
  title: string;
  content: string;
  category: string;
}

export const ArticleSummary = ({ title, content, category }: ArticleSummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke("summarize-article", {
          body: { title, content, category },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setSummary(data?.summary || null);
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError(err instanceof Error ? err.message : "Błąd podczas generowania podsumowania");
      } finally {
        setLoading(false);
      }
    };

    if (title && content) {
      fetchSummary();
    }
  }, [title, content, category]);

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground">Podsumowanie AI</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Generowanie podsumowania...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive/80">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <p className="text-foreground/90 leading-relaxed">{summary}</p>
      )}
    </div>
  );
};
