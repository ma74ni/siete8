export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      category: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      lead: {
        Row: {
          consent_at: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          plan_id: string | null
          service_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          utm: Json
        }
        Insert: {
          consent_at: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          service_id?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm?: Json
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          service_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["id"]
          },
        ]
      }
      plan: {
        Row: {
          created_at: string
          duration_unit: Database["public"]["Enums"]["duration_unit"] | null
          duration_value: number | null
          holder_type: Database["public"]["Enums"]["holder_type"]
          id: string
          name: string
          price_without_vat: number
          service_id: string
          sort_order: number
          updated_at: string
          vat_rate: number
          visible: boolean
        }
        Insert: {
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"] | null
          duration_value?: number | null
          holder_type?: Database["public"]["Enums"]["holder_type"]
          id?: string
          name: string
          price_without_vat: number
          service_id: string
          sort_order?: number
          updated_at?: string
          vat_rate: number
          visible?: boolean
        }
        Update: {
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"] | null
          duration_value?: number | null
          holder_type?: Database["public"]["Enums"]["holder_type"]
          id?: string
          name?: string
          price_without_vat?: number
          service_id?: string
          sort_order?: number
          updated_at?: string
          vat_rate?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plan_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["id"]
          },
        ]
      }
      post: {
        Row: {
          author_id: string | null
          body_md: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_md?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_md?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      post_service: {
        Row: {
          post_id: string
          service_id: string
        }
        Insert: {
          post_id: string
          service_id: string
        }
        Update: {
          post_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_service_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_service_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      project: {
        Row: {
          challenge_md: string | null
          client_name: string | null
          cover_url: string | null
          created_at: string
          featured: boolean
          id: string
          link_checked_at: string | null
          link_ok: boolean | null
          live_url: string | null
          published: boolean
          results_md: string | null
          sector: string | null
          show_client_name: boolean
          slug: string
          solution_md: string | null
          sort_order: number
          status: Database["public"]["Enums"]["project_status"]
          summary: string | null
          tech_stack: string[]
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          challenge_md?: string | null
          client_name?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          link_checked_at?: string | null
          link_ok?: boolean | null
          live_url?: string | null
          published?: boolean
          results_md?: string | null
          sector?: string | null
          show_client_name?: boolean
          slug: string
          solution_md?: string | null
          sort_order?: number
          status: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          tech_stack?: string[]
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          challenge_md?: string | null
          client_name?: string | null
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          link_checked_at?: string | null
          link_ok?: boolean | null
          live_url?: string | null
          published?: boolean
          results_md?: string | null
          sector?: string | null
          show_client_name?: boolean
          slug?: string
          solution_md?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["project_status"]
          summary?: string | null
          tech_stack?: string[]
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      project_image: {
        Row: {
          alt: string
          created_at: string
          device: Database["public"]["Enums"]["image_device"]
          id: string
          project_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          alt: string
          created_at?: string
          device?: Database["public"]["Enums"]["image_device"]
          id?: string
          project_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string
          created_at?: string
          device?: Database["public"]["Enums"]["image_device"]
          id?: string
          project_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_image_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_service: {
        Row: {
          project_id: string
          service_id: string
        }
        Insert: {
          project_id: string
          service_id: string
        }
        Update: {
          project_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_service_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_service_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          required: boolean
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          required?: boolean
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          required?: boolean
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["id"]
          },
        ]
      }
      service: {
        Row: {
          body_md: string | null
          category_id: string
          created_at: string
          external_app_url: string | null
          featured: boolean
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["service_kind"]
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          summary: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          body_md?: string | null
          category_id: string
          created_at?: string
          external_app_url?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["service_kind"]
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          body_md?: string | null
          category_id?: string
          created_at?: string
          external_app_url?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["service_kind"]
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          summary?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin"
      duration_unit: "day" | "month" | "year"
      holder_type: "natural" | "legal_entity" | "not_applicable"
      image_device: "desktop" | "mobile"
      lead_source: "assistant" | "form" | "whatsapp"
      lead_status: "new" | "contacted" | "closed" | "lost"
      post_status: "draft" | "published"
      project_status:
        | "in_development"
        | "active"
        | "internal"
        | "replaced"
        | "archived"
      service_kind: "service" | "own_product" | "resale"
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
      app_role: ["admin"],
      duration_unit: ["day", "month", "year"],
      holder_type: ["natural", "legal_entity", "not_applicable"],
      image_device: ["desktop", "mobile"],
      lead_source: ["assistant", "form", "whatsapp"],
      lead_status: ["new", "contacted", "closed", "lost"],
      post_status: ["draft", "published"],
      project_status: [
        "in_development",
        "active",
        "internal",
        "replaced",
        "archived",
      ],
      service_kind: ["service", "own_product", "resale"],
    },
  },
} as const

