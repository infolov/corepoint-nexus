import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Radio, MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useLocationContext } from '@/components/geolocation/LocationProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ALERT_TYPES } from '@/data/categories';

interface EmergencyAlert {
  id: string;
  message: string;
  source: string;
  region: string | null;
  priority: number;
  created_at: string;
}

type AlertSection = 'all' | 'pilne' | 'ostrzezenia' | 'lokalnie';

const SCROLL_SPEED_PX_PER_SECOND = 70;

export const AlertTicker = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [activeSection, setActiveSection] = useState<AlertSection>('all');
  const tickerRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(25);
  
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { location } = useLocationContext();
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
        // Don't filter here - we'll filter by section
        setAlerts(data);
      }
    };

    if (isEnabled) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isEnabled]);

  // Filter alerts by active section
  const filteredAlerts = alerts.filter(alert => {
    if (activeSection === 'all') {
      // For "all", show regional alerts only if they match user's location
      if (alert.region && location?.voivodeship) {
        return alert.region.toLowerCase() === location.voivodeship.toLowerCase();
      }
      return !alert.region; // Show non-regional alerts
    }
    
    if (activeSection === 'pilne') {
      return alert.priority >= 10;
    }
    
    if (activeSection === 'ostrzezenia') {
      return alert.priority >= 5 && alert.priority < 10;
    }
    
    if (activeSection === 'lokalnie') {
      if (!location?.voivodeship) return false;
      return alert.region?.toLowerCase() === location.voivodeship.toLowerCase();
    }
    
    return true;
  });

  // Calculate animation duration based on content width
  const calculateAnimationDuration = useCallback(() => {
    if (tickerRef.current && !isMobile) {
      const contentWidth = tickerRef.current.scrollWidth / 2;
      const duration = contentWidth / SCROLL_SPEED_PX_PER_SECOND;
      setAnimationDuration(Math.max(duration, 10));
    }
  }, [isMobile]);

  useEffect(() => {
    calculateAnimationDuration();
    window.addEventListener('resize', calculateAnimationDuration);
    return () => window.removeEventListener('resize', calculateAnimationDuration);
  }, [calculateAnimationDuration, filteredAlerts]);

  // Mobile: cycle through alerts with fade animation
  useEffect(() => {
    if (isMobile && filteredAlerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentMobileIndex(prev => (prev + 1) % filteredAlerts.length);
        setAnimationKey(prev => prev + 1);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isMobile, filteredAlerts.length]);

  if (!isEnabled || alerts.length === 0) {
    return null;
  }

  const hasBreakingNews = filteredAlerts.some(a => a.priority >= 10);
  const tickerClass = hasBreakingNews ? 'alert-ticker-breaking' : 'alert-ticker-standard';

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: pl });
    } catch {
      return '';
    }
  };

  const getSectionIcon = (section: AlertSection) => {
    switch (section) {
      case 'pilne':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'ostrzezenia':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'lokalnie':
        return <MapPin className="h-3.5 w-3.5" />;
      default:
        return <Radio className="h-3.5 w-3.5" />;
    }
  };

  const getSectionCount = (section: AlertSection): number => {
    return alerts.filter(alert => {
      if (section === 'all') return true;
      if (section === 'pilne') return alert.priority >= 10;
      if (section === 'ostrzezenia') return alert.priority >= 5 && alert.priority < 10;
      if (section === 'lokalnie') {
        if (!location?.voivodeship) return false;
        return alert.region?.toLowerCase() === location.voivodeship.toLowerCase();
      }
      return false;
    }).length;
  };

  // Desktop: horizontal scrolling ticker
  const renderDesktopTicker = () => {
    if (filteredAlerts.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Brak alertów w tej sekcji
        </div>
      );
    }

    const messageItems = filteredAlerts.map((alert, idx) => (
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
    if (filteredAlerts.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-3">
          Brak alertów
        </div>
      );
    }

    const currentAlert = filteredAlerts[currentMobileIndex % filteredAlerts.length];
    
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
      {/* Section tabs */}
      <div className="flex items-center border-b border-white/10">
        {(['all', 'pilne', 'ostrzezenia', 'lokalnie'] as AlertSection[]).map((section) => {
          const count = getSectionCount(section);
          const sectionLabel = section === 'all' ? 'Wszystkie' : 
                              section === 'pilne' ? 'Pilne' :
                              section === 'ostrzezenia' ? 'Ostrzeżenia' : 'Lokalnie';
          
          return (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === section
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {getSectionIcon(section)}
              <span className="hidden sm:inline">{sectionLabel}</span>
              {count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  activeSection === section ? "bg-white/30" : "bg-white/10"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ticker content */}
      <div className="flex items-center py-2">
        {/* Static label */}
        <div className="ticker-label flex-shrink-0 px-3 md:px-4 flex items-center gap-2">
          {hasBreakingNews ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Radio className="h-4 w-4" />
          )}
          <span className="font-semibold text-xs md:text-sm uppercase tracking-wider">
            {activeSection === 'pilne' ? 'PILNE' : 
             activeSection === 'ostrzezenia' ? 'ALERT' :
             activeSection === 'lokalnie' ? 'LOKALNIE' : 'NEWS'}
          </span>
        </div>
        
        {/* Content area */}
        {isMobile ? renderMobileTicker() : renderDesktopTicker()}
      </div>
    </div>
  );
};
