import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Handshake, Building2, Mail, Phone, User, Briefcase, FileText, Send, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  companyName: z.string().min(2, "Nazwa firmy musi mieć min. 2 znaki").max(100),
  contactName: z.string().min(2, "Imię i nazwisko musi mieć min. 2 znaki").max(100),
  contactEmail: z.string().email("Niepoprawny adres email").max(255),
  contactPhone: z.string().optional(),
  industry: z.string().min(1, "Wybierz branżę"),
  partnershipType: z.enum(["site", "category"], { required_error: "Wybierz typ partnerstwa" }),
  targetCategory: z.string().optional(),
  message: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const industries = [
  "Motoryzacja",
  "Finanse i ubezpieczenia",
  "Nieruchomości",
  "Technologia",
  "Handel detaliczny",
  "Zdrowie i uroda",
  "Edukacja",
  "Turystyka",
  "Sport",
  "Rozrywka",
  "Gastronomia",
  "Budownictwo",
  "Rolnictwo",
  "Usługi prawne",
  "Inne",
];

const categories = [
  { slug: "polska", name: "Polska" },
  { slug: "swiat", name: "Świat" },
  { slug: "biznes", name: "Biznes" },
  { slug: "sport", name: "Sport" },
  { slug: "technologia", name: "Technologia" },
  { slug: "kultura", name: "Kultura" },
  { slug: "zdrowie", name: "Zdrowie" },
  { slug: "nauka", name: "Nauka" },
];

export default function DashboardPartnerApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<{ status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      industry: "",
      partnershipType: undefined,
      targetCategory: "",
      message: "",
    },
  });

  const watchPartnershipType = form.watch("partnershipType");

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("partner_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setExistingApplication(data);
      }
      setLoading(false);
    };

    checkExistingApplication();
  }, [user]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Musisz być zalogowany");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("partner_applications").insert({
        user_id: user.id,
        company_name: values.companyName,
        contact_name: values.contactName,
        contact_email: values.contactEmail,
        contact_phone: values.contactPhone || null,
        industry: values.industry,
        partnership_type: values.partnershipType,
        target_category: values.partnershipType === "category" ? values.targetCategory : null,
        message: values.message || null,
      });

      if (error) throw error;

      toast.success("Zgłoszenie zostało wysłane!", {
        description: "Skontaktujemy się z Tobą wkrótce.",
      });

      setExistingApplication({ status: "pending" });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Błąd podczas wysyłania zgłoszenia", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (existingApplication) {
    const statusConfig = {
      pending: { color: "text-yellow-600", bg: "bg-yellow-50", label: "Oczekuje na rozpatrzenie" },
      approved: { color: "text-green-600", bg: "bg-green-50", label: "Zaakceptowane" },
      rejected: { color: "text-red-600", bg: "bg-red-50", label: "Odrzucone" },
    };
    const config = statusConfig[existingApplication.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="max-w-2xl mx-auto">
        <Card className={config.bg}>
          <CardContent className="p-8 text-center">
            <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${config.color}`} />
            <h2 className="text-2xl font-bold mb-2">Zgłoszenie zostało wysłane</h2>
            <p className="text-muted-foreground mb-4">
              Status: <span className={`font-semibold ${config.color}`}>{config.label}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Nasz zespół przeanalizuje Twoje zgłoszenie i skontaktuje się z Tobą w ciągu 2-3 dni roboczych.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Handshake className="h-7 w-7 text-primary" />
          Zostań Partnerem
        </h1>
        <p className="text-muted-foreground mt-1">
          Wypełnij formularz, aby zostać partnerem serwisu lub sponsorem kategorii.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Partner Serwisu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Twoje logo widoczne w nagłówku strony głównej. Ekskluzywna pozycja dla jednego partnera.
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Partner Kategorii</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Twoje logo widoczne w nagłówku wybranej kategorii. Dotrzyj do specyficznej grupy odbiorców.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formularz zgłoszeniowy</CardTitle>
          <CardDescription>
            Wypełnij poniższe dane, a nasz zespół skontaktuje się z Tobą w sprawie szczegółów współpracy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa firmy *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Twoja Firma Sp. z o.o." className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imię i nazwisko *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Jan Kowalski" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email kontaktowy *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="email" placeholder="jan@firma.pl" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="+48 123 456 789" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branża *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Wybierz branżę" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partnershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ partnerstwa *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <Handshake className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Wybierz typ partnerstwa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="site">Partner Serwisu (logo w nagłówku)</SelectItem>
                        <SelectItem value="category">Partner Kategorii (sponsoring kategorii)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchPartnershipType === "category" && (
                <FormField
                  control={form.control}
                  name="targetCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferowana kategoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz kategorię" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Możesz wskazać preferowaną kategorię. Ostateczna dostępność zostanie potwierdzona przez nasz zespół.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dodatkowa wiadomość</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Opisz swoje oczekiwania, pytania lub dodatkowe informacje..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Wyślij zgłoszenie
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
