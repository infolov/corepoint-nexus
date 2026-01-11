import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Json } from "@/integrations/supabase/types";

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action_type: string;
  action_details: Record<string, unknown>;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
}

export function useAdminLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;

      const formattedLogs: AdminActivityLog[] = (data || []).map(log => ({
        ...log,
        action_details: (log.action_details as Record<string, unknown>) || {},
      }));

      setLogs(formattedLogs);
      setError(null);
    } catch (err) {
      console.error("Error fetching admin logs:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logAction = async (
    actionType: string,
    actionDetails: Record<string, unknown> = {},
    targetType?: string,
    targetId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error: insertError } = await supabase
        .from("admin_activity_logs")
        .insert([{
          admin_id: user.id,
          admin_email: user.email || null,
          action_type: actionType,
          action_details: actionDetails as Json,
          target_type: targetType || null,
          target_id: targetId || null,
        }]);

      if (insertError) throw insertError;
      return true;
    } catch (err) {
      console.error("Error logging admin action:", err);
      return false;
    }
  };

  return {
    logs,
    loading,
    error,
    logAction,
    refetch: fetchLogs,
  };
}
