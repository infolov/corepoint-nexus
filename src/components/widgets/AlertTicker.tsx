import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface EmergencyAlert {
  id: string;
  message: string;
  source: string;
  region: string | null;
  priority: number;
  created_at: string;
}

const SCROLL_SPEED_PX_PER_SECOND = 70;

export const AlertTicker = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(25);
  
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { location } = useGeolocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!settingsLoading && settings) {
      const enabled = settings.alert_ticker_enabled;
      setIsEnabled(enabled === true || enabled === 'true');
    }
  }, [settings, settingsLoading]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        const filteredAlerts = data.filter(alert => {
          if (!alert.region) return true;
          if (!location?.voivodeship) return true;
          return alert.region.toLowerCase() === location.voivodeship.toLowerCase();
        });
        setAlerts(filteredAlerts);
      }
    };

    if (isEnabled) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isEnabled, location?.voivodeship]);

  // Calculate animation duration based on content width for 70px/s speed
  const calculateAnimationDuration = useCallback(() => {
    if (tickerRef.current && !isMobile) {
      const contentWidth = tickerRef.current.scrollWidth / 2; // Divided by 2 because content is duplicated
      const duration = contentWidth / SCROLL_SPEED_PX_PER_SECOND;
      setAnimationDuration(Math.max(duration, 10)); // Minimum 10 seconds
    }
  }, [isMobile]);

  useEffect(() => {
    calculateAnimationDuration();
    window.addEventListener('resize', calculateAnimationDuration);
    return () => window.removeEventListener('resize', calculateAnimationDuration);
  }, [calculateAnimationDuration, alerts]);

  // Mobile: cycle through alerts with fade animation
  useEffect(() => {
    if (isMobile && alerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentMobileIndex(prev => (prev + 1) % alerts.length);
        setAnimationKey(prev => prev + 1);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isMobile, alerts.length]);

  if (!isEnabled || alerts.length === 0) {
    return null;
  }

  const hasBreakingNews = alerts.some(a => a.priority >= 10);
  const tickerClass = hasBreakingNews ? 'alert-ticker-breaking' : 'alert-ticker-standard';
  const labelText = hasBreakingNews ? 'PILNE' : 'NEWS';

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: pl });
    } catch {
      return '';
    }
  };

  // Desktop: horizontal scrolling ticker
  const renderDesktopTicker = () => {
    const messageItems = alerts.map((alert, idx) => (
      <span key={alert.id} className="inline-flex items-center">
        {idx > 0 && <span className="mx-4 opacity-60">•</span>}
        <span>{alert.message}</span>
        <span className="ticker-time">{formatRelativeTime(alert.created_at)}</span>
      </span>
    ));

    return (
      <div className="ticker-container">
        <div 
          ref={tickerRef}
          className="animate-ticker ticker-speed-dynamic"
          style={{ animationDuration: `${animationDuration}s` }}
        >
          <span className="inline-flex items-center px-4">
            {messageItems}
          </span>
          <span className="inline-flex items-center px-4">
            {messageItems}
          </span>
        </div>
      </div>
    );
  };

  // Mobile: vertical fade-in/fade-out single message
  const renderMobileTicker = () => {
    const currentAlert = alerts[currentMobileIndex];
    
    return (
      <div className="flex-1 overflow-hidden px-3">
        <div 
          key={animationKey}
          className="mobile-ticker-item flex items-center justify-center gap-2"
        >
          <span className="text-center line-clamp-2">{currentAlert.message}</span>
          <span className="ticker-time whitespace-nowrap">
            {formatRelativeTime(currentAlert.created_at)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full overflow-hidden alert-ticker ${tickerClass}`}>
      <div className="flex items-center py-2">
        {/* Static label - always visible on top */}
        <div className="ticker-label flex-shrink-0 px-3 md:px-4 flex items-center gap-2">
          {hasBreakingNews ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Radio className="h-4 w-4" />
          )}
          <span className="font-semibold text-xs md:text-sm uppercase tracking-wider">
            {labelText}
          </span>
        </div>
        
        {/* Content area - different behavior on mobile vs desktop */}
        {isMobile ? renderMobileTicker() : renderDesktopTicker()}
      </div>
    </div>
  );
};
