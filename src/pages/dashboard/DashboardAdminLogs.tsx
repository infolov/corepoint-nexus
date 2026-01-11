import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useAdminLogs, AdminActivityLog } from "@/hooks/use-admin-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ShieldAlert, 
  Search, 
  RefreshCw,
  Clock,
  User,
  Settings,
  Trash2,
  UserPlus,
  Edit,
  Eye,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const actionTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  user_deleted: { label: "Usunięcie użytkownika", icon: Trash2, variant: "destructive" },
  role_added: { label: "Dodanie roli", icon: UserPlus, variant: "default" },
  role_removed: { label: "Usunięcie roli", icon: User, variant: "secondary" },
  setting_updated: { label: "Zmiana ustawienia", icon: Settings, variant: "outline" },
  campaign_approved: { label: "Zatwierdzenie kampanii", icon: Edit, variant: "default" },
  campaign_rejected: { label: "Odrzucenie kampanii", icon: Trash2, variant: "destructive" },
  default: { label: "Inna akcja", icon: Activity, variant: "secondary" },
};

export default function DashboardAdminLogs() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { logs, loading, refetch } = useAdminLogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getActionConfig = (actionType: string) => {
    return actionTypeConfig[actionType] || actionTypeConfig.default;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.action_details).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = actionFilter === "all" || log.action_type === actionFilter;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueActionTypes = [...new Set(logs.map(l => l.action_type))];

  const openDetails = (log: AdminActivityLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

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
      <div>
        <h1 className="text-2xl font-bold">Logi aktywności</h1>
        <p className="text-muted-foreground">
          Historia wszystkich akcji administracyjnych
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ostatnie akcje ({filteredLogs.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj w logach..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtruj typ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  {uniqueActionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {getActionConfig(type).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak logów do wyświetlenia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Typ akcji</TableHead>
                    <TableHead>Cel</TableHead>
                    <TableHead className="text-right">Szczegóły</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => {
                    const config = getActionConfig(log.action_type);
                    const ActionIcon = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <div>{format(new Date(log.created_at), "d MMM yyyy", { locale: pl })}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm truncate max-w-[150px]">
                              {log.admin_email || "Nieznany"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <ActionIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.target_type && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">{log.target_type}:</span>
                              <br />
                              <span className="font-mono text-xs truncate block max-w-[120px]">
                                {log.target_id || "-"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Szczegóły akcji
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "d MMMM yyyy, HH:mm:ss", { locale: pl })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Administrator</p>
                  <p className="font-medium">{selectedLog.admin_email || "Nieznany"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Typ akcji</p>
                  <Badge variant={getActionConfig(selectedLog.action_type).variant}>
                    {getActionConfig(selectedLog.action_type).label}
                  </Badge>
                </div>
                {selectedLog.target_type && (
                  <div>
                    <p className="text-muted-foreground">Cel</p>
                    <p className="font-medium">
                      {selectedLog.target_type}: {selectedLog.target_id}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-2">Szczegóły akcji</p>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.action_details, null, 2)}
                </pre>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>ID logu: {selectedLog.id}</p>
                <p>ID administratora: {selectedLog.admin_id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
