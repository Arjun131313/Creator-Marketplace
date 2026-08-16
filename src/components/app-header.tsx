import Link from "next/link"
import MessagesNavLink from "@/components/messages-nav-link"

export type AppHeaderLink = {
  label: string
  href: string
  /** Renders as the filled primary action. One per header. */
  primary?: boolean
}

type AppHeaderProps = {
  /** Small overline above the wordmark, e.g. "Brand Portal". */
  eyebrow: string
  /** Where the wordmark links back to. */
  homeHref: string
  links: AppHeaderLink[]
  /** Set false on pages where a messages badge would be redundant. */
  showMessages?: boolean
}

/**
 * The signed-in chrome, shared by the brand portal, the creator portal, and the
 * inbox.
 *
 * These were three separately hand-written headers that had drifted apart — the
 * inbox had a different width, a different wordmark size, and a different link
 * set — which is exactly the kind of thing that makes a site feel stitched
 * together rather than designed. One component means they can't drift again.
 */
export default function AppHeader({ eyebrow, homeHref, links, showMessages = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#0d1117]/[0.07] bg-[#f1f3f7]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#16255c]">
            {eyebrow}
          </p>
          <Link
            href={homeHref}
            className="font-display text-xl font-extrabold text-[#0d1117] transition hover:text-[#16255c]"
          >
            RealReach.
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em]">
          {links
            .filter((link) => !link.primary)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-[#0d1117]/[0.12] px-4 py-2 text-[#0d1117] transition-colors hover:bg-[#0d1117] hover:text-[#f1f3f7]"
              >
                {link.label}
              </Link>
            ))}

          {showMessages ? <MessagesNavLink /> : null}

          {links
            .filter((link) => link.primary)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[8px] bg-[#16255c] px-4 py-2 text-white transition-opacity hover:opacity-90"
              >
                {link.label}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  )
}
