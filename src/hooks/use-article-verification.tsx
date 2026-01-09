import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VerificationFeedback {
  attempt: number;
  timestamp: string;
  status: 'verified' | 'rejected' | 'pending';
  errors: string[];
  mismatchDetails?: Array<{
    type: string;
    claimInSummary: string;
    sourceEvidence: string | null;
    explanation: string;
  }>;
  claimsChecked: number;
  claimsVerified: number;
  claimsRejected: number;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_review';

export interface ArticleVerificationResult {
  articleId: string;
  status: VerificationStatus;
  attempts: number;
  summary: string;
  feedbackHistory: VerificationFeedback[];
  lastVerification?: any;
}

export function useArticleVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ArticleVerificationResult | null>(null);
  const { toast } = useToast();

  const verifyArticle = async (articleId: string, forceRegenerate = false): Promise<ArticleVerificationResult | null> => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-article', {
        body: { articleId, forceRegenerate }
      });

      if (error) {
        toast({
          title: 'Błąd weryfikacji',
          description: error.message || 'Nie udało się zweryfikować artykułu',
          variant: 'destructive',
        });
        return null;
      }

      const result = data as ArticleVerificationResult;
      setVerificationResult(result);

      // Show appropriate toast based on result
      if (result.status === 'verified') {
        toast({
          title: 'Artykuł zweryfikowany ✓',
          description: `Weryfikacja zakończona pomyślnie po ${result.attempts} próbach.`,
        });
      } else if (result.status === 'manual_review') {
        toast({
          title: 'Wymaga ręcznej weryfikacji',
          description: `Artykuł nie przeszedł weryfikacji po ${result.attempts} próbach. Wymaga ręcznego sprawdzenia.`,
          variant: 'destructive',
        });
      } else if (result.status === 'rejected') {
        toast({
          title: 'Podsumowanie odrzucone',
          description: 'Wykryto błędy w podsumowaniu AI.',
          variant: 'destructive',
        });
      }

      return result;
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        title: 'Błąd weryfikacji',
        description: err instanceof Error ? err.message : 'Nieznany błąd',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationStats = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('ai_verification_status');

    if (error) {
      console.error('Failed to fetch verification stats:', error);
      return null;
    }

    const stats = {
      total: data.length,
      verified: data.filter(a => a.ai_verification_status === 'verified').length,
      rejected: data.filter(a => a.ai_verification_status === 'rejected').length,
      pending: data.filter(a => a.ai_verification_status === 'pending').length,
      manualReview: data.filter(a => a.ai_verification_status === 'manual_review').length,
    };

    return stats;
  };

  const getArticlesByStatus = async (status: VerificationStatus) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('ai_verification_status', status)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch articles by status:', error);
      return [];
    }

    return data;
  };

  return {
    isVerifying,
    verificationResult,
    verifyArticle,
    getVerificationStats,
    getArticlesByStatus,
  };
}
