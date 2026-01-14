import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IMGWWarning {
  id?: string;
  name?: string;
  level?: number;
  from?: string;
  to?: string;
  content?: string;
  probability?: number;
  teryt?: string[];
  wojewodztwo?: string;
}

interface RCBItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

// Map TERYT voivodeship codes to names
const terytToVoivodeship: Record<string, string> = {
  '02': 'dolnośląskie',
  '04': 'kujawsko-pomorskie',
  '06': 'lubelskie',
  '08': 'lubuskie',
  '10': 'łódzkie',
  '12': 'małopolskie',
  '14': 'mazowieckie',
  '16': 'opolskie',
  '18': 'podkarpackie',
  '20': 'podlaskie',
  '22': 'pomorskie',
  '24': 'śląskie',
  '26': 'świętokrzyskie',
  '28': 'warmińsko-mazurskie',
  '30': 'wielkopolskie',
  '32': 'zachodniopomorskie',
};

// Extract voivodeship from TERYT code
function getVoivodeshipFromTeryt(terytCodes: string[]): string | null {
  if (!terytCodes || terytCodes.length === 0) return null;
  const firstCode = terytCodes[0];
  if (firstCode && firstCode.length >= 2) {
    const voivCode = firstCode.substring(0, 2);
    return terytToVoivodeship[voivCode] || null;
  }
  return null;
}

// Parse simple XML RSS
function parseRSSItem(xml: string): RCBItem[] {
  const items: RCBItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i.exec(itemContent);
    const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i.exec(itemContent);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
    const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent);
    
    items.push({
      title: (titleMatch?.[1] || titleMatch?.[2] || '').trim(),
      description: (descMatch?.[1] || descMatch?.[2] || '').trim(),
      pubDate: (pubDateMatch?.[1] || '').trim(),
      link: (linkMatch?.[1] || '').trim(),
    });
  }
  
  return items;
}

// Fetch IMGW meteorological warnings
async function fetchIMGWMeteoWarnings(): Promise<{ message: string; region: string | null; source: string; priority: number }[]> {
  const alerts: { message: string; region: string | null; source: string; priority: number }[] = [];
  
  try {
    const response = await fetch('https://meteo.imgw.pl/api/meteo/messages/v1/osmet/latest/osmet-teryt', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.log('IMGW Meteo API returned:', response.status);
      return alerts;
    }
    
    const data = await response.json();
    console.log('IMGW Meteo data received:', JSON.stringify(data).substring(0, 500));
    
    // Parse the IMGW response structure
    if (data && typeof data === 'object') {
      // IMGW returns warnings grouped by region/type
      const processWarning = (warning: IMGWWarning, region?: string) => {
        if (warning.content || warning.name) {
          const warningText = warning.content || warning.name || '';
          const level = warning.level || 1;
          const voivodeship = region || getVoivodeshipFromTeryt(warning.teryt || []) || warning.wojewodztwo;
          
          alerts.push({
            message: `${warning.name ? warning.name + ': ' : ''}${warningText}`.substring(0, 500),
            region: voivodeship || null,
            source: 'imgw',
            priority: Math.min(level, 3),
          });
        }
      };
      
      // Handle array of warnings
      if (Array.isArray(data)) {
        data.forEach((item: IMGWWarning) => processWarning(item));
      } 
      // Handle object with warnings property
      else if (data.warnings && Array.isArray(data.warnings)) {
        data.warnings.forEach((item: IMGWWarning) => processWarning(item));
      }
      // Handle nested structure by region
      else {
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item: IMGWWarning) => processWarning(item, key));
          } else if (value && typeof value === 'object') {
            processWarning(value as IMGWWarning, key);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error fetching IMGW Meteo warnings:', error);
  }
  
  return alerts;
}

// Fetch IMGW hydrological warnings
async function fetchIMGWHydroWarnings(): Promise<{ message: string; region: string | null; source: string; priority: number }[]> {
  const alerts: { message: string; region: string | null; source: string; priority: number }[] = [];
  
  try {
    const response = await fetch('https://meteo.imgw.pl/api/meteo/messages/v1/warnhydro/latest/warn', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.log('IMGW Hydro API returned:', response.status);
      return alerts;
    }
    
    const data = await response.json();
    console.log('IMGW Hydro data received:', JSON.stringify(data).substring(0, 500));
    
    if (data && Array.isArray(data)) {
      data.forEach((warning: IMGWWarning) => {
        if (warning.content || warning.name) {
          alerts.push({
            message: `Ostrzeżenie hydrologiczne: ${warning.content || warning.name}`.substring(0, 500),
            region: getVoivodeshipFromTeryt(warning.teryt || []) || warning.wojewodztwo || null,
            source: 'imgw',
            priority: warning.level ? Math.min(warning.level, 3) : 2,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching IMGW Hydro warnings:', error);
  }
  
  return alerts;
}

// Fetch RCB alerts from RSS
async function fetchRCBAlerts(): Promise<{ message: string; region: string | null; source: string; priority: number }[]> {
  const alerts: { message: string; region: string | null; source: string; priority: number }[] = [];
  
  try {
    // Try gov.pl RCB RSS feed
    const response = await fetch('https://www.gov.pl/web/rcb/rss.xml', {
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    
    if (!response.ok) {
      console.log('RCB RSS returned:', response.status);
      return alerts;
    }
    
    const xmlText = await response.text();
    console.log('RCB RSS received:', xmlText.substring(0, 500));
    
    const items = parseRSSItem(xmlText);
    
    // Filter for recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    items.forEach((item) => {
      // Check if it's a recent alert
      const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0;
      if (pubDate < oneDayAgo) return;
      
      // Check if title contains alert-related keywords
      const alertKeywords = ['alert', 'ostrzeżenie', 'zagrożenie', 'uwaga', 'alarm', 'ewakuacja', 'niebezpieczeństwo'];
      const titleLower = item.title.toLowerCase();
      const isAlert = alertKeywords.some(keyword => titleLower.includes(keyword));
      
      if (isAlert || item.title.includes('RCB')) {
        // Try to extract region from title/description
        let region: string | null = null;
        const voivodeships = Object.values(terytToVoivodeship);
        for (const voiv of voivodeships) {
          if (item.title.toLowerCase().includes(voiv) || item.description.toLowerCase().includes(voiv)) {
            region = voiv;
            break;
          }
        }
        
        alerts.push({
          message: `${item.title}${item.description ? ': ' + item.description : ''}`.substring(0, 500),
          region,
          source: 'rcb',
          priority: 3, // RCB alerts are typically high priority
        });
      }
    });
  } catch (error) {
    console.error('Error fetching RCB alerts:', error);
  }
  
  return alerts;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting emergency alerts fetch...');
    
    // Fetch from all sources in parallel
    const [imgwMeteo, imgwHydro, rcb] = await Promise.all([
      fetchIMGWMeteoWarnings(),
      fetchIMGWHydroWarnings(),
      fetchRCBAlerts(),
    ]);
    
    const allAlerts = [...imgwMeteo, ...imgwHydro, ...rcb];
    console.log(`Fetched ${allAlerts.length} alerts total`);
    
    if (allAlerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new alerts found',
          counts: { imgwMeteo: 0, imgwHydro: 0, rcb: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Deactivate old external alerts (older than 24 hours or from previous fetch)
    const { error: deactivateError } = await supabase
      .from('emergency_alerts')
      .update({ is_active: false })
      .in('source', ['imgw', 'rcb'])
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    if (deactivateError) {
      console.error('Error deactivating old alerts:', deactivateError);
    }
    
    // Insert new alerts, avoiding duplicates by checking message
    let insertedCount = 0;
    
    for (const alert of allAlerts) {
      // Check if similar alert already exists
      const { data: existing } = await supabase
        .from('emergency_alerts')
        .select('id')
        .eq('message', alert.message)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!existing) {
        const { error: insertError } = await supabase
          .from('emergency_alerts')
          .insert({
            message: alert.message,
            region: alert.region,
            source: alert.source,
            priority: alert.priority,
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          });
        
        if (insertError) {
          console.error('Error inserting alert:', insertError);
        } else {
          insertedCount++;
        }
      }
    }
    
    console.log(`Inserted ${insertedCount} new alerts`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fetched and processed alerts`,
        counts: { 
          imgwMeteo: imgwMeteo.length, 
          imgwHydro: imgwHydro.length, 
          rcb: rcb.length,
          inserted: insertedCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in fetch-emergency-alerts:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
