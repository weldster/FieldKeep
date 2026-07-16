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
      jobs: {
        Row: {
          id: string
          title: string
          client_name: string
          location: string
          trade_type: string
          status: 'pending' | 'in_progress' | 'completed'
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          client_name: string
          location: string
          trade_type: string
          status?: 'pending' | 'in_progress' | 'completed'
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          client_name?: string
          location?: string
          trade_type?: string
          status?: 'pending' | 'in_progress' | 'completed'
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          job_id: string
          question: string
          is_checked: boolean
          checked_by: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          question: string
          is_checked?: boolean
          checked_by?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          question?: string
          is_checked?: boolean
          checked_by?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      job_photos: {
        Row: {
          id: string
          job_id: string
          photo_url: string
          caption: string
          photo_type: 'before' | 'after'
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          photo_url: string
          caption?: string
          photo_type: 'before' | 'after'
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          photo_url?: string
          caption?: string
          photo_type?: 'before' | 'after'
          created_at?: string
        }
        Relationships: []
      }
      sign_offs: {
        Row: {
          id: string
          job_id: string
          signer_name: string
          signature_data: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          signer_name: string
          signature_data?: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          signer_name?: string
          signature_data?: string
          created_at?: string
        }
        Relationships: []
      }
      crew_members: {
        Row: {
          id: string
          name: string
          role: string
          email: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          email: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          email?: string
          user_id?: string
          created_at?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
