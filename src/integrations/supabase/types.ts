export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          ad_type: string
          content_text: string | null
          content_url: string | null
          created_at: string
          end_date: string
          id: string
          is_global: boolean
          name: string
          placement_id: string
          region: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          target_gmina: string | null
          target_powiat: string | null
          target_url: string | null
          tile_position: number | null
          total_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_type: string
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_global?: boolean
          name: string
          placement_id: string
          region?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          target_gmina?: string | null
          target_powiat?: string | null
          target_url?: string | null
          tile_position?: number | null
          total_credits: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_type?: string
          content_text?: string | null
          content_url?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_global?: boolean
          name?: string
          placement_id?: string
          region?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          target_gmina?: string | null
          target_powiat?: string | null
          target_url?: string | null
          tile_position?: number | null
          total_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placement_regional_pricing: {
        Row: {
          created_at: string
          credit_cost: number
          id: string
          placement_id: string
          region_name: string
          region_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_cost: number
          id?: string
          placement_id: string
          region_name: string
          region_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_cost?: number
          id?: string
          placement_id?: string
          region_name?: string
          region_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_placement_regional_pricing_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_placements: {
        Row: {
          created_at: string
          credit_cost: number
          description: string | null
          dimensions: string | null
          id: string
          is_active: boolean
          name: string
          section2_credit_cost: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          credit_cost?: number
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name: string
          section2_credit_cost?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          credit_cost?: number
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name?: string
          section2_credit_cost?: number | null
          slug?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_email: string | null
          admin_id: string
          created_at: string
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_email?: string | null
          admin_id: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_email?: string | null
          admin_id?: string
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      advertiser_credits: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      article_summaries: {
        Row: {
          article_id: string
          created_at: string
          id: string
          summary: string
          title_hash: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          summary: string
          title_hash: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          summary?: string
          title_hash?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          ai_summary: string | null
          ai_verification_status: string | null
          author_id: string | null
          badge: string | null
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          generation_attempts: number | null
          id: string
          image: string
          is_featured: boolean
          is_published: boolean
          is_sponsored: boolean | null
          region: string | null
          sponsor_status: string | null
          sponsor_user_id: string | null
          subcategory: string | null
          target_url: string | null
          title: string
          updated_at: string
          verification_feedback: Json | null
          view_count: number
        }
        Insert: {
          ai_summary?: string | null
          ai_verification_status?: string | null
          author_id?: string | null
          badge?: string | null
          category: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          generation_attempts?: number | null
          id?: string
          image: string
          is_featured?: boolean
          is_published?: boolean
          is_sponsored?: boolean | null
          region?: string | null
          sponsor_status?: string | null
          sponsor_user_id?: string | null
          subcategory?: string | null
          target_url?: string | null
          title: string
          updated_at?: string
          verification_feedback?: Json | null
          view_count?: number
        }
        Update: {
          ai_summary?: string | null
          ai_verification_status?: string | null
          author_id?: string | null
          badge?: string | null
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          generation_attempts?: number | null
          id?: string
          image?: string
          is_featured?: boolean
          is_published?: boolean
          is_sponsored?: boolean | null
          region?: string | null
          sponsor_status?: string | null
          sponsor_user_id?: string | null
          subcategory?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string
          verification_feedback?: Json | null
          view_count?: number
        }
        Relationships: []
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          clicks: number
          created_at: string
          date: string
          id: string
          impressions: number
        }
        Insert: {
          campaign_id: string
          clicks?: number
          created_at?: string
          date: string
          id?: string
          impressions?: number
        }
        Update: {
          campaign_id?: string
          clicks?: number
          created_at?: string
          date?: string
          id?: string
          impressions?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_banner_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          placement_position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          placement_position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          placement_position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      carousel_banners: {
        Row: {
          campaign_id: string | null
          created_at: string
          display_order: number
          group_id: string
          id: string
          local_campaign_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          display_order?: number
          group_id: string
          id?: string
          local_campaign_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          display_order?: number
          group_id?: string
          id?: string
          local_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_banners_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_banners_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "carousel_banner_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_banners_local_campaign_id_fkey"
            columns: ["local_campaign_id"]
            isOneToOne: false
            referencedRelation: "local_ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          name: string
          price_eur: number | null
          price_pln: number
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          name: string
          price_eur?: number | null
          price_pln: number
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          name?: string
          price_eur?: number | null
          price_pln?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          package_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          package_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          package_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          article_ids: string[]
          audio_url: string | null
          created_at: string
          id: string
          region: string | null
          summary_date: string
          summary_text: string
          updated_at: string
          view_count_total: number | null
        }
        Insert: {
          article_ids?: string[]
          audio_url?: string | null
          created_at?: string
          id?: string
          region?: string | null
          summary_date: string
          summary_text: string
          updated_at?: string
          view_count_total?: number | null
        }
        Update: {
          article_ids?: string[]
          audio_url?: string | null
          created_at?: string
          id?: string
          region?: string | null
          summary_date?: string
          summary_text?: string
          updated_at?: string
          view_count_total?: number | null
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          priority: number | null
          region: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          priority?: number | null
          region?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          priority?: number | null
          region?: string | null
          source?: string | null
        }
        Relationships: []
      }
      journalists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          price_per_article: number
          specialization: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          price_per_article?: number
          specialization?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_article?: number
          specialization?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      local_ad_campaigns: {
        Row: {
          ad_type: string
          budget_credits: number
          clicks: number | null
          content_text: string | null
          content_url: string | null
          cpm_rate: number
          created_at: string
          end_date: string
          id: string
          impressions: number | null
          name: string
          placement_id: string
          rejection_reason: string | null
          spent_credits: number | null
          start_date: string
          status: string
          target_regions: Json
          target_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_type: string
          budget_credits: number
          clicks?: number | null
          content_text?: string | null
          content_url?: string | null
          cpm_rate: number
          created_at?: string
          end_date: string
          id?: string
          impressions?: number | null
          name: string
          placement_id: string
          rejection_reason?: string | null
          spent_credits?: number | null
          start_date: string
          status?: string
          target_regions?: Json
          target_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_type?: string
          budget_credits?: number
          clicks?: number | null
          content_text?: string | null
          content_url?: string | null
          cpm_rate?: number
          created_at?: string
          end_date?: string
          id?: string
          impressions?: number | null
          name?: string
          placement_id?: string
          rejection_reason?: string | null
          spent_credits?: number | null
          start_date?: string
          status?: string
          target_regions?: Json
          target_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_ad_campaigns_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "local_ad_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      local_ad_placements: {
        Row: {
          base_cpm_pln: number
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          is_active: boolean | null
          name: string
          placement_type: string
          slug: string
        }
        Insert: {
          base_cpm_pln?: number
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          placement_type: string
          slug: string
        }
        Update: {
          base_cpm_pln?: number
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          placement_type?: string
          slug?: string
        }
        Relationships: []
      }
      local_campaign_stats: {
        Row: {
          campaign_id: string
          clicks: number | null
          created_at: string
          credits_spent: number | null
          date: string
          id: string
          impressions: number | null
          region_slug: string
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          created_at?: string
          credits_spent?: number | null
          date: string
          id?: string
          impressions?: number | null
          region_slug: string
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          created_at?: string
          credits_spent?: number | null
          date?: string
          id?: string
          impressions?: number | null
          region_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "local_ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      local_news_sources: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          source_name: string
          source_type: string
          updated_at: string
          url: string
          voivodeship: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          source_name: string
          source_type?: string
          updated_at?: string
          url: string
          voivodeship: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          source_name?: string
          source_type?: string
          updated_at?: string
          url?: string
          voivodeship?: string
        }
        Relationships: []
      }
      news_cache: {
        Row: {
          category: string | null
          content: Json
          created_at: string
          id: string
          last_fetched_at: string
          source_url: string
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string
          id?: string
          last_fetched_at?: string
          source_url: string
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string
          id?: string
          last_fetched_at?: string
          source_url?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          admin_notes: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          industry: string
          message: string | null
          partnership_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry: string
          message?: string | null
          partnership_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_category?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          industry?: string
          message?: string | null
          partnership_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_campaigns: {
        Row: {
          category_slug: string | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          logo_text: string | null
          logo_url: string | null
          name: string
          partner_type: string
          start_date: string
          target_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          logo_text?: string | null
          logo_url?: string | null
          name: string
          partner_type: string
          start_date?: string
          target_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          logo_text?: string | null
          logo_url?: string | null
          name?: string
          partner_type?: string
          start_date?: string
          target_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_articles: {
        Row: {
          ai_summary: string | null
          ai_title: string | null
          ai_verification_status: string
          category: string | null
          created_at: string
          full_content: string | null
          id: string
          image_url: string | null
          processed_at: string
          pub_date: string | null
          source: string | null
          title: string
          url: string
          verification_logs: Json | null
        }
        Insert: {
          ai_summary?: string | null
          ai_title?: string | null
          ai_verification_status?: string
          category?: string | null
          created_at?: string
          full_content?: string | null
          id?: string
          image_url?: string | null
          processed_at?: string
          pub_date?: string | null
          source?: string | null
          title: string
          url: string
          verification_logs?: Json | null
        }
        Update: {
          ai_summary?: string | null
          ai_title?: string | null
          ai_verification_status?: string
          category?: string | null
          created_at?: string
          full_content?: string | null
          id?: string
          image_url?: string | null
          processed_at?: string
          pub_date?: string | null
          source?: string | null
          title?: string
          url?: string
          verification_logs?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regional_pricing: {
        Row: {
          cpm_multiplier: number
          created_at: string
          id: string
          is_active: boolean | null
          parent_voivodeship: string | null
          population_tier: string | null
          region_name: string
          region_slug: string
          region_type: string
        }
        Insert: {
          cpm_multiplier?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_voivodeship?: string | null
          population_tier?: string | null
          region_name: string
          region_slug: string
          region_type: string
        }
        Update: {
          cpm_multiplier?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          parent_voivodeship?: string | null
          population_tier?: string | null
          region_name?: string
          region_slug?: string
          region_type?: string
        }
        Relationships: []
      }
      rss_sources: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          source_name: string
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_name: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          source_name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sponsored_article_orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          journalist_id: string | null
          price: number
          status: string
          target_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          journalist_id?: string | null
          price: number
          status?: string
          target_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          journalist_id?: string | null
          price?: number
          status?: string
          target_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_article_orders_journalist_id_fkey"
            columns: ["journalist_id"]
            isOneToOne: false
            referencedRelation: "journalists"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_subcategories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_category: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category?: string | null
          slug?: string
        }
        Relationships: []
      }
      user_local_sources: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          source_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          source_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_local_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "local_news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          breaking_news: boolean
          categories: string[] | null
          created_at: string
          daily_digest: boolean
          font_size: string | null
          id: string
          personalized: boolean
          tags: string[] | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          breaking_news?: boolean
          categories?: string[] | null
          created_at?: string
          daily_digest?: boolean
          font_size?: string | null
          id?: string
          personalized?: boolean
          tags?: string[] | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          breaking_news?: boolean
          categories?: string[] | null
          created_at?: string
          daily_digest?: boolean
          font_size?: string | null
          id?: string
          personalized?: boolean
          tags?: string[] | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          article_url: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          article_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          article_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recently_viewed: {
        Row: {
          article_id: string
          category: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          article_id: string
          category: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          article_id?: string
          category?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recently_viewed_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_site_settings: {
        Row: {
          city: string | null
          county: string | null
          created_at: string
          id: string
          language: string | null
          locality: string | null
          region: string | null
          updated_at: string
          user_id: string
          voivodeship: string | null
        }
        Insert: {
          city?: string | null
          county?: string | null
          created_at?: string
          id?: string
          language?: string | null
          locality?: string | null
          region?: string | null
          updated_at?: string
          user_id: string
          voivodeship?: string | null
        }
        Update: {
          city?: string | null
          county?: string | null
          created_at?: string
          id?: string
          language?: string | null
          locality?: string | null
          region?: string | null
          updated_at?: string
          user_id?: string
          voivodeship?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_add_local_sources_for_user: {
        Args: { p_user_id: string; p_voivodeship: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_click: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      increment_campaign_impression: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "advertiser" | "admin" | "publisher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "advertiser", "admin", "publisher"],
    },
  },
} as const
