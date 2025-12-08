import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  badge: "hot" | "trending" | "new" | null;
  is_published: boolean;
  is_featured: boolean;
}

export function useAdminArticles() {
  return useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (article: ArticleFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("articles")
        .insert({
          ...article,
          author_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artykuł został dodany" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: error.message,
      });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, article }: { id: string; article: Partial<ArticleFormData> }) => {
      const { data, error } = await supabase
        .from("articles")
        .update(article)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artykuł został zaktualizowany" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: error.message,
      });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({ title: "Artykuł został usunięty" });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: error.message,
      });
    },
  });
}
