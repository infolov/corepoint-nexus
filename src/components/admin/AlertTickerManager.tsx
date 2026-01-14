import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { useEmergencyAlerts } from '@/hooks/use-emergency-alerts';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

export const AlertTickerManager = () => {
  const { alerts, loading, createAlert, toggleAlert, deleteAlert, refetch } = useEmergencyAlerts();
  const { settings, updateSetting, getSetting } = useSiteSettings();
  const { toast } = useToast();
  
  const [newAlert, setNewAlert] = useState({
    message: '',
    source: 'manual',
    region: '',
    priority: 1,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const isTickerEnabled = getSetting('alert_ticker_enabled', true);

  const handleToggleTicker = async () => {
    await updateSetting('alert_ticker_enabled', !isTickerEnabled, true);
  };

  const handleFetchExternalAlerts = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-emergency-alerts');
      
      if (error) throw error;
      
      toast({
        title: 'Sukces',
        description: `Pobrano alerty: IMGW Meteo: ${data.counts?.imgwMeteo || 0}, IMGW Hydro: ${data.counts?.imgwHydro || 0}, RCB: ${data.counts?.rcb || 0}. Dodano: ${data.counts?.inserted || 0}`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error fetching external alerts:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać alertów zewnętrznych',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddAlert = async () => {
    if (!newAlert.message.trim()) return;
    
    const success = await createAlert({
      message: newAlert.message,
      source: newAlert.source,
      region: newAlert.region || null,
      priority: newAlert.priority,
    });

    if (success) {
      setNewAlert({ message: '', source: 'manual', region: '', priority: 1 });
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Pasek Alertów</CardTitle>
              <CardDescription>
                Zarządzaj alertami wyświetlanymi na stronie głównej (m.in. RCB)
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ticker-enabled" className="text-sm">
              {isTickerEnabled ? 'Włączony' : 'Wyłączony'}
            </Label>
            <Switch
              id="ticker-enabled"
              checked={isTickerEnabled === true || isTickerEnabled === 'true'}
              onCheckedChange={handleToggleTicker}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fetch external alerts button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleFetchExternalAlerts} 
            variant="secondary"
            disabled={isFetching}
            className="flex-1"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Pobierz alerty z RCB/IMGW
          </Button>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj ręcznie
            </Button>
          )}
        </div>

        {isAdding && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="space-y-2">
              <Label>Treść alertu</Label>
              <Textarea
                placeholder="Wpisz treść alertu..."
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Źródło</Label>
                <Select
                  value={newAlert.source}
                  onValueChange={(value) => setNewAlert({ ...newAlert, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Ręczny</SelectItem>
                    <SelectItem value="rcb">RCB</SelectItem>
                    <SelectItem value="imgw">IMGW</SelectItem>
                    <SelectItem value="police">Policja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region (opcjonalnie)</Label>
                <Select
                  value={newAlert.region || '__all__'}
                  onValueChange={(value) => setNewAlert({ ...newAlert, region: value === '__all__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cała Polska" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Cała Polska</SelectItem>
                    {VOIVODESHIPS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorytet</Label>
                <Select
                  value={String(newAlert.priority)}
                  onValueChange={(value) => setNewAlert({ ...newAlert, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Normalny</SelectItem>
                    <SelectItem value="2">Wysoki</SelectItem>
                    <SelectItem value="3">Krytyczny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Anuluj
              </Button>
              <Button onClick={handleAddAlert} disabled={!newAlert.message.trim()}>
                Dodaj alert
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Aktywne alerty</h4>
          
          {loading ? (
            <div className="text-sm text-muted-foreground">Ładowanie...</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
              Brak alertów
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-background"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                        {alert.is_active ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                      <Badge variant="outline">{alert.source}</Badge>
                      {alert.region && (
                        <Badge variant="outline">{alert.region}</Badge>
                      )}
                      {alert.priority > 1 && (
                        <Badge variant="destructive">
                          Priorytet: {alert.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      Dodano: {format(new Date(alert.created_at), 'dd MMM yyyy, HH:mm', { locale: pl })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.is_active}
                      onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
