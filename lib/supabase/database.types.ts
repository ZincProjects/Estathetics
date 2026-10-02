// Generated from the live Supabase schema. Regenerate with `npm run db:types`.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          design_id: string | null
          id: string
          owner_id: string
          role: string
          room_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          design_id?: string | null
          id?: string
          owner_id?: string
          role: string
          room_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          design_id?: string | null
          id?: string
          owner_id?: string
          role?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          agent_id: string
          created_at: string
          designer_id: string | null
          id: string
          invite_email: string | null
          listing_id: string
          message: string | null
          status: Database["public"]["Enums"]["collab_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string
          created_at?: string
          designer_id?: string | null
          id?: string
          invite_email?: string | null
          listing_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          designer_id?: string | null
          id?: string
          invite_email?: string | null
          listing_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      design_breakdowns: {
        Row: {
          created_at: string
          data: Json
          design_id: string
          owner_id: string
          prompt_version: string
        }
        Insert: {
          created_at?: string
          data: Json
          design_id: string
          owner_id?: string
          prompt_version: string
        }
        Update: {
          created_at?: string
          data?: Json
          design_id?: string
          owner_id?: string
          prompt_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_breakdowns_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: true
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      designs: {
        Row: {
          batch_id: string
          chosen: boolean
          created_at: string
          id: string
          listing_id: string | null
          listing_photo_id: string | null
          owner_id: string
          prompt: string | null
          provider: string | null
          room_id: string | null
          source_photo_id: string | null
          status: Database["public"]["Enums"]["design_status"]
          storage_path: string | null
          theme_id: string | null
          theme_name: string
          variation: number
        }
        Insert: {
          batch_id: string
          chosen?: boolean
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_photo_id?: string | null
          owner_id?: string
          prompt?: string | null
          provider?: string | null
          room_id?: string | null
          source_photo_id?: string | null
          status?: Database["public"]["Enums"]["design_status"]
          storage_path?: string | null
          theme_id?: string | null
          theme_name: string
          variation?: number
        }
        Update: {
          batch_id?: string
          chosen?: boolean
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_photo_id?: string | null
          owner_id?: string
          prompt?: string | null
          provider?: string | null
          room_id?: string | null
          source_photo_id?: string | null
          status?: Database["public"]["Enums"]["design_status"]
          storage_path?: string | null
          theme_id?: string | null
          theme_name?: string
          variation?: number
        }
        Relationships: [
          {
            foreignKeyName: "designs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_listing_photo_id_fkey"
            columns: ["listing_photo_id"]
            isOneToOne: false
            referencedRelation: "listing_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_source_photo_id_fkey"
            columns: ["source_photo_id"]
            isOneToOne: false
            referencedRelation: "room_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          kind: string
          message: string | null
          output: Json | null
          owner_id: string
          progress: number
          provider_ref: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          kind: string
          message?: string | null
          output?: Json | null
          owner_id?: string
          progress?: number
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          kind?: string
          message?: string | null
          output?: Json | null
          owner_id?: string
          progress?: number
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget: string | null
          consent_text: string
          created_at: string
          design_id: string | null
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["lead_kind"]
          listing_id: string | null
          message: string | null
          name: string
          pdpa_consent: boolean
          phone: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["lead_status"]
          timeline: string | null
        }
        Insert: {
          budget?: string | null
          consent_text: string
          created_at?: string
          design_id?: string | null
          email?: string | null
          id?: string
          kind: Database["public"]["Enums"]["lead_kind"]
          listing_id?: string | null
          message?: string | null
          name: string
          pdpa_consent: boolean
          phone?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
        }
        Update: {
          budget?: string | null
          consent_text?: string
          created_at?: string
          design_id?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["lead_kind"]
          listing_id?: string | null
          message?: string | null
          name?: string
          pdpa_consent?: boolean
          phone?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_amenities: {
        Row: {
          category: string
          created_at: string
          distance_m: number
          id: string
          lat: number
          listing_id: string
          lng: number
          name: string
          source: string
          walk_minutes: number
        }
        Insert: {
          category: string
          created_at?: string
          distance_m: number
          id?: string
          lat: number
          listing_id: string
          lng: number
          name: string
          source: string
          walk_minutes: number
        }
        Update: {
          category?: string
          created_at?: string
          distance_m?: number
          id?: string
          lat?: number
          listing_id?: string
          lng?: number
          name?: string
          source?: string
          walk_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_amenities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_content: {
        Row: {
          agent_id: string
          created_at: string
          data: Json
          id: string
          is_current: boolean
          kind: Database["public"]["Enums"]["content_kind"]
          listing_id: string
          prompt_version: string
          tone: string | null
        }
        Insert: {
          agent_id?: string
          created_at?: string
          data: Json
          id?: string
          is_current?: boolean
          kind: Database["public"]["Enums"]["content_kind"]
          listing_id: string
          prompt_version: string
          tone?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          data?: Json
          id?: string
          is_current?: boolean
          kind?: Database["public"]["Enums"]["content_kind"]
          listing_id?: string
          prompt_version?: string
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_content_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          agent_id: string
          created_at: string
          height: number | null
          id: string
          listing_id: string
          room_label: string | null
          sort: number
          storage_path: string
          width: number | null
        }
        Insert: {
          agent_id?: string
          created_at?: string
          height?: number | null
          id?: string
          listing_id: string
          room_label?: string | null
          sort?: number
          storage_path: string
          width?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          height?: number | null
          id?: string
          listing_id?: string
          room_label?: string | null
          sort?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string
          agent_id: string
          asking_price: number | null
          bathrooms: number | null
          bedrooms: number | null
          block: string | null
          cover_photo_path: string | null
          created_at: string
          facilities: string[]
          facing: string | null
          floor_level: string | null
          highlights: string | null
          id: string
          lat: number | null
          lease_start_year: number | null
          lng: number | null
          postal_code: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at: string | null
          size_sqft: number | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          tenure: Database["public"]["Enums"]["tenure_type"] | null
          title: string
          top_year: number | null
          unit: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          address: string
          agent_id?: string
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          block?: string | null
          cover_photo_path?: string | null
          created_at?: string
          facilities?: string[]
          facing?: string | null
          floor_level?: string | null
          highlights?: string | null
          id?: string
          lat?: number | null
          lease_start_year?: number | null
          lng?: number | null
          postal_code?: string | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          size_sqft?: number | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          tenure?: Database["public"]["Enums"]["tenure_type"] | null
          title: string
          top_year?: number | null
          unit?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          address?: string
          agent_id?: string
          asking_price?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          block?: string | null
          cover_photo_path?: string | null
          created_at?: string
          facilities?: string[]
          facing?: string | null
          floor_level?: string | null
          highlights?: string | null
          id?: string
          lat?: number | null
          lease_start_year?: number | null
          lng?: number | null
          postal_code?: string | null
          property_type?: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          size_sqft?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tenure?: Database["public"]["Enums"]["tenure_type"] | null
          title?: string
          top_year?: number | null
          unit?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          cea_licence: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["org_kind"]
          logo_path: string | null
          name: string
          website: string | null
        }
        Insert: {
          cea_licence?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["org_kind"]
          logo_path?: string | null
          name: string
          website?: string | null
        }
        Update: {
          cea_licence?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["org_kind"]
          logo_path?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          avatar_path: string | null
          bio: string | null
          cea_number: string | null
          created_at: string
          firm_name: string | null
          full_name: string | null
          id: string
          onboarded_at: string | null
          organisation_id: string | null
          phone: string | null
          portfolio_urls: string[]
          role: Database["public"]["Enums"]["user_role"] | null
          slug: string | null
          specialties: string[]
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          avatar_path?: string | null
          bio?: string | null
          cea_number?: string | null
          created_at?: string
          firm_name?: string | null
          full_name?: string | null
          id: string
          onboarded_at?: string | null
          organisation_id?: string | null
          phone?: string | null
          portfolio_urls?: string[]
          role?: Database["public"]["Enums"]["user_role"] | null
          slug?: string | null
          specialties?: string[]
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          avatar_path?: string | null
          bio?: string | null
          cea_number?: string | null
          created_at?: string
          firm_name?: string | null
          full_name?: string | null
          id?: string
          onboarded_at?: string | null
          organisation_id?: string | null
          phone?: string | null
          portfolio_urls?: string[]
          role?: Database["public"]["Enums"]["user_role"] | null
          slug?: string | null
          specialties?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          client_name: string | null
          created_at: string
          id: string
          notes: string | null
          owner_id: string
          property_type: Database["public"]["Enums"]["property_type"] | null
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string
          property_type?: Database["public"]["Enums"]["property_type"] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_primary: boolean
          owner_id: string
          room_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean
          owner_id?: string
          room_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_primary?: boolean
          owner_id?: string
          room_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_photos_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_scans: {
        Row: {
          created_at: string
          data: Json
          edited_at: string | null
          id: string
          model: string
          owner_id: string
          photo_id: string | null
          prompt_version: string
          room_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          edited_at?: string | null
          id?: string
          model: string
          owner_id?: string
          photo_id?: string | null
          prompt_version: string
          room_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          edited_at?: string | null
          id?: string
          model?: string
          owner_id?: string
          photo_id?: string | null
          prompt_version?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_scans_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "room_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_scans_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          project_id: string
          room_type: string | null
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          project_id: string
          room_type?: string | null
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          project_id?: string
          room_type?: string | null
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_preset: boolean
          materials: string[]
          mood: string[]
          name: string
          owner_id: string | null
          palette: string[]
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_preset?: boolean
          materials?: string[]
          mood?: string[]
          name: string
          owner_id?: string | null
          palette?: string[]
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_preset?: boolean
          materials?: string[]
          mood?: string[]
          name?: string
          owner_id?: string | null
          palette?: string[]
          slug?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          created_at: string
          est_cost_usd: number | null
          id: number
          input_tokens: number | null
          kind: string
          meta: Json
          mocked: boolean
          output_tokens: number | null
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          est_cost_usd?: number | null
          id?: never
          input_tokens?: number | null
          kind: string
          meta?: Json
          mocked?: boolean
          output_tokens?: number | null
          units?: number
          user_id: string
        }
        Update: {
          created_at?: string
          est_cost_usd?: number | null
          id?: never
          input_tokens?: number | null
          kind?: string
          meta?: Json
          mocked?: boolean
          output_tokens?: number | null
          units?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_kind: string; p_limit: number; p_window_seconds: number }
        Returns: number
      }
      increment_listing_view: { Args: { p_slug: string }; Returns: undefined }
    }
    Enums: {
      collab_status: "invited" | "accepted" | "declined" | "revoked"
      content_kind: "listing_copy" | "social_pack" | "utilisation"
      design_status: "pending" | "ready" | "failed"
      job_status: "queued" | "running" | "succeeded" | "failed"
      lead_kind: "enquiry" | "get_this_look"
      lead_status: "new" | "contacted" | "won" | "lost"
      listing_status: "draft" | "published" | "archived"
      org_kind: "design_firm" | "agency"
      property_type: "hdb" | "condo" | "ec" | "landed"
      tenure_type:
        | "leasehold_99"
        | "leasehold_999"
        | "freehold"
        | "leasehold_other"
      user_role: "interior_designer" | "agent" | "buyer" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      collab_status: ["invited", "accepted", "declined", "revoked"],
      content_kind: ["listing_copy", "social_pack", "utilisation"],
      design_status: ["pending", "ready", "failed"],
      job_status: ["queued", "running", "succeeded", "failed"],
      lead_kind: ["enquiry", "get_this_look"],
      lead_status: ["new", "contacted", "won", "lost"],
      listing_status: ["draft", "published", "archived"],
      org_kind: ["design_firm", "agency"],
      property_type: ["hdb", "condo", "ec", "landed"],
      tenure_type: [
        "leasehold_99",
        "leasehold_999",
        "freehold",
        "leasehold_other",
      ],
      user_role: ["interior_designer", "agent", "buyer", "admin"],
    },
  },
} as const
