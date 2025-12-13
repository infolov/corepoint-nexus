import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, AlertCircle, Volume2, Square, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = async () => {
    if (!summary) return;

    // If already playing, pause
    if (isPlaying && !isPaused && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      return;
    }

    // If paused, resume
    if (isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      return;
    }

    // Generate new audio with ElevenLabs
    setIsLoadingAudio(true);
    try {
      const response = await supabase.functions.invoke("elevenlabs-tts", {
        body: { text: summary },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Create blob from response data
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        toast.error("Błąd podczas odtwarzania audio");
      };

      await audio.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Error generating audio:", err);
      toast.error("Nie udało się wygenerować audio");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
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
              disabled={isLoadingAudio}
              className="gap-2"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : isPlaying && !isPaused ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pauza
                </>
              ) : isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Wznów
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
