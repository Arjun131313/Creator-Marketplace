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
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#f5f1e8] text-[#18140f]">
      {/* Top nav */}
      <header className="shrink-0 border-b border-[#18140f]/10 bg-[#f5f1e8]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-serif text-base text-[#18140f] transition hover:text-[#c1440e]">
            Creator<em className="not-italic italic text-[#c1440e]">Hub</em>
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-1.5 rounded-[2px] border border-[#18140f]/15 px-3 py-1.5 text-xs font-medium text-[#3a332a] transition hover:border-[#c1440e] hover:text-[#c1440e]"
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
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[#18140f]/10 bg-[#fbf9f4] lg:flex">
          <div className="shrink-0 border-b border-[#18140f]/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8b8578]">
              Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convList.map((c) => {
              const isActive = c.id === conversationId
              const initials = getInitials(c.otherName)
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className={`flex items-center gap-3 border-b border-[#18140f]/5 px-5 py-4 transition ${
                    isActive
                      ? "border-l-2 border-l-[#c1440e] bg-[#c1440e]/10"
                      : "hover:bg-[#18140f]/[0.03]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[2px] text-xs font-bold ${
                        isActive
                          ? "bg-[#c1440e]/20 text-[#c1440e]"
                          : "bg-[#18140f]/5 text-[#3a332a]"
                      }`}
                    >
                      {initials}
                    </div>
                    {c.unread && !isActive ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#c1440e] ring-2 ring-[#fbf9f4]" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isActive ? "text-[#c1440e]" : "text-[#3a332a]"
                      }`}
                    >
                      {c.otherName}
                    </p>
                    <p className="truncate text-xs text-[#8b8578]">{c.lastMessage || "No messages"}</p>
                  </div>
                  <p className="shrink-0 text-xs text-[#8b8578]">{timeAgo(c.updatedAt)}</p>
                </Link>
              )
            })}
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[#6b6153]">Loading conversation…</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="border border-rose-300 bg-rose-50 p-6 text-sm text-rose-700">
                {error}
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="shrink-0 border-b border-[#18140f]/10 bg-[#fbf9f4] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#c1440e]/10 text-sm font-bold text-[#c1440e]">
                    {getInitials(otherName)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#18140f]">{otherName}</p>
                    <p className="text-xs text-[#8b8578]">Direct message</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-1 px-6 py-6">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2px] bg-[#c1440e]/10 text-[#c1440e]">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                      </div>
                      <p className="mt-4 font-semibold text-[#18140f]">
                        Start the conversation
                      </p>
                      <p className="mt-1 text-sm text-[#6b6153]">
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
                            <span className="rounded-full bg-[#18140f]/5 px-3 py-1 text-xs text-[#8b8578]">
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
                            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                              isMine
                                ? "rounded-br-md bg-[#c1440e] text-[#fef8f2]"
                                : "rounded-bl-md bg-[#18140f]/[0.06] text-[#18140f]"
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
              <div className="shrink-0 border-t border-[#18140f]/10 bg-[#fbf9f4] px-6 py-4">
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
                    className="flex-1 resize-none overflow-hidden rounded-sm border border-[#18140f]/15 bg-white px-4 py-3 text-sm text-[#18140f] outline-none transition placeholder:text-[#8b8578] focus:border-[#c1440e] focus:ring-1 focus:ring-[#c1440e]"
                    style={{ minHeight: "48px" }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] bg-[#c1440e] text-[#fef8f2] transition hover:bg-[#a23a0c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#8b8578]">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
