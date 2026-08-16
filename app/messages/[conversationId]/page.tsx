"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  read: boolean
  created_at: string
}

type ConvSummary = {
  id: string
  otherName: string
  lastMessage: string
  updatedAt: string
  unread: boolean
}

type EscrowPayment = {
  status: string
  amount: number
}

const AVATAR_COLORS = [
  { bg: "#ff534b", text: "#fff6f5" },
  { bg: "#16255c", text: "#f2f5fc" },
  { bg: "#c8f23c", text: "#101a3d" },
  { bg: "#feb930", text: "#2b1d00" },
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
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
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
}

export default function MessageConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = use(params)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [otherName, setOtherName] = useState<string>("Chat")
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [convList, setConvList] = useState<ConvSummary[]>([])
  const [escrow, setEscrow] = useState<EscrowPayment | null>(null)

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
      setSessionUserId(userId)

      // Load current conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("id,participant_a,participant_b")
        .eq("id", conversationId)
        .maybeSingle()

      if (!mounted) return

      if (convError || !conv) {
        setError(convError?.message ?? "Conversation not found.")
        setLoading(false)
        return
      }

      if (conv.participant_a !== userId && conv.participant_b !== userId) {
        setError("You are not a participant in this conversation.")
        setLoading(false)
        return
      }

      const otherId = conv.participant_a === userId ? conv.participant_b : conv.participant_a
      setOtherUserId(otherId)

      // Fetch all data in parallel: messages, other profile, all convs for sidebar
      const [msgRes, profileRes, allConvsRes] = await Promise.all([
        supabase
          .from("messages")
          .select("id,conversation_id,sender_id,recipient_id,content,read,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id,display_name")
          .eq("id", otherId)
          .single(),
        supabase
          .from("conversations")
          .select("id,participant_a,participant_b")
          .or(`participant_a.eq.${userId},participant_b.eq.${userId}`),
      ])

      if (!mounted) return

      if (msgRes.error) { setError(msgRes.error.message); setLoading(false); return }
      if (profileRes.error) { setError(profileRes.error.message); setLoading(false); return }

      setOtherName(profileRes.data?.display_name ?? "User")
      setMessages(msgRes.data ?? [])

      supabase
        .from("payments")
        .select("status,amount")
        .or(
          `and(brand_id.eq.${userId},creator_id.eq.${otherId}),and(brand_id.eq.${otherId},creator_id.eq.${userId})`,
        )
        .in("status", ["held", "released"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (mounted && data) setEscrow(data)
        })

      // Mark messages as read
      const unread = (msgRes.data ?? []).filter(
        (m) => m.recipient_id === userId && !m.read,
      )
      if (unread.length > 0) {
        supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .eq("recipient_id", userId)
          .eq("read", false)
          .then(() => {})
      }

      // Build sidebar conversation list
      const allConvs = allConvsRes.data ?? []
      const allOtherIds = allConvs.map((c) =>
        c.participant_a === userId ? c.participant_b : c.participant_a,
      )
      const allConvIds = allConvs.map((c) => c.id)

      const [latestMsgsRes, profilesRes] = await Promise.all([
        allConvIds.length > 0
          ? supabase
              .from("messages")
              .select("conversation_id,content,created_at,recipient_id,read")
              .in("conversation_id", allConvIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        allOtherIds.length > 0
          ? supabase
              .from("profiles")
              .select("id,display_name")
              .in("id", allOtherIds)
          : Promise.resolve({ data: [] }),
      ])

      if (!mounted) return

      const latestMsgs = (latestMsgsRes.data ?? []) as {
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
      latestMsgs.forEach((m) => {
        if (!latestByConv.has(m.conversation_id)) {
          latestByConv.set(m.conversation_id, {
            content: m.content,
            created_at: m.created_at,
            unread: m.recipient_id === userId && !m.read,
          })
        }
      })

      const nameById = new Map(
        (profilesRes.data ?? []).map((p: { id: string; display_name: string | null }) => [
          p.id,
          p.display_name ?? "User",
        ]),
      )

      const summaries: ConvSummary[] = allConvs
        .map((c) => {
          const oid = c.participant_a === userId ? c.participant_b : c.participant_a
          const latest = latestByConv.get(c.id)
          return {
            id: c.id,
            otherName: nameById.get(oid) ?? "User",
            lastMessage: latest?.content ?? "",
            updatedAt: latest?.created_at ?? new Date(0).toISOString(),
            unread: latest?.unread ?? false,
          }
        })
        .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))

      if (mounted) {
        setConvList(summaries)
        setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [conversationId, router])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const text = newMessage.trim()
    if (!text || !sessionUserId || !otherUserId) return

    setSending(true)
    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: sessionUserId,
        recipient_id: otherUserId,
        content: text,
      })
      .select("id,conversation_id,sender_id,recipient_id,content,read,created_at")
      .maybeSingle()

    if (sendError) {
      setError(sendError.message)
    } else if (data) {
      setMessages((prev) => [...prev, data])
      setNewMessage("")

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) {
        fetch("/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ type: "message", conversationId }),
        }).catch((err) => console.error("Failed to send message notification:", err))
      }
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const otherColor = avatarColor(otherName)

  return (
    <div className="flex h-screen flex-col bg-[#f1f3f7] text-[#0d1117]">
      {/* Top nav */}
      <header className="shrink-0 border-b border-[#0d1117]/[0.07] bg-[#f1f3f7]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-display text-base font-extrabold text-[#0d1117] transition hover:text-[#16255c]">
            RealReach.
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-1.5 border border-[#0d1117]/[0.12] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            All messages
          </Link>
        </div>
      </header>

      {/* Body: sidebar + chat */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden w-[336px] shrink-0 flex-col border-r border-[#0d1117]/[0.07] bg-white lg:flex">
          <div className="shrink-0 border-b border-[#0d1117]/[0.07] px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5b6472]">
              Conversations
            </p>
          </div>
          <div className="flex-1 divide-y divide-[#0d1117]/[0.07] overflow-y-auto">
            {convList.map((c) => {
              const isActive = c.id === conversationId
              const initials = getInitials(c.otherName)
              const color = avatarColor(c.otherName)
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    isActive ? "bg-[#16255c]/10" : "hover:bg-[#e4e7ee]/40"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-extrabold"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {initials}
                    </div>
                    {c.unread && !isActive ? (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#ff534b] ring-2 ring-white" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${isActive ? "font-extrabold text-[#16255c]" : "font-semibold text-[#0d1117]"}`}>
                      {c.otherName}
                    </p>
                    <p className="truncate text-xs text-[#5b6472]">{c.lastMessage || "No messages"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-[#8b93a3]">{timeAgo(c.updatedAt)}</p>
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[#5b6472]">Loading conversation…</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="rounded-[12px] bg-[#ff534b]/[0.06] ring-1 ring-[#ff534b]/30 p-6 text-sm text-[#ff534b]">
                {error}
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="shrink-0 border-b border-[#0d1117]/[0.07] bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-extrabold"
                    style={{ backgroundColor: otherColor.bg, color: otherColor.text }}
                  >
                    {getInitials(otherName)}
                  </div>
                  <div>
                    <p className="font-bold text-[#0d1117]">{otherName}</p>
                    <p className="text-xs text-[#5b6472]">Direct message</p>
                  </div>
                </div>
              </div>

              {/* Escrow status banner */}
              {escrow ? (
                <div className="shrink-0 border-b border-[#0d1117]/[0.07] bg-[#c8f23c] px-6 py-3 text-[#101a3d]">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">
                    {escrow.status === "released" ? "Payment released" : "Offer accepted"}
                  </p>
                  <p className="font-display text-2xl font-extrabold">
                    £{escrow.amount.toLocaleString()} {escrow.status === "released" ? "released" : "held in escrow"}
                  </p>
                </div>
              ) : null}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-1 px-6 py-6">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#16255c]/10 text-[#16255c]">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                      </div>
                      <p className="mt-4 font-bold text-[#0d1117]">
                        Start the conversation
                      </p>
                      <p className="mt-1 text-sm text-[#5b6472]">
                        Say hello to {otherName}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.sender_id === sessionUserId
                    const prevMsg = messages[i - 1]
                    const showTime =
                      !prevMsg ||
                      new Date(msg.created_at).getTime() -
                        new Date(prevMsg.created_at).getTime() >
                        5 * 60 * 1000

                    return (
                      <div key={msg.id}>
                        {showTime ? (
                          <div className="my-4 flex items-center justify-center">
                            <span className="rounded-full bg-[#0d1117]/5 px-3 py-1 text-xs text-[#5b6472]">
                              {new Date(msg.created_at).toLocaleString("en-GB", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : null}
                        <div
                          className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}
                        >
                          <div
                            className={`max-w-[70%] rounded-[20px] px-4 py-2.5 text-sm leading-6 ${
                              isMine
                                ? "rounded-br-md bg-[#16255c] text-[#f2f5fc]"
                                : "rounded-bl-md bg-[#e4e7ee] text-[#0d1117]"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-[#0d1117]/[0.07] bg-white px-6 py-4">
                <div className="flex items-end gap-3">
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      e.target.style.height = "auto"
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${otherName}…`}
                    className="flex-1 resize-none overflow-hidden rounded-[8px] border border-[#0d1117]/[0.12] bg-white px-4 py-3 text-sm text-[#0d1117] outline-none transition-colors placeholder:text-[#8b93a3] focus:border-[#16255c]"
                    style={{ minHeight: "48px" }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="flex h-12 shrink-0 items-center justify-center rounded-[8px] bg-[#0d1117] px-4 font-display text-sm font-extrabold text-[#f1f3f7] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#8b93a3]">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
