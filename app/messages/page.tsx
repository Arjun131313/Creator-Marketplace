"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type ConversationSummary = {
  id: string
  otherId: string
  otherName: string
  lastMessage: string
  updatedAt: string
  unread: boolean
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function timeAgo(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
}

export default function MessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user?.id) {
        router.push("/login")
        return
      }

      const userId = session.user.id

      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("id,participant_a,participant_b")
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

      if (!mounted) return

      if (convError) {
        setError(convError.message)
        setLoading(false)
        return
      }

      const convList = convData ?? []
      const convIds = convList.map((c) => c.id)
      const otherIds = convList.map((c) =>
        c.participant_a === userId ? c.participant_b : c.participant_a,
      )

      const [msgRes, profileRes] = await Promise.all([
        convIds.length > 0
          ? supabase
              .from("messages")
              .select("conversation_id,content,created_at,recipient_id,read")
              .in("conversation_id", convIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        otherIds.length > 0
          ? supabase
              .from("profiles")
              .select("id,display_name")
              .in("id", otherIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (!mounted) return

      const msgs = (msgRes.data ?? []) as {
        conversation_id: string
        content: string
        created_at: string
        recipient_id: string
        read: boolean
      }[]

      const latestByConv = new Map<
        string,
        { content: string; created_at: string; unread: boolean }
      >()
      msgs.forEach((m) => {
        if (!latestByConv.has(m.conversation_id)) {
          latestByConv.set(m.conversation_id, {
            content: m.content,
            created_at: m.created_at,
            unread: m.recipient_id === userId && !m.read,
          })
        }
      })

      const nameById = new Map(
        (profileRes.data ?? []).map((p: { id: string; display_name: string | null }) => [
          p.id,
          p.display_name ?? "User",
        ]),
      )

      const summaries = convList
        .map((c) => {
          const otherId = c.participant_a === userId ? c.participant_b : c.participant_a
          const latest = latestByConv.get(c.id)
          return {
            id: c.id,
            otherId,
            otherName: nameById.get(otherId) ?? "User",
            lastMessage: latest?.content ?? "No messages yet",
            updatedAt: latest?.created_at ?? new Date(0).toISOString(),
            unread: latest?.unread ?? false,
          }
        })
        .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))

      if (mounted) {
        setConversations(summaries)
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#18140f]/10 bg-[#f5f1e8]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="font-serif text-lg text-[#18140f] transition hover:text-[#c1440e]">
            Real<em className="not-italic italic text-[#c1440e]">Reach</em>
          </Link>
          <Link
            href="/creators"
            className="rounded-[2px] border border-[#18140f]/15 px-4 py-2 text-sm font-medium text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
          >
            Browse creators
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c1440e]">Inbox</p>
          <h1 className="mt-2 font-serif text-3xl font-medium text-[#18140f]">Messages</h1>
          <p className="mt-1 text-sm text-[#6b6153]">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse border border-[#18140f]/10 bg-[#18140f]/[0.03]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : conversations.length === 0 ? (
          <div className="border border-dashed border-[#18140f]/15 p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2px] bg-[#c1440e]/10 text-[#c1440e]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <p className="mt-4 font-semibold text-[#18140f]">No conversations yet</p>
            <p className="mt-1 text-sm text-[#6b6153]">
              Visit a creator profile to start a conversation.
            </p>
            <Link
              href="/creators"
              className="mt-6 inline-flex items-center gap-2 rounded-[2px] bg-[#c1440e] px-5 py-2.5 text-sm font-semibold text-[#fef8f2] transition hover:bg-[#a23a0c]"
            >
              Browse creators
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const initials = getInitials(conv.otherName)
              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="group flex items-center gap-4 border border-[#18140f]/10 bg-[#fbf9f4] p-5 transition hover:border-[#c1440e]/40"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[2px] bg-[#c1440e]/10 text-sm font-bold text-[#c1440e]">
                      {initials}
                    </div>
                    {conv.unread ? (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#c1440e] ring-2 ring-[#f5f1e8]" />
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`truncate text-base font-semibold transition ${
                          conv.unread ? "text-[#18140f]" : "text-[#3a332a] group-hover:text-[#18140f]"
                        }`}
                      >
                        {conv.otherName}
                      </p>
                      <p className="shrink-0 text-xs text-[#8b8578]">{timeAgo(conv.updatedAt)}</p>
                    </div>
                    <p
                      className={`mt-0.5 truncate text-sm ${
                        conv.unread ? "font-medium text-[#3a332a]" : "text-[#8b8578]"
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="h-5 w-5 shrink-0 text-[#8b8578] transition group-hover:text-[#c1440e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
