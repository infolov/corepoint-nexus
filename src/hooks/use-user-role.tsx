import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type UserRole = "user" | "partner" | "publisher" | "admin";

interface UserRoleState {
  roles: UserRole[];
  isAdmin: boolean;
  isPartner: boolean;
  isPublisher: boolean;
  isUser: boolean;
  hasAnyRole: boolean;
  hasDashboardAccess: boolean;
  loading: boolean;
  refetch: () => void;
  getPrimaryRole: () => UserRole;
  getDashboardPath: () => string;
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
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("[useUserRole] Error fetching user roles:", error);
        setRoles([]);
      } else {
        // Map database roles to app roles (advertiser -> partner for backward compatibility)
        const fetchedRoles = (data || []).map(r => {
          const dbRole = r.role as string;
          if (dbRole === "advertiser") return "partner" as UserRole;
          return dbRole as UserRole;
        });
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
  const isPartner = roles.includes("partner");
  const isPublisher = roles.includes("publisher");
  const isUser = roles.includes("user") || roles.length === 0; // Default to user if no roles
  
  // All roles have dashboard access (each to their own dashboard)
  const hasDashboardAccess = true;

  // Get primary role for routing (priority: admin > publisher > partner > user)
  const getPrimaryRole = (): UserRole => {
    if (isAdmin) return "admin";
    if (isPublisher) return "publisher";
    if (isPartner) return "partner";
    return "user";
  };

  // Get the appropriate dashboard path based on role
  const getDashboardPath = (): string => {
    const primaryRole = getPrimaryRole();
    switch (primaryRole) {
      case "admin":
        return "/dashboard/admin";
      case "publisher":
        return "/dashboard/publisher";
      case "partner":
        return "/dashboard/partner";
      default:
        return "/dashboard/user";
    }
  };

  return {
    roles,
    isAdmin,
    isPartner,
    isPublisher,
    isUser: !isAdmin && !isPartner && !isPublisher, // Pure user without other roles
    hasAnyRole: roles.length > 0,
    hasDashboardAccess,
    loading: loading || authLoading,
    refetch: fetchUserRoles,
    getPrimaryRole,
    getDashboardPath,
  };
}
