import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArticleForm } from "@/components/admin/ArticleForm";
import {
  useAdminArticles,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  ArticleFormData,
} from "@/hooks/useAdminArticles";
import { useIsAdmin } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

type EditingArticle = Partial<ArticleFormData> & { id?: string };

export default function AdminArticles() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: articles = [], isLoading } = useAdminArticles();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<EditingArticle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = () => {
    setEditingArticle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: ArticleFormData) => {
    if (editingArticle?.id) {
      updateArticle.mutate(
        { id: editingArticle.id, article: data },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createArticle.mutate(data, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteArticle.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">Zarządzanie artykułami</h1>
          </div>
          <Button variant="gradient" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj artykuł
          </Button>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Brak artykułów. Dodaj pierwszy artykuł!
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-sm border border-border"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="category" className="text-xs">
                      {article.category}
                    </Badge>
                    {article.badge && (
                      <Badge variant={article.badge as "hot" | "trending" | "new"} className="text-xs">
                        {article.badge}
                      </Badge>
                    )}
                    {article.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {!article.is_published && (
                      <Badge variant="secondary" className="text-xs">
                        Szkic
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground truncate">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(article.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(article)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Article Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle?.id ? "Edytuj artykuł" : "Dodaj nowy artykuł"}
            </DialogTitle>
          </DialogHeader>
          <ArticleForm
            initialData={editingArticle || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createArticle.isPending || updateArticle.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Artykuł zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
