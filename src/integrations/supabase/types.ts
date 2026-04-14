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
      bookings: {
        Row: {
          id: string
          customer_id: string
          driver_id: string | null
          pickup_address: string
          delivery_address: string
          pickup_latitude: number
          pickup_longitude: number
          delivery_latitude: number
          delivery_longitude: number
          total_volume_m3: number | null
          total_weight_kg: number | null
          goods_description: string | null
          special_instructions: string | null
          status: string
          estimated_price: number | null
          final_price: number | null
          scheduled_pickup: string | null
          actual_pickup: string | null
          actual_delivery: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          driver_id?: string | null
          pickup_address: string
          delivery_address: string
          pickup_latitude: number
          pickup_longitude: number
          delivery_latitude: number
          delivery_longitude: number
          total_volume_m3?: number | null
          total_weight_kg?: number | null
          goods_description?: string | null
          special_instructions?: string | null
          status?: string
          estimated_price?: number | null
          final_price?: number | null
          scheduled_pickup?: string | null
          actual_pickup?: string | null
          actual_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          driver_id?: string | null
          pickup_address?: string
          delivery_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          delivery_latitude?: number
          delivery_longitude?: number
          total_volume_m3?: number | null
          total_weight_kg?: number | null
          goods_description?: string | null
          special_instructions?: string | null
          status?: string
          estimated_price?: number | null
          final_price?: number | null
          scheduled_pickup?: string | null
          actual_pickup?: string | null
          actual_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_documents: {
        Row: {
          document_type: string
          driver_id: string
          expiry_date: string | null
          file_url: string
          id: string
          updated_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          document_type: string
          driver_id: string
          expiry_date?: string | null
          file_url: string
          id?: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          document_type?: string
          driver_id?: string
          expiry_date?: string | null
          file_url?: string
          id?: string
          updated_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      profile_details: {
        Row: {
          id: string
          user_id: string
          phone: string | null
          experience_years: number | null
          languages: string[] | null
          is_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone?: string | null
          experience_years?: number | null
          languages?: string[] | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone?: string | null
          experience_years?: number | null
          languages?: string[] | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_activated: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_activated?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_activated?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          id: string
          user_id: string
          name: string
          address: string
          latitude: number
          longitude: number
          is_default: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          address: string
          latitude: number
          longitude: number
          is_default?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          is_default?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          driver_id: string
          vehicle_type: string
          make: string
          model: string
          year: number | null
          plate_number: string
          capacity_m3: number | null
          max_weight_kg: number | null
          is_active: boolean | null
          documents_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          vehicle_type: string
          make: string
          model: string
          year?: number | null
          plate_number: string
          capacity_m3?: number | null
          max_weight_kg?: number | null
          is_active?: boolean | null
          documents_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          vehicle_type?: string
          make?: string
          model?: string
          year?: number | null
          plate_number?: string
          capacity_m3?: number | null
          max_weight_kg?: number | null
          is_active?: boolean | null
          documents_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
