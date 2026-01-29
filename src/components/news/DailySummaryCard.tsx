import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Volume2, Calendar, MapPin, Loader2, FileText } from "lucide-react";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function DailySummaryCard() {
  const { nationalSummary, regionalSummary, loading, error } = useDailySummary();
  const [activeTab, setActiveTab] = useState<"national" | "regional">("national");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSummary = activeTab === "national" ? nationalSummary : regionalSummary;

  const togglePlayback = async () => {
    if (!currentSummary?.audio_url) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setAudioLoading(true);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.error("Playback error:", err);
        } finally {
          setAudioLoading(false);
        }
      }
    } else if (currentSummary.audio_url) {
      setAudioLoading(true);
      const audio = new Audio(currentSummary.audio_url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
      };

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Playback error:", err);
        setAudioLoading(false);
      }
    }
  };

  // Cleanup audio on tab change
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const handleTabChange = (tab: "national" | "regional") => {
    stopAudio();
    setActiveTab(tab);
    setIsExpanded(false);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error || (!nationalSummary && !regionalSummary)) {
    return null;
  }

  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5 text-primary" />
            Skrót dnia
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {today}
          </Badge>
        </div>
        
        {/* Tab switcher */}
        {regionalSummary && (
          <div className="flex gap-2 mt-3">
            <Button
              variant={activeTab === "national" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("national")}
              className="text-xs"
            >
              🇵🇱 Wszystkie
            </Button>
            <Button
              variant={activeTab === "regional" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("regional")}
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {regionalSummary.region}
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {currentSummary ? (
          <>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {currentSummary.summary_text.slice(0, 250)}
                {currentSummary.summary_text.length > 250 && !isExpanded && "..."}
              </p>
              
              <CollapsibleContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {currentSummary.summary_text.slice(250)}
                </p>
              </CollapsibleContent>
              
              {currentSummary.summary_text.length > 250 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {isExpanded ? "Zwiń" : "Rozwiń pełny tekst"}
                  </Button>
                </CollapsibleTrigger>
              )}
            </Collapsible>
            
            <div className="flex items-center gap-3 flex-wrap">
              {currentSummary.audio_url && (
                <Button
                  onClick={togglePlayback}
                  variant="default"
                  size="sm"
                  className="gap-2"
                  disabled={audioLoading}
                >
                  {audioLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {audioLoading ? "Ładowanie..." : isPlaying ? "Pauza" : "Słuchaj"}
                </Button>
              )}
              
              <span className="text-xs text-muted-foreground">
                {currentSummary.article_ids.length} wiadomości
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Podsumowanie {activeTab === "national" ? "ogólne" : "regionalne"} nie jest jeszcze dostępne.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
