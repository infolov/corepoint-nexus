import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, Volume2, VolumeX, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ArticleSummaryProps {
  title: string;
  content: string;
  category: string;
}

export const ArticleSummary = ({ title, content, category }: ArticleSummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayAudio = () => {
    if (!summary) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'pl-PL';
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Podsumowanie AI</span>
        </div>
        
        {/* Audio Controls */}
        {summary && !loading && !error && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePlayAudio}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  Pauza
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Odsłuchaj
                </>
              )}
            </Button>
            {isPlaying && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleStopAudio}
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
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
