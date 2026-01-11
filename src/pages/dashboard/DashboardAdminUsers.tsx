import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useAdminLogs } from "@/hooks/use-admin-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  User, 
  Shield, 
  ShieldAlert, 
  Search,
  UserCog,
  Mail,
  Calendar,
  Trash2,
  Loader2,
  AlertTriangle,
  UserPlus,
  Building
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  roles: string[];
}

const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  user: { label: "Użytkownik", variant: "secondary", icon: User },
  advertiser: { label: "Partner", variant: "default", icon: UserCog },
  admin: { label: "Administrator", variant: "destructive", icon: Shield },
};

export default function DashboardAdminUsers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Create Partner state
  const [createPartnerDialogOpen, setCreatePartnerDialogOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
  });
  const [creatingPartner, setCreatingPartner] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch all profiles (admin has access via RLS)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("Błąd podczas pobierania użytkowników");
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const rolesMap = new Map<string, string[]>();
    (rolesData || []).forEach(r => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const formattedUsers: UserProfile[] = (profilesData || []).map(profile => ({
      ...profile,
      roles: rolesMap.get(profile.user_id) || ["user"],
    }));

    setUsers(formattedUsers);
    setLoading(false);
  };

  const openRoleDialog = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setSelectedRole("");
    setRoleDialogOpen(true);
  };

  const openDeleteDialog = (userProfile: UserProfile) => {
    setUserToDelete(userProfile);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !user) return;

    setDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Brak autoryzacji");
        return;
      }

      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: userToDelete.user_id, userEmail: userToDelete.email },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Użytkownik został usunięty");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Błąd podczas usuwania użytkownika");
    } finally {
      setDeleting(false);
    }
  };

  const { logAction } = useAdminLogs();

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Wybierz rolę");
      return;
    }

    if (selectedUser.roles.includes(selectedRole)) {
      toast.error("Użytkownik ma już tę rolę");
      return;
    }

    setProcessing(true);

    const roleValue = selectedRole as "user" | "advertiser" | "admin";

    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: selectedUser.user_id,
        role: roleValue,
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("Użytkownik ma już tę rolę");
      } else {
        toast.error("Błąd podczas dodawania roli");
      }
    } else {
      // Log the action
      await logAction(
        "role_added",
        { role: selectedRole, user_email: selectedUser.email },
        "user",
        selectedUser.user_id
      );
      toast.success(`Rola "${roleConfig[selectedRole]?.label}" została dodana`);
      setRoleDialogOpen(false);
      fetchUsers();
    }

    setProcessing(false);
  };

  const handleRemoveRole = async (userProfile: UserProfile, role: string) => {
    if (role === "user") {
      toast.error("Nie można usunąć podstawowej roli użytkownika");
      return;
    }

    if (userProfile.user_id === user?.id && role === "admin") {
      toast.error("Nie możesz usunąć sobie roli administratora");
      return;
    }

    setProcessing(true);

    const roleValue = role as "user" | "advertiser" | "admin";

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userProfile.user_id)
      .eq("role", roleValue);

    if (error) {
      toast.error("Błąd podczas usuwania roli");
    } else {
      // Log the action
      await logAction(
        "role_removed",
        { role, user_email: userProfile.email },
        "user",
        userProfile.user_id
      );
      toast.success(`Rola "${roleConfig[role]?.label}" została usunięta`);
      fetchUsers();
    }

    setProcessing(false);
  };

  const handleCreatePartner = async () => {
    if (!partnerForm.email || !partnerForm.password || !partnerForm.fullName) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    if (partnerForm.password.length < 6) {
      toast.error("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setCreatingPartner(true);

    try {
      // Create user via admin API (using Edge Function)
      const { data, error } = await supabase.functions.invoke("admin-create-partner", {
        body: {
          email: partnerForm.email,
          password: partnerForm.password,
          fullName: partnerForm.fullName,
          companyName: partnerForm.companyName,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Log the action
      await logAction(
        "partner_created",
        { partner_email: partnerForm.email, company_name: partnerForm.companyName },
        "user",
        data.userId
      );

      toast.success("Konto Partnera zostało utworzone!");
      setCreatePartnerDialogOpen(false);
      setPartnerForm({ email: "", password: "", fullName: "", companyName: "" });
      fetchUsers();
    } catch (error) {
      console.error("Error creating partner:", error);
      toast.error("Błąd podczas tworzenia konta Partnera");
    } finally {
      setCreatingPartner(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      (u.email?.toLowerCase().includes(query) || false) ||
      (u.full_name?.toLowerCase().includes(query) || false) ||
      (u.company_name?.toLowerCase().includes(query) || false)
    );
  });

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Brak dostępu</h2>
          <p className="text-muted-foreground">
            Ta strona jest dostępna tylko dla administratorów.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie użytkownikami</h1>
          <p className="text-muted-foreground">
            Przeglądaj użytkowników i zarządzaj ich rolami
          </p>
        </div>
        <Button onClick={() => setCreatePartnerDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Utwórz konto Partnera
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Wszyscy użytkownicy ({users.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj użytkownika..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nie znaleziono użytkowników
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Użytkownik</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Data rejestracji</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(userProfile => (
                    <TableRow key={userProfile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">
                            {userProfile.full_name || "Brak nazwy"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {userProfile.email || "Brak"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {userProfile.company_name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userProfile.roles.map(role => {
                            const config = roleConfig[role] || roleConfig.user;
                            const RoleIcon = config.icon;
                            return (
                              <Badge 
                                key={role} 
                                variant={config.variant}
                                className="gap-1 cursor-pointer hover:opacity-80"
                                onClick={() => {
                                  if (role !== "user") {
                                    handleRemoveRole(userProfile, role);
                                  }
                                }}
                                title={role !== "user" ? "Kliknij aby usunąć" : ""}
                              >
                                <RoleIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(userProfile.created_at), "d MMM yyyy", { locale: pl })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(userProfile)}
                            className="gap-1"
                          >
                            <UserCog className="h-4 w-4" />
                            Rola
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(userProfile)}
                            disabled={userProfile.user_id === user?.id}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj rolę użytkownikowi</DialogTitle>
            <DialogDescription>
              Wybierz rolę dla użytkownika "{selectedUser?.full_name || selectedUser?.email}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz rolę..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Użytkownik</SelectItem>
                <SelectItem value="advertiser">Partner</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={processing || !selectedRole}
            >
              Dodaj rolę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Usuń użytkownika
            </DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć użytkownika "{userToDelete?.full_name || userToDelete?.email}"?
              <br />
              <strong className="text-destructive">Ta operacja jest nieodwracalna!</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-muted-foreground">
              Zostaną usunięte:
            </p>
            <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
              <li>• Konto użytkownika</li>
              <li>• Profil i ustawienia</li>
              <li>• Wszystkie kampanie reklamowe</li>
              <li>• Historia przeglądania</li>
              <li>• Avatar i pliki</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń użytkownika
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={createPartnerDialogOpen} onOpenChange={setCreatePartnerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Utwórz konto Partnera
            </DialogTitle>
            <DialogDescription>
              Utwórz nowe konto z rolą Partnera umożliwiającą prowadzenie kampanii reklamowych.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partner-email">Email *</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="partner@firma.pl"
                value={partnerForm.email}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-password">Hasło *</Label>
              <Input
                id="partner-password"
                type="password"
                placeholder="Minimum 6 znaków"
                value={partnerForm.password}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-name">Imię i nazwisko *</Label>
              <Input
                id="partner-name"
                type="text"
                placeholder="Jan Kowalski"
                value={partnerForm.fullName}
                onChange={(e) => setPartnerForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-company">Nazwa firmy</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="partner-company"
                  type="text"
                  placeholder="Nazwa firmy Sp. z o.o."
                  className="pl-9"
                  value={partnerForm.companyName}
                  onChange={(e) => setPartnerForm(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreatePartnerDialogOpen(false);
                setPartnerForm({ email: "", password: "", fullName: "", companyName: "" });
              }}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleCreatePartner}
              disabled={creatingPartner || !partnerForm.email || !partnerForm.password || !partnerForm.fullName}
            >
              {creatingPartner ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tworzenie...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Utwórz Partnera
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
