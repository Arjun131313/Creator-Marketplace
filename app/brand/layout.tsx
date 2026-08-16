import AppHeader from "@/components/app-header"

const LINKS = [
  { label: "Dashboard", href: "/brand/dashboard" },
  { label: "Jobs", href: "/brand/jobs" },
  { label: "Events", href: "/brand/events" },
  { label: "Browse creators", href: "/creators" },
  { label: "Billing", href: "/brand/billing" },
  { label: "Post a job", href: "/brand/jobs/new", primary: true },
]

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f3f7] text-[#0d1117]">
      <AppHeader eyebrow="Brand Portal" homeHref="/brand/dashboard" links={LINKS} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
