import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type UserRole = "user" | "advertiser" | "admin";

interface UserRoleState {
  roles: UserRole[];
  isAdmin: boolean;
  isAdvertiser: boolean;
  isUser: boolean;
  hasAnyRole: boolean;
  hasDashboardAccess: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleState {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } else {
        setRoles((data || []).map(r => r.role as UserRole));
      }
      setLoading(false);
    }

    fetchUserRoles();
  }, [user]);

  const isAdmin = roles.includes("admin");
  const isAdvertiser = roles.includes("advertiser");
  const isUser = roles.includes("user") || roles.length === 0; // Default to user if no roles
  
  // Only admin and advertiser (partner) have dashboard access
  const hasDashboardAccess = isAdmin || isAdvertiser;

  return {
    roles,
    isAdmin,
    isAdvertiser,
    isUser: isUser && !isAdmin && !isAdvertiser, // Pure user without other roles
    hasAnyRole: roles.length > 0,
    hasDashboardAccess,
    loading,
  };
}
