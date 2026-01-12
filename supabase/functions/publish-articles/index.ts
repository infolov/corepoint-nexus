import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { limit = 50, status = 'pending' } = await req.json().catch(() => ({}));
    
    console.log(`Publishing articles with status: ${status}, limit: ${limit}`);
    
    // Fetch processed articles that have AI title and summary
    const { data: processedArticles, error: fetchError } = await supabase
      .from('processed_articles')
      .select('*')
      .eq('ai_verification_status', status)
      .not('ai_title', 'is', null)
      .not('ai_summary', 'is', null)
      .order('pub_date', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch processed articles: ${fetchError.message}`);
    }

    if (!processedArticles || processedArticles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No articles to publish',
          published: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${processedArticles.length} articles to publish`);

    // Get existing article URLs to avoid duplicates
    const urls = processedArticles.map(a => a.url);
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title')
      .in('title', processedArticles.map(a => a.ai_title));

    const existingTitles = new Set(existingArticles?.map(a => a.title) || []);
    
    // Prepare articles for insertion
    const articlesToInsert = processedArticles
      .filter(article => !existingTitles.has(article.ai_title))
      .map(article => ({
        title: article.ai_title,
        excerpt: article.ai_summary,
        content: article.full_content || article.ai_summary,
        category: mapCategory(article.category),
        image: article.image_url || getDefaultImage(article.category),
        badge: getBadge(article.pub_date),
        created_at: article.pub_date || article.processed_at,
        is_published: true,
        is_featured: false,
        ai_summary: article.ai_summary,
        ai_verification_status: 'verified',
      }));

    if (articlesToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All articles already exist',
          published: 0,
          skipped: processedArticles.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inserting ${articlesToInsert.length} new articles`);

    // Insert articles in batches
    const batchSize = 20;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < articlesToInsert.length; i += batchSize) {
      const batch = articlesToInsert.slice(i, i + batchSize);
      const { error: insertError, data: inserted } = await supabase
        .from('articles')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`Batch insert error: ${insertError.message}`);
        errors.push(insertError.message);
      } else {
        insertedCount += inserted?.length || 0;
      }
    }

    // Update processed articles status to 'published'
    const publishedUrls = processedArticles
      .filter(a => !existingTitles.has(a.ai_title))
      .map(a => a.url);

    if (publishedUrls.length > 0) {
      await supabase
        .from('processed_articles')
        .update({ ai_verification_status: 'verified' })
        .in('url', publishedUrls);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${insertedCount} articles`,
        published: insertedCount,
        skipped: processedArticles.length - articlesToInsert.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error publishing articles:', error);
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

// Map RSS category to our categories
function mapCategory(category: string | null): string {
  const categoryMap: Record<string, string> = {
    'Wiadomości': 'wiadomosci',
    'Biznes': 'biznes',
    'Sport': 'sport',
    'Technologia': 'technologia',
    'Nauka': 'nauka',
    'Rozrywka': 'rozrywka',
    'Zdrowie': 'zdrowie',
  };
  return categoryMap[category || 'Wiadomości'] || 'wiadomosci';
}

// Get default image for category
function getDefaultImage(category: string | null): string {
  const fallbackImages: Record<string, string> = {
    'Wiadomości': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
    'wiadomosci': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
    'Biznes': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
    'biznes': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
    'Sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
    'sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
    'Technologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
    'technologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
    'Nauka': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop',
    'nauka': 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop',
  };
  return fallbackImages[category || 'Wiadomości'] || fallbackImages['Wiadomości'];
}

// Determine badge based on publication date
function getBadge(pubDate: string | null): string | null {
  if (!pubDate) return null;
  
  const date = new Date(pubDate);
  const now = new Date();
  const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 2) return 'new';
  if (hoursDiff < 6) return 'hot';
  return null;
}
