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
      cards: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          column_id: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          column_id?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          column_id?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          id: string
          user_id: string
          text: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          completed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          user_id: string
          content: string
          updated_at: string
        }
        Insert: {
          user_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          content?: string
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

// Helper types for table rows
export type CardRow = Database['public']['Tables']['cards']['Row']
export type CardInsert = Database['public']['Tables']['cards']['Insert']
export type CardUpdate = Database['public']['Tables']['cards']['Update']

export type TodoRow = Database['public']['Tables']['todos']['Row']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

export type NoteRow = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']
