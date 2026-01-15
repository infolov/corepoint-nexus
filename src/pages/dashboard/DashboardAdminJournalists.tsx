import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useJournalists, Journalist, JournalistFormData } from "@/hooks/use-journalists";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";

const SPECIALIZATIONS = [
  "Polityka",
  "Gospodarka",
  "Sport",
  "Technologia",
  "Kultura",
  "Nauka",
  "Zdrowie",
  "Lifestyle",
  "Motoryzacja",
  "Podróże",
];

export default function DashboardAdminJournalists() {
  const { journalists, isLoading, createJournalist, updateJournalist, deleteJournalist } = useJournalists();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingJournalist, setEditingJournalist] = useState<Journalist | null>(null);
  const [journalistToDelete, setJournalistToDelete] = useState<Journalist | null>(null);
  const [formData, setFormData] = useState<JournalistFormData>({
    name: "",
    email: "",
    specialization: [],
    bio: "",
    avatar_url: "",
    price_per_article: 500,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      specialization: [],
      bio: "",
      avatar_url: "",
      price_per_article: 500,
      is_active: true,
    });
    setEditingJournalist(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (journalist: Journalist) => {
    setEditingJournalist(journalist);
    setFormData({
      name: journalist.name,
      email: journalist.email,
      specialization: journalist.specialization || [],
      bio: journalist.bio || "",
      avatar_url: journalist.avatar_url || "",
      price_per_article: journalist.price_per_article,
      is_active: journalist.is_active,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (journalist: Journalist) => {
    setJournalistToDelete(journalist);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingJournalist) {
      await updateJournalist.mutateAsync({ id: editingJournalist.id, ...formData });
    } else {
      await createJournalist.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (journalistToDelete) {
      await deleteJournalist.mutateAsync(journalistToDelete.id);
      setIsDeleteDialogOpen(false);
      setJournalistToDelete(null);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dziennikarze</h1>
          <p className="text-muted-foreground">
            Zarządzaj dziennikarzami dostępnymi do zamówień artykułów sponsorowanych
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj dziennikarza
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista dziennikarzy ({journalists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {journalists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak dziennikarzy. Dodaj pierwszego dziennikarza.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dziennikarz</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specjalizacje</TableHead>
                  <TableHead>Cena/artykuł</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalists.map((journalist) => (
                  <TableRow key={journalist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={journalist.avatar_url || undefined} />
                          <AvatarFallback>
                            {journalist.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{journalist.name}</div>
                          {journalist.bio && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {journalist.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{journalist.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {journalist.specialization?.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {journalist.specialization?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{journalist.specialization.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{journalist.price_per_article} PLN</TableCell>
                    <TableCell>
                      <Badge variant={journalist.is_active ? "default" : "secondary"}>
                        {journalist.is_active ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(journalist)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(journalist)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingJournalist ? "Edytuj dziennikarza" : "Dodaj dziennikarza"}
            </DialogTitle>
            <DialogDescription>
              {editingJournalist
                ? "Zaktualizuj dane dziennikarza"
                : "Dodaj nowego dziennikarza do systemu"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jan Kowalski"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jan@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Cena za artykuł (PLN) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_per_article}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_article: Number(e.target.value) })
                  }
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">URL zdjęcia</Label>
                <Input
                  id="avatar"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specjalizacje</Label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <Badge
                    key={spec}
                    variant={formData.specialization.includes(spec) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialization(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Opis / Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Krótki opis dziennikarza..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktywny (widoczny dla wydawców)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                !formData.email ||
                createJournalist.isPending ||
                updateJournalist.isPending
              }
            >
              {(createJournalist.isPending || updateJournalist.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingJournalist ? "Zapisz zmiany" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdź usunięcie</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć dziennikarza {journalistToDelete?.name}? Ta operacja jest
              nieodwracalna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteJournalist.isPending}
            >
              {deleteJournalist.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
