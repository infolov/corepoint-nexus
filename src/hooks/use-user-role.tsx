import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type UserRole = "user" | "advertiser" | "publisher" | "admin";

interface UserRoleState {
  roles: UserRole[];
  isAdmin: boolean;
  isAdvertiser: boolean;
  isPublisher: boolean;
  isUser: boolean;
  hasAnyRole: boolean;
  hasDashboardAccess: boolean;
  loading: boolean;
  refetch: () => void;
}

export function useUserRole(): UserRoleState {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      console.log("[useUserRole] Fetching roles for user:", user.id);
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("[useUserRole] Error fetching user roles:", error);
        setRoles([]);
      } else {
        const fetchedRoles = (data || []).map(r => r.role as UserRole);
        console.log("[useUserRole] Fetched roles:", fetchedRoles);
        setRoles(fetchedRoles);
      }
    } catch (err) {
      console.error("[useUserRole] Unexpected error:", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading before fetching roles
    if (authLoading) {
      return;
    }
    
    fetchUserRoles();
  }, [user, authLoading, fetchUserRoles]);

  const isAdmin = roles.includes("admin");
  const isAdvertiser = roles.includes("advertiser");
  const isPublisher = roles.includes("publisher");
  const isUser = roles.includes("user") || roles.length === 0; // Default to user if no roles
  
  // Admin, advertiser (partner), and publisher have dashboard access
  const hasDashboardAccess = isAdmin || isAdvertiser || isPublisher;

  return {
    roles,
    isAdmin,
    isAdvertiser,
    isPublisher,
    isUser: isUser && !isAdmin && !isAdvertiser && !isPublisher, // Pure user without other roles
    hasAnyRole: roles.length > 0,
    hasDashboardAccess,
    loading: loading || authLoading,
    refetch: fetchUserRoles,
  };
}
