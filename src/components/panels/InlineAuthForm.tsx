import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthView = "login" | "register" | "reset-password";

interface InlineAuthFormProps {
  initialView?: AuthView;
}

export function InlineAuthForm({ initialView = "login" }: InlineAuthFormProps) {
  const [view, setView] = useState<AuthView>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setName("");
    setShowPassword(false);
    setResetSent(false);
  };

  const switchView = (v: AuthView) => {
    resetFields();
    setView(v);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Nieprawidłowy email lub hasło"
            : error.message
        );
        return;
      }
      toast.success("Zalogowano pomyślnie!");
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: name },
        },
      });
      if (error) {
        toast.error(
          error.message.includes("already registered")
            ? "Ten email jest już zarejestrowany"
            : error.message
        );
        return;
      }
      if (data.user) {
        toast.success("Konto utworzone! Sprawdź email, aby potwierdzić rejestrację.");
      }
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Wprowadź adres email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setResetSent(true);
      toast.success("Email z linkiem do resetu hasła został wysłany");
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error("Błąd logowania przez Google");
  };

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm";

  // ── Reset password view ──
  if (view === "reset-password") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => switchView("login")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do logowania
        </button>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground">Resetuj hasło</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Podaj email — wyślemy link do resetu.
          </p>
        </div>

        {resetSent ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Email wysłany!</p>
            <p className="text-xs text-muted-foreground">
              Sprawdź skrzynkę i kliknij link.
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => switchView("login")}>
              Wróć do logowania
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Wyślij link resetujący"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // ── Login / Register view ──
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            view === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => switchView("login")}
        >
          Logowanie
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            view === "register"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => switchView("register")}
        >
          Rejestracja
        </button>
      </div>

      {/* Form */}
      <form onSubmit={view === "login" ? handleLogin : handleRegister} className="space-y-3">
        {view === "register" && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Imię"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} !pr-10`}
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {view === "login" && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => switchView("reset-password")}
              className="text-xs text-primary hover:underline"
            >
              Zapomniałeś hasła?
            </button>
          </div>
        )}

        {view === "register" && (
          <label className="flex items-start gap-2 cursor-pointer text-xs">
            <input type="checkbox" className="rounded border-input mt-0.5" required />
            <span className="text-muted-foreground">
              Akceptuję{" "}
              <a href="/terms" className="text-primary hover:underline">regulamin</a>{" "}
              oraz{" "}
              <a href="/privacy" className="text-primary hover:underline">politykę prywatności</a>
            </span>
          </label>
        )}

        <Button type="submit" variant="gradient" className="w-full text-white" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : view === "login" ? (
            "Zaloguj się"
          ) : (
            "Utwórz konto"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">lub</span>
        </div>
      </div>

      {/* Google */}
      <Button variant="outline" className="w-full" size="sm" onClick={handleGoogleLogin}>
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </Button>

      {/* Bottom toggle link */}
      <p className="text-center text-xs text-muted-foreground">
        {view === "login" ? (
          <>
            Nie masz konta?{" "}
            <button onClick={() => switchView("register")} className="text-primary hover:underline font-medium">
              Zarejestruj się
            </button>
          </>
        ) : (
          <>
            Masz konto?{" "}
            <button onClick={() => switchView("login")} className="text-primary hover:underline font-medium">
              Zaloguj się
            </button>
          </>
        )}
      </p>
    </div>
  );
}
