export type BlogSection = {
  heading: string
  paragraphs: string[]
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  readMinutes: number
  audience: "Brands" | "Creators"
  sections: BlogSection[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-price-a-ugc-brief",
    title: "How to price a UGC brief without guessing",
    excerpt:
      "A fixed number scares people less than a range, but only if you've actually worked out what's fair. Here's a simple way to land on a number you won't want to change halfway through a campaign.",
    date: "2026-08-01",
    readMinutes: 5,
    audience: "Brands",
    sections: [
      {
        heading: "Start from the deliverable, not the follower count",
        paragraphs: [
          "It's tempting to price a brief around a creator's audience size, but that leads to two bad outcomes: you overpay a creator with a big but disengaged following, or you underpay someone with a small, highly relevant audience who'd have done a great job for less. Price the deliverable instead — one 30-second Reel is a different job from three TikToks and a testimonial, regardless of who's making it.",
          "A useful anchor: how many hours of work does this actually take? Filming, editing, revisions, and the back-and-forth of getting a brief right rarely take less than half a day for a single piece of content, even for an experienced creator. Price from there, then adjust for niche and production complexity.",
        ],
      },
      {
        heading: "Build in revisions before you post the brief",
        paragraphs: [
          "Nothing sours a working relationship faster than a brand asking for a fourth free revision on what was quoted as a single deliverable. Decide upfront how much back-and-forth is reasonable — a couple of rounds is standard — and put it in the brief itself, not as a surprise mid-project. On RealReach, revisions are unlimited and never trigger an extra charge, but that doesn't mean the number of rounds should be unbounded in practice — it just means the mechanism to fix problems is free, not that scope should silently expand.",
        ],
      },
      {
        heading: "A rough starting range, not a rule",
        paragraphs: [
          "There's no universal price list — a single photo for a small skincare brand and a three-video series for a national retailer aren't comparable. But as a starting point: a single short-form video from a micro-influencer with a genuinely engaged niche audience commonly lands somewhere in the low hundreds of pounds, scaling up with usage rights, exclusivity, or a multi-deliverable package. Post the fee upfront rather than negotiating it after applications come in — creators self-select out of briefs that don't work for them, saving everyone time.",
        ],
      },
    ],
  },
  {
    slug: "disclosure-rules-for-uk-brands",
    title: "What UK brands need to know about disclosing paid content",
    excerpt:
      "Ad disclosure isn't optional in the UK, and getting it wrong is the kind of mistake that costs more in reputation than any fee ever saved. A short, practical overview.",
    date: "2026-08-05",
    readMinutes: 4,
    audience: "Brands",
    sections: [
      {
        heading: "The basic rule",
        paragraphs: [
          "In the UK, the Committee of Advertising Practice (CAP) requires that any content a brand has paid for, gifted a product for, or otherwise materially influenced must be clearly labelled as an ad — typically with #ad at the start of a caption, not buried at the bottom or hidden behind other hashtags. This applies whether the payment was cash, free product, or any other form of value exchange. It's the creator's legal responsibility to disclose, but a brand that pressures a creator not to, or fails to make the paid relationship clear, can be held responsible too.",
        ],
      },
      {
        heading: "Why this matters beyond compliance",
        paragraphs: [
          "Beyond the regulatory risk, transparent disclosure tends to perform better, not worse — audiences are used to sponsored content and generally trust a creator more, not less, for being upfront about it. Briefs that ask a creator to disguise a partnership as organic content are a bigger risk to your brand than a clearly labelled ad ever is.",
        ],
      },
      {
        heading: "What to put in the brief",
        paragraphs: [
          "Make disclosure expectations explicit in the brief itself — which hashtag or wording you want used, and where it should appear. Most experienced creators will get this right without prompting, but it removes any ambiguity and protects both sides if it's written down as part of what you're agreeing to.",
        ],
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
