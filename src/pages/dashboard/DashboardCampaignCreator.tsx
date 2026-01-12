import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Calendar,
  Target,
  Zap,
  CreditCard,
  Upload,
  Monitor,
  Smartphone,
  Square,
  FileText,
  X,
  Image as ImageIcon,
  Globe,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { BookingCalendar } from "@/components/dashboard/BookingCalendar";
import { EmissionTypeSelector, EmissionType } from "@/components/dashboard/EmissionTypeSelector";
import { PricingPackages, PricingPackage } from "@/components/dashboard/PricingPackages";
import { AdministrativeTargeting } from "@/components/dashboard/AdministrativeTargeting";
import { MultiRegionSelector, SelectedRegion } from "@/components/dashboard/MultiRegionSelector";

interface AdPlacement {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  dimensions: string | null;
  credit_cost: number;
}

// Placements that are restricted to global-only targeting
const GLOBAL_ONLY_PLACEMENT_SLUGS = ["top-banner"];

const placementIcons: Record<string, any> = {
  "top-banner": Monitor,
  "sidebar-square": Square,
  "sponsored-article": FileText,
  "mobile-banner": Smartphone,
};

const STEPS = [
  { id: 1, name: "Miejsce", icon: Target },
  { id: 2, name: "Emisja", icon: Zap },
  { id: 3, name: "Zasięg", icon: Globe },
  { id: 4, name: "Termin", icon: Calendar },
  { id: 5, name: "Podsumowanie", icon: CreditCard },
  { id: 6, name: "Kreacja", icon: Upload },
];

// Pricing (PLN per day)
const EXCLUSIVE_DAILY_RATE = 100;
const ROTATION_DAILY_RATE = 35;

export default function DashboardCampaignCreator() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlacementId = searchParams.get("placement");

  const [currentStep, setCurrentStep] = useState(1);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(initialPlacementId);
  const [emissionType, setEmissionType] = useState<EmissionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Targeting state
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("");
  const [selectedGmina, setSelectedGmina] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch placements
        const { data: placementsData } = await supabase
          .from("ad_placements")
          .select("*")
          .eq("is_active", true);

        setPlacements(placementsData || []);

        // Fetch wallet balance
        const { data: creditsData } = await supabase
          .from("advertiser_credits")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        setWalletBalance(creditsData?.balance || 0);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate pricing
  const dailyRate = emissionType === "exclusive" ? EXCLUSIVE_DAILY_RATE : ROTATION_DAILY_RATE;
  const daysCount = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const totalPrice = daysCount * dailyRate;

  // Handle package selection - update dates
  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    const today = new Date();
    
    switch (packageId) {
      case "1day":
        setStartDate(today);
        setEndDate(today);
        break;
      case "1week":
        setStartDate(today);
        setEndDate(addDays(today, 6));
        break;
      case "1month":
        setStartDate(today);
        setEndDate(addDays(today, 29));
        break;
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedPackage(null); // Clear package selection when manually selecting dates
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type first to determine size limit
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/apng'];
      const videoTypes = ['video/mp4', 'video/webm'];
      const allowedTypes = [...imageTypes, ...videoTypes];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Nieobsługiwany format pliku. Dozwolone: JPG, PNG, GIF, WebP, APNG, MP4, WebM.");
        return;
      }
      
      // Different size limits for images (5MB) and videos/animations (15MB)
      const isVideo = videoTypes.includes(file.type);
      const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
      const maxSizeLabel = isVideo ? "15MB" : "5MB";
      
      if (file.size > maxSize) {
        toast.error(`Plik jest za duży. Maksymalny rozmiar dla ${isVideo ? 'wideo' : 'obrazów'} to ${maxSizeLabel}.`);
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      toast.success("Plik został wybrany");
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate current step
  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!selectedPlacement;
      case 2: return !!emissionType && (emissionType === "exclusive" || !!selectedSlot);
      case 3: return isGlobal || selectedRegions.length > 0; // Targeting validation - at least one region required
      case 4: return !!startDate && !!endDate;
      case 5: return !!campaignName && totalPrice > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedPlacement || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      let uploadedContentUrl = contentUrl || null;

      // Upload file to storage if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ad-campaigns')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Błąd podczas przesyłania pliku");
          setSubmitting(false);
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ad-campaigns')
          .getPublicUrl(fileName);

        uploadedContentUrl = publicUrl;
      }

      // If global, create single campaign
      // If regional with multiple regions, create one campaign per region
      if (isGlobal) {
        const { error } = await supabase.from("ad_campaigns").insert({
          user_id: user.id,
          placement_id: selectedPlacement,
          name: campaignName,
          ad_type: emissionType === "exclusive" ? "exclusive" : `rotation_slot_${selectedSlot}`,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          total_credits: isAdmin ? 0 : totalPrice,
          target_url: targetUrl || null,
          content_url: uploadedContentUrl,
          status: "pending",
          is_global: true,
          region: null,
          target_powiat: null,
          target_gmina: null
        });

        if (error) throw error;
      } else {
        // Create a campaign for each selected region
        const formatRegionName = (region: SelectedRegion) => {
          if (region.gmina) return region.gmina;
          if (region.powiat) return region.powiat;
          return region.voivodeship.charAt(0).toUpperCase() + region.voivodeship.slice(1);
        };

        const campaignsToCreate = selectedRegions.map((region) => ({
          user_id: user.id,
          placement_id: selectedPlacement,
          name: selectedRegions.length > 1 
            ? `${campaignName} - ${formatRegionName(region)}`
            : campaignName,
          ad_type: emissionType === "exclusive" ? "exclusive" : `rotation_slot_${selectedSlot}`,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          total_credits: isAdmin ? 0 : Math.ceil(totalPrice / selectedRegions.length),
          target_url: targetUrl || null,
          content_url: uploadedContentUrl,
          status: "pending",
          is_global: false,
          region: region.voivodeship,
          target_powiat: region.powiat || null,
          target_gmina: region.gmina || null
        }));

        const { error } = await supabase.from("ad_campaigns").insert(campaignsToCreate);

        if (error) throw error;
      }

      const successMessage = !isGlobal && selectedRegions.length > 1
        ? `Utworzono ${selectedRegions.length} kampanii dla wybranych regionów`
        : "Kampania została utworzona i oczekuje na weryfikację";
      
      toast.success(successMessage);
      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Wystąpił błąd podczas tworzenia kampanii");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlacementData = placements.find(p => p.id === selectedPlacement);
  const PlacementIcon = selectedPlacementData ? placementIcons[selectedPlacementData.slug] || Monitor : Monitor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/placements")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nowa kampania</h1>
          <p className="text-muted-foreground">Zarezerwuj miejsce reklamowe</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-1",
                  isActive && "text-primary font-medium",
                  !isActive && "text-muted-foreground"
                )}>
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "w-8 md:w-16 lg:w-24 h-0.5 mx-2",
                  isCompleted ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Placement Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Wybierz miejsce reklamowe</h2>
                <p className="text-muted-foreground">
                  Wybierz format reklamy, który najlepiej pasuje do Twojej kampanii.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {placements.map((placement) => {
                  const Icon = placementIcons[placement.slug] || Monitor;
                  const isSelected = selectedPlacement === placement.id;

                  return (
                    <Card
                      key={placement.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        isSelected && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => {
                        setSelectedPlacement(placement.id);
                        // Auto-set global targeting for top-banner
                        if (GLOBAL_ONLY_PLACEMENT_SLUGS.includes(placement.slug)) {
                          setIsGlobal(true);
                          setSelectedVoivodeship("");
                          setSelectedPowiat("");
                          setSelectedGmina("");
                        }
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{placement.name}</CardTitle>
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-primary" />}
                        </div>
                        {placement.dimensions && (
                          <CardDescription>{placement.dimensions}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {placement.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Emission Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Wybierz typ emisji</h2>
                <p className="text-muted-foreground">
                  Określ jak często Twoja reklama będzie wyświetlana.
                </p>
              </div>

              <EmissionTypeSelector
                selectedType={emissionType}
                selectedSlot={selectedSlot}
                onTypeSelect={setEmissionType}
                onSlotSelect={setSelectedSlot}
                exclusivePrice={EXCLUSIVE_DAILY_RATE}
                rotationPrice={ROTATION_DAILY_RATE}
              />
            </div>
          )}

          {/* Step 3: Targeting */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Wybierz zasięg kampanii</h2>
                <p className="text-muted-foreground">
                  Określ czy reklama ma być wyświetlana w całej Polsce czy tylko w wybranym regionie.
                </p>
              </div>

              {/* Check if selected placement is global-only */}
              {selectedPlacementData && GLOBAL_ONLY_PLACEMENT_SLUGS.includes(selectedPlacementData.slug) ? (
                <div className="space-y-4">
                  <Card className="ring-2 ring-primary border-primary bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Cała Polska</CardTitle>
                        </div>
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <CardDescription>Kampania ogólnopolska</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Twoja reklama będzie wyświetlana wszystkim użytkownikom w Polsce.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-border">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      <strong>Top Banner na stronie głównej</strong> jest dostępny wyłącznie jako reklama ogólnopolska. 
                      Wybór regionu nie jest możliwy dla tego miejsca reklamowego.
                    </p>
                  </div>
                </div>
              ) : (
                /* Targeting Toggle - normal flow for other placements */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        isGlobal && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => {
                        setIsGlobal(true);
                        setSelectedRegions([]);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Cała Polska</CardTitle>
                          </div>
                          {isGlobal && <Check className="h-5 w-5 text-primary" />}
                        </div>
                        <CardDescription>Kampania ogólnopolska</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Twoja reklama będzie wyświetlana wszystkim użytkownikom w Polsce.
                        </p>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        !isGlobal && "ring-2 ring-primary border-primary"
                      )}
                      onClick={() => setIsGlobal(false)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Wybrane regiony</CardTitle>
                          </div>
                          {!isGlobal && <Check className="h-5 w-5 text-primary" />}
                        </div>
                        <CardDescription>Kampania lokalna</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Twoja reklama będzie wyświetlana tylko użytkownikom z wybranych województw.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                {/* Multi Region Selector - only show when local is selected */}
                {!isGlobal && (
                  <div className="mt-6">
                    <Label className="text-base font-medium mb-4 block">
                      Wybierz regiony <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Wybierz jedno lub więcej województw, w których ma być wyświetlana reklama.
                      Dla każdego wybranego regionu zostanie utworzona osobna kampania.
                    </p>
                    <MultiRegionSelector
                      selectedRegions={selectedRegions}
                      onRegionsChange={setSelectedRegions}
                    />
                    {selectedRegions.length === 0 && (
                      <p className="text-sm text-destructive mt-2">
                        Wybierz przynajmniej jedno województwo, aby kontynuować
                      </p>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Date Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Wybierz termin kampanii</h2>
                <p className="text-muted-foreground">
                  Wybierz pakiet lub zaznacz daty w kalendarzu.
                </p>
              </div>

              {/* Pricing Packages */}
              <PricingPackages
                packages={[
                  { id: "1day", name: "1 dzień", days: 1, price: dailyRate, description: "Dobre na szybkie promo" },
                  { id: "1week", name: "1 tydzień", days: 7, price: dailyRate * 6, savings: dailyRate, description: "Oszczędzasz " + dailyRate + " PLN" },
                  { id: "1month", name: "1 miesiąc", days: 30, price: dailyRate * 20, savings: dailyRate * 10, popular: true, description: "Oszczędzasz " + (dailyRate * 10) + " PLN" },
                ]}
                selectedPackage={selectedPackage}
                onPackageSelect={handlePackageSelect}
                dailyRate={dailyRate}
              />

              <Separator />

              {/* Calendar */}
              <div>
                <h3 className="text-lg font-medium mb-4">Lub wybierz własne daty</h3>
                <BookingCalendar
                  selectedStartDate={startDate}
                  selectedEndDate={endDate}
                  onDateSelect={handleDateSelect}
                />
              </div>

              {/* Selection Summary */}
              {startDate && endDate && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Wybrałeś {daysCount} {daysCount === 1 ? "dzień" : daysCount < 5 ? "dni" : "dni"} emisji
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(startDate, "d MMMM", { locale: pl })} – {format(endDate, "d MMMM yyyy", { locale: pl })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{totalPrice} PLN</p>
                        <p className="text-xs text-muted-foreground">
                          {emissionType === "exclusive" ? "Wyłączność" : "Rotacja"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 5: Summary & Payment */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Podsumowanie zamówienia</h2>
                <p className="text-muted-foreground">
                  Sprawdź szczegóły kampanii i podaj nazwę.
                </p>
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Nazwa kampanii *</Label>
                <Input
                  id="campaign-name"
                  placeholder="np. Promocja świąteczna 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-url">Link docelowy (opcjonalnie)</Label>
                <Input
                  id="target-url"
                  type="url"
                  placeholder="https://twoja-strona.pl"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
              </div>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Szczegóły zamówienia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Miejsce reklamowe</span>
                    <span className="font-medium">{selectedPlacementData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Typ emisji</span>
                    <span className="font-medium">
                      {emissionType === "exclusive" ? "Wyłączność (100%)" : `Rotacja (Slot ${selectedSlot})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Okres</span>
                    <span className="font-medium">
                      {startDate && endDate && `${format(startDate, "d.MM.yyyy")} – ${format(endDate, "d.MM.yyyy")}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liczba dni</span>
                    <span className="font-medium">{daysCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zasięg</span>
                    <span className="font-medium flex items-center gap-1">
                      {isGlobal ? (
                        <>
                          <Globe className="h-4 w-4" />
                          Cała Polska
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          {selectedRegions.length === 1 ? (
                            selectedRegions[0].gmina ? (
                              `${selectedRegions[0].gmina}, ${selectedRegions[0].powiat}`
                            ) : selectedRegions[0].powiat ? (
                              `pow. ${selectedRegions[0].powiat}`
                            ) : (
                              `woj. ${selectedRegions[0].voivodeship.charAt(0).toUpperCase()}${selectedRegions[0].voivodeship.slice(1)}`
                            )
                          ) : (
                            `${selectedRegions.length} lokalizacji`
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  {!isGlobal && selectedRegions.length > 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <p className="font-medium mb-2">Wybrane regiony:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRegions.map((r, idx) => (
                          <Badge 
                            key={`${r.voivodeship}-${r.powiat || ''}-${r.gmina || ''}-${idx}`} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {r.gmina ? (
                              `${r.gmina}`
                            ) : r.powiat ? (
                              `pow. ${r.powiat}`
                            ) : (
                              `woj. ${r.voivodeship.charAt(0).toUpperCase() + r.voivodeship.slice(1)}`
                            )}
                          </Badge>
                        ))}
                      </div>
                      {selectedRegions.length > 1 && (
                        <p className="text-xs mt-2 text-muted-foreground/70">
                          Zostanie utworzonych {selectedRegions.length} osobnych kampanii
                        </p>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Do zapłaty</span>
                    <span className="text-primary">{totalPrice} PLN</span>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Info */}
              {isAdmin ? (
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Konto administratora - brak opłat</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jako administrator możesz tworzyć kampanie bez wykorzystania kredytów.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span>Saldo portfela</span>
                      </div>
                      <span className="font-bold">{walletBalance} PLN</span>
                    </div>
                    {walletBalance < totalPrice && (
                      <p className="text-sm text-destructive mt-2">
                        Niewystarczające środki. Doładuj portfel aby kontynuować.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 6: Creative Upload */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Wgraj kreację reklamową</h2>
                <p className="text-muted-foreground">
                  Dodaj grafikę lub multimedia do swojej kampanii.
                </p>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/gif,image/webp,image/apng,video/mp4,video/webm"
                className="hidden"
              />

              {!selectedFile ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="content-url">URL kreacji (grafika/wideo/animacja)</Label>
                    <Input
                      id="content-url"
                      type="url"
                      placeholder="https://... lub wgraj plik poniżej"
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                    />
                  </div>

                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Przeciągnij i upuść plik lub
                    </p>
                    <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      Wybierz plik
                    </Button>
                    <div className="text-xs text-muted-foreground mt-4 space-y-1">
                      <p><strong>Obrazy:</strong> JPG, PNG, GIF, WebP, APNG (max 5MB)</p>
                      <p><strong>Wideo/Animacje:</strong> MP4, WebM (max 15MB)</p>
                    </div>
                  </div>
                </>
              ) : (
                /* File Preview */
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {filePreview ? (
                        <img 
                          src={filePreview} 
                          alt="Podgląd kreacji" 
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedFile.type}
                        </p>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="mt-2"
                          onClick={handleRemoveFile}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Usuń plik
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedPlacementData?.dimensions && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm">
                      <strong>Zalecane wymiary:</strong> {selectedPlacementData.dimensions}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    <strong>Uwaga:</strong> Możesz pominąć ten krok i dodać kreację później. 
                    Kampania zostanie zapisana jako szkic.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wstecz
        </Button>

        {currentStep < STEPS.length ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Dalej
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !campaignName}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Wysyłanie..." : "Zatwierdź kampanię"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
