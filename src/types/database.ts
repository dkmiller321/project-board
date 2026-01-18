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
      customers: {
        Row: {
          id: string
          stripe_customer_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          stripe_customer_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stripe_customer_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          active: boolean
          name: string
          description: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id: string
          active?: boolean
          name: string
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          active?: boolean
          name?: string
          description?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          id: string
          product_id: string
          active: boolean
          currency: string
          unit_amount: number | null
          type: 'one_time' | 'recurring'
          interval: 'month' | 'year' | null
          interval_count: number | null
          created_at: string
        }
        Insert: {
          id: string
          product_id: string
          active?: boolean
          currency: string
          unit_amount?: number | null
          type: 'one_time' | 'recurring'
          interval?: 'month' | 'year' | null
          interval_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          active?: boolean
          currency?: string
          unit_amount?: number | null
          type?: 'one_time' | 'recurring'
          interval?: 'month' | 'year' | null
          interval_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id: string
          cancel_at_period_end: boolean
          current_period_start: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id: string
          cancel_at_period_end?: boolean
          current_period_start: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id?: string
          cancel_at_period_end?: boolean
          current_period_start?: string
          current_period_end?: string
          created_at?: string
        }
        Relationships: []
      }
      usage: {
        Row: {
          user_id: string
          cards_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          cards_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          cards_count?: number
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

export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type PriceRow = Database['public']['Tables']['prices']['Row']
export type PriceInsert = Database['public']['Tables']['prices']['Insert']
export type PriceUpdate = Database['public']['Tables']['prices']['Update']

export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export type UsageRow = Database['public']['Tables']['usage']['Row']
export type UsageInsert = Database['public']['Tables']['usage']['Insert']
export type UsageUpdate = Database['public']['Tables']['usage']['Update']
