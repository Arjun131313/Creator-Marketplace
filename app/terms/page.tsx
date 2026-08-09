import Link from "next/link"
import PublicNav from "@/components/public-nav"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#18140f]">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <div className="mb-10 rounded-sm border border-[#c1440e]/30 bg-[#c1440e]/5 p-5 text-sm leading-6 text-[#6b6153]">
          <strong className="text-[#18140f]">Draft — not legal advice.</strong> This is placeholder
          content generated to unblock development and ad-platform requirements. Replace the
          bracketed details, confirm it matches how RealReach Agency actually operates, and have it
          reviewed by a qualified lawyer in your jurisdiction before publishing it as final.
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c1440e]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-[#6b6153]">Last updated: [DATE]</p>

        <div className="mt-10 space-y-8 leading-7 text-[#3a332a]">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">1. Who we are</h2>
            <p>
              RealReach Agency (&ldquo;RealReach Agency&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a marketplace platform
              that connects brands (&ldquo;Brands&rdquo;) seeking microinfluencer marketing content with independent
              content creators (&ldquo;Creators&rdquo;). RealReach Agency is currently operated by [YOUR FULL NAME], a
              sole trader based in the United Kingdom. RealReach Agency is not yet operated through a
              registered company — this section will be updated with company registration details
              once one is formed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">2. What RealReach Agency is (and isn&apos;t)</h2>
            <p>
              RealReach Agency provides the platform, tools, and payment infrastructure that let Brands and
              Creators find each other, agree on a brief, and exchange payment for deliverables. We are
              not a party to the underlying agreement between a Brand and a Creator, and we do not
              employ Creators or act as an advertising agency on behalf of Brands. Brands and Creators
              are solely responsible for the content, quality, legality, and outcome of any work they
              agree to.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">3. Accounts</h2>
            <p>
              You must be at least 18 years old (or the age of majority in your jurisdiction) to create
              an account. You&apos;re responsible for keeping your login credentials secure and for all
              activity under your account. Creators must accurately represent their audience, platform
              statistics, and past work. Brands must accurately represent their business and campaign
              requirements. We may suspend or terminate accounts that provide false information, violate
              these Terms, or engage in fraudulent or abusive behavior.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">4. Jobs, briefs, and applications</h2>
            <p>
              Brands post job briefs describing the campaign, deliverables, budget, and deadline.
              Creators may apply, or Brands may reach out directly. Once a Brand accepts an application
              or hires a Creator directly, both parties agree to be bound by the terms of that specific
              job (deliverables, deadline, and price) in addition to these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">5. Payments and escrow</h2>
            <p>
              When a Brand hires a Creator, the agreed payment is held in escrow by our payment
              processor until the Brand approves the delivered content, or the applicable revision/
              dispute window closes. Funds are only released to the Creator on approval, expiry of the
              review window, or resolution of a dispute in the Creator&apos;s favor. RealReach Agency charges a
              platform fee on successfully completed jobs, disclosed before checkout. There is no
              subscription fee to browse, message, or post a brief.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">6. Revisions, disputes, and refunds</h2>
            <p>
              Brands may request reasonable revisions consistent with the original brief before
              approving delivered content. If a Brand and Creator cannot agree on whether deliverables
              meet the brief, either party may raise a dispute; RealReach Agency will review the brief,
              deliverables, and correspondence and make a binding determination on release or refund of
              the held funds. We aim to resolve disputes within 10 business days.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">7. Content and intellectual property</h2>
            <p>
              Unless the job brief states otherwise, ownership and usage rights for delivered content
              transfer to the Brand only once payment has been released to the Creator. Creators retain
              the right to display completed work in their own portfolio unless the Brand&apos;s brief
              specifies otherwise (e.g. embargoed or confidential campaigns).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">8. Prohibited conduct</h2>
            <p>
              You may not use RealReach Agency to circumvent platform fees by arranging payment outside the
              platform for a job originated on RealReach Agency, post unlawful, deceptive, or infringing
              content, harass other users, or misrepresent your identity, audience, or business.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">9. Limitation of liability</h2>
            <p>
              RealReach Agency is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, RealReach Agency is not
              liable for indirect, incidental, or consequential damages arising from your use of the
              platform, or from the acts or omissions of Brands or Creators. Our total liability for any
              claim is limited to the platform fees you paid in the 12 months before the claim arose.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">10. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. We&apos;ll post the updated version here and
              update the &ldquo;Last updated&rdquo; date above. Continued use of RealReach Agency after changes take
              effect means you accept the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">11. Governing law</h2>
            <p>
              These Terms are governed by the laws of England and Wales, without regard to
              conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-[#18140f]">12. Contact</h2>
            <p>
              Questions about these Terms? Email hello@realreachagency.com.
            </p>
          </section>
        </div>

        <p className="mt-14 text-sm">
          <Link href="/privacy" className="font-semibold text-[#c1440e] hover:underline">
            Read our Privacy Policy →
          </Link>
        </p>
      </main>

      <footer className="border-t border-[#18140f]/10 bg-[#f5f1e8] px-6 py-10 text-[#6b6153]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6">
          <Link href="/" className="font-serif text-lg text-[#18140f] transition hover:text-[#c1440e]">
            Real<em className="not-italic italic text-[#c1440e]">Reach</em>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/help" className="transition hover:text-[#18140f]">Help Center</Link>
            <Link href="/privacy" className="transition hover:text-[#18140f]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
