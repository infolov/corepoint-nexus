import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface SponsoredArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  image: string;
  target_url: string | null;
  is_sponsored: boolean;
  sponsor_user_id: string | null;
  sponsor_status: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsoredArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  target_url?: string;
}

export function useSponsoredArticleEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: myArticles = [], isLoading } = useQuery({
    queryKey: ["my-sponsored-articles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_sponsored", true)
        .eq("sponsor_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SponsoredArticle[];
    },
    enabled: !!user?.id,
  });

  const createArticle = useMutation({
    mutationFn: async (formData: SponsoredArticleFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("articles")
        .insert({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          image: formData.image,
          target_url: formData.target_url || null,
          is_sponsored: true,
          sponsor_user_id: user.id,
          sponsor_status: "pending",
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-sponsored-articles"] });
      toast({
        title: "Sukces",
        description: "Artykuł został wysłany do weryfikacji",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć artykułu",
        variant: "destructive",
      });
      console.error("Create article error:", error);
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...formData }: SponsoredArticleFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("articles")
        .update({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          image: formData.image,
          target_url: formData.target_url || null,
          sponsor_status: "pending", // Reset to pending on edit
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-sponsored-articles"] });
      toast({
        title: "Sukces",
        description: "Artykuł został zaktualizowany",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować artykułu",
        variant: "destructive",
      });
      console.error("Update article error:", error);
    },
  });

  return {
    myArticles,
    isLoading,
    createArticle,
    updateArticle,
  };
}
