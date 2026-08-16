import Link from "next/link"

type EmptyStateProps = {
  /** Short, concrete headline — say what isn't here, not "nothing found". */
  title: string
  /** One line of context, ideally explaining why it's empty. */
  body: string
  icon?: React.ReactNode
  action?: { label: string; href: string }
  /** Optional secondary line, e.g. a nudge for the other side of the market. */
  secondary?: { label: string; href: string }
}

function DefaultIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  )
}

/**
 * A designed empty state rather than a line of grey text. An early-stage
 * marketplace shows these constantly, so they carry a lot of the impression
 * the site makes — they should look deliberate, not like a missing section.
 */
export default function EmptyState({ title, body, icon, action, secondary }: EmptyStateProps) {
  return (
    <div className="surface-card relative overflow-hidden px-6 py-16 text-center sm:px-12">
      {/* Soft tonal wash so the panel reads as a designed surface, not a gap. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(22,37,92,0.06), transparent 70%)",
        }}
      />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[#0d1117]/10 bg-[#f1f3f7] text-[#16255c] shadow-[var(--elev-1)]">
          {icon ?? <DefaultIcon />}
        </div>

        <h3 className="mt-5 font-display text-xl font-extrabold text-[#0d1117]">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5b6472]">{body}</p>

        {action ? (
          <Link
            href={action.href}
            className="mt-6 inline-flex items-center justify-center rounded-[8px] bg-[#16255c] px-6 py-3 text-sm font-bold text-white shadow-[var(--elev-1)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--elev-2)]"
          >
            {action.label}
          </Link>
        ) : null}

        {secondary ? (
          <p className="mt-4 text-sm">
            <Link href={secondary.href} className="font-bold text-[#16255c] hover:underline">
              {secondary.label}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
