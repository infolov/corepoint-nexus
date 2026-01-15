import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Journalist {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  bio: string | null;
  avatar_url: string | null;
  price_per_article: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalistFormData {
  name: string;
  email: string;
  specialization: string[];
  bio?: string;
  avatar_url?: string;
  price_per_article: number;
  is_active?: boolean;
}

export function useJournalists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journalists = [], isLoading } = useQuery({
    queryKey: ["journalists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journalists")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Journalist[];
    },
  });

  const createJournalist = useMutation({
    mutationFn: async (formData: JournalistFormData) => {
      const { data, error } = await supabase
        .from("journalists")
        .insert({
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
          price_per_article: formData.price_per_article,
          is_active: formData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalists"] });
      toast({
        title: "Sukces",
        description: "Dziennikarz został dodany",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać dziennikarza",
        variant: "destructive",
      });
      console.error("Create journalist error:", error);
    },
  });

  const updateJournalist = useMutation({
    mutationFn: async ({ id, ...formData }: JournalistFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("journalists")
        .update({
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
          price_per_article: formData.price_per_article,
          is_active: formData.is_active,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalists"] });
      toast({
        title: "Sukces",
        description: "Dziennikarz został zaktualizowany",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować dziennikarza",
        variant: "destructive",
      });
      console.error("Update journalist error:", error);
    },
  });

  const deleteJournalist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("journalists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journalists"] });
      toast({
        title: "Sukces",
        description: "Dziennikarz został usunięty",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć dziennikarza",
        variant: "destructive",
      });
      console.error("Delete journalist error:", error);
    },
  });

  return {
    journalists,
    isLoading,
    createJournalist,
    updateJournalist,
    deleteJournalist,
  };
}
