import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface SponsoredArticleOrder {
  id: string;
  user_id: string;
  journalist_id: string | null;
  title: string;
  description: string;
  target_url: string | null;
  status: string;
  price: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SponsoredArticleFormData {
  journalist_id: string;
  title: string;
  description: string;
  target_url?: string;
  price: number;
}

export function useSponsoredArticles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["sponsored-article-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("sponsored_article_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SponsoredArticleOrder[];
    },
    enabled: !!user?.id,
  });

  const createOrder = useMutation({
    mutationFn: async (formData: SponsoredArticleFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("sponsored_article_orders")
        .insert({
          user_id: user.id,
          journalist_id: formData.journalist_id,
          title: formData.title,
          description: formData.description,
          target_url: formData.target_url || null,
          price: formData.price,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsored-article-orders"] });
      toast({
        title: "Sukces",
        description: "Zamówienie zostało złożone",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się złożyć zamówienia",
        variant: "destructive",
      });
      console.error("Create order error:", error);
    },
  });

  return {
    orders,
    isLoading,
    createOrder,
  };
}
