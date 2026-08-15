"use client"

import { useEffect, useRef, useState } from "react"

type RevealProps = {
  children: React.ReactNode
  /** Stagger in ms, for revealing a row of cards in sequence. */
  delay?: number
  className?: string
}

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. Uses IntersectionObserver rather than a scroll listener so it costs
 * nothing while off-screen, and unobserves after firing so elements don't
 * re-animate on the way back up.
 *
 * Falls back to visible immediately if IntersectionObserver isn't available.
 */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      // Deferred rather than set synchronously, which would cascade a second
      // render pass on mount.
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
