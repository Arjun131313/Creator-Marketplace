import { supabase } from "@/lib/supabase"

export async function getOrCreateConversationId(_brandId: string, creatorId: string): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("Not authenticated")
  }

  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ creatorId }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Failed to start conversation")
  }

  return (data as { conversationId?: string }).conversationId ?? null
}
