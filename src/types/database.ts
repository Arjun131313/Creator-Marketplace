export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Domain types ────────────────────────────────────────────────────────────

export type PlatformHandle = {
  followers: number | null
  username: string | null
}

/** New shape: each platform is an object with followers + username. */
export type PlatformStats = {
  instagram: PlatformHandle | null
  tiktok: PlatformHandle | null
  snapchat: PlatformHandle | null
}

export type CreatorPackage = {
  name: string
  description: string
  price: number
}

export type ContentUrl = {
  platform: "tiktok" | "instagram"
  url: string
}

// ─── Helpers for backward-compat with the old platform_stats shape ───────────
// Old shape: { instagram: number, tiktok: number, youtube: number }
// New shape: { instagram: { followers, username }, ... }

export function getPlatformFollowers(
  stats: PlatformStats | null | undefined,
  platform: keyof PlatformStats,
): number | null {
  if (!stats) return null
  const val = stats[platform] as PlatformHandle | number | null | undefined
  if (typeof val === "number") return val          // legacy
  if (val && typeof val === "object") return val.followers ?? null
  return null
}

export function getPlatformUsername(
  stats: PlatformStats | null | undefined,
  platform: keyof PlatformStats,
): string | null {
  if (!stats) return null
  const val = stats[platform] as PlatformHandle | number | null | undefined
  if (val && typeof val === "object") return val.username ?? null
  return null
}

// ─── Database schema ─────────────────────────────────────────────────────────

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
          stripe_payouts_enabled: boolean
          niche: string | null
          platform_stats: PlatformStats | null
          packages: CreatorPackage[] | null
          content_urls: ContentUrl[] | null
          content_types: string[] | null
          available: boolean
          created_at: string
        }
        Insert: {
          id: string
          role?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          stripe_payouts_enabled?: boolean
          niche?: string | null
          platform_stats?: PlatformStats | null
          packages?: CreatorPackage[] | null
          content_urls?: ContentUrl[] | null
          content_types?: string[] | null
          available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          role?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          stripe_account_id?: string | null
          stripe_payouts_enabled?: boolean
          niche?: string | null
          platform_stats?: PlatformStats | null
          packages?: CreatorPackage[] | null
          content_urls?: ContentUrl[] | null
          content_types?: string[] | null
          available?: boolean
          created_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          brand_id: string
          title: string
          description: string
          budget: number
          currency: string
          status: "open" | "in_progress" | "completed" | "cancelled"
          deadline: string | null
          content_type: string | null
          platform: string | null
          video_duration: string | null
          language: string | null
          talking_points: string | null
          requires_shipping: boolean
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
          status?: "open" | "in_progress" | "completed" | "cancelled"
          deadline?: string | null
          content_type?: string | null
          platform?: string | null
          video_duration?: string | null
          language?: string | null
          talking_points?: string | null
          requires_shipping?: boolean
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
          status?: "open" | "in_progress" | "completed" | "cancelled"
          deadline?: string | null
          content_type?: string | null
          platform?: string | null
          video_duration?: string | null
          language?: string | null
          talking_points?: string | null
          requires_shipping?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          job_id: string
          creator_id: string
          status: "pending" | "accepted" | "rejected" | "withdrawn"
          pitch: string
          proposed_rate: number | null
          shipping_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          creator_id: string
          status?: "pending" | "accepted" | "rejected" | "withdrawn"
          pitch: string
          proposed_rate?: number | null
          shipping_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          creator_id?: string
          status?: "pending" | "accepted" | "rejected" | "withdrawn"
          pitch?: string
          proposed_rate?: number | null
          shipping_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          status: "pending" | "held" | "released" | "refunded" | "disputed"
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
          status?: "pending" | "held" | "released" | "refunded" | "disputed"
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
          status?: "pending" | "held" | "released" | "refunded" | "disputed"
          platform_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          id: string
          job_id: string
          application_id: string
          creator_id: string
          content_url: string
          notes: string | null
          status: "pending" | "approved" | "rejected" | "revision_requested"
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
          status?: "pending" | "approved" | "rejected" | "revision_requested"
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
          status?: "pending" | "approved" | "rejected" | "revision_requested"
          reviewer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          id: string
          job_id: string
          payment_id: string | null
          raised_by: string
          reason: string
          status: "open" | "under_review" | "resolved" | "closed"
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
          status?: "open" | "under_review" | "resolved" | "closed"
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
          status?: "open" | "under_review" | "resolved" | "closed"
          resolution?: string | null
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant_a: string
          participant_b: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_a: string
          participant_b: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_a?: string
          participant_b?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      creator_waitlist: {
        Row: {
          id: string
          full_name: string
          email: string
          platform: string
          handle: string | null
          followers: string | null
          niche: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          platform: string
          handle?: string | null
          followers?: string | null
          niche?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          platform?: string
          handle?: string | null
          followers?: string | null
          niche?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          creator_id: string
          brand_id: string
          job_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          brand_id: string
          job_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          brand_id?: string
          job_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
        Relationships: []
      }
      academy_lessons: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          price: number
          currency: string
          category: string | null
          status: "draft" | "published" | "archived"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          price: number
          currency?: string
          category?: string | null
          status?: "draft" | "published" | "archived"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          price?: number
          currency?: string
          category?: string | null
          status?: "draft" | "published" | "archived"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_lesson_content: {
        Row: {
          lesson_id: string
          content_url: string
        }
        Insert: {
          lesson_id: string
          content_url: string
        }
        Update: {
          lesson_id?: string
          content_url?: string
        }
        Relationships: []
      }
      academy_purchases: {
        Row: {
          id: string
          lesson_id: string
          buyer_id: string
          teacher_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          platform_fee: number | null
          status: "pending" | "paid" | "refunded"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          buyer_id: string
          teacher_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          platform_fee?: number | null
          status?: "pending" | "paid" | "refunded"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          buyer_id?: string
          teacher_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          platform_fee?: number | null
          status?: "pending" | "paid" | "refunded"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      job_application_counts: {
        Args: { job_ids: string[] }
        Returns: { job_id: string; application_count: number }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
