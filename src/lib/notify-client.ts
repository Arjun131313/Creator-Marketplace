import { supabase } from "@/lib/supabase"

type NotifyPayload =
  | { type: "message"; conversationId: string }
  | { type: "application"; jobId: string }
  | { type: "application_decision"; applicationId: string }
  | { type: "content_submitted"; submissionId: string }
  | { type: "content_reviewed"; submissionId: string }
  | { type: "event_application"; eventId: string }
  | { type: "event_decision"; applicationId: string }

/**
 * Fires a notification for an action the browser just performed directly
 * against Supabase.
 *
 * Deliberately fire-and-forget and never throws: the database write has already
 * happened by the time this runs, so a failed email must not surface as a failed
 * action or block the UI.
 */
export function notify(payload: NotifyPayload): void {
  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) return

      await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.warn("[notify] failed to send notification", error)
    }
  })()
}
