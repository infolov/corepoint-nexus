import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
// Header i Footer renderowane globalnie przez MainLayout
// import { Header } from "@/components/layout/Header";
// import { Footer } from "@/components/layout/Footer";
import { InterestsSelector } from "@/components/auth/InterestsSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type AuthMode = "login" | "register";
type RegistrationStep = "form" | "interests";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Interests state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  // Redirect if already logged in - will be handled by Dashboard's useEffect
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    if (password.length < 6) {
      toast.error("Hasło musi mieć co najmniej 6 znaków");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            toast.error("Nieprawidłowy email lub hasło");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Zalogowano pomyślnie!");
        navigate("/dashboard");
      } else {
        // Register regular user
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Ten email jest już zarejestrowany");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Move to interests step
        if (data.user) {
          setNewUserId(data.user.id);
          setRegistrationStep("interests");
          toast.success("Konto utworzone! Wybierz swoje zainteresowania.");
        }
      }
    } catch (error) {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInterests = async () => {
    if (!newUserId) {
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_notification_preferences")
        .upsert({
          user_id: newUserId,
          categories: selectedCategories,
          tags: selectedTags,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error saving interests:", error);
      }

      toast.success("Świetnie! Twoje konto jest gotowe.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving interests:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipInterests = () => {
    toast.success("Konto utworzone! Możesz zmienić zainteresowania później.");
    navigate("/dashboard");
  };

  const handleBackToForm = () => {
    setRegistrationStep("form");
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error("Błąd logowania przez Google");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-lg p-8">
            {/* Interests Step */}
            {registrationStep === "interests" ? (
              <div>
                <button
                  onClick={handleBackToForm}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Wróć</span>
                </button>
                <InterestsSelector
                  selectedCategories={selectedCategories}
                  selectedTags={selectedTags}
                  onCategoriesChange={setSelectedCategories}
                  onTagsChange={setSelectedTags}
                  onContinue={handleSaveInterests}
                  onSkip={handleSkipInterests}
                  isLoading={loading}
                  showSkip={true}
                  submitLabel="Zakończ rejestrację"
                />
              </div>
            ) : (
              <>
                {/* Logo */}
                <div className="text-center mb-8">
                  <Link to="/" className="inline-flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero-gradient">
                      <span className="text-2xl font-bold text-primary-foreground">I</span>
                    </div>
                  </Link>
                  <h1 className="mt-4 text-2xl font-bold">
                    {mode === "login" ? "Zaloguj się" : "Utwórz konto"}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    {mode === "login" 
                      ? "Witaj ponownie! Zaloguj się do swojego konta." 
                      : "Załóż konto, aby śledzić ulubione tematy."}
                  </p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
                  <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      mode === "login"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMode("login")}
                  >
                    Logowanie
                  </button>
                  <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      mode === "register"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMode("register")}
                  >
                    Rejestracja
                  </button>
                </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Imię"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-muted-foreground">Zapamiętaj mnie</span>
                  </label>
                  <Link to="/reset-password" className="text-primary hover:underline">
                    Zapomniałeś hasła?
                  </Link>
                </div>
              )}

              {mode === "register" && (
                <label className="flex items-start gap-2 cursor-pointer text-sm">
                  <input type="checkbox" className="rounded border-input mt-1" required />
                  <span className="text-muted-foreground">
                    Akceptuję{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      regulamin
                    </a>{" "}
                    oraz{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      politykę prywatności
                    </a>
                  </span>
                </label>
              )}

              <Button type="submit" variant="gradient" className="w-full" size="xl" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  mode === "login" ? "Zaloguj się" : "Utwórz konto"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">lub kontynuuj przez</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            {/* Partner Info */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-foreground">Chcesz zostać Partnerem?</strong><br />
                Skontaktuj się z nami, aby uzyskać dostęp do panelu Partnera i możliwość prowadzenia kampanii reklamowych.
              </p>
            </div>
              </>
            )}
          </div>

          {/* Bottom Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>
                Nie masz jeszcze konta?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-primary hover:underline font-medium"
                >
                  Zarejestruj się
                </button>
              </>
            ) : (
              <>
                Masz już konto?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-medium"
                >
                  Zaloguj się
                </button>
              </>
            )}
          </p>
        </div>
      </main>

    </div>
  );
}
