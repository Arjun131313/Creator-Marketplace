# DESIGN SYSTEM

Locked from `https://brit-influencer-connect.lovable.app` — extracted directly from the
live site's computed styles (not estimated from screenshots), across all seven pages:
home, creator browse, campaign browse, creator profile, creator dashboard, brand hub,
inbox.

This supersedes the earlier "paper/ink" system (terracotta accent, Fraunces serif,
rounded cards) entirely. Nothing from that system carries forward except the underlying
Next.js/Supabase/Stripe app it's applied to.

## Colour

| Token | Hex | Use |
|---|---|---|
| `paper` | `#f5f3ee` | Page background |
| `ink` | `#10141b` | Primary text, dark sections |
| `muted` | `#595e66` | Secondary text |
| `surface` | `#ffffff` | Cards |
| `surface-alt` | `#eae8e1` | Secondary surface / subtle fills |
| `accent` | `#1a54f0` | Primary CTA, links, active states |
| `positive` | `#c8f23c` | Released / booked / success status |
| `urgent` | `#ff534b` | Pass / urgent / attention status |
| `pending` | `#feb930` | Scheduled / awaiting / in-progress status |

The four status colours (`accent`, `positive`, `urgent`, `pending`) are used as flat
fills on badges/chips — not gradients, not tints. This is where the site's personality
mostly lives, against an otherwise restrained paper/ink/white base.

## Typography

- **Display**: Bricolage Grotesque, weight 800. Used for all headings, and — distinctly
  — for creator names on profile pages, set very large across two lines as the visual
  focal point of the page.
- **Body**: Manrope, regular/medium/bold as needed.
- No serif anywhere.

## Shape

`border-radius: 0` on every real UI element — buttons, cards, inputs, badges, images.
This is a deliberate, consistent signature, not an oversight. No exceptions carry
forward into the redesign.

## Layout patterns observed per page

- **Home**: stat bar (creator count / live briefs) → two-line bold headline → dual CTA
  (creator vs. brand) → floating price card breaking the hero image frame → scrolling
  niche ticker → 3-step process → "booked this week" creator strip → live brief preview
  cards → footer.
- **Creator browse**: filter bar (niche/platform/city/followers/rate) + niche pill row →
  dense info-rich cards: engagement badge, name, price, handle, city, niche tag, platform
  tags, follower count, all in one card.
- **Campaign browse**: cards with platform tag, applicant count, brand name (caps),
  title, price, deliverables + category, deadline, apply button.
- **Creator profile**: name split across two lines as huge display type, stats row
  (followers / engagement / rate / brands worked with), bio.
- **Creator dashboard**: personal greeting ("Hey Priya 👋") + one-line context → stat
  row → applications list with status chips → earnings bar chart → messages preview →
  "matched for you" recommendations.
- **Brand dashboard**: personal greeting ("Morning, Lumen Skin.") → stat row → live
  campaigns with budget progress bars → applicants-to-review list with pass/shortlist
  actions → spend-by-month bars → payments list with status chips.
- **Inbox**: conversation list with avatar initials + unread count → thread view with
  rounded message bubbles → inline offer/escrow status banner within the thread.

## What does not change

Supabase schema, auth, Stripe integration, API routes, and all business logic stay
exactly as they are. This is a frontend/UI replacement only.
