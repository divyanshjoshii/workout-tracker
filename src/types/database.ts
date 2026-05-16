export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          hall_of_fame: string[] | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          hall_of_fame?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          hall_of_fame?: string[] | null
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          muscle_group: string
          category: string
          equipment: string | null
          instructions: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          muscle_group: string
          category: string
          equipment?: string | null
          instructions?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          muscle_group?: string
          category?: string
          equipment?: string | null
          instructions?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      favorite_exercises: {
        Row: {
          user_id: string
          exercise_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          exercise_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          exercise_id?: string
          created_at?: string
        }
      }
      splits: {
        Row: {
          id: string
          user_id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      split_days: {
        Row: {
          id: string
          split_id: string
          name: string
          day_order: number
          created_at: string
          target_muscles: string[] | null
          default_template_id: string | null
        }
        Insert: {
          id?: string
          split_id: string
          name: string
          day_order: number
          created_at?: string
          target_muscles?: string[] | null
          default_template_id?: string | null
        }
        Update: {
          id?: string
          split_id?: string
          name?: string
          day_order?: number
          created_at?: string
          target_muscles?: string[] | null
          default_template_id?: string | null
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          split_day_id: string | null
          name: string
          date: string
          notes: string | null
          feeling: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          split_day_id?: string | null
          name: string
          date?: string
          notes?: string | null
          feeling?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          split_day_id?: string | null
          name?: string
          date?: string
          notes?: string | null
          feeling?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          exercise_order: number
          superset_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          exercise_order: number
          superset_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          exercise_order?: number
          superset_id?: string | null
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_exercise_id: string
          set_number: number
          weight: number | null
          reps: number
          rpe: number | null
          set_type: string | null
          notes: string | null
          is_bodyweight: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          set_number: number
          weight?: number | null
          reps: number
          rpe?: number | null
          set_type?: string | null
          notes?: string | null
          is_bodyweight?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          set_number?: number
          weight?: number | null
          reps?: number
          rpe?: number | null
          set_type?: string | null
          notes?: string | null
          is_bodyweight?: boolean | null
          created_at?: string
        }
      }
      body_weight_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          weight: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          weight?: number
          note?: string | null
          created_at?: string
        }
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          template_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          notes?: string | null
          template_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string | null
          template_order?: number
          created_at?: string
        }
      }
      template_exercises: {
        Row: {
          id: string
          template_id: string
          exercise_id: string
          exercise_order: number
          superset_id: string | null
          created_at: string
          target_sets: number | null
        }
        Insert: {
          id?: string
          template_id: string
          exercise_id: string
          exercise_order: number
          superset_id?: string | null
          created_at?: string
          target_sets?: number | null
        }
        Update: {
          id?: string
          template_id?: string
          exercise_id?: string
          exercise_order?: number
          superset_id?: string | null
          created_at?: string
          target_sets?: number | null
        }
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
  }
}
