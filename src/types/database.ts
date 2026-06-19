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
      profiles: {
        Row: {
          id: string
          role: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          stripe_account_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          brand_id: string
          title: string
          description: string
          budget: number
          currency: string
          status: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          description: string
          budget: number
          currency?: string
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string
          description?: string
          budget?: number
          currency?: string
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          creator_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          pitch: string
          proposed_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          creator_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          pitch: string
          proposed_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          creator_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          pitch?: string
          proposed_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          job_id: string
          application_id: string | null
          brand_id: string
          creator_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed'
          platform_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          application_id?: string | null
          brand_id: string
          creator_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'held' | 'released' | 'refunded' | 'disputed'
          platform_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          application_id?: string | null
          brand_id?: string
          creator_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'held' | 'released' | 'refunded' | 'disputed'
          platform_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          job_id: string
          application_id: string
          creator_id: string
          content_url: string
          notes: string | null
          status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
          reviewer_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          application_id: string
          creator_id: string
          content_url: string
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'revision_requested'
          reviewer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          application_id?: string
          creator_id?: string
          content_url?: string
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'revision_requested'
          reviewer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      disputes: {
        Row: {
          id: string
          job_id: string
          payment_id: string | null
          raised_by: string
          reason: string
          status: 'open' | 'under_review' | 'resolved' | 'closed'
          resolution: string | null
          resolved_by: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          job_id: string
          payment_id?: string | null
          raised_by: string
          reason: string
          status?: 'open' | 'under_review' | 'resolved' | 'closed'
          resolution?: string | null
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          payment_id?: string | null
          raised_by?: string
          reason?: string
          status?: 'open' | 'under_review' | 'resolved' | 'closed'
          resolution?: string | null
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
