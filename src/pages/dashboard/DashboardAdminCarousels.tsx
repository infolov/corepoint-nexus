import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Eye, GalleryHorizontal, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface CarouselGroup {
  id: string;
  name: string;
  placement_position: number;
  is_active: boolean;
  user_id: string;
  banners: CarouselBanner[];
}

interface CarouselBanner {
  id: string;
  group_id: string;
  campaign_id: string | null;
  local_campaign_id: string | null;
  display_order: number;
}

interface Campaign {
  id: string;
  name: string;
  ad_type: string;
  content_url: string | null;
}

export default function DashboardAdminCarousels() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CarouselGroup[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CarouselGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    placement_position: 1,
  });
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CarouselGroup | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    campaign_type: "national" as "national" | "local",
    campaign_id: "",
  });

  const fetchData = async () => {
    try {
      // Fetch carousel groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("carousel_banner_groups")
        .select("*")
        .order("placement_position");

      if (groupsError) throw groupsError;

      // Fetch banners for each group
      const groupsWithBanners = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: bannersData } = await supabase
            .from("carousel_banners")
            .select("*")
            .eq("group_id", group.id)
            .order("display_order");

          return { ...group, banners: bannersData || [] };
        })
      );

      setGroups(groupsWithBanners);

      // Fetch campaigns for banner selection
      const { data: campaignsData } = await supabase
        .from("ad_campaigns")
        .select("id, name, ad_type, content_url")
        .eq("status", "active");

      setCampaigns(campaignsData || []);

      const { data: localData } = await supabase
        .from("local_ad_campaigns")
        .select("id, name, ad_type, content_url")
        .eq("status", "active");

      setLocalCampaigns(localData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Nie udało się pobrać danych");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const groupData = {
        name: formData.name,
        placement_position: formData.placement_position,
        user_id: user.id,
        is_active: true,
      };

      if (editingGroup) {
        const { error } = await supabase
          .from("carousel_banner_groups")
          .update(groupData)
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast.success("Karuzela zaktualizowana");
      } else {
        const { error } = await supabase
          .from("carousel_banner_groups")
          .insert(groupData);

        if (error) throw error;
        toast.success("Karuzela utworzona");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving group:", error);
      toast.error("Nie udało się zapisać karuzeli");
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (selectedGroup.banners.length >= 4) {
      toast.error("Karuzela może mieć maksymalnie 4 banery");
      return;
    }

    try {
      const bannerData = {
        group_id: selectedGroup.id,
        campaign_id: bannerFormData.campaign_type === "national" ? bannerFormData.campaign_id : null,
        local_campaign_id: bannerFormData.campaign_type === "local" ? bannerFormData.campaign_id : null,
        display_order: selectedGroup.banners.length + 1,
      };

      const { error } = await supabase
        .from("carousel_banners")
        .insert(bannerData);

      if (error) throw error;
      toast.success("Baner dodany do karuzeli");
      setBannerDialogOpen(false);
      setBannerFormData({ campaign_type: "national", campaign_id: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding banner:", error);
      toast.error("Nie udało się dodać banera");
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      const { error } = await supabase
        .from("carousel_banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;
      toast.success("Baner usunięty");
      fetchData();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Nie udało się usunąć banera");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tę karuzelę i wszystkie jej banery?")) return;

    try {
      const { error } = await supabase
        .from("carousel_banner_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Karuzela usunięta");
      fetchData();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Nie udało się usunąć karuzeli");
    }
  };

  const toggleActive = async (group: CarouselGroup) => {
    try {
      const { error } = await supabase
        .from("carousel_banner_groups")
        .update({ is_active: !group.is_active })
        .eq("id", group.id);

      if (error) throw error;
      toast.success(group.is_active ? "Karuzela dezaktywowana" : "Karuzela aktywowana");
      fetchData();
    } catch (error) {
      console.error("Error toggling group:", error);
      toast.error("Nie udało się zmienić statusu");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", placement_position: 1 });
    setEditingGroup(null);
  };

  const openEditDialog = (group: CarouselGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      placement_position: group.placement_position,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Zarządzanie Karuzelami</h1>
          <p className="text-muted-foreground">Grupy banerów wyświetlanych co 12 kafelków w feedzie</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nowa karuzela
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Edytuj karuzelę" : "Nowa karuzela"}</DialogTitle>
              <DialogDescription>
                Karuzela wyświetla do 4 banerów w rotacji
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa karuzeli</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Pozycja w feedzie (co 12 kafelków)</Label>
                <Input
                  id="position"
                  type="number"
                  min={1}
                  value={formData.placement_position}
                  onChange={(e) => setFormData({ ...formData, placement_position: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Pozycja 1 = po pierwszych 12 kafelkach, 2 = po 24, itd.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingGroup ? "Zapisz" : "Utwórz"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj baner do karuzeli</DialogTitle>
            <DialogDescription>
              Wybierz kampanię do wyświetlenia w karuzeli
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBanner} className="space-y-4">
            <div className="space-y-2">
              <Label>Typ kampanii</Label>
              <Select
                value={bannerFormData.campaign_type}
                onValueChange={(value: "national" | "local") => 
                  setBannerFormData({ ...bannerFormData, campaign_type: value, campaign_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Ogólnokrajowa</SelectItem>
                  <SelectItem value="local">Lokalna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kampania</Label>
              <Select
                value={bannerFormData.campaign_id}
                onValueChange={(value) => setBannerFormData({ ...bannerFormData, campaign_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kampanię" />
                </SelectTrigger>
                <SelectContent>
                  {(bannerFormData.campaign_type === "national" ? campaigns : localCampaigns).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!bannerFormData.campaign_id}>
                Dodaj baner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Carousel Groups */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Brak karuzel. Utwórz pierwszą karuzelę aby zacząć.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GalleryHorizontal className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        Pozycja: {group.placement_position} (po {group.placement_position * 12} kafelkach)
                      </CardDescription>
                    </div>
                    {!group.is_active && <Badge variant="outline">Nieaktywna</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
                        setBannerDialogOpen(true);
                      }}
                      disabled={group.banners.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Dodaj baner ({group.banners.length}/4)
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(group)}>
                      <Eye className={`h-4 w-4 ${group.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.banners.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Brak banerów w karuzeli
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.banners.map((banner, index) => {
                      const campaign = banner.campaign_id 
                        ? campaigns.find(c => c.id === banner.campaign_id)
                        : localCampaigns.find(c => c.id === banner.local_campaign_id);
                      
                      return (
                        <div key={banner.id} className="relative border rounded-lg overflow-hidden group">
                          <div className="aspect-[4/1] bg-muted flex items-center justify-center">
                            {campaign?.content_url ? (
                              <img 
                                src={campaign.content_url} 
                                alt={campaign?.name || "Banner"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {campaign?.name || "Baner"}
                              </span>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {banner.local_campaign_id && (
                            <Badge className="absolute top-1 right-1 text-[10px]" variant="secondary">
                              Lokalna
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
