import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Plus,
  Upload,
  X,
  Image as ImageIcon,
  Globe,
  MapPin,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Placement {
  id: string;
  name: string;
  slug: string;
  dimensions: string | null;
  is_active: boolean;
}

interface AdminCampaignCreateDialogProps {
  placements: Placement[];
  onCreated: () => void;
}

const VOIVODESHIPS = [
  "dolnośląskie", "kujawsko-pomorskie", "lubelskie", "lubuskie",
  "łódzkie", "małopolskie", "mazowieckie", "opolskie",
  "podkarpackie", "podlaskie", "pomorskie", "śląskie",
  "świętokrzyskie", "warmińsko-mazurskie", "wielkopolskie", "zachodniopomorskie",
];

export function AdminCampaignCreateDialog({ placements, onCreated }: AdminCampaignCreateDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [placementId, setPlacementId] = useState("");
  const [adType, setAdType] = useState("image");
  const [targetUrl, setTargetUrl] = useState("");
  const [contentText, setContentText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [isGlobal, setIsGlobal] = useState(true);
  const [region, setRegion] = useState("");
  const [targetPowiat, setTargetPowiat] = useState("");
  const [totalCredits, setTotalCredits] = useState(0);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setPlacementId("");
    setAdType("image");
    setTargetUrl("");
    setContentText("");
    setStartDate("");
    setEndDate("");
    setStatus("active");
    setIsGlobal(true);
    setRegion("");
    setTargetPowiat("");
    setTotalCredits(0);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/apng"];
    const videoTypes = ["video/mp4", "video/webm"];
    const allowedTypes = [...imageTypes, ...videoTypes];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Nieobsługiwany format pliku. Dozwolone: JPG, PNG, GIF, WebP, APNG, MP4, WebM.");
      return;
    }

    const isVideo = videoTypes.includes(file.type);
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Plik jest za duży. Max: ${isVideo ? "15MB" : "5MB"}.`);
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    if (filePreview?.startsWith("blob:")) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedPlacement = placements.find(p => p.id === placementId);

  const handleSubmit = async () => {
    if (!user || !name.trim() || !placementId || !startDate || !endDate) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedContentUrl: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `admin/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("ad-campaigns")
          .upload(fileName, selectedFile);

        if (uploadError) {
          toast.error("Błąd podczas przesyłania pliku");
          setSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("ad-campaigns")
          .getPublicUrl(fileName);

        uploadedContentUrl = publicUrl;
      }

      const { error } = await supabase.from("ad_campaigns").insert({
        user_id: user.id,
        placement_id: placementId,
        name: name.trim(),
        ad_type: adType,
        start_date: startDate,
        end_date: endDate,
        total_credits: totalCredits,
        target_url: targetUrl.trim() || null,
        content_url: uploadedContentUrl,
        content_text: contentText.trim() || null,
        status,
        is_global: isGlobal,
        region: isGlobal ? null : region || null,
        target_powiat: isGlobal ? null : targetPowiat || null,
      });

      if (error) {
        console.error("Error creating campaign:", error);
        toast.error("Błąd podczas tworzenia kampanii");
      } else {
        toast.success("Kampania została utworzona");
        resetForm();
        setOpen(false);
        onCreated();
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj kampanię
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Utwórz nową kampanię reklamową</DialogTitle>
          <DialogDescription>
            Jako administrator możesz dodać kampanię bezpośrednio z wybranym statusem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-name">Nazwa kampanii *</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Np. Promocja letnia 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Miejsce reklamowe *</Label>
              <Select value={placementId} onValueChange={setPlacementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz placement" />
                </SelectTrigger>
                <SelectContent>
                  {placements.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.dimensions && <span className="text-muted-foreground ml-1">({p.dimensions})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlacement?.dimensions && (
                <p className="text-xs text-muted-foreground">
                  Zalecane wymiary: <span className="font-medium text-foreground">{selectedPlacement.dimensions}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywna</SelectItem>
                  <SelectItem value="pending">Oczekująca</SelectItem>
                  <SelectItem value="rejected">Odrzucona</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-start">Data rozpoczęcia *</Label>
              <Input
                id="create-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-end">Data zakończenia *</Label>
              <Input
                id="create-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isGlobal ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-500" />
                )}
                <Label>Zasięg: {isGlobal ? "Ogólnopolski" : "Regionalny"}</Label>
              </div>
              <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
            </div>

            {!isGlobal && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-xs">Województwo</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOIVODESHIPS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Powiat (opcjonalnie)</Label>
                  <Input
                    value={targetPowiat}
                    onChange={(e) => setTargetPowiat(e.target.value)}
                    placeholder="Np. krakowski"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ad type & content */}
          <div className="space-y-3">
            <Label>Typ reklamy</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdType("image")}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Obraz
              </Button>
              <Button
                type="button"
                variant={adType === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setAdType("text")}
                className="gap-2"
              >
                Tekst
              </Button>
            </div>

            {adType === "image" && (
              <div className="space-y-3">
                {/* File upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {filePreview ? (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Podgląd"
                        className="max-h-48 mx-auto object-contain rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center gap-2 cursor-pointer py-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Kliknij, aby wybrać plik kreacji
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {["JPG", "PNG", "GIF", "WebP", "MP4", "WebM"].map((fmt) => (
                          <Badge key={fmt} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                            {fmt}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Max: 5 MB (obrazy), 15 MB (wideo)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/apng,video/mp4,video/webm"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {adType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="create-content-text">Treść reklamy</Label>
                <Textarea
                  id="create-content-text"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Wprowadź treść reklamy tekstowej..."
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Target URL */}
          <div className="space-y-2">
            <Label htmlFor="create-target-url">Link docelowy</Label>
            <Input
              id="create-target-url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Credits */}
          <div className="space-y-2">
            <Label htmlFor="create-credits">Kredyty (admin: 0 = darmowe)</Label>
            <Input
              id="create-credits"
              type="number"
              value={totalCredits}
              onChange={(e) => setTotalCredits(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
            Anuluj
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !placementId || !startDate || !endDate}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitting ? "Tworzenie..." : "Utwórz kampanię"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
