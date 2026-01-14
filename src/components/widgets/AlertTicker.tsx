import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useGeolocation } from '@/hooks/use-geolocation';

interface EmergencyAlert {
  id: string;
  message: string;
  source: string;
  region: string | null;
  priority: number;
}

type TickerSpeed = 'slow' | 'normal' | 'fast';

export const AlertTicker = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [speed, setSpeed] = useState<TickerSpeed>('normal');
  const { settings, loading: settingsLoading, getSetting } = useSiteSettings();
  const { location } = useGeolocation();

  useEffect(() => {
    if (!settingsLoading && settings) {
      const enabled = settings.alert_ticker_enabled;
      setIsEnabled(enabled === true || enabled === 'true');
      
      const tickerSpeed = getSetting('alert_ticker_speed', 'normal') as TickerSpeed;
      setSpeed(tickerSpeed);
    }
  }, [settings, settingsLoading, getSetting]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter by region if user location is available
        const filteredAlerts = data.filter(alert => {
          if (!alert.region) return true; // Global alerts
          if (!location?.voivodeship) return true; // Show all if no location
          return alert.region.toLowerCase() === location.voivodeship.toLowerCase();
        });
        setAlerts(filteredAlerts);
      }
    };

    if (isEnabled) {
      fetchAlerts();
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, location?.voivodeship]);

  if (!isEnabled || alerts.length === 0) {
    return null;
  }

  const combinedMessage = alerts.map(a => a.message).join(' • ');
  const speedClass = `ticker-speed-${speed}`;

  return (
    <div className="w-full bg-destructive text-destructive-foreground overflow-hidden">
      <div className="flex items-center py-2">
        <div className="flex-shrink-0 px-3 flex items-center gap-2 bg-destructive/90 z-10">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-semibold text-sm uppercase tracking-wide">Alert</span>
        </div>
        <div className="ticker-container">
          <div className={`animate-ticker ${speedClass}`}>
            <span className="inline-block px-8 text-sm font-medium">
              {combinedMessage}
            </span>
            <span className="inline-block px-8 text-sm font-medium">
              {combinedMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
