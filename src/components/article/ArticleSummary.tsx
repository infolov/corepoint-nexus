import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, Volume2, VolumeX, Square, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArticleSummaryProps {
  title: string;
  content: string;
  category: string;
}

type VoiceGender = "female" | "male";

export const ArticleSummary = ({ title, content, category }: ArticleSummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const polishVoices = voices.filter(v => v.lang === 'pl-PL' || v.lang.startsWith('pl'));
      setAvailableVoices(polishVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // If no content at all (not even title), stop loading
    // Allow generating summary from title alone if content is missing
    if (!title && !content) {
      setLoading(false);
      setError("Brak treści do podsumowania");
      return;
    }

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching summary for:", title.substring(0, 50));
        const { data, error: fnError } = await supabase.functions.invoke("summarize-article", {
          body: { title, content, category },
        });

        console.log("Summary response:", data, fnError);

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

    fetchSummary();
  }, [title, content, category]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoiceByGender = (gender: VoiceGender): SpeechSynthesisVoice | undefined => {
    const voices = window.speechSynthesis.getVoices();
    
    // Female voice names commonly used
    const femaleNames = ['Paulina', 'Zosia', 'Ewa', 'Anna', 'female', 'Female', 'kobieta'];
    // Male voice names commonly used
    const maleNames = ['Adam', 'Krzysztof', 'Jacek', 'male', 'Male', 'mężczyzna'];
    
    const targetNames = gender === 'female' ? femaleNames : maleNames;
    
    // Try to find a Polish voice matching the gender
    let voice = voices.find(v => 
      (v.lang === 'pl-PL' || v.lang.startsWith('pl')) && 
      targetNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()))
    );
    
    // If not found, try Google/Microsoft voices
    if (!voice) {
      const prefixes = gender === 'female' 
        ? ['Google', 'Microsoft Paulina', 'Microsoft Zosia']
        : ['Microsoft Adam', 'Microsoft Krzysztof'];
      
      voice = voices.find(v => 
        (v.lang === 'pl-PL' || v.lang.startsWith('pl')) && 
        prefixes.some(prefix => v.name.includes(prefix))
      );
    }
    
    // Fallback to any Polish voice
    if (!voice) {
      voice = voices.find(v => v.lang === 'pl-PL') || voices.find(v => v.lang.startsWith('pl'));
    }
    
    return voice;
  };

  const handlePlayAudio = () => {
    if (!summary) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'pl-PL';
    utterance.rate = 0.9;
    utterance.pitch = voiceGender === 'female' ? 1.1 : 0.9;
    utterance.volume = 1.0;
    
    const voice = getVoiceByGender(voiceGender);
    if (voice) {
      utterance.voice = voice;
    }
    
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
            <Select value={voiceGender} onValueChange={(v: VoiceGender) => setVoiceGender(v)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <User className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Żeński</SelectItem>
                <SelectItem value="male">Męski</SelectItem>
              </SelectContent>
            </Select>
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
        <p 
          className="text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: summary?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || ''
          }}
        />
      )}
    </div>
  );
};
