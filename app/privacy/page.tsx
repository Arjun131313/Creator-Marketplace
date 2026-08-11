import Link from "next/link"
import PublicNav from "@/components/public-nav"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#10141b]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <div className="mb-10 border-2 border-[#feb930] bg-[#feb930]/10 p-5 text-sm leading-6 text-[#595e66]">
          <strong className="text-[#10141b]">Draft — not legal advice.</strong> This is placeholder
          content generated to unblock development and ad-platform requirements (e.g. Meta requires a
          live Privacy Policy URL before it will approve an ad account). Replace the bracketed details,
          confirm it matches your actual data practices, and have it reviewed by a qualified lawyer
          before publishing it as final.
        </div>

        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1a54f0]">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#595e66]">Last updated: [DATE]</p>

        <div className="mt-10 space-y-8 leading-7 text-[#10141b]">
          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">1. Who this policy covers</h2>
            <p>
              This Privacy Policy explains how RealReach Agency (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and
              protects information about Brands and Creators (&ldquo;you&rdquo;) who use the RealReach Agency platform.
              RealReach Agency is currently operated by [YOUR FULL NAME], a sole trader based in the United
              Kingdom — this section will be updated with company registration details once one is
              formed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">2. Information we collect</h2>
            <ul className="ml-5 list-disc space-y-2">
              <li><strong>Account information:</strong> name, email, password (hashed), and account role (Brand or Creator).</li>
              <li><strong>Profile information:</strong> for Creators — bio, niche, platform handles and follower counts, portfolio content, package pricing; for Brands — company name and job briefs.</li>
              <li><strong>Payment information:</strong> processed by our payment provider; we store transaction records and status (e.g. held, released, refunded), not full card numbers.</li>
              <li><strong>Communications:</strong> messages sent between Brands and Creators through the platform, and correspondence with our support team.</li>
              <li><strong>Usage data:</strong> log data, device/browser information, and how you interact with the platform, collected automatically.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">3. How we use your information</h2>
            <p>We use the information above to:</p>
            <ul className="ml-5 mt-2 list-disc space-y-2">
              <li>Operate the marketplace — matching Brands with Creators, processing job briefs and applications, and facilitating messaging.</li>
              <li>Process payments, hold funds in escrow, and release or refund them per these Terms.</li>
              <li>Verify creator profiles and prevent fraud or abuse.</li>
              <li>Send account, transaction, and (if you opt in) marketing communications.</li>
              <li>Improve the platform and diagnose technical issues.</li>
              <li>Comply with legal obligations, including tax and financial record-keeping.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">4. Who we share it with</h2>
            <ul className="ml-5 list-disc space-y-2">
              <li><strong>Other users:</strong> your public profile (Creators) or job briefs (Brands) are visible to the other side of the marketplace as needed to facilitate a job.</li>
              <li><strong>Service providers:</strong> our database host (Supabase), payment processor (Stripe), and hosting provider, solely to operate the platform on our behalf.</li>
              <li><strong>Advertising platforms:</strong> if you arrive via an ad (e.g. Meta/Facebook), we may share limited conversion data with that platform to measure ad performance, subject to your cookie/consent choices.</li>
              <li><strong>Legal and safety:</strong> when required by law, or to protect the rights, property, or safety of RealReach Agency, our users, or the public.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">5. Data retention</h2>
            <p>
              We retain account and transaction data for as long as your account is active and for
              [X years] afterward to meet our legal, tax, and dispute-resolution obligations. You can
              request deletion of your account at any time, subject to records we&apos;re legally required
              to keep.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">6. Your rights</h2>
            <p>
              Under UK GDPR (and equivalent laws if you&apos;re based elsewhere), you have the right to
              access, correct, export, or delete your personal information, and to object to or
              restrict certain processing. To exercise any of these rights, contact us at
              hello@realreachagency.com. You also have the right to lodge a complaint with the UK
              Information Commissioner&apos;s Office (ico.org.uk), or your local data protection authority
              if you&apos;re outside the UK.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">7. Cookies</h2>
            <p>
              We use essential cookies to keep you signed in and the platform functioning, and
              (if enabled) analytics/advertising cookies to understand traffic and measure ad campaigns.
              You can control non-essential cookies through your browser or our cookie banner.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">8. Security</h2>
            <p>
              We use industry-standard measures — including encryption in transit, access controls, and
              row-level security on our database — to protect your information. No system is completely
              secure, and we can&apos;t guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">9. International transfers</h2>
            <p>
              Your information may be processed in countries other than your own by the service
              providers listed above. Where required, we rely on appropriate safeguards (such as
              standard contractual clauses) for these transfers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">10. Children</h2>
            <p>RealReach Agency is not intended for anyone under 18, and we don&apos;t knowingly collect data from them.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">11. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We&apos;ll post the updated version here and
              update the &ldquo;Last updated&rdquo; date above.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-[#10141b]">12. Contact</h2>
            <p>Questions about this policy or your data? Email hello@realreachagency.com.</p>
          </section>
        </div>

        <p className="mt-14 text-sm">
          <Link href="/terms" className="font-bold text-[#1a54f0] hover:underline">
            Read our Terms of Service →
          </Link>
        </p>
      </main>

      <footer className="border-t-2 border-[#10141b]/10 bg-[#f5f3ee] px-6 py-10 text-[#595e66]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
          <Link href="/" className="font-display text-lg font-extrabold text-[#10141b] transition hover:text-[#1a54f0]">
            RealReach.
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/help" className="transition hover:text-[#10141b]">Help Center</Link>
            <Link href="/terms" className="transition hover:text-[#10141b]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
