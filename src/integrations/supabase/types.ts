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
      actual_results: {
        Row: {
          created_at: string
          fifth_place: string | null
          first_place: string | null
          fourth_place: string | null
          id: string
          last_place: string | null
          second_place: string | null
          sweden_actual_position: number | null
          third_place: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          fifth_place?: string | null
          first_place?: string | null
          fourth_place?: string | null
          id?: string
          last_place?: string | null
          second_place?: string | null
          sweden_actual_position?: number | null
          third_place?: string | null
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          fifth_place?: string | null
          first_place?: string | null
          fourth_place?: string | null
          id?: string
          last_place?: string | null
          second_place?: string | null
          sweden_actual_position?: number | null
          third_place?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "actual_results_fifth_place_fkey"
            columns: ["fifth_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_results_first_place_fkey"
            columns: ["first_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_results_fourth_place_fkey"
            columns: ["fourth_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_results_last_place_fkey"
            columns: ["last_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_results_second_place_fkey"
            columns: ["second_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actual_results_third_place_fkey"
            columns: ["third_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          artist: string | null
          country_name: string
          created_at: string
          display_order: number
          flag_emoji: string
          id: string
          is_active_finalist: boolean
          song_title: string | null
          year: number
        }
        Insert: {
          artist?: string | null
          country_name: string
          created_at?: string
          display_order?: number
          flag_emoji?: string
          id?: string
          is_active_finalist?: boolean
          song_title?: string | null
          year?: number
        }
        Update: {
          artist?: string | null
          country_name?: string
          created_at?: string
          display_order?: number
          flag_emoji?: string
          id?: string
          is_active_finalist?: boolean
          song_title?: string | null
          year?: number
        }
        Relationships: []
      }
      favourite_votes: {
        Row: {
          created_at: string
          first_favourite: string | null
          id: string
          is_submitted: boolean
          second_favourite: string | null
          submitted_at: string | null
          third_favourite: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          first_favourite?: string | null
          id?: string
          is_submitted?: boolean
          second_favourite?: string | null
          submitted_at?: string | null
          third_favourite?: string | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          created_at?: string
          first_favourite?: string | null
          id?: string
          is_submitted?: boolean
          second_favourite?: string | null
          submitted_at?: string | null
          third_favourite?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "favourite_votes_first_favourite_fkey"
            columns: ["first_favourite"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourite_votes_second_favourite_fkey"
            columns: ["second_favourite"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourite_votes_third_favourite_fkey"
            columns: ["third_favourite"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          calculated_points: number
          created_at: string
          fifth_place: string | null
          first_place: string | null
          fourth_place: string | null
          id: string
          is_submitted: boolean
          last_place: string | null
          second_place: string | null
          submitted_at: string | null
          sweden_final_position: number | null
          third_place: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          calculated_points?: number
          created_at?: string
          fifth_place?: string | null
          first_place?: string | null
          fourth_place?: string | null
          id?: string
          is_submitted?: boolean
          last_place?: string | null
          second_place?: string | null
          submitted_at?: string | null
          sweden_final_position?: number | null
          third_place?: string | null
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          calculated_points?: number
          created_at?: string
          fifth_place?: string | null
          first_place?: string | null
          fourth_place?: string | null
          id?: string
          is_submitted?: boolean
          last_place?: string | null
          second_place?: string | null
          submitted_at?: string | null
          sweden_final_position?: number | null
          third_place?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "predictions_fifth_place_fkey"
            columns: ["fifth_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_first_place_fkey"
            columns: ["first_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_fourth_place_fkey"
            columns: ["fourth_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_last_place_fkey"
            columns: ["last_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_second_place_fkey"
            columns: ["second_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_third_place_fkey"
            columns: ["third_place"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_admin: boolean
          nickname: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          nickname: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          nickname?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          active_year: number
          created_at: string
          favourites_locked: boolean
          id: string
          prediction_lock_time: string
          predictions_locked: boolean
          results_published: boolean
          updated_at: string
        }
        Insert: {
          active_year?: number
          created_at?: string
          favourites_locked?: boolean
          id?: string
          prediction_lock_time?: string
          predictions_locked?: boolean
          results_published?: boolean
          updated_at?: string
        }
        Update: {
          active_year?: number
          created_at?: string
          favourites_locked?: boolean
          id?: string
          prediction_lock_time?: string
          predictions_locked?: boolean
          results_published?: boolean
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
    Enums: {},
  },
} as const
