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
      admin_login_attempts: {
        Row: {
          attempts: number
          ip: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          ip: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          ip?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chapter_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      chapter_signups: {
        Row: {
          college: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interview_slot: string | null
          invite_sent_at: string | null
          isaca_id: string | null
          major: string
          notified_at: string | null
          phone: string | null
          preferred_role: string | null
          preferred_team: string | null
          program: string | null
          reason: string | null
          student_id: string
          year_of_study: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interview_slot?: string | null
          invite_sent_at?: string | null
          isaca_id?: string | null
          major: string
          notified_at?: string | null
          phone?: string | null
          preferred_role?: string | null
          preferred_team?: string | null
          program?: string | null
          reason?: string | null
          student_id: string
          year_of_study: string
        }
        Update: {
          college?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interview_slot?: string | null
          invite_sent_at?: string | null
          isaca_id?: string | null
          major?: string
          notified_at?: string | null
          phone?: string | null
          preferred_role?: string | null
          preferred_team?: string | null
          program?: string | null
          reason?: string | null
          student_id?: string
          year_of_study?: string
        }
        Relationships: []
      }
      pm_activity: {
        Row: {
          action: string
          created_at: string
          id: string
          meta: Json
          project_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          meta?: Json
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          meta?: Json
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          task_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          task_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_files: {
        Row: {
          created_at: string
          id: string
          kind: string
          mime: string | null
          name: string
          project_id: string
          size: number | null
          storage_path: string | null
          task_id: string | null
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          name: string
          project_id: string
          size?: number | null
          storage_path?: string | null
          task_id?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          mime?: string | null
          name?: string
          project_id?: string
          size?: number | null
          storage_path?: string | null
          task_id?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_interview_feedback: {
        Row: {
          author_id: string | null
          decision: string
          notes: string
          rating: number | null
          signup_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          decision?: string
          notes?: string
          rating?: number | null
          signup_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          decision?: string
          notes?: string
          rating?: number | null
          signup_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_interview_feedback_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_interview_feedback_signup_id_fkey"
            columns: ["signup_id"]
            isOneToOne: true
            referencedRelation: "chapter_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_project_members: {
        Row: {
          access: string
          added_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          access?: string
          added_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          access?: string
          added_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_projects: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          key: string
          lead_id: string | null
          name: string
          task_counter: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          key: string
          lead_id?: string | null
          name: string
          task_counter?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          key?: string
          lead_id?: string | null
          name?: string
          task_counter?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: string[]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: string[]
        }
        Relationships: []
      }
      pm_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimate_hours: number | null
          id: string
          labels: string[]
          number: number
          parent_id: string | null
          position: number
          priority: string
          project_id: string
          reporter_id: string | null
          start_date: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          labels?: string[]
          number: number
          parent_id?: string | null
          position?: number
          priority?: string
          project_id: string
          reporter_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          labels?: string[]
          number?: number
          parent_id?: string | null
          position?: number
          priority?: string
          project_id?: string
          reporter_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pm_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "pm_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_users: {
        Row: {
          avatar_color: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_active: boolean
          is_admin: boolean
          last_login_at: string | null
          must_change_password: boolean
          password_hash: string
          role_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_color?: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          password_hash: string
          role_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_color?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          password_hash?: string
          role_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "pm_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      taken_interview_slots: {
        Args: never
        Returns: {
          interview_slot: string
        }[]
      }
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
