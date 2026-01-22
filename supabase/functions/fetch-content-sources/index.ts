import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContentSource {
  id: string;
  category_id: string;
  name: string;
  url: string;
  type: "rss" | "scraping";
  is_active: boolean;
  selector: string | null;
  last_fetched_at: string | null;
  fetch_interval_minutes: number;
}

interface FetchResult {
  source_id: string;
  source_name: string;
  articles_found: number;
  success: boolean;
  error?: string;
}

/**
 * PLACEHOLDER: Supabase Edge Function for fetching content from configured sources
 * 
 * This function will:
 * 1. Retrieve all active content sources from the database
 * 2. For each source, based on type:
 *    - RSS: Parse the RSS feed and extract articles
 *    - Scraping: Use the CSS selector to scrape articles from the page
 * 3. Process and store the fetched articles
 * 4. Update the last_fetched_at timestamp for each source
 * 
 * TODO: Implement the following:
 * - RSS feed parsing logic
 * - Web scraping with CSS selectors
 * - Article deduplication
 * - AI-based article categorization using keywords
 * - Integration with existing article processing pipeline
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active sources
    const { data: sources, error: sourcesError } = await supabase
      .from("content_sources")
      .select("*")
      .eq("is_active", true);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    const results: FetchResult[] = [];

    for (const source of sources as ContentSource[]) {
      try {
        // Check if enough time has passed since last fetch
        if (source.last_fetched_at) {
          const lastFetch = new Date(source.last_fetched_at);
          const nextFetch = new Date(lastFetch.getTime() + source.fetch_interval_minutes * 60 * 1000);
          if (new Date() < nextFetch) {
            console.log(`Skipping ${source.name}: next fetch at ${nextFetch.toISOString()}`);
            continue;
          }
        }

        let articlesFound = 0;

        if (source.type === "rss") {
          // TODO: Implement RSS fetching
          // const articles = await fetchRSSFeed(source.url);
          // articlesFound = articles.length;
          console.log(`PLACEHOLDER: Would fetch RSS from ${source.url}`);
        } else if (source.type === "scraping") {
          // TODO: Implement web scraping with selector
          // const articles = await scrapeWebPage(source.url, source.selector);
          // articlesFound = articles.length;
          console.log(`PLACEHOLDER: Would scrape ${source.url} with selector: ${source.selector}`);
        }

        // Update last_fetched_at
        await supabase
          .from("content_sources")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", source.id);

        results.push({
          source_id: source.id,
          source_name: source.name,
          articles_found: articlesFound,
          success: true,
        });
      } catch (err) {
        console.error(`Error processing source ${source.name}:`, err);
        results.push({
          source_id: source.id,
          source_name: source.name,
          articles_found: 0,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Content fetch completed",
        sources_processed: results.length,
        results,
        note: "This is a placeholder implementation. RSS parsing and web scraping logic needs to be implemented.",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in fetch-content-sources:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
