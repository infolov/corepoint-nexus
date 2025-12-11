import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    id?: string;
    title: string;
    category: string;
    image: string;
    timestamp: string;
    source?: string;
    sourceUrl?: string;
    excerpt?: string;
  } | null;
}

export function ArticlePreviewModal({ isOpen, onClose, article }: ArticlePreviewModalProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!article || !isOpen) return;
      
      setLoading(true);
      setError(null);
      setSummary("");

      try {
        const { data, error: fnError } = await supabase.functions.invoke('summarize-article', {
          body: {
            title: article.title,
            content: article.excerpt || article.title,
            category: article.category,
          }
        });

        if (fnError) {
          throw fnError;
        }

        if (data?.summary) {
          setSummary(data.summary);
        } else {
          setError("Nie udało się wygenerować podsumowania");
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
        setError("Błąd podczas generowania podsumowania. Spróbuj ponownie.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [article, isOpen]);

  if (!article) return null;

  const sourceInitials = article.source 
    ? article.source.length <= 3 
      ? article.source 
      : article.source.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : "IP";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{article.category}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.timestamp}
            </span>
          </div>
          <DialogTitle className="text-xl leading-tight pr-8">
            {article.title}
          </DialogTitle>
        </DialogHeader>

        {/* Article Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop";
            }}
          />
        </div>

        {/* Source Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">{sourceInitials}</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{article.source || "Informacje.pl"}</p>
            <p className="text-xs text-muted-foreground">Źródło artykułu</p>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs">✨</span>
            Podsumowanie AI
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Generowanie podsumowania...</span>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 rounded-lg p-4">
              <p className="text-foreground/90 leading-relaxed m-0">{summary}</p>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {article.sourceUrl ? (
            <a 
              href={article.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full" size="lg">
                <ExternalLink className="h-4 w-4 mr-2" />
                Przeczytaj oryginalny artykuł
              </Button>
            </a>
          ) : article.id ? (
            <Link to={`/artykul/${article.id}`} className="flex-1" onClick={onClose}>
              <Button className="w-full" size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Czytaj więcej na Informacje.pl
              </Button>
            </Link>
          ) : null}
          
          <Button variant="outline" onClick={onClose} className="sm:w-auto">
            Zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
