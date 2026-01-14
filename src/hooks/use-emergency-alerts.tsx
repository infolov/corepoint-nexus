import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyAlert {
  id: string;
  message: string;
  source: string;
  region: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
}

export const useEmergencyAlerts = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać alertów',
        variant: 'destructive',
      });
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const createAlert = async (alert: {
    message: string;
    source?: string;
    region?: string | null;
    priority?: number;
    expires_at?: string | null;
  }) => {
    const { error } = await supabase
      .from('emergency_alerts')
      .insert({
        message: alert.message,
        source: alert.source || 'manual',
        region: alert.region || null,
        priority: alert.priority || 1,
        expires_at: alert.expires_at || null,
      });

    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się dodać alertu',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sukces',
      description: 'Alert został dodany',
    });
    fetchAlerts();
    return true;
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('emergency_alerts')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować alertu',
        variant: 'destructive',
      });
      return false;
    }

    fetchAlerts();
    return true;
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('emergency_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć alertu',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sukces',
      description: 'Alert został usunięty',
    });
    fetchAlerts();
    return true;
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    alerts,
    loading,
    createAlert,
    toggleAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
};
