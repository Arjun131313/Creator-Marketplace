import AppHeader from "@/components/app-header"

const LINKS = [
  { label: "Dashboard", href: "/creator/dashboard" },
  { label: "Browse jobs", href: "/creator/jobs" },
  { label: "Applications", href: "/creator/applications" },
  { label: "Events", href: "/creator/events" },
  { label: "Academy", href: "/creator/academy" },
  { label: "Edit profile", href: "/creator/profile/setup", primary: true },
]

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <AppHeader eyebrow="Creator Portal" homeHref="/creator/dashboard" links={LINKS} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
