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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      // [LC-008 manual augment — pending CLI regen]
      analytics_events: {
        Row: {
          id: string
          event_name: string
          user_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          user_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      // [LC-008 manual augment — pending CLI regen]
      cart_strategies: {
        Row: {
          id: string
          student_id: string
          list_id: string
          strategy: "cheapest" | "fastest" | "recommended"
          items: Json
          total_cents: number
          total_items: number
          unavailable_items: number
          has_partial_strategy: boolean
          retailers_summary: Json
          generated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          student_id: string
          list_id: string
          strategy: "cheapest" | "fastest" | "recommended"
          items: Json
          total_cents?: number
          total_items?: number
          unavailable_items?: number
          has_partial_strategy?: boolean
          retailers_summary?: Json
          generated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          list_id?: string
          strategy?: "cheapest" | "fastest" | "recommended"
          items?: Json
          total_cents?: number
          total_items?: number
          unavailable_items?: number
          has_partial_strategy?: boolean
          retailers_summary?: Json
          generated_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_strategies_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_strategies_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string | null
          id: string
          items_already_owned: string[] | null
          list_id: string
          options: Json
          parent_id: string
          selected_at: string | null
          selected_strategy: Database["public"]["Enums"]["cart_strategy"] | null
          short_code: string
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_already_owned?: string[] | null
          list_id: string
          options: Json
          parent_id: string
          selected_at?: string | null
          selected_strategy?:
            | Database["public"]["Enums"]["cart_strategy"]
            | null
          short_code: string
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items_already_owned?: string[] | null
          list_id?: string
          options?: Json
          parent_id?: string
          selected_at?: string | null
          selected_strategy?:
            | Database["public"]["Enums"]["cart_strategy"]
            | null
          short_code?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          canonical_name: string
          category: string
          created_at: string | null
          id: string
          keywords: string[] | null
          sample_image_url: string | null
          typical_specs: Json | null
          typical_unit: string | null
        }
        Insert: {
          canonical_name: string
          category: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          sample_image_url?: string | null
          typical_specs?: Json | null
          typical_unit?: string | null
        }
        Update: {
          canonical_name?: string
          category?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          sample_image_url?: string | null
          typical_specs?: Json | null
          typical_unit?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          body: string
          id: string
          list_id: string | null
          read_count: number | null
          school_id: string
          sent_at: string | null
          sent_by: string | null
          sent_to_count: number | null
          title: string
        }
        Insert: {
          body: string
          id?: string
          list_id?: string | null
          read_count?: number | null
          school_id: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to_count?: number | null
          title: string
        }
        Update: {
          body?: string
          id?: string
          list_id?: string | null
          read_count?: number | null
          school_id?: string
          sent_at?: string | null
          sent_by?: string | null
          sent_to_count?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "admin_schools_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_link_clicks: {
        Row: {
          cart_id: string
          clicked_at: string | null
          estimated_subtotal: number | null
          id: string
          item_count: number | null
          parent_id: string | null
          retailer: Database["public"]["Enums"]["retailer_slug"]
        }
        Insert: {
          cart_id: string
          clicked_at?: string | null
          estimated_subtotal?: number | null
          id?: string
          item_count?: number | null
          parent_id?: string | null
          retailer: Database["public"]["Enums"]["retailer_slug"]
        }
        Update: {
          cart_id?: string
          clicked_at?: string | null
          estimated_subtotal?: number | null
          id?: string
          item_count?: number | null
          parent_id?: string | null
          retailer?: Database["public"]["Enums"]["retailer_slug"]
        }
        Relationships: [
          {
            foreignKeyName: "deep_link_clicks_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_link_clicks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inep_schools: {
        Row: {
          address: string | null
          admin_category: string | null
          admin_dependency: string | null
          cep: string | null
          cep_source: string | null
          city: string
          education_levels: string | null
          imported_at: string | null
          inep_code: string
          latitude: number | null
          location: string | null
          longitude: number | null
          phone: string | null
          restrictions: string | null
          school_size: string | null
          trade_name: string
          uf: string
        }
        Insert: {
          address?: string | null
          admin_category?: string | null
          admin_dependency?: string | null
          cep?: string | null
          cep_source?: string | null
          city: string
          education_levels?: string | null
          imported_at?: string | null
          inep_code: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          restrictions?: string | null
          school_size?: string | null
          trade_name: string
          uf: string
        }
        Update: {
          address?: string | null
          admin_category?: string | null
          admin_dependency?: string | null
          cep?: string | null
          cep_source?: string | null
          city?: string
          education_levels?: string | null
          imported_at?: string | null
          inep_code?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          restrictions?: string | null
          school_size?: string | null
          trade_name?: string
          uf?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          catalog_match_id: string | null
          created_at: string | null
          id: string
          list_id: string
          name: string
          notes: string | null
          position: number
          procon_reason: string | null
          procon_status: Database["public"]["Enums"]["procon_severity"] | null
          quantity: number
          specification: string | null
          // [LC-008 manual augment — pending CLI regen]
          suggested_query: string | null
          unit: string | null
        }
        Insert: {
          catalog_match_id?: string | null
          created_at?: string | null
          id?: string
          list_id: string
          name: string
          notes?: string | null
          position: number
          procon_reason?: string | null
          procon_status?: Database["public"]["Enums"]["procon_severity"] | null
          quantity?: number
          specification?: string | null
          // [LC-008 manual augment]
          suggested_query?: string | null
          unit?: string | null
        }
        Update: {
          catalog_match_id?: string | null
          created_at?: string | null
          id?: string
          list_id?: string
          name?: string
          notes?: string | null
          position?: number
          procon_reason?: string | null
          procon_status?: Database["public"]["Enums"]["procon_severity"] | null
          quantity?: number
          specification?: string | null
          // [LC-008 manual augment]
          suggested_query?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          grade: string
          id: string
          pending_manual_digitization: boolean
          procon_report: Json | null
          procon_severity: Database["public"]["Enums"]["procon_severity"] | null
          published_at: string | null
          raw_file_url: string | null
          school_id: string
          school_year: number
          source: Database["public"]["Enums"]["list_source"]
          status: Database["public"]["Enums"]["list_status"]
          teacher_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grade: string
          id?: string
          pending_manual_digitization?: boolean
          procon_report?: Json | null
          procon_severity?:
            | Database["public"]["Enums"]["procon_severity"]
            | null
          published_at?: string | null
          raw_file_url?: string | null
          school_id: string
          school_year?: number
          source: Database["public"]["Enums"]["list_source"]
          status?: Database["public"]["Enums"]["list_status"]
          teacher_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grade?: string
          id?: string
          pending_manual_digitization?: boolean
          procon_report?: Json | null
          procon_severity?:
            | Database["public"]["Enums"]["procon_severity"]
            | null
          published_at?: string | null
          raw_file_url?: string | null
          school_id?: string
          school_year?: number
          source?: Database["public"]["Enums"]["list_source"]
          status?: Database["public"]["Enums"]["list_status"]
          teacher_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "admin_schools_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      // [LC-008 manual augment — pending CLI regen]
      ml_search_cache: {
        Row: {
          id: string
          query_normalized: string
          source: "mercadolibre"
          results: Json
          fetched_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          query_normalized: string
          source?: "mercadolibre"
          results: Json
          fetched_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          query_normalized?: string
          source?: "mercadolibre"
          results?: Json
          fetched_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cep: string | null
          city: string | null
          consent_analytics: boolean | null
          consent_marketing: boolean | null
          consent_privacy_at: string | null
          consent_terms_at: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          city?: string | null
          consent_analytics?: boolean | null
          consent_marketing?: boolean | null
          consent_privacy_at?: string | null
          consent_terms_at?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          city?: string | null
          consent_analytics?: boolean | null
          consent_marketing?: boolean | null
          consent_privacy_at?: string | null
          consent_terms_at?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      retailer_links: {
        Row: {
          catalog_item_id: string
          created_at: string | null
          estimated_price: number | null
          id: string
          last_checked_at: string | null
          retailer: Database["public"]["Enums"]["retailer_slug"]
          search_url: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          last_checked_at?: string | null
          retailer: Database["public"]["Enums"]["retailer_slug"]
          search_url: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          last_checked_at?: string | null
          retailer?: Database["public"]["Enums"]["retailer_slug"]
          search_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_links_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admins: {
        Row: {
          created_at: string | null
          // [LC-002.5 manual augment — pending CLI regen]
          deleted_at: string | null
          id: string
          role: string | null
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          // [LC-002.5 manual augment — pending CLI regen]
          deleted_at?: string | null
          id?: string
          role?: string | null
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          // [LC-002.5 manual augment — pending CLI regen]
          deleted_at?: string | null
          id?: string
          role?: string | null
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "admin_schools_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // [LC-002.5 manual augment — pending CLI regen]
      school_admin_audit_log: {
        Row: {
          action: "school_admin_invited" | "school_admin_redeemed" | "school_admin_removed"
          actor_id: string
          created_at: string
          id: string
          invite_id: string | null
          metadata: Json
          school_id: string
          target_id: string | null
        }
        Insert: {
          action: "school_admin_invited" | "school_admin_redeemed" | "school_admin_removed"
          actor_id: string
          created_at?: string
          id?: string
          invite_id?: string | null
          metadata?: Json
          school_id: string
          target_id?: string | null
        }
        Update: {
          action?: "school_admin_invited" | "school_admin_redeemed" | "school_admin_removed"
          actor_id?: string
          created_at?: string
          id?: string
          invite_id?: string | null
          metadata?: Json
          school_id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      // [LC-002.5 manual augment — pending CLI regen]
      school_admin_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          revoked_at: string | null
          revoked_reason: "admin_removed" | "manual" | null
          school_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          revoked_reason?: "admin_removed" | "manual" | null
          school_id: string
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revoked_at?: string | null
          revoked_reason?: "admin_removed" | "manual" | null
          school_id?: string
          token?: string
        }
        Relationships: []
      }
      school_status_log: {
        Row: {
          changed_at: string
          changed_by: string
          from_status: Database["public"]["Enums"]["school_status"] | null
          id: string
          reason: string | null
          school_id: string
          to_status: Database["public"]["Enums"]["school_status"]
        }
        Insert: {
          changed_at?: string
          changed_by: string
          from_status?: Database["public"]["Enums"]["school_status"] | null
          id?: string
          reason?: string | null
          school_id: string
          to_status: Database["public"]["Enums"]["school_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string
          from_status?: Database["public"]["Enums"]["school_status"] | null
          id?: string
          reason?: string | null
          school_id?: string
          to_status?: Database["public"]["Enums"]["school_status"]
        }
        Relationships: [
          {
            foreignKeyName: "school_status_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_status_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "admin_schools_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_status_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          cep: string | null
          city: string
          cnpj: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          email_likely_institutional: boolean
          id: string
          inep_code: string | null
          latitude: number | null
          legal_name: string
          longitude: number | null
          manually_added: boolean
          neighborhood: string | null
          phone: string | null
          rejected_reason: string | null
          slug: string
          state: string
          status: Database["public"]["Enums"]["school_status"]
          trade_name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          email_likely_institutional?: boolean
          id?: string
          inep_code?: string | null
          latitude?: number | null
          legal_name: string
          longitude?: number | null
          manually_added?: boolean
          neighborhood?: string | null
          phone?: string | null
          rejected_reason?: string | null
          slug: string
          state?: string
          status?: Database["public"]["Enums"]["school_status"]
          trade_name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cep?: string | null
          city?: string
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          email_likely_institutional?: boolean
          id?: string
          inep_code?: string | null
          latitude?: number | null
          legal_name?: string
          longitude?: number | null
          manually_added?: boolean
          neighborhood?: string | null
          phone?: string | null
          rejected_reason?: string | null
          slug?: string
          state?: string
          status?: Database["public"]["Enums"]["school_status"]
          trade_name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // [LC-007 manual augment — pending CLI regen]
      student_owned_items: {
        Row: {
          id: string
          student_id: string
          list_item_id: string
          marked_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          list_item_id: string
          marked_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          list_item_id?: string
          marked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_owned_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_owned_items_list_item_id_fkey"
            columns: ["list_item_id"]
            isOneToOne: false
            referencedRelation: "list_items"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          // [LC-007 manual augment — pending CLI regen]
          deleted_at: string | null
          first_name: string
          grade: string | null
          id: string
          list_id: string | null
          parent_id: string
          parental_consent_at: string
          parental_consent_version: string
          school_id: string | null
          // [LC-007 manual augment — pending CLI regen]
          teacher_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          // [LC-007 manual augment]
          deleted_at?: string | null
          first_name: string
          grade?: string | null
          id?: string
          list_id?: string | null
          parent_id: string
          parental_consent_at: string
          parental_consent_version: string
          school_id?: string | null
          // [LC-007 manual augment]
          teacher_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          // [LC-007 manual augment]
          deleted_at?: string | null
          first_name?: string
          grade?: string | null
          id?: string
          list_id?: string | null
          parent_id?: string
          parental_consent_at?: string
          parental_consent_version?: string
          school_id?: string | null
          // [LC-007 manual augment]
          teacher_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "admin_schools_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students_access_log: {
        Row: {
          accessed_at: string | null
          accessed_by: string | null
          action: string
          id: string
          // [LC-008 manual augment — pending CLI regen]
          metadata: Json
          student_id: string
        }
        Insert: {
          accessed_at?: string | null
          accessed_by?: string | null
          action: string
          id?: string
          // [LC-008 manual augment]
          metadata?: Json
          student_id: string
        }
        Update: {
          accessed_at?: string | null
          accessed_by?: string | null
          action?: string
          id?: string
          // [LC-008 manual augment]
          metadata?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_access_log_accessed_by_fkey"
            columns: ["accessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_access_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_captures: {
        Row: {
          cart_id: string | null
          id: string
          media_url: string | null
          parent_id: string | null
          parsed_list: Json | null
          processed_at: string | null
          received_at: string | null
          school_name_hint: string | null
          sender_phone: string
          status: string
        }
        Insert: {
          cart_id?: string | null
          id?: string
          media_url?: string | null
          parent_id?: string | null
          parsed_list?: Json | null
          processed_at?: string | null
          received_at?: string | null
          school_name_hint?: string | null
          sender_phone: string
          status?: string
        }
        Update: {
          cart_id?: string | null
          id?: string
          media_url?: string | null
          parent_id?: string | null
          parsed_list?: Json | null
          processed_at?: string | null
          received_at?: string | null
          school_name_hint?: string | null
          sender_phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_captures_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_captures_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_schools_queue: {
        Row: {
          address: string | null
          admins_count: number | null
          approved_at: string | null
          approved_by: string | null
          cep: string | null
          city: string | null
          cnpj: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          email_likely_institutional: boolean | null
          id: string | null
          inep_code: string | null
          latitude: number | null
          legal_name: string | null
          longitude: number | null
          manually_added: boolean | null
          neighborhood: string | null
          phone: string | null
          priority_score: number | null
          rejected_reason: string | null
          slug: string | null
          state: string | null
          status: Database["public"]["Enums"]["school_status"] | null
          trade_name: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          admins_count?: never
          approved_at?: string | null
          approved_by?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          email_likely_institutional?: boolean | null
          id?: string | null
          inep_code?: string | null
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          manually_added?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          priority_score?: never
          rejected_reason?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["school_status"] | null
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          admins_count?: never
          approved_at?: string | null
          approved_by?: string | null
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          email_likely_institutional?: boolean | null
          id?: string | null
          inep_code?: string | null
          latitude?: number | null
          legal_name?: string | null
          longitude?: number | null
          manually_added?: boolean | null
          neighborhood?: string | null
          phone?: string | null
          priority_score?: never
          rejected_reason?: string | null
          slug?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["school_status"] | null
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // [LC-007 manual augment — pending CLI regen]
      my_students_with_progress: {
        Row: {
          id: string | null
          parent_id: string | null
          first_name: string | null
          school_id: string | null
          grade: string | null
          teacher_name: string | null
          list_id: string | null
          parental_consent_at: string | null
          parental_consent_version: string | null
          created_at: string | null
          school_trade_name: string | null
          school_slug: string | null
          list_school_year: number | null
          total_items: number
          owned_items: number
        }
        Relationships: []
      }
    }
    Functions: {
      // [LC-007 manual augment — pending CLI regen]
      register_student: {
        Args: {
          p_first_name: string
          p_school_id: string
          p_grade: string | null
          p_teacher_name: string | null
          p_consent_version: string
        }
        Returns: {
          id: string
          list_id: string | null
          requires_list_selection: boolean
        }[]
      }
      // [LC-007 manual augment — pending CLI regen]
      soft_delete_student: {
        Args: { p_student_id: string }
        Returns: { id: string; deleted_at: string }[]
      }
      // [LC-007 manual augment — pending CLI regen]
      toggle_owned_item: {
        Args: { p_student_id: string; p_list_item_id: string }
        Returns: { marked: boolean; marked_at: string | null }[]
      }
      admin_change_school_status: {
        Args: {
          p_reason?: string
          p_school_id: string
          p_to_status: Database["public"]["Enums"]["school_status"]
        }
        Returns: {
          changed_at: string
          school_id: string
          status: Database["public"]["Enums"]["school_status"]
        }[]
      }
      // [LC-002.5 manual augment — pending CLI regen]
      create_admin_invite: {
        Args: { p_school_id: string }
        Returns: {
          invite_id: string
          token: string
          expires_at: string
        }[]
      }
      create_list_with_items: {
        Args: {
          p_grade: string
          p_items: Json
          p_pending_manual_digitization: boolean
          p_raw_file_url: string
          p_school_id: string
          p_school_year: number
          p_source: Database["public"]["Enums"]["list_source"]
          p_teacher_name: string
        }
        Returns: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["list_status"]
        }[]
      }
      generate_short_code: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      publish_list: {
        Args: { p_list_id: string }
        Returns: {
          id: string
          published_at: string
          status: Database["public"]["Enums"]["list_status"]
        }[]
      }
      // [LC-002.5 manual augment — pending CLI regen]
      redeem_admin_invite: {
        Args: { p_token: string }
        Returns: {
          school_id: string
          idempotent: boolean
        }[]
      }
      // [LC-002.5 manual augment — pending CLI regen]
      remove_school_admin: {
        Args: { p_school_id: string; p_target_user_id: string }
        Returns: undefined
      }
      search_approved_schools: {
        Args: {
          city_filter?: string
          limit_n?: number
          q: string
          uf_filter?: string
        }
        Returns: {
          city: string
          id: string
          neighborhood: string
          published_lists_count: number
          rank: number
          slug: string
          state: string
          trade_name: string
        }[]
      }
      search_inep_schools: {
        Args: {
          city_filter?: string
          limit_n?: number
          q: string
          uf_filter?: string
        }
        Returns: {
          address: string
          cep: string
          city: string
          inep_code: string
          latitude: number
          longitude: number
          rank: number
          trade_name: string
          uf: string
        }[]
      }
      slugify: { Args: { text_to_slugify: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      cart_strategy: "cheapest" | "fastest" | "recommended"
      list_source:
        | "school_upload_pdf"
        | "school_upload_photo"
        | "school_manual"
        | "whatsapp_capture"
        | "parent_upload"
      list_status: "draft" | "published" | "archived"
      procon_severity: "compliant" | "warning" | "violation"
      retailer_slug: "kalunga" | "magalu" | "mercadolivre" | "amazon"
      school_status: "pending_approval" | "approved" | "rejected" | "suspended"
      user_role: "parent" | "school_admin" | "platform_admin"
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
      cart_strategy: ["cheapest", "fastest", "recommended"],
      list_source: [
        "school_upload_pdf",
        "school_upload_photo",
        "school_manual",
        "whatsapp_capture",
        "parent_upload",
      ],
      list_status: ["draft", "published", "archived"],
      procon_severity: ["compliant", "warning", "violation"],
      retailer_slug: ["kalunga", "magalu", "mercadolivre", "amazon"],
      school_status: ["pending_approval", "approved", "rejected", "suspended"],
      user_role: ["parent", "school_admin", "platform_admin"],
    },
  },
} as const
