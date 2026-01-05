import { useState, useEffect } from "react";
import { Sparkles, AlertCircle, Volume2, VolumeX, Square, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ArticleSummaryProps {
  title: string;
  content: string;
  category: string;
}

type VoiceGender = "female" | "male";

// Generate a simple hash for the title to match database records
const generateTitleHash = (title: string): string => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const ArticleSummary = ({ title, content, category }: ArticleSummaryProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const titleHash = generateTitleHash(title);

  // Fetch summary directly from database
  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['article-summary', titleHash],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_summaries')
        .select('summary')
        .eq('title_hash', titleHash)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!title,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const summary = summaryData?.summary || null;

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getVoiceByGender = (gender: VoiceGender): SpeechSynthesisVoice | undefined => {
    const voices = window.speechSynthesis.getVoices();
    
    const femaleNames = ['Paulina', 'Zosia', 'Ewa', 'Anna', 'female', 'Female', 'kobieta'];
    const maleNames = ['Adam', 'Krzysztof', 'Jacek', 'male', 'Male', 'mężczyzna'];
    
    const targetNames = gender === 'female' ? femaleNames : maleNames;
    
    let voice = voices.find(v => 
      (v.lang === 'pl-PL' || v.lang.startsWith('pl')) && 
      targetNames.some(name => v.name.toLowerCase().includes(name.toLowerCase()))
    );
    
    if (!voice) {
      const prefixes = gender === 'female' 
        ? ['Google', 'Microsoft Paulina', 'Microsoft Zosia']
        : ['Microsoft Adam', 'Microsoft Krzysztof'];
      
      voice = voices.find(v => 
        (v.lang === 'pl-PL' || v.lang.startsWith('pl')) && 
        prefixes.some(prefix => v.name.includes(prefix))
      );
    }
    
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

  // Don't render anything if loading (quick DB fetch)
  if (isLoading) {
    return null;
  }

  // If no summary exists in database, show elegant empty state
  if (!summary) {
    return (
      <div className="bg-muted/30 border border-border/50 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Podsumowanie AI jest przygotowywane...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 text-destructive/80">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Nie udało się pobrać podsumowania</span>
        </div>
      </div>
    );
  }

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
      </div>

      <p className="text-foreground/90 leading-relaxed">{summary}</p>
    </div>
  );
};
