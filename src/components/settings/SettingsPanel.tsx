import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { DisplaySettings } from "./DisplaySettings";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export function SettingsPanel({ isOpen, onClose, onSettingsSaved }: SettingsPanelProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Settings are saved automatically via DisplayModeProvider
    toast.success("Ustawienia zapisane");
    onSettingsSaved?.();
    
    setIsSaving(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-border">
          <SheetTitle className="text-xl font-bold">Ustawienia</SheetTitle>
          {!user && (
            <SheetDescription>
              Zaloguj się, aby zapisać ustawienia na koncie
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="py-6 space-y-6">
          {/* Display Settings (Theme, Font Size) */}
          <DisplaySettings />

          {/* Account Section */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Konto
            </h3>
            
            {user ? (
              <div className="space-y-2">
                <Link to="/dashboard/settings" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      <span>Ustawienia konta</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link to="/interests" onClick={onClose}>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-3">
                      <span>📰</span>
                      <span>Moje zainteresowania</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/login" onClick={onClose}>
                <Button className="w-full">
                  Zaloguj się
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Gotowe"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
